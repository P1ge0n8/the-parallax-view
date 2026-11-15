import {mountRailView} from './src/rail-view.js';
import {mountRailEditor} from './src/rail-editor.js';
import {downloadRailHTML,downloadRailJSON} from './src/rail-export.js';

import {cinemaDirectory} from './src/cinema-content.js';

let config=cinemaDirectory;
const $=id=>document.getElementById(id);
const motion=matchMedia('(prefers-reduced-motion: reduce)');
let demo=false,paused=false;
const view=mountRailView({railHost:$('rail-host'),readerHost:$('reader-host'),config,prefix:'parallax',
  onDemoEnd:()=>{demo=false;syncControls();}});
const editor=mountRailEditor($('editor-host'),{config,onChange:next=>{
  if(next.title!==config.title)view.setTitle(next.title);
  if(next.items!==config.items)view.setItems(next.items);
  config=next;
  if(config.items.length<2 && demo){demo=false;view.setDemo(false);}
  syncControls();
}});
function syncControls(){
  $('demo').disabled=motion.matches || config.items.length<2;
  $('demo').setAttribute('aria-pressed',String(demo));
  $('demo').setAttribute('aria-label',demo?'停止往返演示':'演示往返移动');
  $('demo').title=$('demo').getAttribute('aria-label');
  $('pause').setAttribute('aria-pressed',String(paused));
  $('pause').setAttribute('aria-label',paused?'继续动画':'暂停动画');
  $('pause').title=$('pause').getAttribute('aria-label');
}
function showEditor(value,returnFocus=false) {
  $('editor-drawer').hidden=!value;
  document.querySelector('.doc-layout').classList.toggle('is-editing',value);
  $('edit-open').setAttribute('aria-expanded',String(value));
  if(value)$('editor-host').querySelector('input')?.focus({preventScroll:true});
  else if(returnFocus)$('edit-open').focus();
}
$('edit-open').addEventListener('click',()=>showEditor($('editor-drawer').hidden));
$('edit-close').addEventListener('click',()=>showEditor(false,true));
$('editor-drawer').addEventListener('keydown',event=>{if(event.key==='Escape')showEditor(false,true);});
$('link-reading').addEventListener('change',event=>{
  config={...config,linked:event.target.checked};view.setLinked(config.linked);editor.sync(config);
});
$('demo').addEventListener('click',()=>{
  demo=!demo;
  if(demo&&paused){paused=false;view.setPaused(false);}
  view.setDemo(demo);syncControls();
});
$('pause').addEventListener('click',()=>{paused=!paused;view.setPaused(paused);syncControls();});
$('speed').addEventListener('change',event=>view.setRate(Number(event.target.value)));
motion.addEventListener('change',()=>{if(motion.matches)demo=false;syncControls();});
const downloads=document.querySelector('.download');
document.addEventListener('click',event=>{if(!downloads.contains(event.target))downloads.open=false;});
downloads.addEventListener('keydown',event=>{if(event.key==='Escape'){downloads.open=false;downloads.querySelector('summary').focus();}});
let noticeTimer;
for(const button of document.querySelectorAll('[data-download]')) {
  button.addEventListener('click',async()=>{
    const format=button.dataset.download;
    downloads.open=false;
    clearTimeout(noticeTimer);
    try{
      await (format==='html'?downloadRailHTML(config):downloadRailJSON(config));
      $('notice').textContent='已导出 '+format.toUpperCase();
    }catch{
      $('notice').textContent='导出未完成，请重新打开页面后再试。';
    }
    noticeTimer=setTimeout(()=>{$('notice').textContent='';},3000);
    downloads.querySelector('summary').focus({preventScroll:true});
  });
}
syncControls();
