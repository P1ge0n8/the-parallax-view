(() => {
  const root = document.documentElement;
  const isTV = document.currentScript.dataset.page === 'tv';
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const directory = new URL('./', location.href);
  const partnerPaths = isTV ? ['next.html', 'directory.html'] : ['', 'index.html'];
  const historyKey = 'parallax-passage:' + directory.pathname;
  let destination, departure, tapeTimer;

  function partnerURL(value) {
    if (!value) return false;
    const url = new URL(value, directory);
    return url.origin === directory.origin &&
      partnerPaths.some(path => url.pathname === new URL(path, directory).pathname);
  }
  function historySource() {
    // A restored document retains its original referrer.
    try { return sessionStorage.getItem(historyKey); } catch { return ''; }
  }
  function clearArrival() {
    root.classList.remove('tv-arrival-pending', 'tv-arriving');
  }
  function reveal() {
    clearArrival();
    if (!motion.matches) root.classList.add('tv-arriving');
  }
  const type = performance.getEntriesByType('navigation')[0]?.type;
  if (!motion.matches && type !== 'reload' && partnerURL(type === 'back_forward' ? historySource() : document.referrer)) {
    root.classList.add('tv-arrival-pending');
    document.addEventListener('DOMContentLoaded', reveal, {once:true});
  }
  document.addEventListener('animationend', event => {
    if (event.animationName === 'resolve-picture') clearArrival();
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted && partnerURL(historySource())) reveal();
  });

  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[data-passage]');
    if (!link || event.defaultPrevented || event.button !== 0 ||
        event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (destination) return;
    destination = link.href;
    const navigate = () => location.assign(destination);
    const surface = document.querySelector('[data-passage-surface]');
    const style = getComputedStyle(surface);
    const from = {opacity:style.opacity, filter:style.filter === 'none' ? 'blur(0px)' : style.filter};
    clearArrival();
    root.classList.add('tv-departing');
    if (motion.matches) {
      if (isTV) tapeTimer = setTimeout(navigate, 120);
      else navigate();
      return;
    }
    // The receiver has a short tape cue before both directions use the same dissolve.
    departure = surface.animate([from, {opacity:0, filter:'blur(10px)'}], {
      delay:isTV ? 290 : 0, duration:500, easing:'cubic-bezier(.55,.05,.8,.7)', fill:'both',
    });
    departure.onfinish = navigate;
  });
  motion.addEventListener('change', () => {
    if (motion.matches) { clearArrival(); departure?.finish(); }
  });
  window.addEventListener('pagehide', () => {
    try { sessionStorage.setItem(historyKey, location.pathname); } catch {}
    clearTimeout(tapeTimer);
    if (departure) { departure.onfinish = null; departure.cancel(); }
    departure = destination = null;
    clearArrival();
    root.classList.remove('tv-departing');
  });
})();
