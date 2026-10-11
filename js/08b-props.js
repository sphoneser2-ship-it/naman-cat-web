/* ============ props & toys, drawn on the same fine pixel grid as the cat ============
   Everything here works in "art pixels": SS art pixels = 1 world pixel. inArt() moves the origin to a
   world position and switches to that finer grid, y grows downward (negative = up).                  */
const PO = '#4a3158';                       // shared outline colour
function A(c, col, x, y, w, h) { c.fillStyle = col; c.fillRect(x, y, w, h); }
function boxO(c, x, y, w, h, fill) { A(c, PO, x - 1, y - 1, w + 2, h + 2); A(c, fill, x, y, w, h); }
function aEll(c, col, cx, cy, rx, ry) {
  c.fillStyle = col;
  const r = Math.floor(ry);
  for (let dy = -r; dy <= r; dy++) {
    const t = dy / (ry + 0.5), hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - t * t)));
    c.fillRect(cx - hw, cy + dy, hw * 2 + 1, 1);
  }
}
function aEllO(c, fill, cx, cy, rx, ry) { aEll(c, PO, cx, cy, rx + 1, ry + 1); aEll(c, fill, cx, cy, rx, ry); }
function aLine(c, col, x0, y0, x1, y1, t = 1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy, g = 0;
  c.fillStyle = col;
  const h = Math.floor(t / 2);
  for (;;) {
    c.fillRect(x0 - h, y0 - h, t, t);
    if ((x0 === x1 && y0 === y1) || ++g > 600) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
}
/* Props are drawn on the art grid into a small scratch canvas, cleaned up (Scale2x, twice) and then drawn with filtering,
   exactly like the cat, so they stay crisp in shape but never look uneven at a fractional screen scale.
   spec = { w, h, ox, oy [, key] }: the scratch size in art px, where the origin sits in it, and (for pictures that do not change)
   a cache key. Without a spec the old direct drawing is used. */
const PSK = 4;
const pScratch = {}, pCache = new Map();
function pScratchFor(w, h) {
  const k = w + 'x' + h;
  let s = pScratch[k];
  if (!s) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const out = document.createElement('canvas'); out.width = w * PSK; out.height = h * PSK;
    const oc = out.getContext('2d'), oi = oc.createImageData(w * PSK, h * PSK);
    s = pScratch[k] = { cx: cv.getContext('2d', { willReadFrequently: true }), out, oc, oi, ob: new Uint32Array(oi.data.buffer), mid: new Uint32Array(w * 2 * h * 2) };
  }
  return s;
}
function smoothArt(spec, fn) {
  if (spec.key !== undefined) { const hit = pCache.get(spec.key); if (hit) return hit; }
  const w = spec.w, h = spec.h, s = pScratchFor(w, h), g = s.cx;
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.clearRect(0, 0, w, h);
  g.save(); g.translate(spec.ox, spec.oy); fn(g); g.restore();
  const src = new Uint32Array(g.getImageData(0, 0, w, h).data.buffer);
  if (window.__PDBG) {         // test aid: a picture that touches the edge of its scratch canvas is being cut off
    let bad = 0;
    for (let x = 0; x < w; x++) if (src[x] || src[(h - 1) * w + x]) bad++;
    for (let y = 0; y < h; y++) if (src[y * w] || src[y * w + w - 1]) bad++;
    if (bad) { (window.__PBAD = window.__PBAD || {})[spec.name || spec.key] = bad; }
  }
  s.mid.fill(0); s.ob.fill(0);
  scale2xInto(src, w, h, s.mid, 0, 0, w - 1, h - 1);
  scale2xInto(s.mid, w * 2, h * 2, s.ob, 0, 0, w * 2 - 1, h * 2 - 1);
  s.oc.putImageData(s.oi, 0, 0);
  if (spec.key !== undefined) {
    const keep = document.createElement('canvas'); keep.width = w * PSK; keep.height = h * PSK;
    keep.getContext('2d').drawImage(s.out, 0, 0);
    if (pCache.size > 200) pCache.clear();
    pCache.set(spec.key, keep);
    return keep;
  }
  return s.out;
}
function inArt(c, x, y, fn, spec) {
  const ax = Math.round(x * SS), ay = Math.round(y * SS);
  if (spec && smOk) {
    const big = smoothArt(spec, fn);
    c.save();
    c.scale(1 / (SS * PSK), 1 / (SS * PSK));
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.drawImage(big, (ax - spec.ox) * PSK, (ay - spec.oy) * PSK);
    c.restore();
    return;
  }
  c.save();
  c.scale(1 / SS, 1 / SS);
  c.translate(ax, ay);
  fn(c);
  c.restore();
}
// picture sizes of the props (art px): scratch width / height and the position of the origin inside it
const PSPEC = {
  shadowS: { w: 34, h: 12, ox: 17, oy: 5, name: 'shadowS' },
  toy: { w: 48, h: 40, ox: 24, oy: 32, name: 'toy' },
  post: { w: 44, h: 100, ox: 22, oy: 92, name: 'post' },
  box: { w: 76, h: 30, ox: 38, oy: 26, name: 'box' },
  bowl: { w: 36, h: 24, ox: 18, oy: 19, name: 'bowl' },
  cushion: { w: 68, h: 28, ox: 34, oy: 22, name: 'cushion' },
  mess: { w: 44, h: 64, ox: 22, oy: 52, name: 'mess' },
  ball: { w: 30, h: 28, ox: 15, oy: 22, name: 'ball' },
  mouse: { w: 40, h: 28, ox: 22, oy: 24, name: 'mouse' },
  nip: { w: 32, h: 32, ox: 16, oy: 26, name: 'nip' },
  brush: { w: 44, h: 40, ox: 16, oy: 34, name: 'brush' },
  gift: { w: 40, h: 36, ox: 20, oy: 30, name: 'gift' },
  present: { w: 44, h: 40, ox: 22, oy: 32, name: 'present' },
  carry: { w: 34, h: 34, ox: 17, oy: 26, name: 'carry' },
  furn: {
    shadow: { w: 112, h: 14, ox: 56, oy: 6 },
    cardbox: { w: 60, h: 50, ox: 30, oy: 44 }, tower: { w: 56, h: 96, ox: 28, oy: 90 },
    grass: { w: 26, h: 44, ox: 13, oy: 36 }, hammock: { w: 92, h: 52, ox: 46, oy: 46 }, tent: { w: 124, h: 80, ox: 62, oy: 74 }
  }
};
function ellRects(cx, cy, rx, ry, col) {
  const out = [], r = Math.floor(ry);
  for (let dy = -r; dy <= r; dy++) {
    const t = dy / (ry + 0.5), hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - t * t)));
    out.push([cx - hw, cy + dy, hw * 2 + 1, 1, col]);
  }
  return out;
}
function propShadow(c, x, gy, w) {
  const hw = Math.ceil(w * SS) + 3; inArt(c, x, gy, g => { aEll(g, 'rgba(30,20,50,0.20)', 0, 1, w * SS, 3); }, { w: hw * 2 + 2, h: 12, ox: hw + 1, oy: 5, key: 'psh' + w, name: 'psh' });
}

/* ---------- scratching post ---------- */
function drawPost(c) {
  const { x, gy } = Room.post;
  inArt(c, x, gy, g => {
    boxO(g, -14, -6, 28, 6, '#a67447'); A(g, '#cf9c68', -13, -5, 26, 1); A(g, '#7d5330', -13, -1, 26, 1);
    boxO(g, -5, -72, 10, 67, '#e6cb9c');
    for (let y = -70; y < -6; y += 4) { A(g, '#c9a972', -5, y, 10, 1); A(g, '#d8bb88', -5 + ((y / 4) & 1 ? 4 : 0), y + 2, 4, 1); }
    A(g, '#f8e8c6', -4, -71, 2, 64); A(g, '#b79660', 3, -71, 2, 64);
    boxO(g, -12, -80, 24, 8, '#a67447'); A(g, '#cf9c68', -11, -79, 22, 1);
    boxO(g, -11, -83, 22, 3, '#e8909a'); A(g, '#f6bcc6', -10, -82, 20, 1);
    const sw = Math.round(Math.sin(Room.t * 2) * 1.6);
    A(g, '#ffffff', 9, -72, 1, 13);
    aEllO(g, '#ff8fb1', 9 + sw, -56, 3, 3); A(g, '#ffd0de', 8 + sw, -58, 2, 2);
  }, { ...PSPEC.post, key: 'post:' + Math.round(Math.sin(Room.t * 2) * 1.6) });
}

/* ---------- litter box ---------- */
const POOP_HI = mkOutlined(16, 13, [
  ...ellRects(8, 10, 7, 2.5, '#6e4020'), ...ellRects(8, 7, 5.5, 2.5, '#7f4a25'), ...ellRects(8, 3.5, 3.5, 2.5, '#8d5a2e'),
  [5, 9, 3, 1, '#b07a44'], [6, 5, 2, 1, '#b07a44'], [6, 2, 2, 1, '#c8935a'], [8, 0, 1, 1, '#8d5a2e']
], '#2e1a0c');
const POOP_SM = mkOutlined(10, 8, [
  ...ellRects(5, 6, 4, 1.5, '#6e4020'), ...ellRects(5, 3.5, 3, 1.5, '#7f4a25'), ...ellRects(5, 1.5, 1.5, 1.5, '#8d5a2e'),
  [3, 5, 2, 1, '#b07a44'], [4, 2, 1, 1, '#c8935a']
], '#2e1a0c');
const HAIR_HI = mkOutlined(14, 8, [
  ...ellRects(7, 4, 6, 3, '#a79fae'), [2, 2, 3, 1, '#7c7484'], [6, 5, 4, 1, '#7c7484'], [9, 3, 3, 1, '#c8c0cf'], [0, 4, 2, 1, '#a79fae'], [12, 3, 2, 1, '#a79fae']
], '#4a4350');

// a three-tier swirl drawn with outlined ellipses (the old pixel sprite looked like a cup with handles once smoothed)
function drawPoop(g, ox, oy, k) {
  const e = (cy, rx, ry, col) => aEllO(g, col, ox, oy + Math.round(cy * k), Math.max(1, Math.round(rx * k)), Math.max(1, Math.round(ry * k)));
  e(-3, 8, 3, '#6e4020');
  e(-7, 6, 2.6, '#7f4a25');
  e(-10.5, 3.8, 2.2, '#8d5a2e');
  A(g, PO, ox - 1, oy + Math.round(-15 * k), 3, Math.max(2, Math.round(3 * k))); A(g, '#8d5a2e', ox, oy + Math.round(-14 * k), 1, Math.max(1, Math.round(2 * k)));
  A(g, '#b07a44', ox - Math.round(5 * k), oy + Math.round(-4 * k), Math.max(1, Math.round(3 * k)), 1);
  A(g, '#b07a44', ox - Math.round(3 * k), oy + Math.round(-8 * k), Math.max(1, Math.round(2 * k)), 1);
  A(g, '#c8935a', ox - Math.round(2 * k), oy + Math.round(-11 * k), 1, 1);
}

function drawBoxBack(c) {
  const { x, by } = Room.box, P = skinOf('litter');
  inArt(c, x, by, g => {
    boxO(g, -34, -22, 68, 22, P.body);
    A(g, P.rim, -33, -21, 66, 2);                   // back rim
    A(g, P.mid, -33, -19, 66, 3);
    A(g, '#efd9a0', -30, -16, 60, 5);                   // sand
    A(g, '#f6e8bd', -29, -16, 58, 1);
    for (let i = 0; i < 16; i++) A(g, i % 3 ? '#d9c07f' : '#f8edc9', -28 + ((i * 11) % 56), -15 + (i % 4), 1, 1);
    A(g, P.dark, -34, -22, 3, 22); A(g, P.dark, 31, -22, 3, 22);
    for (const m of boxMesses()) drawPoop(g, Math.round((m.x - x) * SS), -12, 0.62);
  }, { ...PSPEC.box, key: 'boxB:' + Skin.litter + ':' + boxMesses().map(m => Math.round((m.x - x) * SS)).join(',') });
}
function drawBoxFront(c) {
  const { x, by } = Room.box, P = skinOf('litter');
  inArt(c, x, by, g => {
    boxO(g, -34, -12, 68, 12, P.body);
    A(g, P.rim, -33, -11, 66, 2);                   // front rim
    A(g, P.mid, -33, -9, 66, 2);
    A(g, P.dark, -33, -3, 66, 3);
    A(g, P.hi, -30, -7, 12, 2);
    // little paw print on the front
    A(g, P.motif, -2, -7, 4, 3); A(g, P.motif, -5, -9, 2, 2); A(g, P.motif, -1, -10, 2, 2); A(g, P.motif, 3, -9, 2, 2);
  }, { ...PSPEC.box, key: 'boxF:' + Skin.litter });
}

/* ---------- bowls ---------- */
const KIBBLE = [];
(function () {
  for (let lvl = 0; lvl < 7; lvl++) {
    const half = 11 - lvl * 1.6, n = Math.max(1, Math.floor((half * 2) / 3.2));
    for (let i = 0; i < n; i++) KIBBLE.push({ x: Math.round(-half + (i + 0.5) * (half * 2) / n + ((lvl * 7 + i * 5) % 3 - 1)), y: -10 - lvl * 2 - ((i + lvl) % 2), v: (lvl + i) % 3 });
  }
})();
function bowlArt(g, body, light, shade, inside, food, pawCol, motif = 'paw') {
  aEllO(g, light, 0, -10, 14, 4);
  aEll(g, inside, 0, -10, 12, 3);
  // body
  for (let y = -9; y <= -1; y++) {
    const w = Math.round(14 - (y + 9) * 0.55);
    A(g, PO, -w - 1, y, 1, 1); A(g, PO, w, y, 1, 1);
    A(g, body, -w, y, w * 2, 1);
    A(g, light, -w, y, 3, 1); A(g, shade, w - 4, y, 4, 1);
  }
  A(g, PO, -10, 0, 20, 1); A(g, shade, -9, -2, 18, 2);
  bowlMotif(g, motif, pawCol);
  if (food > 0) {
    const k = Math.min(KIBBLE.length, Math.ceil(food / 100 * KIBBLE.length));
    for (let i = 0; i < k; i++) {
      const p = KIBBLE[i];
      A(g, '#5a3014', p.x - 1, p.y - 1, 5, 4);
      A(g, '#a8632e', p.x, p.y, 3, 2); A(g, p.v === 1 ? '#e0a45c' : '#c98a4b', p.x, p.y, 2, 1);
    }
  }
}
function drawBowl(c) {
  const { x, gy, food } = Room.bowl, P = skinOf('bowl');
  inArt(c, x, gy, g => bowlArt(g, P.body, P.light, P.shade, P.inside, food, P.decal, P.motif), { ...PSPEC.bowl, key: 'bowl:' + Skin.bowl + ':' + (food > 0 ? Math.min(KIBBLE.length, Math.ceil(food / 100 * KIBBLE.length)) : 0) });
}
function drawWater(c) {
  const { x, gy } = Room.water, P = skinOf('water');
  inArt(c, x, gy, g => {
    bowlArt(g, P.body, P.light, P.shade, P.inside, 0, P.decal, P.motif);
    aEll(g, P.water, 0, -10, 11, 2);
    A(g, '#ffffff', -4 + Math.round(Math.sin(Room.t * 1.5) * 3), -11, 3, 1);
  }, { ...PSPEC.bowl, key: 'water:' + Skin.water + ':' + Math.round(Math.sin(Room.t * 1.5) * 3) });
}

/* ---------- cushion ---------- */
function drawCushion(c) {
  const { x, gy } = Room.cushion, P = skinOf('bed');
  inArt(c, x, gy, g => {
    aEllO(g, P.a, 0, -6, 30, 7);
    aEllO(g, P.b, 0, -9, 29, 7);
    aEll(g, P.c, -2, -11, 20, 4);
    // stitching
    g.fillStyle = P.st;
    for (let a = 0; a < 28; a++) { const t = a / 28 * Math.PI * 2; g.fillRect(Math.round(Math.cos(t) * 24), Math.round(-9 + Math.sin(t) * 5), 2, 1); }
    if (P.motif === 'heart') { A(g, '#ffffff', -5, -13, 4, 3); A(g, '#ffffff', 1, -13, 4, 3); A(g, '#ffffff', -4, -11, 8, 2); A(g, '#ffffff', -2, -9, 4, 1); }
    else if (P.motif === 'seeds') { for (const [sx, sy] of [[-16, -9], [-8, -13], [0, -8], [8, -13], [15, -9], [-4, -12], [11, -11]]) A(g, P.seed || '#ffe98a', sx, sy, 2, 2); }
    else if (P.motif === 'paw') { A(g, '#ffffff', -2, -12, 4, 3); A(g, '#ffffff', -5, -13, 2, 2); A(g, '#ffffff', -1, -14, 2, 2); A(g, '#ffffff', 3, -13, 2, 2); }
    else if (P.motif === 'flower') { A(g, '#ffffff', -1, -15, 2, 2); A(g, '#ffffff', -1, -11, 2, 2); A(g, '#ffffff', -3, -13, 2, 2); A(g, '#ffffff', 1, -13, 2, 2); A(g, '#ffd04a', -1, -13, 2, 2); }
    else if (P.motif === 'star') { for (const [sx, sy] of [[-12, -12], [-3, -14], [7, -11], [13, -9], [-8, -8]]) { A(g, '#ffe98a', sx, sy, 1, 3); A(g, '#ffe98a', sx - 1, sy + 1, 3, 1); } }
    else if (P.motif === 'check') { for (let gx = -13; gx <= 9; gx += 4) for (let gy2 = -13; gy2 <= -9; gy2 += 3) if ((((gx + 13) / 4) + ((gy2 + 13) / 3)) % 2 === 0) A(g, '#ffffff', gx, gy2, 3, 2); }
    else if (P.motif === 'stripe') { for (let sx = -15; sx <= 13; sx += 4) A(g, '#ffffff', sx, -14, 2, 5); }
    else if (P.motif === 'moon') { A(g, '#ffe36a', -9, -14, 6, 6); A(g, P.b, -7, -15, 5, 6); A(g, '#ffe36a', 8, -12, 2, 2); A(g, '#ffe36a', 13, -9, 2, 2); }
    else if (P.motif === 'cloud') { aEll(g, '#ffffff', -4, -11, 6, 2); aEll(g, '#ffffff', 4, -12, 5, 3); }
    else { aEllO(g, P.a, 0, -10, 3, 2); A(g, P.c, -1, -11, 2, 1); }
  }, { ...PSPEC.cushion, key: 'bed:' + Skin.bed });
}

/* ---------- messes ---------- */
function drawMess(c, m) {
  if (m.where === 'box') return;      // drawn inside the box
  inArt(c, m.x, m.gy, g => {
    if (m.kind === 'hairball') { g.drawImage(HAIR_HI, -8, -9); return; }
    drawPoop(g, 0, 0, 1);
    if (m.age > 22) {
      const a = Math.min(0.9, (m.age - 22) / 25);
      g.fillStyle = `rgba(150,200,70,${a})`;
      for (let i = 0; i < 3; i++) {
        const ph = Room.t * 3 + i * 2;
        for (let k = 0; k < 9; k++) g.fillRect(-8 + i * 8 + Math.round(Math.sin(ph + k * 0.7) * 1.5), -20 - k * 3, 2, 2);
      }
    }
    if (m.age > 70) {
      g.fillStyle = '#2a2230';
      for (let i = 0; i < 2; i++) {
        const t = Room.t * 6 + m.fly + i * 3.1;
        g.fillRect(Math.round(Math.cos(t) * 14), Math.round(-20 + Math.sin(t * 1.3) * 6), 2, 2);
      }
    }
  }, PSPEC.mess);
}

/* ---------- yarn ball ---------- */
function drawBall(c) {
  const b = Room.ball;
  if (!b) return;
  // a toy in the mouth follows the mouth every frame (and is drawn in front of the face)
  if (b.carried && !b.ptrHeld && cat.visible) { const mg = mouthGrip(); b.face = cat.dir; placeToyAt(b, mg.x, mg.up, true); b.gy = cat.gy + 0.4; b.z -= 0.4; }
  if (b.kind === 'mouse') { drawMouseToy(c, b); return; }
  if (drawToy(c, b)) return;
  const lift = Math.min(1, b.z / 30);
  inArt(c, b.x, b.gy, g => aEll(g, `rgba(30,20,50,${0.22 - lift * 0.1})`, 0, 1, 7 - lift * 2, 2), PSPEC.shadowS);
  inArt(c, b.x, b.gy - b.z, g => {
    const cy = -8;
    aEllO(g, '#ff7aa6', 0, cy, 6, 6);
    aEll(g, '#ffa6c4', -1, cy - 1, 4, 4);
    g.fillStyle = '#d95a82';
    for (let s = 0; s < 3; s++) {
      const ang = b.rot + s * 1.05;
      for (let u = -1; u <= 1.001; u += 0.12) {
        const px = 5.2 * u, py = 2.2 * Math.sin(u * Math.PI);
        g.fillRect(Math.round(px * Math.cos(ang) - py * Math.sin(ang)), Math.round(cy + px * Math.sin(ang) + py * Math.cos(ang)), 1, 1);
      }
    }
    A(g, '#ffe4ee', -3, cy - 4, 2, 2);
    g.fillStyle = '#ff7aa6'; g.fillRect(5, cy + 3, 3, 1); g.fillRect(7, cy + 4, 2, 1);   // loose thread
  }, PSPEC.ball);
}

/* ---------- toys ---------- */
const FEATHER_HI = mkOutlined(9, 17, [
  [4, 0, 2, 17, '#e9b44c'],
  [1, 1, 3, 6, '#ff8fb1'], [5, 1, 3, 6, '#ff8fb1'], [0, 5, 4, 7, '#7be0c3'], [5, 5, 4, 7, '#7be0c3'], [1, 11, 3, 4, '#ffd36e'], [5, 11, 3, 4, '#ffd36e'],
  [2, 2, 1, 3, '#ffc2d6'], [6, 7, 1, 3, '#b8f4e4']
], PO);
function drawWand(c) {
  const T = Toy.wand;
  if (!T.active) return;
  const C = Desk.cursor;
  const rx = (C.x + 26) * SS, ry = (C.y - 40) * SS, fx = T.x * SS, fy = T.y * SS;
  c.save(); c.scale(1 / SS, 1 / SS);
  aLine(c, PO, rx + 36, ry - 40, rx, ry, 6); aLine(c, '#b07a48', rx + 36, ry - 40, rx, ry, 4); aLine(c, '#d4a06a', rx + 34, ry - 41, rx + 2, ry - 1, 1);
  const mx = (rx + fx) / 2, my = Math.max(ry, fy) + 12;
  let px = rx, py = ry;
  for (let i = 1; i <= 18; i++) {
    const t = i / 18, qx = (1 - t) * (1 - t) * rx + 2 * (1 - t) * t * mx + t * t * fx, qy = (1 - t) * (1 - t) * ry + 2 * (1 - t) * t * my + t * t * (fy - 8);
    aLine(c, 'rgba(255,255,255,0.9)', px, py, qx, qy, 1);
    px = qx; py = qy;
  }
  if (T.caught) { const h = cat.headAbs; c.drawImage(FEATHER_HI, Math.round((h.x + cat.dir * 5) * SS - 4), Math.round((h.y + 2) * SS)); }
  else c.drawImage(FEATHER_HI, Math.round(fx - 4), Math.round(fy - 8));
  c.restore();
}
function drawLaser(c) {
  const L = Toy.laser;
  if (!L.active) return;
  c.save(); c.scale(1 / SS, 1 / SS);
  const x = Math.round(L.x * SS), y = Math.round(L.y * SS);
  aEll(c, 'rgba(255,60,70,0.22)', x, y, 6, 6);
  aEll(c, 'rgba(255,60,70,0.4)', x, y, 4, 4);
  aEll(c, '#ff2a3a', x, y, 2, 2);
  A(c, '#ffd0d0', x - 1, y - 1, 1, 1);
  c.restore();
}
function drawChuru(c) {
  const C = Interact.churu;
  if (!C) return;
  const bob = Math.sin(C.t * 5) * 1.2;
  c.save(); c.scale(1 / SS, 1 / SS);
  const x = C.x * SS, y = (C.y + bob) * SS;
  aLine(c, PO, x + 4, y - 3, x + 30, y - 29, 9);
  aLine(c, '#ff8fb1', x + 4, y - 3, x + 30, y - 29, 7);
  aLine(c, '#ffc2d6', x + 6, y - 6, x + 26, y - 26, 1);
  aLine(c, '#ffd36e', x + 24, y - 23, x + 31, y - 30, 7);
  aLine(c, PO, x + 20, y - 19, x + 24, y - 23, 2);
  aEllO(c, '#ffb347', Math.round(x - 1), Math.round(y), 3, 2);
  A(c, '#ffe0a0', Math.round(x - 2), Math.round(y - 1), 2, 1);
  c.restore();
}
const SCOOP_HI = mkOutlined(20, 20, [[14, 0, 4, 4, '#b07a48'], [11, 4, 4, 4, '#b07a48'], [8, 8, 4, 4, '#b07a48'],
  [1, 12, 11, 6, '#9fb2d6'], [0, 17, 13, 3, '#7f94bd'], [3, 13, 2, 2, '#4a5d86'], [7, 13, 2, 2, '#4a5d86'], [5, 16, 2, 2, '#4a5d86']], PO);
function drawScoop(c) {
  const s = Interact.scoop;
  if (!s) return;
  const u = s.t / 0.4;
  c.save(); c.scale(1 / SS, 1 / SS);
  c.globalAlpha = 1 - u * u;
  c.drawImage(SCOOP_HI, Math.round(s.x * SS - 8 + u * 12), Math.round(s.y * SS - 20 + Math.sin(u * Math.PI) * -6));
  c.restore();
}
