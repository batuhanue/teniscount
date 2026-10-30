import React, {useEffect, useRef, useState} from 'react';
import * as THREE from 'three';
import {createLiquidGlass} from './liquidGlass';

// Every return gets a new target, speed and arc; this is a continuous simulation,
// not a replayed animation clip. Coordinates are metres relative to table centre.
export default function TableScene({shot, paused, active, reduced, side}) {
  const host = useRef(null), latest = useRef({shot, paused, active, reduced, side});
  latest.current = {shot, paused, active, reduced, side};
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    const el = host.current;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({antialias:true, alpha:true}); }
    catch { setUnavailable(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0xe3e8dc, 0);
    el.appendChild(renderer.domElement);
    const glass = createLiquidGlass(renderer, el);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-5,5,3,-3,.1,120);
    scene.add(new THREE.HemisphereLight(0xf6fbff, 0x74877c, 2.2));
    const sun = new THREE.DirectionalLight(0xfff8ec, 1.6);
    sun.position.set(-3,9,5); sun.castShadow = true;
    sun.shadow.mapSize.set(1024,1024); sun.shadow.camera.left=-7;sun.shadow.camera.right=7;
    sun.shadow.camera.top=7;sun.shadow.camera.bottom=-7;sun.shadow.normalBias=.025;
    scene.add(sun);
    const material = (color, extra={}) => new THREE.MeshStandardMaterial({color, roughness:.75, ...extra});
    const green=material(0x386d60), edge=material(0x294d44), wood=material(0xcbb48b), white=material(0xf5efdc), metal=material(0x56645a);
    function box(w,h,d,mat,x,y,z) {
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
      mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);return mesh;
    }
    box(5.5,.16,3.05,edge,0,1.42,0);
    box(5.48,.035,3.03,green,0,1.515,0);
    for(const z of [-1.49,1.49])box(5.44,.009,.025,white,0,1.538,z);
    for(const x of [-2.71,2.71])box(.025,.009,3,white,x,1.538,0);
    box(5.44,.009,.018,white,0,1.538,0);
    for(const x of [-2.1,2.1])for(const z of [-1.1,1.1])box(.12,1.35,.12,metal,x,.7,z);
    for(const x of [-2.1,2.1])box(.09,.09,2.2,metal,x,.4,0);
    box(4.2,.09,.09,metal,0,.65,0);
    for(const z of [-1.65,1.65])box(.055,.52,.055,metal,0,1.65,z);
    const netMat=new THREE.LineBasicMaterial({color:0xe6eddf,transparent:true,opacity:.65});
    const vertices=[];
    for(let z=-1.62;z<=1.63;z+=.09)vertices.push(0,1.55,z,0,1.94,z);
    for(let y=1.55;y<=1.95;y+=.065)vertices.push(0,y,-1.63,0,y,1.63);
    const net=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(vertices,3)),netMat);scene.add(net);
    box(.025,.025,3.3,white,0,1.95,0);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),material(0xdbe6e5));
    floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
    const studioTime = {value:0};
    floor.material.onBeforeCompile = shader => {
      shader.uniforms.uStudioTime = studioTime;
      shader.vertexShader = 'varying vec3 vStudioPosition;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <worldpos_vertex>',
        '#include <worldpos_vertex>\nvStudioPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      shader.fragmentShader = 'varying vec3 vStudioPosition; uniform float uStudioTime;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
        #include <color_fragment>
        vec2 studio = vStudioPosition.xz;
        float curve = studio.x * .62 + sin(studio.y * .42 + uStudioTime * .09) * 1.8;
        float pool = .5 + .5 * sin(curve + studio.y * .22);
        float ribbon = pow(.5 + .5 * cos(curve * 1.3 - uStudioTime * .06), 14.);
        diffuseColor.rgb *= .93 + pool * .07;
        diffuseColor.rgb += vec3(.065, .085, .10) * ribbon;
      `);
    };
    // Broad studio light pools remain visible through the refractive controls.
    const cool = new THREE.PointLight(0xb4d7ff, 22, 14, 2);cool.position.set(5,3,5);scene.add(cool);
    const warm = new THREE.PointLight(0xf4e9ca, 18, 12, 2);warm.position.set(-5,3,2);scene.add(warm);
    const paddles=[];
    const rubber=[material(0xbd7763),material(0x344b45)];
    for(let i=0;i<2;i++){
      const group=new THREE.Group();
      const blade=new THREE.Mesh(new THREE.CylinderGeometry(.33,.33,.055,40),wood);
      blade.rotation.z=Math.PI/2;blade.scale.z=1.18;group.add(blade);
      for(const x of [-.035,.035]){const face=new THREE.Mesh(new THREE.CylinderGeometry(.315,.315,.008,40),rubber[i]);face.rotation.z=Math.PI/2;face.scale.z=1.18;face.position.x=x;group.add(face);}
      const handle=new THREE.Mesh(new THREE.BoxGeometry(.09,.46,.12),wood);handle.position.y=-.46;group.add(handle);
      group.traverse(o=>{if(o.isMesh)o.castShadow=true});scene.add(group);paddles.push(group);
    }
    const ball=new THREE.Mesh(new THREE.SphereGeometry(.066,20,16),material(0xfff9df,{roughness:.35}));ball.castShadow=true;scene.add(ball);
    const trail=Array.from({length:14},(_,i)=>{const mesh=new THREE.Mesh(new THREE.SphereGeometry(.05*(1-i/18),8,6),new THREE.MeshBasicMaterial({color:0xfdf6ce,transparent:true,opacity:.32*(1-i/14)}));mesh.visible=false;scene.add(mesh);return mesh;});
    const bounce=new THREE.Mesh(new THREE.RingGeometry(.12,.14,32),new THREE.MeshBasicMaterial({color:0xf5e8ae,transparent:true,opacity:0,side:THREE.DoubleSide}));bounce.rotation.x=-Math.PI/2;bounce.position.y=1.55;scene.add(bounce);
    let leg=0,elapsed=0,shotTime=0,shotId=null,prev=performance.now(),frame,hidden=document.hidden,glassTime=0;
    let from={x:-3.2,y:2.15,z:0}, target={x:3.2,y:2.15,z:.5},duration=1.3,height=.8;
    const random=(a,b)=>a+Math.random()*(b-a);
    function nextReturn(){
      leg++;from={...target};const direction=from.x>0?-1:1;
      target={x:direction*3.2,y:random(1.98,2.38),z:random(-1.05,1.05)};
      const style=leg%4;duration=random(style===2?.85:1.05,style===1?1.8:1.4);height=random(style===1?1.15:.45,style===1?1.55:.8);
      elapsed=0;
    }
    function flight(t,a,b,arc,bounceAt=.68){
      const hit={x:b.x*.49,y:1.6,z:b.z*.82};
      const pre=t<bounceAt,u=pre?t/bounceAt:(t-bounceAt)/(1-bounceAt),start=pre?a:hit,end=pre?hit:b;
      return new THREE.Vector3(THREE.MathUtils.lerp(start.x,end.x,u),THREE.MathUtils.lerp(start.y,end.y,u)+Math.sin(u*Math.PI)*(pre?arc:arc*.55),THREE.MathUtils.lerp(start.z,end.z,u));
    }
    function resize(){
      const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h);glass.resize(w,h);
      const aspect=w/h,compact=h<540&&w>h;
      const viewHeight=Math.max(7.4,8/aspect);
      const shift=-viewHeight*(w<761?.11:.10);
      const horizontal=compact?viewHeight*aspect*.23:0;
      camera.left=-viewHeight*aspect/2+horizontal;camera.right=viewHeight*aspect/2+horizontal;
      camera.top=viewHeight/2+shift;camera.bottom=-viewHeight/2+shift;
      camera.position.set(22.2,16.9,24.9);camera.lookAt(0,1.15,0);camera.updateProjectionMatrix();
    }
    const observer=new ResizeObserver(resize);observer.observe(el);resize();
    const visibility=()=>{hidden=document.hidden;prev=performance.now()};document.addEventListener('visibilitychange',visibility);
    function draw(now){
      frame=requestAnimationFrame(draw);const dt=Math.min((now-prev)/1000,.05);prev=now;if(hidden)return;
      const p=latest.current,scoring=!!p.shot;
      if(p.shot?.id!==shotId){shotId=p.shot?.id;shotTime=0;trail.forEach(m=>m.visible=false);if(!scoring){elapsed=0;from={x:-3.2,y:2.15,z:0};target={x:3.2,y:2.15,z:random(-1,1)}}}
      const running=p.active&&!p.paused&&!p.reduced;
      if(scoring&&!p.reduced){
        shotTime+=dt;const sign=p.shot.fromLeft?1:-1,t=Math.min(shotTime/1.65,1);
        ball.position.copy(flight(t,{x:-sign*3.2,y:2.3,z:0},{x:sign*4.9,y:1.05,z:.85},.8,1/1.65));
        bounce.position.x=sign*4.9*.49;bounce.position.z=.85*.82;
        const impact=Math.max(0,shotTime-1);bounce.scale.setScalar(1+impact*4);bounce.material.opacity=shotTime>=1?Math.max(0,.7-impact*2):0;
        ball.visible=t<1;
      }else{
        if(running){elapsed+=dt;if(elapsed>=duration)nextReturn();}
        ball.position.copy(flight(elapsed/duration,from,target,height));ball.visible=p.active;
        bounce.material.opacity=0;
      }
      for(let i=0;i<2;i++){
        const left=i===p.side,sign=left?-1:1,paddle=paddles[i];
        paddle.visible=!scoring&&p.active;
        const receiving=Math.sign(target.x)===sign;
        const goal=receiving?target.z:from.z;
        paddle.position.x=sign*3.2;
        paddle.position.y=receiving?target.y:from.y;
        paddle.position.z=THREE.MathUtils.lerp(paddle.position.z,goal,running?Math.min(dt*6,1):1);
        paddle.rotation.y=sign*(.15+Math.sin(Math.min(elapsed/duration,1)*Math.PI)*.35);
        paddle.rotation.z=sign*(.14+Math.exp(-elapsed*13)*.55);
      }
      if((running||scoring)&&!p.reduced&&ball.visible){for(let i=trail.length-1;i>0;i--)trail[i].position.copy(trail[i-1].position);trail[0].position.copy(ball.position);trail.forEach((m,i)=>{m.visible=elapsed>.2||scoring;m.material.opacity=(scoring?.48:.18)*(1-i/14)})}else trail.forEach(m=>m.visible=false);
      if(!p.reduced)glassTime+=dt;
      studioTime.value=glassTime;
      glass.render(scene,camera,glassTime);
      if(!el.closest('.app').classList.contains('glass-ready'))el.closest('.app').classList.add('glass-ready');
    }
    frame=requestAnimationFrame(draw);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',visibility);scene.traverse(o=>{o.geometry?.dispose();if(o.material){const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose())}});glass.dispose();el.closest('.app')?.classList.remove('glass-ready');renderer.dispose();renderer.domElement.remove();};
  },[]);
  return <div className="table-scene" ref={host} role="img" aria-label="Üç boyutlu masa tenisi masası. Masanın iki ucundaki raketler değişen vuruşlarla ralli yapıyor.">{unavailable&&<div className="scene-fallback">3D görüntü bu cihazda kullanılamıyor. Aşağıdaki düğmelerle skor tutmaya devam edebilirsin.</div>}</div>;
}
