import {defineConfig} from 'vite';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

export default defineConfig({
  plugins: [{
    name: 'courtly-offline-assets',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const assets = ['/', '/icon.svg', '/icon-192.png', '/icon-512.png', '/manifest.webmanifest',
        ...Object.keys(bundle).filter(name => /\.(js|css)$/.test(name)).map(name => `/${name}`)];
      const template = readFileSync(new URL('./src/service-worker.js', import.meta.url), 'utf8');
      const version = createHash('sha256').update(template + assets.join('\n')).digest('hex').slice(0, 12);
      this.emitFile({type:'asset', fileName:'sw.js', source:template
        .replace('__CACHE_VERSION__', version)
        .replace('__PRECACHE_ASSETS__', JSON.stringify(assets))});
    },
  }],
});
