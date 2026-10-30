import * as THREE from 'three';

const MAX_PANELS = 12;

// Refract the live scene render, not a screenshot. HTML stays above the canvas
// for sharp, accessible text and native buttons. Coordinates are CSS pixels so
// the optical boundaries follow resize, scrolling, safe areas and dialogs.
export function createLiquidGlass(renderer, host) {
  const target = new THREE.WebGLRenderTarget(1, 1, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: true,
    type: renderer.extensions.has('EXT_color_buffer_float') ? THREE.HalfFloatType : THREE.UnsignedByteType,
    samples: Math.min(2, renderer.capabilities.maxSamples),
  });
  const uniforms = {
    uScene: {value: target.texture},
    uSize: {value: new THREE.Vector2(1, 1)},
    uPointer: {value: new THREE.Vector2(-400, -400)},
    uTime: {value: 0},
    uCount: {value: 0},
    uRects: {value: Array.from({length: MAX_PANELS}, () => new THREE.Vector4())},
    uRadii: {value: new Float32Array(MAX_PANELS)},
  };
  const material = new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    toneMapped: true,
    uniforms,
    vertexShader: `varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`,
    fragmentShader: `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uScene;
      uniform vec2 uSize, uPointer;
      uniform float uTime;
      uniform int uCount;
      uniform vec4 uRects[${MAX_PANELS}];
      uniform float uRadii[${MAX_PANELS}];
      float roundedBox(vec2 p, vec2 b, float r) {
        vec2 q = abs(p) - b + r;
        return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r;
      }
      vec3 sceneAt(vec2 uv) { return texture2D(uScene, clamp(uv, .001, .999)).rgb; }
      void main() {
        vec2 pixel = vec2(vUv.x, 1. - vUv.y) * uSize;
        vec3 color = sceneAt(vUv);
        for (int i = 0; i < ${MAX_PANELS}; i++) {
          if (i >= uCount) break;
          vec4 rect = uRects[i];
          vec2 p = pixel - rect.xy;
          vec2 halfSize = rect.zw * .5;
          float r = uRadii[i];
          float d = roundedBox(p, halfSize, r);
          if (d > 1.) continue;
          vec2 normal = normalize(vec2(
            roundedBox(p + vec2(.5, 0.), halfSize, r) - roundedBox(p - vec2(.5, 0.), halfSize, r),
            roundedBox(p + vec2(0., .5), halfSize, r) - roundedBox(p - vec2(0., .5), halfSize, r)
          ) + .0001);
          float bevel = exp(-max(-d, 0.) / 13.);
          float bend = bevel * (15. + 2. * sin(uTime * .5 + p.y * .018));
          vec2 lens = p / max(halfSize, vec2(1.));
          vec2 displacement = normal * bend + lens * 2.5;
          vec2 uv = vUv + vec2(-displacement.x, displacement.y) / uSize;
          vec2 chroma = vec2(-normal.x, normal.y) * bevel * 1.4 / uSize;
          vec3 refracted = vec3(sceneAt(uv + chroma).r, sceneAt(uv).g, sceneAt(uv - chroma).b);
          vec2 blur = vec2(1.3) / uSize;
          vec3 frost = (sceneAt(uv + blur) + sceneAt(uv - blur) +
            sceneAt(uv + vec2(blur.x, -blur.y)) + sceneAt(uv + vec2(-blur.x, blur.y))) * .25;
          refracted = mix(refracted, frost, .36);
          vec2 light = normalize(vec2(-.7, -1.) + normalize(uPointer - rect.xy + .001) * .45);
          float highlight = pow(max(dot(normal, light), 0.), 3.);
          float rim = exp(-abs(d + 1.1) * .72);
          vec3 glass = mix(refracted, vec3(.97, .985, 1.), .16);
          glass += bevel * highlight * .10 + rim * (.14 + highlight * .24);
          glass -= bevel * max(dot(normal, -light), 0.) * .055;
          color = mix(color, glass, 1. - smoothstep(-.5, .8, d));
        }
        gl_FragColor = vec4(color, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const screen = new THREE.Scene();
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  screen.add(quad);
  const camera = new THREE.Camera();
  let elements = [];
  const refresh = () => { elements = [...document.querySelectorAll('[data-glass]')].slice(0, MAX_PANELS); };
  const observer = new MutationObserver(refresh);
  observer.observe(document.getElementById('root'), {subtree:true, childList:true});
  refresh();
  const pointer = e => {
    const bounds = host.getBoundingClientRect();
    uniforms.uPointer.value.set(e.clientX - bounds.left, e.clientY - bounds.top);
  };
  window.addEventListener('pointermove', pointer, {passive:true});

  return {
    resize(width, height) {
      const ratio = renderer.getPixelRatio();
      target.setSize(Math.round(width * ratio), Math.round(height * ratio));
      uniforms.uSize.value.set(width, height);
    },
    render(scene, sceneCamera, time) {
      const hostRect = host.getBoundingClientRect();
      let count = 0;
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height || rect.bottom < 0 || rect.top > innerHeight) continue;
        uniforms.uRects.value[count].set(rect.left - hostRect.left + rect.width / 2,
          rect.top - hostRect.top + rect.height / 2, rect.width, rect.height);
        uniforms.uRadii.value[count] = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 28, rect.width / 2, rect.height / 2);
        count++;
      }
      uniforms.uCount.value = count;
      uniforms.uTime.value = time;
      renderer.setRenderTarget(target);
      renderer.render(scene, sceneCamera);
      renderer.setRenderTarget(null);
      renderer.render(screen, camera);
    },
    dispose() {
      observer.disconnect();
      window.removeEventListener('pointermove', pointer);
      target.dispose();quad.geometry.dispose();material.dispose();
    },
  };
}
