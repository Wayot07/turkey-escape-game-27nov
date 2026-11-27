// Every tuning number and colour in one place. The playfield is a fixed 1280x720 logical
// area; the renderer scales it to the window, so no rule below depends on screen size.
export const FIELD = { width: 1280, height: 720, groundY: 640 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** Where the turkey runs on screen; the world scrolls past it. */
export const PLAYER = {
  x: 260,
  width: 62,
  height: 58,
  slideHeight: 34,
  jumpVelocity: -880,
  gravity: 2600,
  slideSeconds: 0.55,
  invulnerable: 1.5,
};

export const LIVES = 3;

/** The farmer starts this far behind the turkey, in pixels on screen. */
export const FARMER = { startGap: 230, stumbleCost: 58, recoverPerSecond: 10, catchGap: 26 };

/** Distance, in metres, the turkey must cover to reach the forest and escape. */
export const ESCAPE_METRES = 1500;

/** Pixels of world scrolled per metre of distance. */
export const PX_PER_METRE = 14;

export const RUN = {
  startSpeed: 330,
  speedPerLevel: 26,
  maxSpeed: 640,
  /** Seconds of running per level; spawn rates and speed grow with it. */
  levelMetres: 250,
  maxLevel: 10,
  stumbleSlow: 0.55,
  stumbleSlowSeconds: 0.7,
};

export const OBSTACLE = {
  fence: { width: 46, height: 64 },
  bale: { width: 78, height: 62 },
  oven: { width: 96, height: 104 },
  knife: { width: 58, height: 16, flyHeight: 92 },
  puddle: { width: 130, height: 16 },
};

export const SPAWN = {
  firstObstacleAt: 1.6,
  obstacleInterval: 1.55,
  obstacleIntervalScale: 0.93,
  minObstacleInterval: 0.8,
  cornInterval: 1.7,
  cornJitter: 0.9,
};

export const SCORE = {
  corn: 10,
  goldCorn: 50,
  dodge: 5,
  perMetre: 1,
  escapeBonus: 500,
};

/** How many obstacles / kernels can exist at once; the pools are allocated once, at boot. */
export const POOL_SIZE = 48;

export const PALETTE = {
  skyTop: '#f7b267',
  skyMid: '#f4845f',
  skyLow: '#e85d75',
  sun: '#ffd97a',
  cloud: '#ffe8c9',
  hillFar: '#8a6d4b',
  hillNear: '#6b8e4e',
  barn: '#a63d2f',
  barnRoof: '#7c2d22',
  tree: '#4c7a3f',
  treeTrunk: '#6b4a2f',
  ground: '#7a5a34',
  groundTop: '#9c7b46',
  grass: '#5d8a3c',
  fence: '#8a6a42',
  fenceDark: '#6e5233',
  turkeyBody: '#8a5a2e',
  turkeyDark: '#6e4522',
  turkeyTail: ['#b5651d', '#d2691e', '#e8a33c', '#a63d2f'],
  turkeyHead: '#c9d2e3',
  turkeyBeak: '#f2a541',
  turkeyWattle: '#e5534b',
  farmerShirt: '#4a6fa5',
  farmerOveralls: '#3b4a6b',
  farmerHat: '#d9b36a',
  farmerSkin: '#e8b88a',
  oven: '#3a3f4a',
  ovenGlow: '#ff9a3c',
  knife: '#dfe3ea',
  knifeHandle: '#5a3a22',
  corn: '#f2c94c',
  goldCorn: '#ffd700',
  puddle: '#5a7a9e',
  panel: 'rgba(24, 18, 12, 0.78)',
  text: '#fff7e8',
  muted: '#e8cfa8',
  danger: '#ff5a4e',
  good: '#7be07b',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'turkey-run.best';
