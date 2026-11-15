import * as THREE from 'three';

// The original desktop adds a canvas-backed festival plaque after loading the Blender meshes.
function createPlaque() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.fillStyle = '#304a41';
  context.fillRect(0, 0, 256, 128);
  context.fillStyle = '#d3dbbd';
  context.textAlign = 'center';
  for (const [i, line] of ['FESTIVAL', 'DE CANNES'].entries()) {
    context.font = `bold ${i === 0 ? 24 : 15}px monospace`;
    context.fillText(line, 128, 36 + i * 29);
  }

  // State at this label after the original desktop's worn finishes and earlier labels.
  let seed = 20809143;
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  context.fillStyle = '#151d1522';
  for (let i = 0; i < 140; i++) {
    context.fillRect(random() * 256, random() * 128, random() * 12, 1);
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(.47, .23),
    new THREE.MeshBasicMaterial({ map, side: THREE.DoubleSide }),
  );
  plaque.name = 'Festival de Cannes plaque';
  plaque.receiveShadow = true;
  plaque.position.set(.12, .30, .225);
  return plaque;
}

// Apply the authored material settings from the original site's refined-models.js.
export function finishPalm(root) {
  const palm = root.getObjectByName('palm');
  palm.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
    const m = object.material;
    m.flatShading = false;
    m.envMapIntensity = 1.15;
    if (m.normalMap) {
      m.normalMap.anisotropy = 8;
      m.normalMap.magFilter = THREE.LinearFilter;
      m.normalMap.minFilter = THREE.LinearMipmapLinearFilter;
    }
    if (m.name === 'Crystal') {
      m.thickness = .35;
      m.transparent = true;
      m.opacity = .36;
      m.attenuationColor.set('#ecf5f0');
      m.attenuationDistance = 4;
      m.side = THREE.DoubleSide;
      m.depthWrite = false;
      object.castShadow = false;
    }
  });
  palm.add(createPlaque());
  return root;
}
