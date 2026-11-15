// Link a TOC to headings inside an overflow container or the document viewport.
export function createRailReader({
  container = window, resolve, items = [], onRead = () => {},
  linked = false, offset = 96, ignoreInput = null,
} = {}) {
  let scroller, viewport, doc, isWindow, media, listeners, resizeObserver;
  let sections = [...items];
  let selected = null, lastRead = null, lastProgress = null, heldTop = null;
  let moving = false, paused = false, destroyed = false;
  let position = 0, velocity = 0, previousTime = null, frame = 0, rate = 1;
  const heading = id => resolve ? resolve(id) : doc.getElementById(id);
  const scrollElement = () => isWindow ? doc.scrollingElement : scroller;
  const scrollTop = () => isWindow ? viewport.scrollY : scroller.scrollTop;
  const scrollLimit = () => Math.max(0, scrollElement().scrollHeight - scrollElement().clientHeight);
  const topEdge = () => isWindow ? 0 : scroller.getBoundingClientRect().top + scroller.clientTop;
  const frozen = () => paused || doc.hidden;

  function stopFrame() {
    if (frame) viewport.cancelAnimationFrame(frame);
    frame = 0;
    previousTime = null;
  }

  function schedule() {
    if (!frame && linked && !destroyed && !frozen()) frame = viewport.requestAnimationFrame(tick);
  }

  function readingProgress() {
    const top = Math.max(0, scrollTop());
    const view = isWindow ? viewport.innerHeight : scroller.clientHeight;
    const remaining = Math.max(0, scrollLimit() - top);
    // Near the end, sweep the reference line from the usual 96px to the bottom
    // of the viewport. Short final chapters can reach their own rail stop.
    const baseline = Math.min(view, offset, top);
    const anchor = topEdge() + baseline + Math.max(0, view - baseline - remaining);
    let index = -1, previousY;
    for (let i = 0; i < sections.length; i++) {
      const el = heading(sections[i].id);
      if (!el || !el.getClientRects().length) continue;
      const y = el.getBoundingClientRect().top;
      if (y > anchor) {
        if (index < 0) return {index:i, progress:i};
        const t = Math.max(0, Math.min(1, (anchor - previousY) / (y - previousY || 1)));
        return {index, progress:index + (i - index) * t};
      }
      index = i;
      previousY = y;
    }
    return index < 0 ? null : {index, progress:index};
  }

  function tick(now) {
    frame = 0;
    if (!linked || destroyed || frozen()) return;
    if (selected === null) {
      const reading = readingProgress();
      if (reading && (sections[reading.index].id !== lastRead || reading.progress !== lastProgress)) {
        lastRead = sections[reading.index].id;
        lastProgress = reading.progress;
        onRead(lastRead, reading.index, reading.progress);
      }
      return;
    }
    if (!moving) return;
    const el = heading(selected);
    if (!el || !el.getClientRects().length) {
      moving = false;
      return;
    }
    const desired = scrollTop() + el.getBoundingClientRect().top - topEdge() - offset;
    const end = Math.max(0, Math.min(scrollLimit(), desired));
    if (media.matches) {
      position = end;
      velocity = 0;
    } else {
      // Exact critically damped step. Keeping the unrounded coordinate and velocity
      // avoids both a jump on retarget and a stall on browsers with integer scrollTop.
      const dt = previousTime === null ? 0 : (now - previousTime) * rate / 1000;
      const omega = 12.8;
      const displacement = position - end;
      const coefficient = velocity + omega * displacement;
      const decay = Math.exp(-omega * dt);
      position = end + (displacement + coefficient * dt) * decay;
      velocity = (velocity - omega * coefficient * dt) * decay;
    }
    previousTime = now;
    if (Math.abs(end - position) < .4 && Math.abs(velocity) < 4) {
      position = end;
      velocity = 0;
      moving = false;
      previousTime = null;
    }
    scroller.scrollTo({top: position, behavior: 'instant'});
    if (moving) schedule();
  }

  function arm() {
    if (!moving) {
      position = scrollTop();
      velocity = 0;
      previousTime = null;
    }
    moving = true;
    schedule();
  }

  function select(id) {
    if (destroyed || !linked || !sections.some(item => item.id === id)) return;
    selected = lastRead = id;
    lastProgress = null;
    arm();
    if (media.matches && !frozen()) {
      stopFrame();
      tick(viewport.performance.now());
    }
  }

  function release(event) {
    if (!linked || selected === null || !event.isTrusted || event.defaultPrevented) return;
    if (typeof ignoreInput === 'function' ? ignoreInput(event) : ignoreInput?.contains(event.target)) return;
    if (event.type === 'keydown') {
      const keys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
      if (!keys.includes(event.key) || event.metaKey || event.ctrlKey || event.altKey
        || event.target?.closest?.('input,select,textarea,button,[contenteditable="true"]')) return;
    }
    if (event.type === 'wheel' && (event.ctrlKey || !event.deltaY)) return;
    selected = null;
    heldTop = null;
    moving = false;
    stopFrame();
    schedule();
  }

  function relayout() {
    if (selected !== null) arm();
    else schedule();
  }

  function onVisibility() {
    if (frozen()) {
      stopFrame();
      if (moving && heldTop === null) heldTop = scrollTop();
    } else {
      heldTop = null;
      schedule();
    }
  }

  function onScroll() {
    // Chrome can still deliver a compositor wheel/anchoring correction after a
    // programme scroll was paused. Hold the presented offset until input takes over.
    if (frozen() && heldTop !== null && Math.abs(scrollTop() - heldTop) > .5) {
      scroller.scrollTo({top: heldTop, behavior:'instant'});
      return;
    }
    if (selected === null) schedule();
  }

  function observe() {
    resizeObserver?.disconnect();
    if (!resizeObserver) return;
    resizeObserver.observe(scrollElement());
    for (const item of sections) {
      const el = heading(item.id);
      if (el) resizeObserver.observe(el);
    }
  }

  function connect({container: next, resolve: nextResolve = resolve}) {
    if (destroyed) return;
    if (viewport) stopFrame();
    listeners?.abort();
    resizeObserver?.disconnect();
    scroller = next;
    isWindow = next.window === next;
    doc = isWindow ? next.document : next.ownerDocument;
    viewport = doc.defaultView;
    resolve = nextResolve;
    selected = lastRead = lastProgress = heldTop = null;
    moving = false;
    media = viewport.matchMedia('(prefers-reduced-motion: reduce)');
    listeners = new viewport.AbortController();
    const passive = {passive:true, signal:listeners.signal};
    scroller.addEventListener('scroll', onScroll, passive);
    scroller.addEventListener('wheel', release, passive);
    scroller.addEventListener('touchmove', release, passive);
    scroller.addEventListener('keydown', release, passive);
    doc.addEventListener('visibilitychange', onVisibility, passive);
    viewport.addEventListener('resize', relayout, passive);
    media.addEventListener('change', schedule, passive);
    resizeObserver = viewport.ResizeObserver ? new viewport.ResizeObserver(relayout) : null;
    observe();
    schedule();
  }

  connect({container});
  return {
    select, connect,
    setLinked(value) {
      if (destroyed || linked === Boolean(value)) return;
      linked = Boolean(value);
      selected = lastRead = lastProgress = heldTop = null;
      moving = false;
      stopFrame();
      schedule();
    },
    setPaused(value) {
      paused = Boolean(value);
      onVisibility();
    },
    setRate(value) {
      if (Number.isFinite(value) && value > 0) rate = value;
    },
    setItems(value) {
      sections = [...value];
      if (selected !== null && !sections.some(item => item.id === selected)) {
        selected = null;
        moving = false;
      }
      lastRead = lastProgress = null;
      observe();
      relayout();
    },
    destroy() {
      destroyed = true;
      stopFrame();
      listeners.abort();
      resizeObserver?.disconnect();
    },
  };
}
