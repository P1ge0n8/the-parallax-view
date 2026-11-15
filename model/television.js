import * as THREE from 'three';
import {installMacintoshTV} from './case.js';

// The first three arrays and the triangle indices are the glass mesh from the room.
async function loadGlass(){
  const response = await fetch(new URL('./glass.bin',import.meta.url));
  if(!response.ok) throw new Error('Could not load the CRT glass.');
  const data = await response.arrayBuffer();
  const count=1225;
  const original=new Uint16Array(data,0,count*3);
  const normal=new Int8Array(data,7350,count*3);
  const texture=new Uint16Array(data.slice(11025,15925));
  const index=new Uint16Array(data.slice(15925));
  const min=[-.1439972,.0880013,-.0379543], extent=[.2879944,.2199974,.0169544];
  const position=Float32Array.from(original,(q,i)=>min[i%3]+extent[i%3]*q/65535);
  const geometry=new THREE.BufferGeometry();
  geometry.setIndex(new THREE.BufferAttribute(index,1));
  geometry.setAttribute('position',new THREE.BufferAttribute(position,3));
  geometry.setAttribute('normal',new THREE.BufferAttribute(normal,3,true));
  geometry.setAttribute('uv',new THREE.BufferAttribute(texture,2,true));
  return geometry;
}

export async function createTelevision(material){
  const root=new THREE.Group();
  const [geometry]=await Promise.all([loadGlass(), document.fonts.load('500 64px Geist').catch(()=>[])]);
  const screen=new THREE.Mesh(geometry,material);
  screen.name='screen';
  screen.position.set(0,.866,.185);
  root.add(screen);
  installMacintoshTV(root);
  screen.position.z+=.005;
  root.position.y=-.858;
  return {root,screen};
}
