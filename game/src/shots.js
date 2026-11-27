// The screenshot scenes behind ?shot=start|play|chase|end. Each one plays the real rules
// forward from a fresh world for a fixed number of steps, steered by a simple autopilot
// (jump when a solid obstacle is close, slide under a flying knife, chase the lowest corn),
// so the frame is what a short game really looks like and the same seed always gives the
// same frame.
import { FIELD, PLAYER, STEP } from './config.js';
import { EVENT_OVER, KIND_KNIFE, KIND_PUDDLE } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 4;
const PLAY_SECONDS = 20;
const CHASE_SECONDS = 34;
const END_LIMIT_SECONDS = 600;
/** How far ahead, in pixels, the autopilot reacts to an obstacle. */
const LOOKAHEAD_PLAY = 320;
const LOOKAHEAD_END = 90;

/** How far one jump carries the turkey, in pixels, at the world's current speed. */
function jumpRange(state) {
  const airtime = (2 * -PLAYER.jumpVelocity) / PLAYER.gravity;
  return state.speed * airtime;
}

/**
 * When to take off for an obstacle of `height` pixels, so the turkey is still above the
 * obstacle's top as it crosses the front edge and lands on the top: the later half of the
 * jump, when the turkey's feet fall back to that height.
 */
function takeoffGap(state, height) {
  const under = PLAYER.jumpVelocity * PLAYER.jumpVelocity - 2 * PLAYER.gravity * height;
  if (under <= 0) return jumpRange(state) * 0.5;
  const tLand = (-PLAYER.jumpVelocity + Math.sqrt(under)) / PLAYER.gravity;
  return Math.max(40, state.speed * tLand - 12);
}

/** Jump when a solid obstacle is near and the turkey is on the ground; slide under knives. */
function autopilot(state, lookahead) {
  const player = state.player;
  let nearest = null;
  let nearestX = Infinity;
  for (let index = 0; index < state.obstacles.length; index += 1) {
    const item = state.obstacles[index];
    if (!item.active || item.kind === KIND_PUDDLE) continue;
    if (item.x >= player.x - 10 && item.x < nearestX) {
      nearest = item;
      nearestX = item.x;
    }
  }
  if (nearest === null) return { jump: false, slide: false };
  const gap = nearestX - (player.x + player.width);
  if (nearest.kind === KIND_KNIFE) {
    return { jump: false, slide: gap < lookahead && player.grounded };
  }
  const takeoff = Math.min(lookahead, takeoffGap(state, nearest.height));
  return { jump: gap < takeoff && player.grounded, slide: false };
}

/**
 * Set `world` to the named scene (start, play, chase or end; any other name is start)
 * and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'chase' && name !== 'end') {
    for (let index = 0; index < START_SECONDS / STEP; index += 1) world.step(STEP, false, false, true);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  const limit = name === 'end' ? END_LIMIT_SECONDS : name === 'chase' ? CHASE_SECONDS : PLAY_SECONDS;
  const lookahead = name === 'end' ? LOOKAHEAD_END : LOOKAHEAD_PLAY;
  let over = false;
  for (let index = 0; index < limit / STEP; index += 1) {
    const pilot = autopilot(world.state, lookahead);
    const events = world.step(STEP, pilot.jump, pilot.slide, false);
    if (events & EVENT_OVER) {
      over = true;
      break;
    }
    if (world.state.escaped) break;
  }
  // Caught or escaped, the end scene shows the end screen either way.
  const ended = over || world.state.escaped;
  if (name === 'chase') {
    // The chase scene shows the farmer right on the turkey's tail: stumble twice on purpose.
    world.state.farmerGap = 52;
    world.state.lives = 1;
  }
  return { screen: ended ? SCREEN_OVER : SCREEN_PLAY, best: Math.floor(world.state.score), escaped: world.state.escaped };
}
