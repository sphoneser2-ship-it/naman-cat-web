'use strict';
/* ============ constants & helpers ============ */
// logical (pixel-art) world size. One logical pixel = S_PX screen pixels.
let S_PX = 3;
let W = 640, H = 360;
let GY_MIN = 30, GY_MAX = 330;     // where the cat's feet may stand
const ROOM_W = 192, ROOM_H = 120, ROOM_FLOOR_TOP = 66;

const rnd = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const chance = p => Math.random() < p;
const ease = t => t * t * (3 - 2 * t);
const approach = (v, t, d) => (v < t ? Math.min(t, v + d) : Math.max(t, v - d));
const smooth = (rate, dt) => 1 - Math.exp(-rate * dt);
const sgn = v => (v < 0 ? -1 : 1);

let DT = 0.016;      // current frame delta (seconds)
let NOW = 0;         // game clock (seconds)

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function wchoose(items) {
  let tot = 0;
  for (const i of items) tot += Math.max(0, i.w);
  if (tot <= 0) return items[0].k;
  let r = Math.random() * tot;
  for (const i of items) {
    r -= Math.max(0, i.w);
    if (r <= 0) return i.k;
  }
  return items[items.length - 1].k;
}

function hexRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbHex(r, g, b) {
  const t = v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0');
  return '#' + t(r) + t(g) + t(b);
}
function mixHex(a, b, t) {
  const A = hexRgb(a), B = hexRgb(b);
  return rgbHex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t));
}
// packed little-endian RGBA (for ImageData Uint32 views)
function packC(h, a = 255) {
  const [r, g, b] = hexRgb(h);
  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
}

// keyframe interpolation: keys = [[t, value], ...] sorted by t
function keyLerp(keys, t, mixer) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const a = keys[i - 1], b = keys[i];
      return mixer(a[1], b[1], (t - a[0]) / (b[0] - a[0]));
    }
  }
  return keys[keys.length - 1][1];
}

// the desktop app keeps everything in its own save file (written by the main process); the browser preview uses localStorage
const store = (() => {
  const H = window.catdesk && window.catdesk.store;
  const local = {
    get(k, d) { try { const v = localStorage.getItem('catdesk.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('catdesk.' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
    del(k) { try { localStorage.removeItem('catdesk.' + k); } catch (e) { /* ignore */ } }
  };
  if (!H) return local;
  let cache = null;
  try { cache = H.all(); } catch (e) { cache = null; }
  if (!cache) {      // first start with the save file: take over what the old storage held
    cache = {};
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf('catdesk.') === 0) cache[k.slice(8)] = localStorage.getItem(k); } } catch (e) { /* none */ }
    try { H.init(cache); } catch (e) { /* ignore */ }
  }
  return {
    get(k, d) { const v = cache[k]; if (v === undefined || v === null) return d; try { return JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { const s = JSON.stringify(v); cache[k] = s; try { H.set(k, s); } catch (e) { /* ignore */ } },
    del(k) { delete cache[k]; try { H.del(k); } catch (e) { /* ignore */ } }
  };
})();
