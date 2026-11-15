import {createLanguageSelector} from './language-selector.js';
import {createRailTOC} from './rail-toc.js';
import {BRAND, ENGLISH_BRAND, getPublication, LINKS, SECTION_IDS} from './publication-i18n.js';
import {mountPodcastStage} from './podcast-stage.js';

const get = selector => document.querySelector(selector);
const languageKey = 'parallax-language:v1';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const aliases = {journal:'articles', festivals:'podcast', 'cannes-79':'podcast', focus:'podcast', cinemas:'podcast'};
let savedLanguage;
try { savedLanguage = localStorage.getItem(languageKey); } catch {}
let publication = getPublication(savedLanguage);
let requestedLocale = publication.locale;
let languageFade;
const spread = get('.spread');
let currentSection;
let podcast;
const reader = get('#publication');
const pages = SECTION_IDS.map(id => document.getElementById(id));
const contactCard = get('.contact-card');
const cardTrigger = get('.contact-card-trigger');
const cardSocial = get('.contact-card-social');
let slides = [];

function sectionFromHash() {
  const id = location.hash.slice(1);
  return SECTION_IDS.includes(id) ? id : Object.hasOwn(aliases, id) ? aliases[id] : 'about';
}
function make(tag, value) {
  const el = document.createElement(tag);
  if (value) el.textContent = value;
  return el;
}
function items() {
  return SECTION_IDS.map(id => ({id, title: publication.nav[id]}));
}
const rail = createRailTOC(get('#rail-host'), {
  title: publication.ui.sections, items: items(),
  onSelect({id,source}) { navigate(id, {source}); }
});

function stopSlides() {
  for (const slide of slides) {
    slide.onfinish = null;
    slide.cancel();
  }
  slides = [];
}

function settleSection() {
  stopSlides();
  for (const page of pages) {
    page.hidden = page.id !== currentSection;
    page.inert = page.hidden;
    page.scrollTop = 0;
  }
  reader.removeAttribute('data-sliding');
  reader.style.removeProperty('--section-window');
}

function slideSection(leaving, incoming, direction) {
  // Keep any portion of the stack that is still on screen, including the
  // previous sheet on a quick reversal. Positions are in viewport heights.
  const bounds = reader.getBoundingClientRect();
  const interrupted = slides.length > 0;
  const starts = new Map();
  for (const page of pages) {
    if (page.hidden) continue;
    const y = interrupted ? (page.getBoundingClientRect().top - bounds.top) / (bounds.height || 1) : 0;
    if (Math.abs(y) < 1 || page === incoming) starts.set(page, y);
  }
  stopSlides();
  const scrollOffset = window.scrollY > get('.spread').offsetTop ? window.scrollY : 0;
  if (scrollOffset) window.scrollTo({top:0, behavior:'instant'});
  const height = Math.max(1, window.innerHeight - reader.getBoundingClientRect().top);
  reader.style.setProperty('--section-window', height + 'px');
  reader.dataset.sliding = '';

  if (!starts.has(incoming)) {
    const visible = Array.from(starts.values());
    const edge = direction > 0 ? Math.max(0, ...visible) : Math.min(0, ...visible);
    starts.set(incoming, edge + direction);
  }
  for (const page of pages) {
    page.hidden = !starts.has(page);
    page.inert = page !== incoming;
  }
  if (scrollOffset && !interrupted) leaving.scrollTop = scrollOffset;
  incoming.scrollTop = 0;

  const travel = starts.get(incoming);
  const duration = Math.min(650, Math.max(180, 560 * Math.sqrt(Math.abs(travel))));
  for (const [page, from] of starts) {
    const slide = page.animate([
      {transform:`translateY(${from * 100}%)`},
      {transform:`translateY(${(from - travel) * 100}%)`}
    ], {duration, easing:interrupted ? 'cubic-bezier(.22,.54,.25,1)' : 'cubic-bezier(.42,.04,.22,1)', fill:'both'});
    slides.push(slide);
    if (page === incoming) slide.onfinish = settleSection;
  }
}

function navigate(id, {source, initial = false} = {}) {
  if (currentSection === id) return;
  const leaving = currentSection && get('#' + currentSection);
  const incoming = get('#' + id);
  const index = SECTION_IDS.indexOf(id);
  currentSection = id;
  if (leaving?.id === 'contact') setCardOpen(false);
  if (source && !initial) {
    const change = source === 'wheel' ? 'replaceState' : 'pushState';
    history[change](null, '', '#' + id);
  }
  if (!['wheel','keyboard','click'].includes(source)) rail.setActive(index, {instant:initial});
  if (id === 'podcast' && !podcast) podcast = mountPodcastStage(get('#podcast-host'), publication);
  podcast?.setActive(id === 'podcast');
  document.title = publication.nav[id] + ' · ' + (publication.locale === 'en' ? ENGLISH_BRAND : BRAND);
  if (leaving?.contains(document.activeElement)) reader.focus({preventScroll:true});
  if (initial || reducedMotion.matches || document.hidden) {
    settleSection();
    if (!initial && window.scrollY > get('.spread').offsetTop) window.scrollTo({top:0, behavior:'instant'});
  } else {
    slideSection(leaving, incoming, Math.sign(index - pages.indexOf(leaving)));
  }
}

reducedMotion.addEventListener('change', () => { if (reducedMotion.matches && slides.length) settleSection(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && slides.length) settleSection(); });
window.addEventListener('pagehide', () => { if (slides.length) settleSection(); });
function localize() {
  const {locale, ui, nav, about, articles, contact} = publication;
  document.documentElement.lang = locale;
  document.title = nav[currentSection || sectionFromHash()] + ' · ' + (publication.locale === 'en' ? ENGLISH_BRAND : BRAND);
  get('.skip-link').textContent = ui.skip;
  get('.brand').setAttribute('aria-label', (locale === 'en' ? ENGLISH_BRAND : BRAND) + ' · ' + ui.home);
  languageSelector.setLabel(ui.language);
  get('.return-tv span').textContent = ui.home;
  rail.setTitle(ui.sections);
  rail.setItems(items());
  for (const id of SECTION_IDS) get('#' + id + '-title').textContent = nav[id];
  get('.statement').replaceChildren(...about.statement.map(line => make('span',line)));
  get('.about-copy').replaceChildren(...about.paragraphs.map(text => make('p',text)));
  get('.still-wide img').alt = about.portraitAlt;
  get('.still-close img').alt = about.handAlt;
  get('.contributors h3').textContent = ui.hosts;
  get('.hosts').replaceChildren(...about.hosts.map(({name,account,bio}) => {
    const li = make('li');
    const byline = make('strong', name);
    byline.append(make('small', account));
    li.append(byline, make('p',bio));
    return li;
  }));
  get('.article-status').replaceChildren(make('span',articles.status), make('span',ui.articlesPending));
  get('.article-status').firstElementChild.lang = 'en';
  get('.article-status').firstElementChild.setAttribute('aria-hidden','true');
  get('.article-status').lastElementChild.className = 'sr-only';
  get('.contact-intro').textContent = contact.intro;
  cardTrigger.setAttribute('aria-label', get('.contact-card-name').textContent + ' · ' + ui.socialAccounts);
  for (const link of cardSocial.querySelectorAll('a')) {
    const platform = link.dataset.platform;
    link.href = LINKS[platform];
    link.setAttribute('aria-label', contact.channels[platform]);
    link.title = contact.channels[platform] + ' · ' + ui.openLink;
  }
  podcast?.update(publication);
}
function commitLocale() {
  if (publication.locale === requestedLocale) return;
  // Pin the reader's current passage when a translation wraps onto more lines.
  let anchor;
  if (window.scrollY > spread.offsetTop && !slides.length) {
    const {left, width} = reader.getBoundingClientRect();
    const middle = document.elementFromPoint(left + width / 2, innerHeight / 2);
    anchor = middle?.closest('.prx-row, .prx-selected, .prx-stage, .about-copy, .still-pair, .contributors, .contact-card');
  }
  const top = anchor?.getBoundingClientRect().top;
  publication = getPublication(requestedLocale);
  localize();
  if (anchor) window.scrollBy({top:anchor.getBoundingClientRect().top - top, behavior:'instant'});
}

function clearFade() {
  if (!languageFade) return;
  languageFade.onfinish = null;
  languageFade.cancel();
  languageFade = undefined;
}

function settleLanguage() {
  clearFade();
  commitLocale();
}

function fadeCopy(to, milliseconds, after) {
  const opacity = getComputedStyle(spread).getPropertyValue('--copy-opacity').trim();
  clearFade();
  languageFade = spread.animate([
    {'--copy-opacity': opacity},
    {'--copy-opacity': to}
  ], {
    duration: Math.max(1, milliseconds * Math.abs(to - Number(opacity))),
    easing: to ? 'cubic-bezier(.16,1,.3,1)' : 'ease-in',
    fill: 'both'
  });
  languageFade.onfinish = after;
}

const languageSelector = createLanguageSelector(get('.languages'), publication.locale, id => {
  requestedLocale = id;
  try { localStorage.setItem(languageKey, id); } catch {}
  if (reducedMotion.matches || document.hidden) { settleLanguage(); return; }
  const reveal = () => fadeCopy(1, 230, clearFade);
  if (id === publication.locale) { reveal(); return; }
  fadeCopy(0, 150, () => { commitLocale(); reveal(); });
});
reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) settleLanguage(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) settleLanguage(); });
window.addEventListener('pagehide', settleLanguage);
function setCardOpen(open) {
  cardTrigger.setAttribute('aria-expanded', String(open));
  cardSocial.inert = !open;
}
contactCard.addEventListener('pointerenter', event => {
  if (event.pointerType === 'mouse') setCardOpen(true);
});
contactCard.addEventListener('pointerleave', event => {
  if (event.pointerType === 'mouse' && !cardSocial.contains(document.activeElement)) setCardOpen(false);
});
cardTrigger.addEventListener('click', () => setCardOpen(cardSocial.inert));
contactCard.addEventListener('focusout', event => {
  if (!contactCard.contains(event.relatedTarget)) setCardOpen(false);
});
contactCard.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !cardSocial.inert) {
    event.stopPropagation();
    cardTrigger.focus({preventScroll:true});
    setCardOpen(false);
  }
});
document.addEventListener('pointerdown', event => {
  if (!cardSocial.inert && !contactCard.contains(event.target)) setCardOpen(false);
});
get('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  get('#publication').focus();
});
window.addEventListener('hashchange', () => navigate(sectionFromHash()));
localize();
navigate(sectionFromHash(), {initial:true});
