// The wheel, spring and interrupted-close response are adapted from TuneShape's
// coffee-selector (MIT, see vendor/TuneShape-LICENSE.txt). Its panel expands
// below the masthead here, with three rows and the site's saved language.
import {LANGUAGES} from './publication-i18n.js';

const duration = 460;
const wrap = value => ((value % LANGUAGES.length) + LANGUAGES.length) % LANGUAGES.length;
const delta = (from, to) => wrap(to - from + LANGUAGES.length / 2) - LANGUAGES.length / 2;
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function spring(position, velocity, target, ms) {
  const frequency = 10 / (duration / 1000);
  const damping = 1 - .12 * .85;
  const decay = damping * frequency;
  const oscillation = frequency * Math.sqrt(1 - damping ** 2);
  const t = ms / 1000;
  const gap = position - target;
  const impulse = (velocity + decay * gap) / oscillation;
  const envelope = Math.exp(-decay * t);
  const sine = Math.sin(oscillation * t), cosine = Math.cos(oscillation * t);
  return [
    target + envelope * (gap * cosine + impulse * sine),
    envelope * (velocity * cosine - (decay * impulse + oscillation * gap) * sine)
  ];
}
function closingHeight({position, velocity, elapsed}) {
  const t = clamp(elapsed / duration, 0, 1);
  const seconds = duration / 1000;
  const decay = velocity > 0 ? Math.max(8, velocity * seconds / (Math.E * Math.max(.0001, 1 - position))) : 0;
  const envelope = Math.exp(-decay * t);
  const momentum = t - 6 * t**3 + 8 * t**4 - 3 * t**5;
  return [
    position * (1 - 10*t**3 + 15*t**4 - 6*t**5) + velocity * seconds * momentum * envelope,
    position * (-30*t**2 + 60*t**3 - 30*t**4) / seconds +
      velocity * (1 - 18*t**2 + 32*t**3 - 15*t**4 - decay * momentum) * envelope
  ];
}

export function createLanguageSelector(host, initialLocale, onChange) {
  const panel = host.querySelector('.cs-panel');
  const list = host.querySelector('.cs-list');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const rows = LANGUAGES.map(({id, label, flag}) => {
    const row = document.createElement('div');
    row.className = 'cs-item';
    row.id = 'language-' + id;
    row.dataset.lang = id;
    row.lang = id;
    row.setAttribute('role', 'option');
    const image = document.createElement('img');
    image.className = 'cs-flag';
    image.src = new URL('../assets/language-flags/' + flag + '.svg', import.meta.url).href;
    image.alt = '';
    image.draggable = false;
    row.append(image, document.createTextNode(label));
    list.append(row);
    return row;
  });

  let chosen = Math.max(0, LANGUAGES.findIndex(item => item.id === initialLocale));
  let position = chosen, target = chosen, velocity = 0;
  let open = false, expansion = 0, expansionVelocity = 0, closing;
  let animation = 0, previousTime, wheelTimer = 0, drag, suppressClickUntil = 0;
  let controlName = '';

  function paint() {
    const p = clamp(expansion, 0, 1);
    const candidate = wrap(Math.round(target));
    panel.style.setProperty('--expansion', String(p));
    panel.setAttribute('aria-expanded', String(open));
    panel.setAttribute('aria-activedescendant', rows[open ? candidate : chosen].id);
    panel.setAttribute('aria-label', controlName + ' · ' + LANGUAGES[chosen].label);
    rows.forEach((row, i) => {
      const distance = delta(position, i);
      const weight = Math.abs(distance);
      const shade = Math.round(32 + 70 * Math.min(1, weight));
      row.style.transform = 'translateY(' + distance * 100 + '%)';
      row.style.opacity = String((1 - weight * (1 - .22) / 2) * (p + (1 - p) * Math.max(0, 1 - weight * 2)));
      row.style.filter = 'blur(' + Math.max(0, weight - .35) * 2.4 / 2 + 'px)';
      row.style.color = 'rgb(' + [shade, shade, shade].join(',') + ')';
      row.style.pointerEvents = open && p > .65 ? 'auto' : 'none';
      row.setAttribute('aria-selected', String(i === (open ? candidate : chosen)));
      row.setAttribute('aria-hidden', String(!open && i !== chosen));
    });
  }
  function frame(now) {
    const dt = previousTime === undefined ? 0 : Math.min(64, now - previousTime);
    previousTime = now;
    const goal = Number(open);
    if (closing) {
      closing.elapsed += dt;
      [expansion, expansionVelocity] = closingHeight(closing);
      if (closing.elapsed >= duration) { closing = null; expansion = 0; expansionVelocity = 0; }
    } else {
      [expansion, expansionVelocity] = spring(expansion, expansionVelocity, goal, dt);
    }
    if (!drag) [position, velocity] = spring(position, velocity, target, dt);
    const moving = closing || Math.abs(goal - expansion) > .0005 || Math.abs(expansionVelocity) > .005 ||
      (!drag && (Math.abs(target - position) > .0005 || Math.abs(velocity) > .005));
    if (moving) animation = requestAnimationFrame(frame);
    else {
      animation = 0; previousTime = undefined;
      expansion = goal; expansionVelocity = 0;
      if (!drag) { position = target; velocity = 0; }
    }
    paint();
  }
  function wake() {
    if (motion.matches) {
      cancelAnimationFrame(animation);
      animation = 0; previousTime = undefined;
      closing = null; expansion = Number(open); expansionVelocity = 0; position = target; velocity = 0;
    } else if (!animation && !document.hidden) {
      animation = requestAnimationFrame(frame);
    }
    paint();
  }
  function expand() {
    open = true; closing = null; wake();
  }
  function finish(cancel = false) {
    if (!open) return;
    clearTimeout(wheelTimer);
    const next = cancel ? chosen : wrap(Math.round(target));
    const changed = next !== chosen;
    chosen = next; target = position + delta(position, next); drag = null;
    open = false; closing = {position:expansion, velocity:expansionVelocity, elapsed:0};
    panel.removeAttribute('data-dragging');
    wake();
    if (changed) onChange(LANGUAGES[next].id);
  }
  panel.addEventListener('click', event => {
    if (event.timeStamp < suppressClickUntil) return;
    panel.focus({preventScroll:true});
    if (!open) { expand(); return; }
    const row = event.target.closest('[data-lang]');
    if (row) target = position + delta(position, rows.indexOf(row));
    finish();
  });
  panel.addEventListener('keydown', event => {
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    switch (event.key) {
      case 'Escape': if (!open) return; finish(true); break;
      case ' ': case 'Enter': open ? finish() : expand(); break;
      case 'Home': target = position + delta(position, 0); expand(); break;
      case 'End': target = position + delta(position, rows.length - 1); expand(); break;
      case 'ArrowDown': case 'ArrowUp':
        target = Math.round(target) + (event.key === 'ArrowDown' ? 1 : -1);
        expand(); break;
      default: return;
    }
    event.preventDefault(); event.stopPropagation();
  });
  panel.addEventListener('wheel', event => {
    if (!open || event.ctrlKey) return;
    event.preventDefault();
    const rowHeight = rows[0].offsetHeight;
    const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rowHeight * 3 : 1;
    target += clamp(event.deltaY * scale / rowHeight, -2, 2);
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => { target = Math.round(target); wake(); }, 140);
    wake();
  }, {passive:false});
  panel.addEventListener('pointerdown', event => {
    if (!open || !event.isPrimary || event.button !== 0) return;
    clearTimeout(wheelTimer);
    drag = {id:event.pointerId, y:event.clientY, origin:position, rowHeight:rows[0].offsetHeight, lastY:event.clientY, lastTime:event.timeStamp, speed:0, moved:false};
    velocity = 0;
  });
  panel.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.abs(dy) < 4) return;
    if (!drag.moved) { panel.setPointerCapture(event.pointerId); drag.moved = true; }
    panel.dataset.dragging = 'true';
    position = target = drag.origin - dy / drag.rowHeight;
    if (event.timeStamp > drag.lastTime) drag.speed = (drag.lastY - event.clientY) / drag.rowHeight / (event.timeStamp - drag.lastTime);
    drag.lastTime = event.timeStamp; drag.lastY = event.clientY;
    paint();
  });
  function endDrag(event) {
    if (!drag || drag.id !== event.pointerId) return;
    if (drag.moved) {
      const speed = motion.matches || event.timeStamp - drag.lastTime > 100 ? 0 : drag.speed;
      target = Math.round(position + clamp(speed, -.018, .018) * 160);
      suppressClickUntil = event.timeStamp + 180;
    }
    drag = null; panel.removeAttribute('data-dragging');
    if (panel.hasPointerCapture(event.pointerId)) panel.releasePointerCapture(event.pointerId);
    wake();
  }
  panel.addEventListener('pointerup', endDrag);
  panel.addEventListener('pointercancel', endDrag);
  panel.addEventListener('lostpointercapture', endDrag);
  document.addEventListener('pointerdown', event => { if (open && !host.contains(event.target)) finish(); });
  panel.addEventListener('focusout', event => { if (!host.contains(event.relatedTarget)) finish(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(animation); animation = 0; previousTime = undefined; }
    else wake();
  });
  motion.addEventListener('change', wake);
  return {setLabel(value) { controlName = value; list.setAttribute('aria-label', value); paint(); }};
}
