/* ============ world: the desktop, the cat's corner room, time, particles ============ */
const WIN = { x: 118, y: 8, w: 52, h: 42 };           // window frame (room-local)
const GLASS = { x0: 120, x1: 167, y0: 10, y1: 45 };   // visible sky (room-local)
// props live in a strip along the bottom-right corner of the desktop (no room, no walls)
const LOCAL = {
  post: { x: 14, gy: 110 }, box: { x: 62, by: 108 }, bowl: { x: 104, gy: 112 }, water: { x: 123, gy: 112 },
  cushion: { x: 164, gy: 111 }, plant: { x: 0, gy: 0 }, sill: { x0: 0, x1: 0, gy: 0 }
};

const Room = {
  ox: 0, oy: 0, t: 0, dayT: 0.2,
  post: {}, box: {}, bowl: { food: 0 }, water: {}, cushion: {}, plant: {}, sill: {},
  messes: [], ball: null, bird: null, fly: null, parts: [], emote: null,
  nextBird: 1e12, nextFly: 1e12, clean: 100
};
let messId = 1;

const Desk = {
  cursor: { x: 300, y: 200, px: 300, py: 200, speed: 0, moved: 0, idle: 0 },
  wins: [], icons: [], vis: [], visT: 0, fullscreen: false, real: false
};

const PROP_KEYS = ['post', 'box', 'bowl', 'water', 'cushion'];
const propBottom = () => Room.oy + ROOM_H - 2;
const propY = k => (k === 'box' ? Room.box.by : Room[k].gy);
function setPropPos(k, x, y) {
  x = clamp(x, 16, W - 16); y = clamp(y, 48, propBottom());
  if (k === 'box') {
    const dx = x - Room.box.x, dy = y - Room.box.by;
    for (const m of Room.messes) if (m.where === 'box') { m.x += dx; m.gy += dy; }
    Room.box.x = x; Room.box.by = y;
  } else { Room[k].x = x; Room[k].gy = y; }
}
function savePropPos() {
  const o = {};
  for (const k of PROP_KEYS) o[k] = { dx: Room[k].x - W, dy: propY(k) - propBottom() };
  store.set('props', o);
}
function applySavedProps() {
  const o = store.get('props', null);
  if (!o) return;
  for (const k of PROP_KEYS) if (o[k]) setPropPos(k, W + o[k].dx, propBottom() + o[k].dy);
}
function layoutWorld(cssW, cssH, workBottomCss) {
  W = Math.ceil(cssW / S_PX); H = Math.ceil(cssH / S_PX);
  const wb = Math.floor(workBottomCss / S_PX);
  const nox = W - ROOM_W, noy = wb - ROOM_H;
  const dx = nox - Room.ox, dy = noy - Room.oy;
  Room.ox = nox; Room.oy = noy;
  for (const k of ['post', 'box', 'bowl', 'water', 'cushion', 'plant']) {
    for (const a in LOCAL[k]) Room[k][a] = LOCAL[k][a] + (a === 'x' ? nox : noy);
  }
  applySavedProps();
  Room.sill = { x0: LOCAL.sill.x0 + nox, x1: LOCAL.sill.x1 + nox, gy: LOCAL.sill.gy + noy };
  for (const m of Room.messes) if (m.where === 'box') { m.x += dx; m.gy += dy; }
  if (Room.ball) { Room.ball.x += dx * 0; }
  GY_MIN = 30; GY_MAX = noy + ROOM_H - 2;     // as low as furniture can be dragged
  if (typeof layoutFurn === 'function') layoutFurn();
  if (typeof cat !== 'undefined' && cat) {
    cat.x = clamp(cat.x, 8, W - 8);
    if (cat.surface === 'floor') cat.gy = clamp(cat.gy, GY_MIN, GY_MAX);
  }
}

/* wall of the cat room is solid: returns a legal gy for (x, gy) given where the cat came from */
function wallBottom() { return -1e9; }
function resolveWall(x, gy) { return gy; }
const inRoom = (x, y) => x >= Room.ox && y >= Room.oy;

/* ---------- time of day follows the real clock ---------- */
function dayTFromClock(d) {
  let h = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
  if (h < 5) h += 24;
  const keys = [[5, 1.0], [7, 1.06], [17, 1.54], [19, 1.66], [20, 1.74], [28.5, 1.94], [29, 2.0]];
  return keyLerp(keys, h, lerp) % 1;
}
function lightKeys() { return [[0, 0.62], [0.06, 1], [0.54, 1], [0.66, 0.42], [0.74, 0.3], [0.94, 0.3], [1, 0.62]]; }
function lightLevel() { return keyLerp(lightKeys(), Room.dayT, lerp); }
const isDay = () => lightLevel() > 0.75;
const isNight = () => lightLevel() < 0.5;

function sunSpot() {
  const h = typeof hourNow === 'function' ? hourNow() : 12;
  if (h < 9 || h >= 17.5 || !Desk.real && !Host.mock) return { on: false };
  const p = (h - 9) / 8.5;
  return { on: true, x: clamp(lerp(W * 0.16, W * 0.7, p), 40, W - 60), gy: clamp(lerp(GY_MAX * 0.4, GY_MAX * 0.62, Math.sin(p * Math.PI)), GY_MIN + 30, GY_MAX - 24), a: 1 };
  // eslint-disable-next-line no-unreachable
  const d = Room.dayT;
  if (d > 0.07 && d < 0.58) {
    const p = (d - 0.07) / 0.51;
    return { on: true, x: Room.ox + lerp(152, 66, p), gy: Room.oy + lerp(82, 98, p), a: Math.min(1, Math.min(p, 1 - p) * 6 + 0.35) };
  }
  return { on: false };
}
function timeLabel() {
  const d = Room.dayT;
  if (d < 0.06) return '새벽';
  if (d < 0.30) return '아침';
  if (d < 0.54) return '낮';
  if (d < 0.66) return '저녁';
  return '밤';
}

/* ---------- desktop data (icons, windows) ---------- */
function setDeskData(msg) {
  if (msg.idle !== undefined) Desk.sysIdle = msg.idle;
  if (msg.wins && typeof onDeskWindows === 'function') onDeskWindows(msg.wins);
  if (msg.wins) {
    Desk.wins = msg.wins.map(w => ({ id: w.id, x: w.x / S_PX, y: w.y / S_PX, w: w.w / S_PX, h: w.h / S_PX, max: w.max, fg: w.fg, t: w.t }));
  }
  if (msg.icons) {
    const sx = (msg.sx || 75), sy = (msg.sy || 98);
    Desk.icons = msg.icons.map((p, i) => ({
      id: i, x: p[0] / S_PX, y: p[1] / S_PX, w: sx / S_PX, h: sy / S_PX,
      cx: (p[0] + sx / 2) / S_PX, cy: (p[1] + sy * 0.34) / S_PX
    }));
  }
  Desk.real = true;
  Desk.visT = 0;
}
function pointCovered(x, y, skip) {
  for (let i = 0; i < Desk.wins.length; i++) {
    if (i === skip) return false;
    const w = Desk.wins[i];
    if (x >= w.x && x <= w.x + w.w && y >= w.y && y <= w.y + w.h) return true;
  }
  return false;
}
function refreshVisible() {
  Desk.vis = Desk.icons.filter(ic =>
    ic.cx > 10 && ic.cx < W - 10 && ic.cy > 12 && ic.cy < GY_MAX - 6 &&
    !(ic.cx > Room.ox - 14 && ic.cy > Room.oy - 14) &&
    !pointCovered(ic.cx, ic.cy, -1));
}
function visibleIcons() { return Desk.vis; }
function iconAt(x, y, pad = 4) {
  for (const ic of Desk.vis) if (x > ic.x - pad && x < ic.x + ic.w + pad && y > ic.y - pad && y < ic.y + ic.h + pad) return ic;
  return null;
}
function platforms() {
  const out = [];
  Desk.wins.forEach((w, i) => {
    if (w.y < 56 || w.y > GY_MAX - 40 || w.w < 70 || w.max) return;
    out.push({ id: w.id, i, x0: w.x + 8, x1: w.x + w.w - 8, y: w.y, t: w.t });
  });
  return out;
}
function platformById(id) { return platforms().find(p => p.id === id) || null; }
function platformVisibleAt(p, x) {
  for (let j = 0; j < p.i; j++) {
    const w = Desk.wins[j];
    if (x >= w.x && x <= w.x + w.w && p.y + 2 >= w.y && p.y + 2 <= w.y + w.h) return false;
  }
  return true;
}

/* ---------- messes (poop / hairball) ---------- */
function addMess(kind, where, x, gy) {
  const m = { id: messId++, kind, where, x, gy, age: 0, fly: rnd(6) };
  Room.messes.push(m);
  return m;
}
function removeMess(m) {
  const i = Room.messes.indexOf(m);
  if (i >= 0) Room.messes.splice(i, 1);
}
const boxMesses = () => Room.messes.filter(m => m.where === 'box');
function messAt(x, y, r = 8) {
  if (typeof isHome === 'function' && !isHome()) return null;
  let best = null, bd = r * r;
  for (const m of Room.messes) {
    const my = m.where === 'box' ? Room.box.by - 5 : m.gy - 3;
    const d = (m.x - x) ** 2 + (my - y) ** 2;
    if (d < bd) { bd = d; best = m; }
  }
  return best;
}
function boxSlot() {
  const slots = [-11, -4, 3, 10];
  const used = boxMesses().map(m => m.x - Room.box.x);
  const free = slots.filter(s => !used.some(u => Math.abs(u - s) < 3));
  return Room.box.x + (free.length ? pick(free) : rint(-12, 12));
}
/* a floor spot that does not sit on a desktop icon */
function freeFloorSpot(x, gy) {
  for (let i = 0; i < 10; i++) {
    if (!iconAt(x, gy - 6, 8)) return { x, gy };
    x = clamp(x + rnd(-30, 30), 12, W - 12); gy = clamp(gy + rnd(-20, 20), GY_MIN, GY_MAX);
  }
  return { x, gy };
}

/* ---------- particles ---------- */
function spawn(type, x, y, o = {}) {
  const p = Object.assign({ type, x, y, vx: 0, vy: 0, t: 0, life: 1, g: 0 }, o);
  Room.parts.push(p);
  return p;
}
function burstDust(x, y, n = 5, dir = 0) {
  for (let i = 0; i < n; i++)
    spawn('dust', x + rnd(-3, 3), y, { vx: rnd(-14, 14) + dir * 10, vy: rnd(-12, -3), life: rnd(0.3, 0.55), g: 20 });
}
function updateParts(dt) {
  for (const p of Room.parts) {
    p.t += dt;
    if (p.type === 'kibble') {
      if (p.t < 0) continue;
      const u = Math.min(1, p.t / p.life);
      p.x = lerp(p.sx, p.tx, u);
      p.y = lerp(p.sy, p.ty, u) - 4 * p.h * u * (1 - u);
      if (u >= 1 && !p.done) { p.done = true; if (p.cb) p.cb(); }
      continue;
    }
    p.vy += p.g * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.type === 'heart' || p.type === 'note') p.x += Math.sin(p.t * 5 + (p.ph || 0)) * 6 * dt;
    if (p.type === 'zzz') p.x += Math.sin(p.t * 3) * 5 * dt;
  }
  Room.parts = Room.parts.filter(p => p.t < p.life);
}
function drawParts(ctx, pass) {
  for (const p of Room.parts) {
    if (p.t < 0) continue;
    if ((p.type === 'paw') !== (pass === 'ground')) continue;
    const u = p.t / p.life;
    const x = Math.round(p.x), y = Math.round(p.y);
    switch (p.type) {
      case 'heart': ctx.globalAlpha = u > 0.7 ? (1 - u) / 0.3 : 1; ctx.drawImage(MINI.heart, x, y); ctx.globalAlpha = 1; break;
      case 'zzz': ctx.globalAlpha = u > 0.7 ? (1 - u) / 0.3 : 1; ctx.drawImage(u > 0.45 ? MINI.Z : MINI.z, x, y); ctx.globalAlpha = 1; break;
      case 'note': ctx.globalAlpha = u > 0.7 ? (1 - u) / 0.3 : 1; ctx.drawImage(MINI.note, x, y); ctx.globalAlpha = 1; break;
      case 'spark': ctx.globalAlpha = 1 - u; ctx.drawImage(MINI.spark, x, y); ctx.globalAlpha = 1; break;
      case 'sweat': ctx.drawImage(MINI.drop, x, y); break;
      case 'dust':
        ctx.fillStyle = `rgba(255,248,235,${0.8 * (1 - u)})`;
        ctx.fillRect(x, y, u < 0.5 ? 2 : 1, u < 0.5 ? 2 : 1);
        break;
      case 'sand':
        ctx.fillStyle = `rgba(232,208,150,${1 - u * 0.6})`; ctx.fillRect(x, y, 1, 1); break;
      case 'fur':
        ctx.fillStyle = p.col || '#fff'; ctx.globalAlpha = 1 - u; ctx.fillRect(x, y, 1, 1); ctx.globalAlpha = 1; break;
      case 'kibble':
        ctx.fillStyle = '#b8743a'; ctx.fillRect(x, y, 2, 2); ctx.fillStyle = '#d9984f'; ctx.fillRect(x, y, 1, 1); break;
      case 'steam':
        ctx.fillStyle = `rgba(255,255,255,${0.55 * (1 - u)})`; ctx.fillRect(x, y, 1, 1); break;
      case 'poof': {
        const r = 2 + u * 7;
        ctx.fillStyle = `rgba(255,255,255,${0.9 * (1 - u)})`;
        for (let a = 0; a < 8; a++) {
          const an = a * Math.PI / 4 + p.rot;
          ctx.fillRect(Math.round(p.x + Math.cos(an) * r), Math.round(p.y + Math.sin(an) * r * 0.8), 2, 2);
        }
        break;
      }
      case 'paw':
        inArt(ctx, p.x, p.y, g => {
          g.globalAlpha = 0.5 * (1 - u * u);
          aEll(g, '#6b5a74', 0, 1, 3, 2);
          A(g, '#6b5a74', -5, -3, 2, 2); A(g, '#6b5a74', -2, -5, 2, 2); A(g, '#6b5a74', 1, -5, 2, 2); A(g, '#6b5a74', 4, -3, 2, 2);
          g.globalAlpha = 1;
        });
        break;
      case 'wob': {
        const o = (Math.sin(p.t * 60) > 0 ? 1 : -1) * (1 - u) * 3;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillRect(Math.round(p.x - 11 + o), Math.round(p.y - 4), 2, 1); ctx.fillRect(Math.round(p.x - 12 - o), Math.round(p.y + 2), 3, 1);
        ctx.fillRect(Math.round(p.x + 10 - o), Math.round(p.y - 3), 2, 1); ctx.fillRect(Math.round(p.x + 10 + o), Math.round(p.y + 3), 3, 1);
        break;
      }
      case 'impact': {
        const r = 2 + u * 8;
        ctx.fillStyle = `rgba(255,214,90,${1 - u})`;
        for (let a = 0; a < 6; a++) {
          const an = a * Math.PI / 3 + p.rot;
          ctx.fillRect(Math.round(p.x + Math.cos(an) * r), Math.round(p.y + Math.sin(an) * r), 2, 2);
        }
        break;
      }
    }
  }
}
function burstHearts(x, y, n = 1) {
  for (let i = 0; i < n; i++)
    spawn('heart', x + rnd(-5, 5), y + rnd(-3, 2), { vy: -rnd(13, 22), vx: rnd(-4, 4), life: rnd(1.1, 1.7), ph: rnd(6) });
}

/* ---------- emote bubble + DOM text bubbles ---------- */
function emote(type, dur = 1.6) { Room.emote = { type, t: 0, dur }; }

let bubblesEl = null;
const BUB_LIMIT = 3;
function sayAt(text, wx, wy, cls = '') {
  if (!bubblesEl) bubblesEl = document.getElementById('bubbles');
  if (!bubblesEl) return;
  while (bubblesEl.children.length >= BUB_LIMIT) bubblesEl.firstChild.remove();
  const d = document.createElement('div');
  d.className = 'bubble ' + cls;
  d.textContent = text;
  d.style.left = clamp(wx * S_PX, 40, W * S_PX - 40) + 'px';
  d.style.top = clamp(wy * S_PX, 20, H * S_PX - 10) + 'px';
  bubblesEl.appendChild(d);
  setTimeout(() => d.remove(), 2100);
}
// the cat never talks in text bubbles; meows are sound only
function say() {}
function sayMeow(kind = 'meow', vol = 1) { Snd.meow(kind, vol); }

/* ---------- bird (outside the room window) & fly (anywhere) ---------- */
function updateBird(dt) {
  const b = Room.bird;
  if (!b) {
    Room.nextBird -= dt;
    if (Room.nextBird <= 0) {
      if (isDay()) {
        const fromLeft = chance(0.5);
        Room.bird = { state: 'in', t: 0, T: 1.4, px: rnd(134, 156), x: 0, y: 0, hop: 0, look: 1, stay: rnd(9, 20), flap: 0, sx: fromLeft ? GLASS.x0 - 8 : GLASS.x1 + 8, sy: rnd(14, 26) };
      } else Room.nextBird = rnd(20, 40);
    }
    return;
  }
  b.t += dt; b.flap += dt * 16;
  if (b.state === 'in') {
    const u = Math.min(1, b.t / b.T);
    b.x = lerp(b.sx, b.px, ease(u)); b.y = lerp(b.sy, 40, u * u) + Math.sin(u * 9) * 2 * (1 - u);
    if (u >= 1) { b.state = 'perch'; b.t = 0; if (chance(0.6)) Snd.chirp(); }
  } else if (b.state === 'perch') {
    b.x = b.px + b.hop; b.y = 40;
    b.look = Math.sin(b.t * 0.9) > 0 ? 1 : -1;
    if (chance(dt * 0.6)) b.hop = clamp(b.hop + rint(-4, 4), -12, 12);
    if (chance(dt * 0.3)) Snd.chirp();
    if (b.t > b.stay) { b.state = 'out'; b.t = 0; b.sx = b.x; b.sy = b.y; b.dir = chance(0.5) ? -1 : 1; }
  } else {
    const u = b.t / 1.2;
    b.x = b.sx + b.dir * u * 60; b.y = b.sy - u * 26 + Math.sin(u * 8);
    if (u >= 1) { Room.bird = null; Room.nextBird = rnd(40, 90); }
  }
}
const birdPresent = () => !!Room.bird && Room.bird.state !== 'out';
const birdWorld = () => (Room.bird ? { x: Room.bird.x + Room.ox, y: Room.bird.y + Room.oy } : null);

function updateFly(dt) {
  const f = Room.fly;
  if (!f) {
    Room.nextFly -= dt;
    if (Room.nextFly <= 0) {
      Room.fly = { t: 0, life: rnd(18, 32), seed: rnd(100), cx: rnd(60, W - 60), cy: rnd(60, GY_MAX - 40), x: 0, y: 0 };
      Room.nextFly = rnd(80, 150);
    }
    return;
  }
  f.t += dt;
  f.cx += Math.sin(f.t * 0.37 + f.seed) * 10 * dt;
  f.cy += Math.cos(f.t * 0.29 + f.seed) * 8 * dt;
  f.cx = clamp(f.cx, 24, W - 24); f.cy = clamp(f.cy, 40, GY_MAX - 20);
  f.x = f.cx + Math.sin(f.t * 1.9 + f.seed) * 22 + Math.sin(f.t * 5.3) * 5;
  f.y = f.cy + Math.sin(f.t * 2.4 + f.seed * 2) * 12 + Math.cos(f.t * 6.1) * 3;
  if (f.t > f.life) Room.fly = null;
}

/* ---------- per-frame ---------- */
function updateRoom(dt) {
  Room.t += dt;
  Room.dayT = Room.devDay !== undefined ? Room.devDay : dayTFromClock(new Date());
  if (Room.bowl.food > 0) Room.bowl.food = Math.max(0, Room.bowl.food - dt * 0.004);
  for (const m of Room.messes) m.age += dt;
  updateParts(dt);
  updateBird(dt);
  updateFly(dt);
  if (Room.emote) { Room.emote.t += dt; if (Room.emote.t > Room.emote.dur) Room.emote = null; }
  Desk.visT -= dt;
  if (Desk.visT <= 0) { Desk.visT = 0.5; refreshVisible(); }

  for (const m of Room.messes) {
    const top = m.where === 'box' ? Room.box.by - 8 : m.gy - 8;
    if (m.kind === 'poop' && m.age < 10 && chance(dt * 3)) spawn('steam', m.x + rnd(-2, 2), top, { vy: -8, vx: rnd(-2, 2), life: 1.2 });
  }
  let dirt = 0;
  for (const m of Room.messes) dirt += Math.min(34, 16 + m.age * (m.where === 'box' ? 0.08 : 0.16)) * (m.where === 'box' ? 0.7 : 1);
  Room.clean = lerp(Room.clean, clamp(100 - dirt, 0, 100), smooth(0.8, dt));

  // cursor speed
  const c = Desk.cursor;
  const sp = Math.hypot(c.x - c.px, c.y - c.py) / Math.max(dt, 0.001);
  c.speed = lerp(c.speed, sp, 0.3);
  c.px = c.x; c.py = c.y;
  if (c.speed < 6) c.idle += dt; else c.idle = 0;
}
