import {ENGLISH_BRAND} from './brand.js';

// Publication-specific adaptation of TuneShape's Album Rail interaction.
const labels = {
  'zh-CN': {
    rail: '唱片架', previous: '上一期', next: '下一期', play: '播放', pause: '暂停',
    now: '本期', cancelLoading: '取消', external: '小宇宙收听',
    seek: '播放进度', list: '全部单集', error: '暂时无法载入音频，可前往小宇宙收听。', minute: '分钟', loading: '载入中', slow: '连接较慢，也可以在小宇宙收听。',
  },
  'zh-TW': {
    rail: '唱片架', previous: '上一期', next: '下一期', play: '播放', pause: '暫停',
    now: '本期', cancelLoading: '取消', external: '小宇宙收聽',
    seek: '播放進度', list: '全部單集', error: '暫時無法載入音訊，可前往小宇宙收聽。', minute: '分鐘', loading: '載入中', slow: '連線較慢，也可以在小宇宙收聽。',
  },
  en: {
    rail: 'Record sleeves', previous: 'Previous episode', next: 'Next episode', play: 'Play', pause: 'Pause',
    now: 'Now!', cancelLoading: 'Cancel', external: 'Listen on Xiaoyuzhou',
    seek: 'Playback position', list: 'All episodes', error: 'Audio could not be loaded. You can listen on Xiaoyuzhou.', minute: 'min', loading: 'Loading', slow: 'Still connecting. You can also listen on Xiaoyuzhou.',
  },
};

const cannesSeriesCovers = new Set(['8.1', '8.2', '8.3']);
const asset = (filename) => new URL(`../assets/${filename}`, import.meta.url).href;
const wrap = (value, count) => ((value % count) + count) % count;
const difference = (value, count) => wrap(value + count / 2, count) - count / 2;
const clock = (seconds) => {
  const value = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
};

function node(tag, className, text) {
  const result = document.createElement(tag);
  if (className) result.className = className;
  if (text !== undefined) result.textContent = text;
  return result;
}

const icons = {
  prev: '<path d="m15 5-7 7 7 7"/>', next: '<path d="m9 5 7 7-7 7"/>',
  external: '<path d="M5 19 18 6M6 6h12v12"/>',
};
function glyph(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
}
function iconButton(className, name) {
  const button = node('button', className);
  button.type = 'button';
  button.innerHTML = glyph(name);
  return button;
}
function nameControl(element, value) {
  element.setAttribute('aria-label', value);
  element.title = value;
}

function programmeImage(className, filename) {
  const image = node('img', className);
  image.src = asset('festival/' + filename);
  image.alt = '';
  image.draggable = false;
  return image;
}

// Category miniatures come from the three models in the sunset site's object gallery.
const categoryObjects = {festivals:'wine-glass.webp', focus:'focus.webp', cinemas:'cinemas.webp'};
// Standalone marks from the Festival de Cannes 2024 accessibility guide (cover)
// and the Berlinale site's official berlinale_logo_baer SVG group.
const festivalMarks = {cannes:'cannes.png', berlin:'berlin.svg'};

function categoryObject(episode) {
  const filename = categoryObjects[episode.categoryId];
  return filename ? programmeImage('prx-category-object', filename) : null;
}

function setEpisodeTitle(element, episode) {
  const {title, festival} = episode;
  const mark = festivalMarks[festival];
  if (!mark) { element.textContent = title; return; }
  // Bind the last word (or two CJK characters) to its mark when a title wraps.
  const ending = title.match(/(?:[\p{Script=Latin}\d’'-]+|[\p{Script=Han}]{1,2})[\p{P}]*$/u)?.[0] || '';
  const tail = node('span', 'prx-title-end', ending);
  tail.append(programmeImage('prx-festival-mark', mark));
  element.replaceChildren(title.slice(0, title.length - ending.length), tail);
}

function makeSleeve(episode) {
  const card = node('button', 'prx-card');
  card.type = 'button';
  card.dataset.number = episode.number;
  card.dataset.series = episode.categoryId;
  const vinyl = node('span', 'prx-vinyl');
  const label = node('span', 'prx-vinyl-label', episode.number);
  vinyl.append(label);
  const art = node('span', 'prx-sleeve');
  if (cannesSeriesCovers.has(episode.number)) {
    const image = node('img', 'prx-original');
    image.src = asset(`podcast-sleeves/${episode.number}.webp`);
    image.alt = '';
    image.draggable = false;
    art.append(image);
  } else {
    const photo = node('span', 'prx-dog');
    const credit = node('span', 'prx-cover-brand', '視差之見');
    const number = node('span', 'prx-cover-number', episode.number);
    const imprint = node('span', 'prx-cover-imprint', ENGLISH_BRAND);
    art.append(photo, credit, number, imprint);
  }
  art.setAttribute('aria-hidden', 'true');
  vinyl.setAttribute('aria-hidden', 'true');
  card.append(vinyl, art);
  return card;
}

export function mountPodcastStage(host, options) {
  const root = node('div', 'prx-podcast');
  const stage = node('div', 'prx-stage');
  stage.setAttribute('role', 'group');
  const fan = node('div', 'prx-fan');
  const toolbar = node('div', 'prx-toolbar');
  const previous = iconButton('prx-step', 'prev');
  const next = iconButton('prx-step', 'next');
  const positionLabel = node('span', 'prx-position');
  toolbar.append(previous, positionLabel, next);
  stage.append(fan, toolbar);

  const selected = node('div', 'prx-selected');
  const caption = node('div', 'prx-caption');
  const meta = node('p', 'prx-meta');
  const heading = node('h3', 'prx-episode-title');
  const description = node('p', 'prx-description');
  caption.append(meta, heading, description);
  const actions = node('div', 'prx-actions');
  const play = node('button', 'prx-play');
  play.type = 'button';
  const owl = programmeImage('prx-play-owl', categoryObjects.cinemas);
  const playLabel = node('span', 'prx-play-label');
  const playHover = node('span', 'prx-play-invitation');
  playHover.setAttribute('aria-hidden', 'true');
  const playFace = node('span', 'prx-play-face');
  playFace.append(owl, playHover, playLabel);
  play.append(playFace);
  const external = node('a', 'prx-external');
  external.target = '_blank';
  external.rel = 'noopener noreferrer';
  const externalText = node('span');
  external.append(externalText);
  external.insertAdjacentHTML('beforeend', glyph('external'));
  actions.append(play, external);
  const progress = node('div', 'prx-progress');
  const elapsed = node('output');
  const slider = node('input');
  slider.type = 'range'; slider.min = '0'; slider.step = '1'; slider.value = '0';
  const duration = node('span');
  progress.append(elapsed, slider, duration);
  const status = node('p', 'prx-status');
  status.setAttribute('role', 'status');
  const audio = node('audio');
  audio.preload = 'none';
  selected.append(caption, actions, progress, status, audio);

  const listHeading = node('h3', 'prx-list-heading');
  const list = node('ol', 'prx-list');
  root.append(stage, selected, listHeading, list);
  host.replaceChildren(root);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const scope = new AbortController();
  const on = (el, event, fn, settings) => el.addEventListener(event, fn, {...settings, signal:scope.signal});
  let episodes = [], cards = [], rows = [], copy = labels['zh-CN'];
  let index = 0, position = 0, target = 0, velocity = 0, raf = 0, last = 0;
  let active = true, inView = false, hovering = false, focused = false, automatic = true, autoTimer;
  let captionFade;
  let drag, discardClick = false, savedNumber = '', pending = false, failed = false, slow = false, request = 0, loadTimeout;

  function scheduleAuto() {
    clearTimeout(autoTimer);
    if (!automatic || !active || !inView || reduced.matches || document.hidden || hovering || focused || drag || pending || !audio.paused || episodes.length < 2) return;
    autoTimer = setTimeout(() => choose(target + 1, false), 10_000);
  }
  function manual() {
    automatic = false;
    clearTimeout(autoTimer);
  }
  function pose() {
    const count = cards.length;
    const frontSlot = Math.round(position);
    cards.forEach((card, i) => {
      const distance = difference(i - position, count);
      const rank = Math.abs(distance);
      const opacity = Math.max(0, Math.min(1, 3.5 - rank));
      card.style.visibility = opacity ? 'visible' : 'hidden';
      card.toggleAttribute('data-centered', i === index && rank < .10);
      if (!opacity) return;
      // The two middle sleeves clear each other's edges at the half-step,
      // so exchanging their depth cannot pop a large area of artwork.
      const outer = Math.max(0, rank - 1);
      const reach = .16 * rank + .48 * Math.tanh(3.5 * rank) + .21 * outer * outer / (outer + .25);
      const spread = Math.sign(distance) * reach;
      card.style.transform = `translate(-50%, -50%) translateX(${spread*100}%) translateY(${Math.min(4,rank)*2.2}%) perspective(750px) rotateY(${-22*Math.tanh(distance*.8)}deg) rotate(${Math.max(-3,Math.min(3,distance))*6}deg) scale(${1/(1+.057*rank)})`;
      card.style.opacity = opacity;
      card.style.zIndex = String(count - Math.abs(difference(i - frontSlot, count)));
      card.style.pointerEvents = opacity > .1 ? '' : 'none';
    });
  }
  function settle() {
    cancelAnimationFrame(raf); raf = 0; velocity = 0; position = target; pose();
  }
  function animate(now) {
    raf = 0;
    if (!active || document.hidden || reduced.matches) { settle(); return; }
    const dt = Math.min(.08, (now - last) / 1000);
    last = now;
    const frequency = automatic ? 8.5 : 12;
    const offset = position - target;
    const impulse = velocity + frequency * offset;
    const decay = Math.exp(-frequency * dt);
    position = target + (offset + impulse * dt) * decay;
    velocity = (velocity - frequency * impulse * dt) * decay;
    if (Math.abs(position-target)<.001 && Math.abs(velocity)<.002) { settle(); return; }
    pose(); raf = requestAnimationFrame(animate);
  }
  function move() {
    if (reduced.matches || !active || !inView || document.hidden) { settle(); return; }
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(animate); }
  }
  function updateProgress() {
    const nativeDuration = audio.duration;
    const total = savedNumber && Number.isFinite(nativeDuration) ? nativeDuration : episodes[index]?.duration || (episodes[index]?.minutes || 0)*60;
    const time = savedNumber ? audio.currentTime || 0 : 0;
    slider.max = String(total || 1);
    slider.value = String(time);
    slider.style.setProperty('--played', `${total ? time/total*100 : 0}%`);
    slider.disabled = !savedNumber || !Number.isFinite(nativeDuration) || failed;
    slider.setAttribute('aria-valuetext', `${clock(time)} / ${clock(total)}`);
    elapsed.textContent = clock(time);
    duration.textContent = clock(total);
  }
  function updatePlayer() {
    const current = episodes[index];
    if (!current) return;
    const playing = !audio.paused && !audio.ended && !failed;
    const stateText = pending ? copy.loading : playing ? copy.pause : copy.play;
    nameControl(play, `${pending ? copy.cancelLoading : stateText} · ${current.title}`);
    playLabel.textContent = stateText;
    playHover.textContent = pending ? copy.cancelLoading : playing ? copy.pause : copy.now;
    play.hidden = !current.audio;
    root.dataset.playing = String(playing);
    progress.hidden = !savedNumber || failed;
    status.hidden = !failed && !slow;
    status.textContent = failed ? copy.error : slow ? copy.slow : '';
    nameControl(cards[index], `${playing || pending ? copy.pause : copy.play} · ${current.title}`);
    updateProgress();
    scheduleAuto();
  }
  function stop(clearSource) {
    clearTimeout(loadTimeout); request++; pending = false; slow = false; audio.pause();
    if (clearSource && savedNumber) {
      savedNumber = ''; failed = false; audio.removeAttribute('src'); audio.load();
    }
  }
  async function togglePlay() {
    if (!active) return;
    manual();
    const current = episodes[index];
    if (!current?.audio) { external.click(); return; }
    if (pending || !audio.paused) { stop(false); updatePlayer(); return; }
    if (savedNumber !== current.number || failed) { audio.src = current.audio; savedNumber = current.number; audio.load(); }
    failed = false; slow = false; pending = true;
    const ticket = ++request;
    clearTimeout(loadTimeout);
    loadTimeout = setTimeout(() => {
      if (request === ticket && pending) { slow = true; updatePlayer(); }
    }, 10000);
    updatePlayer();
    try { await audio.play(); }
    catch (err) { if (ticket === request && err.name !== 'AbortError') failed = true; }
    if (ticket === request) { clearTimeout(loadTimeout); pending = false; slow = false; updatePlayer(); }
  }
  function writeCaption() {
    const current = episodes[index];
    if (!current) return;
    meta.textContent = current.category + '　/　';
    const object = categoryObject(current);
    if (object) meta.append(object);
    meta.append(`No. ${current.number}　/　${current.minutes} ${copy.minute}`);
    setEpisodeTitle(heading, current);
    description.textContent = current.description || '';
    description.hidden = !current.description;
  }
  function clearCaptionFade() {
    if (!captionFade) return;
    captionFade.onfinish = null;
    captionFade.cancel();
    captionFade = undefined;
  }
  function settleCaption() {
    clearCaptionFade();
    writeCaption();
  }
  function fadeCaptionTo(opacity, duration, onfinish) {
    const from = Number(getComputedStyle(caption).opacity);
    clearCaptionFade();
    captionFade = caption.animate([{opacity:from}, {opacity}], {
      duration: duration * Math.abs(from - opacity),
      easing: opacity ? 'ease-out' : 'ease-in',
      fill: 'both',
    });
    captionFade.onfinish = onfinish;
  }
  function updateCaption(animate = false) {
    const current = episodes[index];
    if (!current) return;
    if (animate && active && !document.hidden && !reduced.matches) {
      fadeCaptionTo(0, 150, () => {
        writeCaption();
        fadeCaptionTo(1, 230, clearCaptionFade);
      });
    } else {
      settleCaption();
    }
    positionLabel.textContent = `${String(index+1).padStart(2,'0')} / ${String(episodes.length).padStart(2,'0')}`;
    external.href = current.url;
    externalText.textContent = copy.external;
    cards.forEach((card, i) => {
      const chosen = i === index;
      card.dataset.selected = String(chosen);
      card.tabIndex = chosen ? 0 : -1;
      card.setAttribute('aria-current', String(chosen));
      nameControl(card, episodes[i].title);
      rows[i].setAttribute('aria-current', String(chosen));
    });
    updatePlayer();
  }
  // Keep arrow and wheel destinations in continuous slots across the loop.
  // A direct selection from the list takes the nearest route from the current frame.
  function nearestSlot(i) {
    return Math.round(position + difference(i - position, episodes.length));
  }
  function choose(slot, byHand = true) {
    if (!episodes.length) return;
    if (byHand) manual();
    const next = wrap(slot, episodes.length);
    if (next !== index) { stop(true); index = next; updateCaption(true); }
    target = slot;
    move(); scheduleAuto();
  }
  function drawItems() {
    cards = episodes.map(makeSleeve);
    rows = episodes.map(episode => {
      const row = node('button', 'prx-row');
      row.type = 'button';
      const number = node('span','prx-row-no');
      const object = categoryObject(episode);
      if (object) number.append(object);
      number.append(node('span','prx-index',episode.number));
      row.append(number,node('span','prx-row-title'),node('span','prx-row-duration'));
      return row;
    });
    fan.replaceChildren(...cards);
    list.replaceChildren(...rows.map((row) => { const li=node('li'); li.append(row); return li; }));
  }
  function update({locale, episodes: entries}) {
    const prior = episodes[index]?.number;
    const changed = episodes.length !== entries.length || entries.some((entry,i) => entry.number !== episodes[i]?.number);
    copy = labels[locale] || labels['zh-CN'];
    episodes = entries;
    if (changed) {
      const next = episodes.findIndex(item => item.number === prior);
      if (prior && next < 0) stop(true);
      index = Math.max(0,next); target = index;
      drawItems(); settle();
    }
    root.hidden = !episodes.length;
    if (!episodes.length) { clearCaptionFade(); return; }
    nameControl(previous,copy.previous); nameControl(next,copy.next);
    stage.setAttribute('aria-label',copy.rail);
    nameControl(slider,copy.seek);
    listHeading.textContent = copy.list;
    rows.forEach((row,i) => {
      const e = episodes[i];
      setEpisodeTitle(row.querySelector('.prx-row-title'), e);
      const runtime = `${e.minutes} ${copy.minute}`;
      row.querySelector('.prx-row-duration').textContent = runtime;
      row.setAttribute('aria-label', [e.category, e.number, e.title, runtime].join(' · '));
    });
    updateCaption();
  }

  on(previous,'click',() => choose(target-1));
  on(next,'click',() => choose(target+1));
  on(play,'click', togglePlay);
  on(fan,'click',event => {
    if (discardClick) { discardClick = false; return; }
    const i = cards.indexOf(event.target.closest('.prx-card'));
    if (i === index) togglePlay(); else if (i >= 0) choose(nearestSlot(i));
  });
  on(list,'click',event => {
    const row = event.target.closest('.prx-row');
    const i = rows.indexOf(row);
    if (i < 0) return;
    choose(nearestSlot(i));
    play.focus({preventScroll:true});
    if (selected.getBoundingClientRect().top < 80) selected.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'center'});
  });
  on(stage,'keydown', event => {
    const targets = {ArrowLeft:target-1, ArrowRight:target+1, Home:nearestSlot(0), End:nearestSlot(episodes.length-1)};
    if (Object.hasOwn(targets,event.key)) {
      event.preventDefault(); event.stopPropagation(); choose(targets[event.key]);
      if (fan.contains(document.activeElement)) cards[index].focus({preventScroll:true});
    } else if (event.key==='Escape') { stop(false); updatePlayer(); }
  });
  on(stage,'pointerenter',e => { if(e.pointerType!=='touch'){hovering=true;scheduleAuto();} });
  on(stage,'pointerleave',() => {hovering=false;scheduleAuto();});
  on(root,'focusin',() => {focused=true;scheduleAuto();});
  on(root,'focusout',e => {focused=root.contains(e.relatedTarget);scheduleAuto();});
  on(fan,'pointerdown',e => {
    if (!e.isPrimary || e.button!==0) return;
    drag={id:e.pointerId,x:e.clientX,y:e.clientY,origin:position,moving:false,step:Math.max(52,(cards[index]?.offsetWidth||175)*.64)};
    discardClick=false; scheduleAuto();
  });
  on(fan,'pointermove',e => {
    if (!drag || e.pointerId!==drag.id) return;
    const dx=e.clientX-drag.x, dy=e.clientY-drag.y;
    if (!drag.moving) {
      if (Math.abs(dy)>8 && Math.abs(dy)>Math.abs(dx)) { drag=null;scheduleAuto();return; }
      if (Math.abs(dx)<8) return;
      drag.origin=position; drag.moving=true; manual(); cancelAnimationFrame(raf);raf=0;velocity=0;fan.setPointerCapture(e.pointerId);
    }
    position=drag.origin-dx/drag.step; pose();
  });
  const endDrag=e => {
    if (!drag || e.pointerId!==drag.id) return;
    const moving=drag.moving; drag=null;
    if (fan.hasPointerCapture(e.pointerId)) fan.releasePointerCapture(e.pointerId);
    if (moving) { discardClick=true; choose(Math.round(position)); }
    scheduleAuto();
  };
  on(fan,'pointerup',endDrag); on(fan,'pointercancel',endDrag);
  on(fan,'pointerleave',() => { if(drag&&!drag.moving){drag=null;scheduleAuto();} });
  let wheelDistance=0, wheelUntil=0;
  on(fan,'wheel',e => {
    const dx=e.shiftKey ? e.deltaY || e.deltaX : e.deltaX;
    if (!dx || (!e.shiftKey && Math.abs(dx)<Math.abs(e.deltaY))) return;
    e.preventDefault();
    const now=performance.now();
    if (now<wheelUntil) return;
    wheelDistance+=dx*(e.deltaMode===1?16:1);
    if (Math.abs(wheelDistance)>30) { choose(target+Math.sign(wheelDistance));wheelDistance=0;wheelUntil=now+250; }
  },{passive:false});
  on(slider,'input',() => { if (Number.isFinite(audio.duration)) { audio.currentTime=Number(slider.value); updateProgress(); } });
  on(audio,'timeupdate',updateProgress); on(audio,'durationchange',updateProgress);
  on(audio,'playing',() => { clearTimeout(loadTimeout); pending=false; slow=false; failed=false; updatePlayer(); });
  on(audio,'pause', updatePlayer); on(audio,'ended',updatePlayer);
  on(audio,'error',() => { if (savedNumber && audio.error) { clearTimeout(loadTimeout);pending=false; slow=false; failed=true; updatePlayer(); } });
  function settleMotion() {
    settle();
    if (captionFade) settleCaption();
  }
  on(document,'visibilitychange',() => { if (document.hidden) settleMotion(); scheduleAuto(); });
  on(reduced,'change',()=> {if(reduced.matches) settleMotion();scheduleAuto();});
  const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; if (!inView) settle(); scheduleAuto(); },{threshold:.12});
  observer.observe(stage);
  update(options);
  return {
    update,
    setActive(value) { active=Boolean(value); if (!active) { stop(false);settleMotion();updatePlayer(); } scheduleAuto(); },
    destroy() { observer.disconnect();scope.abort();clearCaptionFade();stop(true);clearTimeout(autoTimer);cancelAnimationFrame(raf);root.remove(); },
  };
}
