import {crtFragment} from './effect.js';

const width = 960;
const height = 720;
const threadingTime = .22;
const captionTime = 2.5;

export function createSignal({THREE, renderer, logoUrl, onChange}) {
  const canvas = document.createElement('canvas');
  const ident = document.createElement('canvas');
  canvas.width = ident.width = width;
  canvas.height = ident.height = height;
  const ctx = canvas.getContext('2d', {alpha:false});
  const plate = ident.getContext('2d', {alpha:false});
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const logo = new Image();
  let powered = true, playing = false, elapsed = 0, clock = 0, powerAt = -10;
  let dirty = true;
  let texture, target, material, pass, geometry, scene, camera, uniforms;

  function drawIdent() {
    plate.fillStyle = '#080c0a';
    plate.fillRect(0, 0, width, height);
    if (logo.naturalWidth) {
      const scale = Math.min((width - 36) / logo.naturalWidth, (height - 36) / logo.naturalHeight);
      const w = logo.naturalWidth * scale, h = logo.naturalHeight * scale;
      plate.drawImage(logo, (width - w) / 2, (height - h) / 2, w, h);
    }
    dirty = true;
  }
  logo.addEventListener('load', drawIdent);
  drawIdent();
  logo.src = logoUrl;

  if (THREE && renderer) {
    texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    const values = {T:texture, t:0, g:0, trk:.105, sat:.9775, openX:1, openY:1,
      dotR:0, us:0, hv:0, bo:0, fit:new THREE.Vector2(1.07,1.1), R:new THREE.Vector2(width,height)};
    uniforms = Object.fromEntries(Object.entries(values).map(([key,value]) => [key, {value}]));
    // Reduce only the raster-line and phosphor-column contrast on this smaller display.
    const fragmentShader = crtFragment.replace('.86+.14*sin', '.975+.025*sin')
      .replace('.9+.1*sin', '.985+.015*sin');
    pass = new THREE.ShaderMaterial({uniforms, fragmentShader,
      vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}'});
    target = new THREE.WebGLRenderTarget(768,576,{depthBuffer:false});
    scene = new THREE.Scene();
    geometry = new THREE.PlaneGeometry(2,2);
    scene.add(new THREE.Mesh(geometry,pass));
    camera = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    material = new THREE.MeshPhysicalMaterial({color:'#0d1110',roughness:.26,clearcoat:.75,
      clearcoatRoughness:.13,emissive:0xffffff,emissiveMap:target.texture,emissiveIntensity:1.58});
  }

  function state() { return {powered, playing}; }
  function notify() { onChange?.(state()); }
  function paintSource(glitch, flat) {
    if (!powered) {
      ctx.fillStyle = '#070b09';
      ctx.fillRect(0,0,width,height);
      return;
    }
    ctx.drawImage(ident,0,0);
    if (!playing) return;
    if (flat && glitch > 0) {
      // A displaced run of scanlines reproduces the VHS pass when the device draws in 2D.
      const band = Math.round((elapsed - threadingTime) / .34 * height);
      const strip = 18;
      for (let i=0; i<4; i++) {
        const y = band + i*strip;
        if (y < 0 || y + strip > height) continue;
        const shift = Math.round(Math.sin(clock*49 + i*3.6) * 38 * glitch);
        ctx.drawImage(ident,0,y,width,strip,shift,y,width,strip);
      }
    }
    ctx.save();
    ctx.font = '44px VT323, monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f2f2f2';
    ctx.shadowColor = 'rgba(0,0,0,.65)';
    ctx.shadowOffsetX = ctx.shadowOffsetY = 3;
    ctx.fillText('▶ PLAY TAPE',60,82);
    ctx.restore();
  }

  function update(delta) {
    clock += delta;
    if (playing) {
      elapsed += delta;
      if (elapsed >= captionTime) {
        playing = false;
        dirty = true;
        notify();
      }
    }
    // The original deck threads for 220 ms, then releases its .9 sync burst over .34 s.
    const sync = playing && elapsed >= threadingTime ? Math.max(0, .9 - (elapsed-threadingTime)/.34) : 0;
    const glitch = motion.matches ? 0 : sync;
    const flat = !renderer || canvas.isConnected;
    if (dirty || playing && flat) {
      paintSource(glitch, flat);
      if (texture) texture.needsUpdate = true;
      dirty = false;
    }
    if (!uniforms || flat) return;
    uniforms.t.value = motion.matches ? 0 : clock;
    uniforms.g.value = glitch;
    const p = clock - powerAt;
    let x = powered ? 1 : 0, y = x, dot = 0;
    if (!motion.matches && p < 1.56) {
      if (powered) {
        x = Math.min(1, p/.12);
        y = p < .12 ? .004 : Math.min(1, ((p-.12)/.35)**.7);
      } else {
        y = Math.max(.004, 1-p/.14);
        x = p < .14 ? 1 : Math.max(0,1-(p-.14)/.12);
        dot = p < .26 ? 0 : Math.max(0,.05*(1-(p-.26)/1.3));
      }
    }
    uniforms.openX.value = x;
    uniforms.openY.value = y;
    uniforms.dotR.value = dot;
    const previousTarget = renderer.getRenderTarget();
    renderer.setRenderTarget(target);
    renderer.render(scene,camera);
    renderer.setRenderTarget(previousTarget);
  }

  return {
    material, canvas, update, get state() { return state(); },
    playTape() {
      if (!powered) return;
      elapsed = 0;
      playing = dirty = true;
      notify();
    },
    stopTape() {
      elapsed = 0;
      playing = false;
      dirty = true;
      notify();
    },
    togglePower() {
      powered = !powered;
      playing = false;
      powerAt = clock;
      dirty = true;
      notify();
    },
    dispose() {
      logo.removeEventListener('load', drawIdent);
      geometry?.dispose();
      pass?.dispose();
      texture?.dispose();
      target?.dispose();
      material?.dispose();
    }
  };
}
