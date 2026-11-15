import {connectControls} from './controls.js';

// The tape controls work as soon as the static receiver is visible.
let signal;
function playTape() {
  if (!signal) return;
  if (!signal.state.powered) signal.togglePower();
  signal.playTape();
}

export function connectEntrySignal(tape) {
  signal = tape;
  if (document.documentElement.classList.contains('tv-departing')) playTape();
}

export const reflectControls = connectControls({action(action) {
  if (document.documentElement.classList.contains('tv-departing')) return;
  if (action === 'power') signal?.togglePower();
  else playTape();
}});
