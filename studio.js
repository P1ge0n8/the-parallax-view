import * as THREE from "three";
import { GLTFLoader } from "./vendor/addons/loaders/GLTFLoader.js";
import { finishPalm } from "./assets/finish-palm.js";

function studioReflections() {
  const paper = document.createElement("canvas");
  paper.width = 256;
  paper.height = 128;
  const paint = paper.getContext("2d");
  const room = paint.createLinearGradient(0, 0, 0, 128);
  room.addColorStop(0, "#f1ebe0");
  room.addColorStop(.49, "#776e62");
  room.addColorStop(.51, "#2e2b25");
  room.addColorStop(1, "#7b705e");
  paint.fillStyle = room;
  paint.fillRect(0, 0, 256, 128);
  paint.fillStyle = "#fff9e9";
  paint.fillRect(20, 21, 56, 51);
  paint.fillStyle = "#f4f7ff";
  paint.fillRect(145, 12, 22, 69);
  const map = new THREE.CanvasTexture(paper);
  map.mapping = THREE.EquirectangularReflectionMapping;
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

async function placePalm(scene, shadow) {
  const asset = await new GLTFLoader().loadAsync(new URL("./assets/palme.glb", import.meta.url).href);
  const award = finishPalm(asset.scene);
  const reflection = studioReflections();
  award.traverse(part => {
    if (part.material?.isMeshStandardMaterial) part.material.envMap = reflection;
  });
  const bounds = new THREE.Box3().setFromObject(award, true);
  const scale = .151 / (bounds.max.y - bounds.min.y);
  award.scale.setScalar(scale);
  award.rotation.y = -.13;
  award.position.set(.246, -bounds.min.y * scale, .095);
  scene.add(award);
  const contact = shadow.clone();
  contact.scale.set(.20, .12, 1);
  contact.position.set(award.position.x, .001, award.position.z);
  scene.add(contact);
}

function contactShadow() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(64, 64, 1, 64, 64, 64);
  for (const [r, opacity] of [[0,.36],[.33,.26],[.59,.13],[.82,.035],[1,0]]) {
    gradient.addColorStop(r, 'rgba(34,29,22,' + opacity + ')');
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const map = new THREE.CanvasTexture(canvas);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(.77,.66),
    new THREE.MeshBasicMaterial({map, transparent:true, depthWrite:false, toneMapped:false}));
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(.015, .0005, 0);
  return mesh;
}

export function setUpStudio({canvas, renderer, television, picture, setScreenBounds}) {
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.21;

  const scene = new THREE.Scene();
  scene.add(television);
  scene.add(new THREE.HemisphereLight(0xfff8eb, 0xbbad9c, 2.55));
  const key = new THREE.DirectionalLight(0xfff1db, 3.6);
  key.position.set(-1.24,1.85,1.7);
  key.target.position.set(0,.19,0);
  scene.add(key,key.target);
  const rim = new THREE.DirectionalLight(0xe8f1ff, 2.55);
  rim.position.set(1.12,.84,-.74);
  scene.add(rim);
  const ground = contactShadow();
  const footShadow = ground.clone();
  footShadow.scale.set(.60,.65,1);
  footShadow.position.set(.005,.0009,.020);
  scene.add(ground,footShadow);

  const camera = new THREE.PerspectiveCamera(23, 1, .05, 12);
  // Keep the optical axis perpendicular to the centreline of the receiver.
  camera.position.set(0,.226,1.58);
  camera.lookAt(0,.226,0);
  camera.updateMatrixWorld();
  function updateLayout(){
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    renderer.setSize(rect.width,rect.height,false);
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
    scene.updateMatrixWorld(true);
    // Map the physical glass into the DOM so a keyboard or touch can operate it, too.
    const pos = picture.geometry.getAttribute('position');
    const point = new THREE.Vector3();
    let left=Infinity, right=-Infinity, top=Infinity, bottom=-Infinity;
    for(let i=0;i<pos.count;i++){
      point.fromBufferAttribute(pos,i).applyMatrix4(picture.matrixWorld).project(camera);
      const x=(point.x+1)/2, y=(1-point.y)/2;
      left=Math.min(left,x); right=Math.max(right,x);
      top=Math.min(top,y); bottom=Math.max(bottom,y);
    }
    setScreenBounds({left,top,width:right-left,height:bottom-top});
    renderer.render(scene,camera);
  }
  new ResizeObserver(updateLayout).observe(canvas);
  updateLayout();
  const ready = placePalm(scene, ground).then(updateLayout);
  return {render:()=>renderer.render(scene,camera), ready};
}
