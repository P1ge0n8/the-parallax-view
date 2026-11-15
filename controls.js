import {BRAND, ENGLISH_BRAND} from './src/brand.js';

export function connectControls({action}) {
  const screen=document.querySelector('#screen');
  const play=document.querySelector('[data-action="play"]');
  const power=document.querySelector('[data-action="power"]');
  const status=document.querySelector('#status');
  const translations = {
    'zh-CN': {tv:'电视', enter:'点击电视，进入内页', play:'播放并进入内页', controls:'电视遥控器', on:'开机', off:'关机', ident:'台标', poweredOff:'电视已关机'},
    'zh-TW': {tv:'電視', enter:'點選電視，進入內頁', play:'播放並進入內頁', controls:'電視遙控器', on:'開機', off:'關機', ident:'台標', poweredOff:'電視已關機'},
    en: {tv:'Television', enter:'Enter the site through the television', play:'Play tape and enter', controls:'Television controls', on:'Power on', off:'Power off', ident:'Station ident', poweredOff:'Television is off'}
  };
  let copy;
  function applyLanguage() {
    let lang;
    try { lang = localStorage.getItem('parallax-language:v1'); } catch {}
    if (!Object.hasOwn(translations, lang)) lang = 'zh-CN';
    copy = translations[lang];
    document.documentElement.lang = lang;
    document.title = (lang === 'en' ? ENGLISH_BRAND : BRAND) + ' · ' + copy.tv;
    document.querySelector('main').setAttribute('aria-label', document.title);
    document.querySelector('.controls').setAttribute('aria-label', copy.controls);
    screen.setAttribute('aria-label', copy.enter);
    play.setAttribute('aria-label', copy.play);
    play.title = copy.play;
  }
  applyLanguage();
  let lastState;
  window.addEventListener('pageshow', () => {
    applyLanguage();
    if (lastState) reflect(lastState);
  });
  function enter(event) {
    if(event.defaultPrevented || event.button!==0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    action('play');
  }
  screen.addEventListener('click',enter);
  play.addEventListener('click',enter);
  power.addEventListener('click',()=>action('power'));
  document.addEventListener('keydown',event=>{
    if(event.metaKey||event.ctrlKey||event.altKey||event.shiftKey||event.repeat) return;
    if(event.key===' ' && event.target.closest?.('button')) return;
    if(event.key===' ' || event.key.toLowerCase()==='p') {
      event.preventDefault();
      if (event.key === ' ') play.click();
      else action('power');
    }
  });
  function reflect(state) {
    lastState = state;
    const {powered, playing} = state;
    const actionLabel = powered ? copy.off : copy.on;
    power.setAttribute('aria-label', actionLabel);
    power.title = actionLabel + ' (P)';
    status.textContent = powered ? (document.documentElement.lang === 'en' ? ENGLISH_BRAND : BRAND) + ' · ' + (playing ? 'PLAY TAPE' : copy.ident) : copy.poweredOff;
  }
  return reflect;
}
