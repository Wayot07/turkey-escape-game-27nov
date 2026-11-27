// The game's rules and state, with no drawing and no browser in it: the turkey, the
// farmer chasing it, the farmyard obstacles, the corn to grab, spawning, collisions,
// score, lives and levels. step() advances one fixed step and returns what happened as
// bit flags, so the caller can react without the world knowing about screens or sound.
// Nothing here allocates after createWorld returns.
import {
  ESCAPE_METRES,
  FARMER,
  FIELD,
  LIVES,
  OBSTACLE,
  PLAYER,
  POOL_SIZE,
  PX_PER_METRE,
  RUN,
  SCORE,
  SPAWN,
} from './config.js';

export const KIND_FENCE = 0;
export const KIND_BALE = 1;
export const KIND_OVEN = 2;
export const KIND_KNIFE = 3;
export const KIND_PUDDLE = 4;
export const KIND_CORN = 5;
export const KIND_GOLD_CORN = 6;

export const EVENT_HIT = 1;
export const EVENT_CORN = 2;
export const EVENT_OVER = 4;
export const EVENT_ESCAPED = 8;
export const EVENT_DODGE = 16;

/** Solid obstacles are landed on when the turkey drops onto them, hit otherwise. */
function isSolid(kind) {
  return kind === KIND_FENCE || kind === KIND_BALE || kind === KIND_OVEN;
}

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function createWorld(random) {
  const player = {
    x: PLAYER.x,
    y: FIELD.groundY - PLAYER.height,
    width: PLAYER.width,
    height: PLAYER.height,
    vy: 0,
    grounded: true,
    slideT: 0,
    invulnerable: 0,
  };
  const obstacles = [];
  const kernels = [];
  for (let index = 0; index < POOL_SIZE; index += 1) {
    obstacles.push({ active: false, kind: KIND_FENCE, x: 0, y: 0, width: 0, height: 0, counted: false });
    kernels.push({ active: false, gold: false, x: 0, y: 0, width: 0, height: 0 });
  }
  /** The ground the turkey's feet rest on: the field, or an obstacle top it stands on. */
  let supportY = FIELD.groundY;
  const state = {
    player,
    obstacles,
    kernels,
    score: 0,
    distance: 0,
    lives: LIVES,
    level: 1,
    speed: RUN.startSpeed,
    farmerGap: FARMER.startGap,
    elapsed: 0,
    obstacleTimer: SPAWN.firstObstacleAt,
    cornTimer: SPAWN.cornInterval,
    slowT: 0,
    inPuddle: false,
    escaped: false,
    over: false,
  };

  function reset() {
    supportY = FIELD.groundY;
    player.y = FIELD.groundY - PLAYER.height;
    player.height = PLAYER.height;
    player.vy = 0;
    player.grounded = true;
    player.slideT = 0;
    player.invulnerable = 0;
    for (const item of obstacles) item.active = false;
    for (const kernel of kernels) kernel.active = false;
    state.score = 0;
    state.distance = 0;
    state.lives = LIVES;
    state.level = 1;
    state.speed = RUN.startSpeed;
    state.farmerGap = FARMER.startGap;
    state.elapsed = 0;
    state.obstacleTimer = SPAWN.firstObstacleAt;
    state.cornTimer = SPAWN.cornInterval;
    state.slowT = 0;
    state.inPuddle = false;
    state.escaped = false;
    state.over = false;
  }

  function freeObstacle() {
    for (let index = 0; index < obstacles.length; index += 1) {
      if (!obstacles[index].active) return obstacles[index];
    }
    return null;
  }

  function freeKernel() {
    for (let index = 0; index < kernels.length; index += 1) {
      if (!kernels[index].active) return kernels[index];
    }
    return null;
  }

  function currentSpeed() {
    let speed = Math.min(
      RUN.maxSpeed,
      RUN.startSpeed + RUN.speedPerLevel * (state.level - 1),
    );
    if (state.slowT > 0) speed *= RUN.stumbleSlow;
    if (state.inPuddle) speed *= 0.6;
    return speed;
  }

  function spawnObstacle() {
    const item = freeObstacle();
    if (item === null) return;
    const roll = random();
    let kind = KIND_FENCE;
    if (state.level >= 3 && roll < 0.2) kind = KIND_KNIFE;
    else if (state.level >= 2 && roll < 0.42) kind = KIND_OVEN;
    else if (roll < 0.58) kind = KIND_PUDDLE;
    else if (roll < 0.8) kind = KIND_BALE;
    const spec = OBSTACLE[kind === KIND_FENCE ? 'fence' : kind === KIND_BALE ? 'bale' : kind === KIND_OVEN ? 'oven' : kind === KIND_KNIFE ? 'knife' : 'puddle'];
    item.active = true;
    item.kind = kind;
    item.width = spec.width;
    item.height = spec.height;
    item.x = FIELD.width + 40;
    item.y = kind === KIND_KNIFE ? FIELD.groundY - OBSTACLE.knife.flyHeight : FIELD.groundY - spec.height;
    item.counted = false;
  }

  function spawnCornArc() {
    const count = 3 + Math.floor(random() * 3);
    const high = random() < 0.45;
    const gold = random() < 0.18;
    const baseY = high ? FIELD.groundY - 150 : FIELD.groundY - 34;
    for (let index = 0; index < count; index += 1) {
      const kernel = freeKernel();
      if (kernel === null) return;
      kernel.active = true;
      kernel.gold = gold && index === 0;
      kernel.x = FIELD.width + 40 + index * 44;
      kernel.y = baseY - Math.sin((index / (count - 1 || 1)) * Math.PI) * 46;
      kernel.width = 26;
      kernel.height = 26;
    }
  }

  function obstacleInterval() {
    return Math.max(
      SPAWN.minObstacleInterval,
      SPAWN.obstacleInterval * SPAWN.obstacleIntervalScale ** (state.level - 1),
    );
  }

  function stumble(events) {
    state.lives -= 1;
    player.invulnerable = PLAYER.invulnerable;
    state.farmerGap = Math.max(0, state.farmerGap - FARMER.stumbleCost);
    state.slowT = RUN.stumbleSlowSeconds;
    if (state.lives <= 0 || state.farmerGap <= FARMER.catchGap) {
      state.over = true;
      return events | EVENT_HIT | EVENT_OVER;
    }
    return events | EVENT_HIT;
  }

  /**
   * One fixed step. `jump` is a one-shot press, `slide` is held. With `attract` set (the
   * title screen's backdrop) the turkey runs and things scroll past, but nothing touches
   * the player and nothing scores.
   */
  function step(dt, jump, slide, attract) {
    let events = 0;
    if (state.over || state.escaped) return events;
    state.elapsed += dt;
    state.level = Math.min(RUN.maxLevel, 1 + Math.floor(state.distance / RUN.levelMetres));
    state.speed = currentSpeed();

    // The turkey's own vertical motion.
    if (jump && player.grounded && !attract) {
      player.vy = PLAYER.jumpVelocity;
      player.grounded = false;
    }
    const prevBottom = player.y + player.height;
    if (!player.grounded) {
      player.vy += PLAYER.gravity * dt;
      player.y += player.vy * dt;
    }
    if (slide && player.grounded) player.slideT = PLAYER.slideSeconds;
    if (player.slideT > 0) player.slideT = Math.max(0, player.slideT - dt);
    player.height = player.slideT > 0 ? PLAYER.slideHeight : PLAYER.height;
    // A slide shrinks the hitbox from the top: keep the turkey's feet on its support.
    if (player.grounded) player.y = supportY - player.height;
    if (player.invulnerable > 0) player.invulnerable = Math.max(0, player.invulnerable - dt);
    if (state.slowT > 0) state.slowT = Math.max(0, state.slowT - dt);

    // The world scrolls; the distance and the score grow with it.
    const metres = (state.speed * dt) / PX_PER_METRE;
    state.distance += metres;
    if (!attract) state.score += metres * SCORE.perMetre;
    if (state.distance >= ESCAPE_METRES) {
      state.escaped = true;
      if (!attract) state.score += SCORE.escapeBonus;
      return events | EVENT_ESCAPED;
    }

    // The farmer gains on a stumble and on mud, and falls back when the turkey runs clean.
    state.farmerGap = Math.min(FARMER.startGap, state.farmerGap + FARMER.recoverPerSecond * dt);
    if (state.inPuddle) state.farmerGap = Math.max(0, state.farmerGap - 34 * dt);
    if (!attract && state.farmerGap <= FARMER.catchGap) {
      state.over = true;
      return events | EVENT_OVER;
    }

    // Spawning.
    state.obstacleTimer -= dt;
    if (state.obstacleTimer <= 0) {
      spawnObstacle();
      state.obstacleTimer += obstacleInterval() + random() * 0.35;
    }
    state.cornTimer -= dt;
    if (state.cornTimer <= 0) {
      spawnCornArc();
      state.cornTimer += SPAWN.cornInterval + random() * SPAWN.cornJitter;
    }

    // Obstacles scroll left; knives fly a little faster than the ground.
    state.inPuddle = false;
    for (let index = 0; index < obstacles.length; index += 1) {
      const item = obstacles[index];
      if (!item.active) continue;
      const drift = item.kind === KIND_KNIFE ? state.speed * 1.3 : state.speed;
      item.x -= drift * dt;
      if (item.x + item.width < -40) {
        item.active = false;
        continue;
      }
      if (!item.counted && item.x + item.width < player.x) {
        item.counted = true;
        if (!attract && isSolid(item.kind)) {
          state.score += SCORE.dodge;
          events |= EVENT_DODGE;
        }
      }
      if (attract || player.invulnerable > 0) continue;
      if (!overlaps(player, item)) continue;
      if (item.kind === KIND_PUDDLE) {
        state.inPuddle = true;
        continue;
      }
      if (item.kind === KIND_KNIFE) {
        if (player.slideT > 0) continue; // Slid clean under the blade.
        item.active = false;
        events = stumble(events);
        if (events & EVENT_OVER) return events;
        continue;
      }
      // Solid obstacle: landing on top is a clean pass, a side hit is a stumble. The
      // landing window covers a full step of falling, so a fast drop still lands.
      if (player.vy >= 0 && prevBottom <= item.y + 22) {
        player.y = item.y - player.height;
        player.vy = 0;
        player.grounded = true;
      } else {
        item.active = false;
        events = stumble(events);
        if (events & EVENT_OVER) return events;
      }
    }

    // The turkey lands back on the ground (or on an obstacle top it stands on).
    let support = FIELD.groundY;
    for (let index = 0; index < obstacles.length; index += 1) {
      const item = obstacles[index];
      if (!item.active || !isSolid(item.kind)) continue;
      if (player.x + player.width > item.x + 4 && player.x < item.x + item.width - 4) {
        if (Math.abs(player.y + player.height - item.y) < 10) support = Math.min(support, item.y);
      }
    }
    supportY = support;
    if (player.y + player.height >= support) {
      player.y = support - player.height;
      player.vy = 0;
      player.grounded = true;
    } else if (player.grounded && player.y + player.height < support - 2) {
      player.grounded = false;
    }

    // Corn kernels.
    for (let index = 0; index < kernels.length; index += 1) {
      const kernel = kernels[index];
      if (!kernel.active) continue;
      kernel.x -= state.speed * dt;
      if (kernel.x + kernel.width < -40) {
        kernel.active = false;
        continue;
      }
      if (!attract && overlaps(player, kernel)) {
        kernel.active = false;
        state.score += kernel.gold ? SCORE.goldCorn : SCORE.corn;
        events |= EVENT_CORN;
      }
    }

    return events;
  }

  reset();
  return { state, reset, step };
}
