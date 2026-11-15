import * as THREE from 'three';
import {createSignal} from './program/signal.js';
import {createTelevision} from './model/television.js';
import {setUpStudio} from './studio.js';
import {useFlatScreen} from './flat-screen.js';
import {connectEntrySignal,reflectControls} from './tv-passage.js';

const receiver=document.querySelector('#receiver');
const canvas=document.querySelector('#glass');
const still=document.querySelector('#still');
const frame={left:.292446,top:.186944,width:.415109,height:.357886};
let studio, activity;
let renderer;
try { renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'}); }
catch { /* The television's photographed receiver also hosts the live programme canvas. */ }
const signal=createSignal({
  THREE:renderer?THREE:null, renderer, logoUrl:new URL('./assets/station.webp',import.meta.url).href,
  onChange:refresh
});
connectEntrySignal(signal);
function refresh(state){
  if (!state) return;
  reflectControls(state);
  if(activity?.material?.emissive) {
    activity.material.emissive.set(state.powered?0x668966:0x000000);
    activity.material.emissiveIntensity=.65;
  }
}
function setScreenBounds(bounds){
  Object.assign(frame,bounds);
  receiver.dataset.glass=JSON.stringify(frame);
}
let flat=false;
function useFallback(){
  if(flat)return;
  flat=true;
  studio=null;
  document.documentElement.classList.remove('has-webgl');
  document.documentElement.classList.add('flat');
  setScreenBounds(frame);
  useFlatScreen({container:still,canvas:signal.canvas,bounds:frame});
}
setScreenBounds(frame);
try {
  if(renderer){
    const tv=await createTelevision(signal.material);
    activity=tv.root.getObjectByName('led_power');
    studio=setUpStudio({canvas,renderer,television:tv.root,picture:tv.screen,setScreenBounds});
    document.documentElement.classList.add('has-webgl');
    studio.ready?.then(()=>{receiver.dataset.studioReady='true';})
      .catch(error=>{console.warn('The trophy could not be loaded:',error);useFallback();});
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();useFallback();},{once:true});
  } else useFallback();
} catch (error) {
  console.warn('Using the flat-screen player:',error);
  useFallback();
}
refresh(signal.state);
let previous=0,request=0;
function draw(now){
  request=0;
  if(document.hidden)return;
  if(now-previous>=1000/30-1){
    const delta=previous?Math.min((now-previous)/1000,.1):1/30;
    previous=now;
    signal.update(delta);
    studio?.render();
  }
  request=requestAnimationFrame(draw);
}
function wake(){
  if(!document.hidden&&!request){ previous=0;request=requestAnimationFrame(draw); }
  if(document.hidden&&request){cancelAnimationFrame(request); request=0;}
}
document.addEventListener('visibilitychange',wake);
window.addEventListener('pageshow',event=>{
  if(event.persisted){
    signal.stopTape();
    wake();
  }
});
wake();
