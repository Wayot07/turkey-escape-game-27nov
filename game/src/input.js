// Keyboard and pointer input. Held keys give slide; one-shot presses (jump, start, pause)
// are queued as bit flags and taken once by the loop, so a press between two frames is
// never lost and never counted twice.
export const ACTION_JUMP = 1;
export const ACTION_CONFIRM = 2;
export const ACTION_PAUSE = 4;
export const ACTION_MUTE = 8;

const JUMP = new Set(['Space', 'ArrowUp', 'KeyW']);
const SLIDE = new Set(['ArrowDown', 'KeyS']);
const CONFIRM = new Set(['Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const RESTART = new Set(['KeyR']);
const MUTE = new Set(['KeyM']);

export function createInput(target) {
  let sliding = false;
  let actions = 0;

  window.addEventListener('keydown', (event) => {
    if (JUMP.has(event.code)) {
      if (!event.repeat) actions |= ACTION_JUMP | ACTION_CONFIRM;
    } else if (SLIDE.has(event.code)) {
      sliding = true;
    } else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (RESTART.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (MUTE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_MUTE;
    } else {
      return;
    }
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (SLIDE.has(event.code)) sliding = false;
  });
  // A key released while the tab is hidden never sends keyup: let go of everything on blur.
  window.addEventListener('blur', () => {
    sliding = false;
  });
  target.addEventListener('pointerdown', () => {
    actions |= ACTION_JUMP | ACTION_CONFIRM;
  });

  return {
    /** True while a slide key is held. */
    isSliding() {
      return sliding;
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
