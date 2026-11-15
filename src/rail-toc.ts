// The standalone download and the page preview import this same DOM/SVG implementation.
const svgNS = 'http://www.w3.org/2000/svg';
const springFrequency = 9 / .520; // The standalone Rail TOC's 520ms settling calibration.
const turnSeconds = .26;
const clamp = (value, low, high) => Math.max(low, Math.min(value, high));

function svg(tag, name, attrs = {}) {
  const node = document.createElementNS(svgNS, tag);
  node.setAttribute('class', name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}

// Convert a position on the measured line into a row index and a fraction to the next row.
// Using this coordinate preserves the plane's location when the list reflows.
function segmentAt(points, distance) {
  if (points.length < 2) return 0;
  for (let i = 1; i < points.length; i++) {
    const start = points[i - 1].s, end = points[i].s;
    if (distance <= end) return i - 1 + clamp((distance - start) / (end - start || 1), 0, 1);
  }
  return points.length - 1;
}
function sample(points, index, prop) {
  const i = Math.floor(clamp(index, 0, points.length - 1));
  const a = points[i][prop], b = points[Math.min(i + 1, points.length - 1)][prop];
  return a + (b - a) * clamp(index - i, 0, 1);
}

export function createRailTOC(container, options = {}) {
  const nav = document.createElement('nav');
  nav.className = 'rail-toc';
  const title = document.createElement('h2');
  title.className = 'rail-toc-title';
  const titleIcon = svg('svg', 'rail-toc-title-icon', {viewBox:'0 0 16 16', 'aria-hidden':'true'});
  titleIcon.append(svg('path', '', {d:'M2 4H14 M2 8H10 M2 12H12'}));
  const titleText = document.createElement('span');
  title.append(titleIcon,titleText);
  const stage = document.createElement('div');
  stage.className = 'rail-toc-stage';
  const list = document.createElement('ol');
  list.className = 'rail-toc-list';
  const track = svg('svg', 'rail-toc-track', {'aria-hidden':'true', focusable:'false'});
  const guide = svg('path', 'rail-toc-guide');
  const ink = svg('path', 'rail-toc-ink');
  const nodes = svg('g', 'rail-toc-nodes');
  const plane = svg('g', 'rail-toc-plane');
  // The independent Rail TOC's original upward-pointing, folded 16px glyph.
  plane.append(svg('path', 'rail-toc-wing', {d:'M0 -8 L5.8 6 L0 3.2 L-5.8 6 Z M0 -8 L0 3.2'}));
  track.append(guide, ink, nodes, plane);
  stage.append(list, track);
  nav.append(title, stage);
  container.append(nav);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let items = [], rows = [], points = [], vertices = [], active = 0, targetIndex = 0;
  let position = 0, velocity = 0, targetExtreme = 0, heading = 1;
  let turnFrom = 0, turnTo = 0, turnElapsed = turnSeconds, turnAngle = 0;
  let paused = !!options.paused, linked = !!options.linked, visible = true;
  let frozen = false, frame = 0, lastTime = null, destroyed = false;
  let demo = false, demoTime = 0, demoOrigin = 0, demoReturning = false;
  let rate = clamp(Number(options.rate) || 1, .1, 5);
  const stopEvents = new AbortController();

  function setTitle(value) {
    titleText.textContent = String(value || 'On this page');
    nav.setAttribute('aria-label', titleText.textContent);
  }
  function selectRow(index) {
    active = index;
    rows.forEach(({button}, i) => {
      button.tabIndex = i === active ? 0 : -1;
      if (i === active) button.setAttribute('aria-current', 'location');
      else button.removeAttribute('aria-current');
    });
  }
  function paint() {
    if (!points.length) return;
    const total = points.at(-1).s;
    const at = clamp(position, 0, total), fractional = segmentAt(vertices, at);
    // Sample the bevel's local tangent on either side of the travelling plane.
    const a = segmentAt(vertices, at - 2), b = segmentAt(vertices, at + 2);
    const dx = sample(vertices, b, 'x') - sample(vertices, a, 'x');
    const dy = sample(vertices, b, 'y') - sample(vertices, a, 'y');
    const tangent = dx || dy ? Math.atan2(dy, dx) * 180 / Math.PI : 90;
    plane.setAttribute('transform', 'translate(' + sample(vertices, fractional, 'x') + ' ' +
      sample(vertices, fractional, 'y') + ') rotate(' + (90 + tangent + turnAngle) + ')');
    ink.setAttribute('stroke-dasharray', at + ' ' + (total + 1));
    ink.style.opacity = at > .05 ? '1' : '0';
    rows.forEach(({dot}, i) => dot.toggleAttribute('data-read', points[i].s <= at + .2));
  }
  function orient(dest, instant = false) {
    targetExtreme = heading > 0 ? Math.max(targetExtreme, dest) : Math.min(targetExtreme, dest);
    if ((targetExtreme - dest) * heading <= 2) return;
    heading = -heading;
    targetExtreme = dest;
    turnFrom = turnAngle;
    turnTo = heading > 0 ? 0 : 180;
    turnElapsed = instant ? turnSeconds : 0;
    if (instant) turnAngle = turnTo;
  }
  function render(now) {
    frame = 0;
    if (frozen || destroyed || !points.length) return;
    const dt = lastTime === null ? 0 : Math.max(0, (now - lastTime) / 1000) * rate;
    lastTime = now;
    if (demo && !motion.matches && items.length > 1) {
      demoTime += dt;
      if (!demoReturning && demoTime >= 1.17) {
        demoReturning = true;
        choose(demoOrigin, 'demo');
      }
      if (demoTime >= 2.34) {
        demo = false;
        options.onDemoEnd?.();
      }
    }
    const dest = sample(points, targetIndex, 's');
    orient(dest, motion.matches);
    if (motion.matches) {
      position = dest;
      velocity = 0;
      turnAngle = turnTo;
      turnElapsed = turnSeconds;
    } else {
      const gap = position - dest;
      const c = velocity + springFrequency * gap;
      const decay = Math.exp(-springFrequency * dt);
      position = dest + (gap + c * dt) * decay;
      velocity = (velocity - springFrequency * c * dt) * decay;
      if (Math.abs(position - dest) < .035 && Math.abs(velocity) < .6) {
        position = dest;
        velocity = 0;
      }
      turnElapsed = Math.min(turnSeconds, turnElapsed + dt);
      const t = turnElapsed / turnSeconds;
      turnAngle = turnFrom + (turnTo - turnFrom) * t * t * (3 - 2 * t);
    }
    paint();
    if (position !== dest || velocity || turnElapsed < turnSeconds || demo && items.length > 1) schedule();
    else lastTime = null;
  }
  function schedule() {
    if (!frame && !frozen && !destroyed && points.length) frame = requestAnimationFrame(render);
  }
  function syncPause() {
    const next = paused || document.hidden || !visible;
    if (next === frozen) return;
    frozen = next;
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = null;
    if (!frozen) schedule();
    options.onFreezeChange?.(frozen);
  }
  function measure() {
    const bounds = stage.getBoundingClientRect();
    if (!bounds.height || !bounds.width) return;
    const oldFraction = points.length ? segmentAt(points, position) : targetIndex;
    const oldExtreme = points.length ? segmentAt(points, targetExtreme) : targetIndex;
    const oldLength = points.at(-1)?.s || 0;
    let length = 0;
    const fresh = [];
    vertices = [];
    function push(x,y) {
      const prev = vertices.at(-1);
      if (prev) length += Math.hypot(x - prev.x, y - prev.y);
      const vertex = {x,y,s:length};
      vertices.push(vertex);
      return vertex;
    }
    const horizontal = getComputedStyle(list).display === 'flex' && getComputedStyle(list).flexDirection.startsWith('row');
    for (const {anchor, dot} of rows) {
      const r = anchor.getBoundingClientRect();
      const x = r.x + r.width / 2 - bounds.x, y = r.y + r.height / 2 - bounds.y;
      const priorRow = fresh.at(-1);
      if (!priorRow && !horizontal) push(x,0);
      else if (priorRow && !horizontal && priorRow.x !== x) {
        const bevel = Math.min(12,(y - priorRow.y)*.28);
        push(priorRow.x,priorRow.y+bevel);
        push(x,y-bevel);
      }
      fresh.push(push(x,y));
      dot.setAttribute('cx', x);
      dot.setAttribute('cy', y);
    }
    points = fresh;
    if (!points.length) return;
    const path = vertices.map(({x,y}, i) => (i ? 'L' : 'M') + x + ' ' + y).join(' ');
    guide.setAttribute('d', path);
    ink.setAttribute('d', path);
    position = sample(points, oldFraction, 's');
    targetExtreme = sample(points, oldExtreme, 's');
    if (oldLength) velocity *= length / oldLength;
    paint();
    schedule();
  }
  function setItems(data) {
    if (!Array.isArray(data) || data.length < 1 || data.length > 12) {
      throw new RangeError('Rail TOC needs 1–12 items.');
    }
    const ids = new Set();
    const next = data.map((item, index) => {
      const id = String(item.id ?? index + 1), label = String(item.title ?? '');
      if (ids.has(id)) throw new TypeError('Rail TOC items need distinct IDs.');
      ids.add(id);
      return {...item, id, title:label, level:clamp(Math.trunc(Number(item.level)) || 0,0,2)};
    });
    const priorId = items[active]?.id;
    const containedFocus = list.contains(document.activeElement);
    items = next;
    rows = items.map((item, index) => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'rail-toc-row';
      button.dataset.id = item.id;
      button.dataset.index = index;
      button.dataset.level = item.level;
      button.style.setProperty('--rail-level', item.level);
      const anchor = document.createElement('span');
      anchor.className = 'rail-toc-anchor';
      anchor.setAttribute('aria-hidden','true');
      const label = document.createElement('span');
      label.className = 'rail-toc-label';
      label.textContent = item.title;
      const dot = svg('circle', 'rail-toc-node', {r:'2.6'});
      button.append(anchor, label);
      li.append(button);
      return {button, anchor, li, dot};
    });
    list.replaceChildren(...rows.map(row=>row.li));
    nodes.replaceChildren(...rows.map(row=>row.dot));
    const found = items.findIndex(item=>item.id === priorId);
    selectRow(found < 0 ? Math.min(active, items.length - 1) : found);
    targetIndex = active;
    if (containedFocus) rows[active].button.focus({preventScroll:true});
    measure();
  }
  function setActive(index, {instant = false, sectionIndex} = {}) {
    if (!Number.isFinite(index) || !items.length) return;
    targetIndex = clamp(index, 0, items.length - 1);
    const selected = Number.isInteger(sectionIndex) ? clamp(sectionIndex,0,items.length-1) : Math.round(targetIndex);
    if (active !== selected) selectRow(selected);
    if (!points.length) return;
    const dest = sample(points, targetIndex, 's');
    if (!frozen) orient(dest, instant || motion.matches);
    if (!frozen && (instant || motion.matches)) {
      position = dest;
      velocity = 0;
      turnElapsed = turnSeconds;
      turnAngle = turnTo;
      paint();
    }
    schedule();
  }
  function choose(index, source) {
    const old = active;
    setActive(index);
    if (source !== 'demo' && demo) { demo = false; options.onDemoEnd?.(); }
    if (old !== active || source === 'click' || source === 'keyboard') {
      options.onSelect?.({id:items[active].id, index:active, source});
    }
  }
  function keydown(event) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const step = {ArrowDown:1, ArrowRight:1, ArrowUp:-1, ArrowLeft:-1}[event.key];
    if (!step && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const i = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : active + step;
    choose(clamp(i, 0, items.length - 1), 'keyboard');
    rows[active].button.focus({preventScroll:true});
  }
  function wheel(event) {
    if (linked || event.ctrlKey || !points.length) return;
    const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (!delta) return;
    const end = points.at(-1).s, scale = event.deltaMode === 2 ? end : event.deltaMode === 1 ? 16 : 1;
    const orig = sample(points, targetIndex, 's');
    const dest = clamp(orig + delta * scale / 4, points[0].s, end);
    if (orig === dest) return;
    event.preventDefault();
    choose(segmentAt(points,dest), 'wheel');
  }
  function setDemo(value) {
    demo = !!value && !motion.matches && items.length > 1;
    demoTime = 0;
    demoOrigin = active;
    demoReturning = false;
    if (demo) choose(active === items.length - 1 ? 0 : items.length - 1, 'demo');
    schedule();
  }
  function motionChange() {
    if (motion.matches) demo = false;
    setActive(targetIndex, {instant:motion.matches,sectionIndex:active});
  }
  const listener = {signal:stopEvents.signal};
  list.addEventListener('click', event => {
    const button = event.target.closest?.('.rail-toc-row');
    if (button && list.contains(button)) choose(Number(button.dataset.index), 'click');
  }, listener);
  list.addEventListener('keydown', keydown, listener);
  stage.addEventListener('wheel', wheel, {...listener, passive:false});
  document.addEventListener('visibilitychange', syncPause, listener);
  motion.addEventListener('change', motionChange, listener);
  const resize = new ResizeObserver(measure);
  resize.observe(stage);
  const inView = new IntersectionObserver(entries=>{
    visible = entries[entries.length - 1].isIntersecting;
    syncPause();
  });
  inView.observe(options.visibilityRoot || stage);
  setTitle(options.title);
  setItems(options.items || [{id:'installation', title:'Installation', level:0}]);
  syncPause();
  if (options.demo) setDemo(true);
  return {
    setTitle, setItems, setActive, getActive:()=>active,
    setLinked(value) { linked = !!value; },
    setPaused(value) { paused = !!value; syncPause(); },
    setDemo,
    setRate(value) { if (Number.isFinite(value)) rate = clamp(value,.1,5); },
    destroy() {
      destroyed = true;
      stopEvents.abort();
      cancelAnimationFrame(frame);
      resize.disconnect();
      inView.disconnect();
      nav.remove();
    }
  };
}
