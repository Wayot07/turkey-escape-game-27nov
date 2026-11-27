// Every pixel the player sees, drawn on one canvas: a dusk farmyard scrolling past,
// the turkey, the farmer on its heels, the oven, the knives, the corn, and every screen.
// Nothing here loads a file: all art is drawn, so the game plays with no network.
import { ESCAPE_METRES, FIELD, FARMER, LIVES, PALETTE, PX_PER_METRE } from './config.js';
import { KIND_BALE, KIND_CORN, KIND_FENCE, KIND_GOLD_CORN, KIND_KNIFE, KIND_OVEN, KIND_PUDDLE } from './world.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_PAUSED = 2;
export const SCREEN_OVER = 3;

/** A tiny deterministic hash of an integer, for scenery that never changes as it scrolls. */
function hash(n) {
  let x = (n | 0) * 2654435761;
  x ^= x >>> 15;
  x = Math.imul(x, 2246822519);
  x ^= x >>> 13;
  return ((x >>> 0) % 1000) / 1000;
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function fit() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || FIELD.width;
    const h = canvas.clientHeight || FIELD.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    const ox = (canvas.width - FIELD.width * scale) / 2;
    const oy = (canvas.height - FIELD.height * scale) / 2;
    ctx.setTransform(scale, 0, 0, scale, ox, oy);
  }

  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawSky(distance) {
    const g = ctx.createLinearGradient(0, 0, 0, FIELD.groundY);
    g.addColorStop(0, PALETTE.skyTop);
    g.addColorStop(0.55, PALETTE.skyMid);
    g.addColorStop(1, PALETTE.skyLow);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, FIELD.width, FIELD.groundY);
    // Low sun, fixed in the sky, clear of the HUD's lives and best score at top right.
    ctx.fillStyle = PALETTE.sun;
    ctx.beginPath();
    ctx.arc(700, 110, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 217, 122, 0.25)';
    ctx.beginPath();
    ctx.arc(700, 110, 78, 0, Math.PI * 2);
    ctx.fill();
    // Clouds drift slower than the ground (parallax).
    for (let i = 0; i < 7; i += 1) {
      const cx = (((i * 317 + 140 - distance * 6) % 1500) + 1500) % 1500 - 110;
      const cy = 60 + hash(i * 7 + 3) * 150;
      ctx.fillStyle = PALETTE.cloud;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 70, 20, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 44, cy + 8, 48, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawHills(distance) {
    // Far hill, slow parallax; near hill with trees, faster.
    ctx.fillStyle = PALETTE.hillFar;
    ctx.beginPath();
    ctx.moveTo(0, FIELD.groundY);
    for (let x = 0; x <= FIELD.width; x += 80) {
      ctx.lineTo(x, FIELD.groundY - 90 - Math.sin((x + distance * 2) / 260) * 36);
    }
    ctx.lineTo(FIELD.width, FIELD.groundY);
    ctx.closePath();
    ctx.fill();
    // The barn stands at the start of the run; the forest gate waits at the end.
    const barnX = 180 - distance * PX_PER_METRE * 0.4;
    if (barnX > -260 && barnX < FIELD.width + 60) drawBarn(barnX, FIELD.groundY - 118);
    for (let i = 0; i < 10; i += 1) {
      const tx = (((i * 421 + 260 - distance * PX_PER_METRE * 0.55) % 1700) + 1700) % 1700 - 210;
      drawTree(tx, FIELD.groundY - 6, 0.8 + hash(i) * 0.5);
    }
    ctx.fillStyle = PALETTE.hillNear;
    ctx.beginPath();
    ctx.moveTo(0, FIELD.groundY);
    for (let x = 0; x <= FIELD.width; x += 80) {
      ctx.lineTo(x, FIELD.groundY - 34 - Math.sin((x + distance * 5) / 200) * 14);
    }
    ctx.lineTo(FIELD.width, FIELD.groundY);
    ctx.closePath();
    ctx.fill();
  }

  function drawBarn(x, y) {
    ctx.fillStyle = PALETTE.barn;
    ctx.fillRect(x, y, 170, 118);
    ctx.fillStyle = PALETTE.barnRoof;
    ctx.beginPath();
    ctx.moveTo(x - 12, y);
    ctx.lineTo(x + 85, y - 52);
    ctx.lineTo(x + 182, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fff7e8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 85, y + 118);
    ctx.lineTo(x + 85, y + 30);
    ctx.moveTo(x + 20, y + 30);
    ctx.lineTo(x + 150, y + 30);
    ctx.moveTo(x + 20, y + 118);
    ctx.lineTo(x + 150, y + 118);
    ctx.stroke();
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(x + 66, y + 62, 38, 56);
  }

  function drawTree(x, y, s) {
    ctx.fillStyle = PALETTE.treeTrunk;
    ctx.fillRect(x - 5 * s, y - 46 * s, 10 * s, 46 * s);
    ctx.fillStyle = PALETTE.tree;
    ctx.beginPath();
    ctx.arc(x, y - 62 * s, 34 * s, 0, Math.PI * 2);
    ctx.arc(x - 24 * s, y - 44 * s, 22 * s, 0, Math.PI * 2);
    ctx.arc(x + 24 * s, y - 44 * s, 22 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawGround(distance) {
    ctx.fillStyle = PALETTE.ground;
    ctx.fillRect(0, FIELD.groundY, FIELD.width, FIELD.height - FIELD.groundY);
    ctx.fillStyle = PALETTE.groundTop;
    ctx.fillRect(0, FIELD.groundY, FIELD.width, 10);
    // Grass tufts and fence posts scroll with the world.
    ctx.fillStyle = PALETTE.grass;
    for (let i = 0; i < 26; i += 1) {
      const gx = (((i * 173 + 40 - distance * PX_PER_METRE) % 1400) + 1400) % 1400 - 60;
      ctx.fillRect(gx, FIELD.groundY + 26 + hash(i * 3) * 40, 4, 12);
      ctx.fillRect(gx + 6, FIELD.groundY + 26 + hash(i * 5) * 40, 4, 10);
    }
    ctx.fillStyle = PALETTE.fence;
    for (let i = 0; i < 12; i += 1) {
      const fx = (((i * 211 + 90 - distance * PX_PER_METRE) % 1500) + 1500) % 1500 - 110;
      ctx.fillRect(fx, FIELD.groundY - 34, 8, 34);
    }
    ctx.fillStyle = PALETTE.fenceDark;
    ctx.fillRect(0, FIELD.groundY - 30, FIELD.width, 5);
    ctx.fillRect(0, FIELD.groundY - 14, FIELD.width, 5);
  }

  function drawGate(distance) {
    // The forest gate at the escape line: two posts, a garland, and the trees beyond.
    const gx = ESCAPE_METRES * PX_PER_METRE - distance * PX_PER_METRE + 260;
    if (gx < -200 || gx > FIELD.width + 200) return;
    ctx.fillStyle = PALETTE.tree;
    ctx.fillRect(gx - 190, FIELD.groundY - 260, 150, 260);
    ctx.fillRect(gx + 40, FIELD.groundY - 260, 150, 260);
    ctx.fillStyle = PALETTE.treeTrunk;
    ctx.fillRect(gx - 26, FIELD.groundY - 210, 22, 210);
    ctx.fillRect(gx + 104, FIELD.groundY - 210, 22, 210);
    ctx.fillStyle = PALETTE.goldCorn;
    ctx.font = 'bold 26px ' + 'system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FOREST — FREEDOM', gx + 65, FIELD.groundY - 222);
  }

  function drawTurkey(state, t) {
    const p = state.player;
    if (p.invulnerable > 0 && Math.floor(t * 12) % 2 === 0) return; // Hit flash.
    const sliding = p.slideT > 0;
    const bob = p.grounded ? Math.sin(t * 16) * 3 : 0;
    const x = p.x;
    const y = p.y + bob;
    const w = p.width;
    const h = p.height;
    ctx.save();
    ctx.translate(x + w / 2, y + h);
    if (sliding) ctx.scale(1.25, 0.62);
    // Tail fan.
    ctx.fillStyle = PALETTE.turkeyTail[0];
    for (let i = -2; i <= 2; i += 1) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 9 - Math.PI / 2);
      ctx.fillStyle = PALETTE.turkeyTail[i + 2] || PALETTE.turkeyTail[0];
      ctx.beginPath();
      ctx.ellipse(0, -34, 9, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Body.
    ctx.fillStyle = PALETTE.turkeyBody;
    ctx.beginPath();
    ctx.ellipse(0, -20, 26, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.turkeyDark;
    ctx.beginPath();
    ctx.ellipse(-4, -14, 16, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wing.
    ctx.fillStyle = PALETTE.turkeyDark;
    ctx.beginPath();
    ctx.ellipse(2, -20, 13, 8, -0.4, 0, Math.PI * 2);
    ctx.fill();
    // Legs: a running cycle on the ground, tucked in the air.
    ctx.strokeStyle = PALETTE.turkeyBeak;
    ctx.lineWidth = 4;
    const legSwing = p.grounded ? Math.sin(t * 16) * 8 : 4;
    ctx.beginPath();
    ctx.moveTo(-8, -4);
    ctx.lineTo(-8 + legSwing, 0);
    ctx.moveTo(8, -4);
    ctx.lineTo(8 - legSwing, 0);
    ctx.stroke();
    // Head, beak, wattle, eye.
    ctx.fillStyle = PALETTE.turkeyHead;
    ctx.beginPath();
    ctx.arc(24, -40, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.turkeyBeak;
    ctx.beginPath();
    ctx.moveTo(33, -42);
    ctx.lineTo(46, -38);
    ctx.lineTo(33, -35);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.turkeyWattle;
    ctx.beginPath();
    ctx.ellipse(32, -30, 4, 7, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c1c1c';
    ctx.beginPath();
    ctx.arc(27, -43, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFarmer(state, t) {
    const gap = state.farmerGap;
    if (gap > 300) return;
    const x = state.player.x - gap;
    const y = FIELD.groundY;
    const runSwing = Math.sin(t * 14) * 7;
    ctx.save();
    ctx.translate(x, y);
    // Legs.
    ctx.strokeStyle = PALETTE.farmerOveralls;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-6, -34);
    ctx.lineTo(-6 + runSwing, 0);
    ctx.moveTo(6, -34);
    ctx.lineTo(6 - runSwing, 0);
    ctx.stroke();
    // Body: overalls and shirt.
    ctx.fillStyle = PALETTE.farmerShirt;
    rr(-16, -66, 32, 34, 8);
    ctx.fill();
    ctx.fillStyle = PALETTE.farmerOveralls;
    ctx.fillRect(-14, -46, 28, 16);
    // Arm reaching forward with the pitchfork.
    ctx.strokeStyle = PALETTE.farmerSkin;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(10, -56);
    ctx.lineTo(30, -44);
    ctx.stroke();
    ctx.strokeStyle = '#8a8f96';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(30, -70);
    ctx.lineTo(44, -20);
    ctx.moveTo(44, -20);
    ctx.lineTo(38, -14);
    ctx.moveTo(44, -20);
    ctx.lineTo(50, -14);
    ctx.stroke();
    // Head and hat.
    ctx.fillStyle = PALETTE.farmerSkin;
    ctx.beginPath();
    ctx.arc(2, -76, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.farmerHat;
    ctx.beginPath();
    ctx.ellipse(2, -84, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-10, -98, 24, 14);
    ctx.fillStyle = '#1c1c1c';
    ctx.beginPath();
    ctx.arc(7, -78, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Danger vignette while he closes in.
    if (gap < 120) {
      ctx.fillStyle = `rgba(255, 60, 40, ${0.1 * (1 - gap / 120)})`;
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    }
  }

  function drawObstacles(state, t) {
    for (const item of state.obstacles) {
      if (!item.active) continue;
      if (item.kind === KIND_FENCE) {
        ctx.fillStyle = PALETTE.fence;
        ctx.fillRect(item.x, item.y, 7, item.height);
        ctx.fillRect(item.x + item.width - 7, item.y, 7, item.height);
        ctx.fillStyle = PALETTE.fenceDark;
        ctx.fillRect(item.x, item.y + 10, item.width, 7);
        ctx.fillRect(item.x, item.y + 34, item.width, 7);
      } else if (item.kind === KIND_BALE) {
        ctx.fillStyle = '#c9a13b';
        ctx.beginPath();
        ctx.arc(item.x + item.width / 2, item.y + item.height / 2, item.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#a67c22';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(item.x + item.width / 2, item.y + item.height / 2, item.width / 2 - 9, 0, Math.PI * 2);
        ctx.arc(item.x + item.width / 2, item.y + item.height / 2, item.width / 2 - 18, 0, Math.PI * 2);
        ctx.stroke();
      } else if (item.kind === KIND_OVEN) {
        ctx.fillStyle = PALETTE.oven;
        rr(item.x, item.y, item.width, item.height, 8);
        ctx.fill();
        ctx.fillStyle = '#22252d';
        ctx.fillRect(item.x + 14, item.y + 18, item.width - 28, 26);
        const flicker = 0.7 + Math.sin(t * 9 + item.x) * 0.3;
        ctx.fillStyle = `rgba(255, 154, 60, ${flicker})`;
        ctx.beginPath();
        ctx.ellipse(item.x + item.width / 2, item.y + 62, 26, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff5a2a';
        ctx.beginPath();
        ctx.ellipse(item.x + item.width / 2, item.y + 62, 14, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PALETTE.ovenGlow;
        ctx.font = 'bold 15px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('HOT!', item.x + item.width / 2, item.y + item.height - 8);
        ctx.fillStyle = PALETTE.oven;
        ctx.fillRect(item.x + item.width / 2 - 8, item.y - 26, 16, 26);
      } else if (item.kind === KIND_KNIFE) {
        ctx.save();
        ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
        ctx.rotate(t * 10);
        ctx.fillStyle = PALETTE.knife;
        ctx.beginPath();
        ctx.moveTo(-28, -6);
        ctx.lineTo(14, -7);
        ctx.lineTo(28, 0);
        ctx.lineTo(14, 7);
        ctx.lineTo(-28, 6);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = PALETTE.knifeHandle;
        ctx.fillRect(-28, -6, 12, 12);
        ctx.restore();
      } else if (item.kind === KIND_PUDDLE) {
        ctx.fillStyle = PALETTE.puddle;
        ctx.beginPath();
        ctx.ellipse(item.x + item.width / 2, item.y + item.height / 2, item.width / 2, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.ellipse(item.x + item.width / 2 - 14, item.y + item.height / 2 - 2, 22, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8a6a42';
        ctx.font = 'bold 13px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('MUD — SLOW!', item.x + item.width / 2, item.y - 8);
      }
    }
    for (const kernel of state.kernels) {
      if (!kernel.active) continue;
      const bobY = kernel.y + Math.sin(t * 4 + kernel.x / 30) * 3;
      ctx.save();
      ctx.translate(kernel.x + 13, bobY + 13);
      if (kernel.gold) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.35)';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = kernel.gold ? PALETTE.goldCorn : PALETTE.corn;
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 13, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7a8c3a';
      ctx.fillRect(-3, -18, 6, 8);
      ctx.restore();
    }
  }

  function drawHud(state, best) {
    ctx.fillStyle = PALETTE.panel;
    rr(16, 14, 350, 118, 12);
    ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.textAlign = 'left';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText(`SCORE ${Math.floor(state.score)}`, 32, 50);
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(`DISTANCE ${Math.floor(state.distance)} m / ${ESCAPE_METRES} m`, 32, 82);
    ctx.fillText(`LEVEL ${state.level}`, 32, 112);
    // Lives as tail feathers, on a dark pill so they read against sky and clouds.
    ctx.fillStyle = PALETTE.panel;
    rr(FIELD.width - 188, 14, 172, 92, 12);
    ctx.fill();
    for (let i = 0; i < LIVES; i += 1) {
      const lx = FIELD.width - 40 - i * 44;
      ctx.save();
      ctx.translate(lx, 44);
      ctx.rotate(-0.5 + i * 0.25);
      ctx.fillStyle = i < state.lives ? PALETTE.turkeyTail[1] : 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`BEST ${Math.max(best, Math.floor(state.score))}`, FIELD.width - 28, 92);
    // Farmer proximity bar.
    const bw = 260;
    const bx = (FIELD.width - bw) / 2;
    ctx.fillStyle = 'rgba(24, 18, 12, 0.78)';
    rr(bx, FIELD.height - 34, bw, 20, 10);
    ctx.fill();
    const closeness = 1 - state.farmerGap / FARMER.startGap;
    ctx.fillStyle = closeness > 0.66 ? PALETTE.danger : closeness > 0.33 ? PALETTE.ovenGlow : PALETTE.good;
    rr(bx + 3, FIELD.height - 31, (bw - 6) * closeness, 14, 7);
    ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FARMER', FIELD.width / 2, FIELD.height - 40);
  }

  function panel(x, y, w, h) {
    ctx.fillStyle = PALETTE.panel;
    rr(x, y, w, h, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 231, 180, 0.5)';
    ctx.lineWidth = 2;
    rr(x, y, w, h, 18);
    ctx.stroke();
  }

  function drawTitle(state, best) {
    panel(290, 96, 700, 470);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 72px system-ui, sans-serif';
    ctx.fillText('TURKEY RUN', 640, 190);
    ctx.fillStyle = PALETTE.ovenGlow;
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText('Escape the farmer — don\'t be Thanksgiving dinner!', 640, 232);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('Jump the fences, hay and the hot oven.', 640, 300);
    ctx.fillText('Slide under the carving knives. Grab the corn.', 640, 330);
    ctx.fillText('Reach the forest gate at 1500 m and you\'re free.', 640, 360);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('SPACE / ↑ / CLICK — jump      ↓ — slide', 640, 420);
    ctx.fillText('P — pause      M — sound on/off', 640, 452);
    if (best > 0) {
      ctx.fillStyle = PALETTE.goldCorn;
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText(`BEST SCORE ${best}`, 640, 492);
    }
    ctx.fillStyle = PALETTE.good;
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText('▶  PRESS SPACE OR CLICK TO RUN', 640, 538);
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(20, 14, 8, 0.55)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    panel(440, 250, 400, 160);
    ctx.fillStyle = PALETTE.text;
    ctx.textAlign = 'center';
    ctx.font = 'bold 44px system-ui, sans-serif';
    ctx.fillText('PAUSED', 640, 318);
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText('P or Esc to keep running', 640, 362);
  }

  function drawOver(state, best, escaped) {
    ctx.fillStyle = 'rgba(20, 14, 8, 0.45)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    panel(330, 130, 620, 420);
    ctx.textAlign = 'center';
    if (escaped) {
      ctx.fillStyle = PALETTE.good;
      ctx.font = 'bold 64px system-ui, sans-serif';
      ctx.fillText('ESCAPED!', 640, 220);
      ctx.fillStyle = PALETTE.text;
      ctx.font = '24px system-ui, sans-serif';
      ctx.fillText('You made it to the forest. No dinner tonight!', 640, 268);
    } else {
      ctx.fillStyle = PALETTE.danger;
      ctx.font = 'bold 64px system-ui, sans-serif';
      ctx.fillText('CAUGHT!', 640, 220);
      ctx.fillStyle = PALETTE.text;
      ctx.font = '24px system-ui, sans-serif';
      ctx.fillText('The farmer got you… Thanksgiving dinner is served.', 640, 268);
    }
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText(`SCORE ${Math.floor(state.score)}`, 640, 336);
    ctx.font = '22px system-ui, sans-serif';
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(`Distance ${Math.floor(state.distance)} m  ·  Level ${state.level}`, 640, 374);
    ctx.fillStyle = PALETTE.goldCorn;
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(`BEST ${Math.max(best, Math.floor(state.score))}`, 640, 410);
    ctx.fillStyle = PALETTE.good;
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText('▶  PRESS R OR CLICK TO RUN AGAIN', 640, 488);
  }

  function draw(state, screen, best, escaped, t) {
    fit();
    ctx.fillStyle = '#11141b';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    drawSky(state.distance);
    drawHills(state.distance);
    drawGround(state.distance);
    drawGate(state.distance);
    if (screen !== SCREEN_TITLE) {
      drawObstacles(state, t);
      drawFarmer(state, t);
      drawTurkey(state, t);
      drawHud(state, best);
    } else {
      drawObstacles(state, t);
      drawTurkey(state, t);
    }
    if (screen === SCREEN_TITLE) drawTitle(state, best);
    else if (screen === SCREEN_PAUSED) drawPaused();
    else if (screen === SCREEN_OVER) drawOver(state, best, escaped);
  }

  return { draw };
}
