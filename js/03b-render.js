/* ============ cat rasteriser: chubby chibi cat, drawn at 2x resolution ============
   cat space: x forward, y up, origin at the feet, units = art pixels (SS art pixels = 1 world pixel) */
const SS = 2;
const SW = 170, SH = 150, OX = 85, OY = 128;
const spr = new Uint32Array(SW * SH);
const lay = new Uint32Array(SW * SH);
const sCanvas = document.createElement('canvas');
sCanvas.width = SW; sCanvas.height = SH;
const sCtx = sCanvas.getContext('2d');
const sImg = sCtx.createImageData(SW, SH);
const sBuf = new Uint32Array(sImg.data.buffer);

let FY = null;      // when set, everything is mirrored top-to-bottom around this y (upside-down head)
function pL(x, y, c) {
  if (FY !== null) y = 2 * FY - y;
  x = OX + Math.round(x); y = OY - Math.round(y);
  if (x < 0 || y < 0 || x >= SW || y >= SH) return;
  lay[y * SW + x] = c;
}
function pS(x, y, c) {
  if (FY !== null) y = 2 * FY - y;
  x = OX + Math.round(x); y = OY - Math.round(y);
  if (x < 0 || y < 0 || x >= SW || y >= SH) return;
  spr[y * SW + x] = c;
}
function rL(x, y, w, h, c) {
  x = Math.round(x); y = Math.round(y);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) pL(x + i, y + j, c);
}
function eLf(cx, cy, rx, ry, fn) {
  cx = Math.round(cx); cy = Math.round(cy);
  const ryi = Math.floor(ry);
  for (let y = -ryi; y <= ryi; y++) {
    const t = y / (ry + 0.5);
    const hw = Math.floor((rx + 0.5) * Math.sqrt(Math.max(0, 1 - t * t)));
    for (let x = -hw; x <= hw; x++) pL(cx + x, cy + y, fn(x, y));
  }
}
function eL(cx, cy, rx, ry, c) { eLf(cx, cy, rx, ry, () => c); }
function lL(x0, y0, x1, y1, t, c) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy, guard = 0;
  const h = Math.floor(t / 2);
  for (;;) {
    // round brush: a square with trimmed corners
    rL(x0 - h, y0 - h, t, t, typeof c === 'function' ? c(x0, y0) : c);
    if ((x0 === x1 && y0 === y1) || ++guard > 300) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
}
// same line with a round brush (used for the tail tip)
function lLround(x0, y0, x1, y1, t, c) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0))), r = Math.max(1.5, t / 2 - 0.5);
  for (let i = 0; i <= n; i++) eL(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, r, r, c);
}
function flush(outline) {
  for (let y = 0; y < SH; y++) {
    for (let x = 0; x < SW; x++) {
      const i = y * SW + x;
      if (lay[i] === 0) {
        if ((x > 0 && lay[i - 1]) || (x < SW - 1 && lay[i + 1]) || (y > 0 && lay[i - SW]) || (y < SH - 1 && lay[i + SW])) spr[i] = outline;
      }
    }
  }
  for (let i = 0; i < lay.length; i++) if (lay[i]) { spr[i] = lay[i]; lay[i] = 0; }
}

// dark outline pixels that ended up inside the body (a notch between haunch, tail and back) become a soft line instead of a black one
function softenInner(outline, soft) {
  const hit = [];
  for (let y = 1; y < SH - 1; y++) for (let x = 1; x < SW - 1; x++) {
    const i = y * SW + x;
    if (spr[i] === outline && spr[i - 1] && spr[i + 1] && spr[i - SW] && spr[i + SW]) hit.push(i);
  }
  for (const i of hit) spr[i] = soft;
}

// outline whose colour depends on what it touches: dark against empty space, soft against the body
function flush2(outer, inner) {
  for (let y = 0; y < SH; y++) {
    for (let x = 0; x < SW; x++) {
      const i = y * SW + x;
      if (lay[i] === 0 && ((x > 0 && lay[i - 1]) || (x < SW - 1 && lay[i + 1]) || (y > 0 && lay[i - SW]) || (y < SH - 1 && lay[i + SW]))) {
        if (spr[i] === 0) spr[i] = outer; else if (spr[i] !== outer || !touchesEmpty(i)) spr[i] = inner;
      }
    }
  }
  for (let i = 0; i < lay.length; i++) if (lay[i]) { spr[i] = lay[i]; lay[i] = 0; }
}
function touchesEmpty(i) {
  const x = i % SW, y = (i / SW) | 0;
  return (x > 0 && !spr[i - 1]) || (x < SW - 1 && !spr[i + 1]) || (y > 0 && !spr[i - SW]) || (y < SH - 1 && !spr[i + SW]);
}

/* ---------- ears: rounded triangles ---------- */
const FOLD_ROWS = [[1, 9, 9], [2, 10, 9], [4, 10, 7], [6, 10, 5], [8, 10, 3]];
function earRows(state, kind, k = 1) {
  // k: head size (a kitten's head is smaller, so its ears must shrink with it or they stick out past the head)
  if (kind === 'fold') return k >= 0.999 ? FOLD_ROWS : FOLD_ROWS.map(r => { const x0 = Math.round(r[0] * k), x1 = Math.max(x0, Math.round(r[1] * k)); return [x0, x1, x1 - x0 + 1]; });
  // returns { rows:[[x0,x1],...], near:true } offsets relative to head centre x, and y offset from head centre
  let o = { normal: { bw: 9, eh: 8, c: 5.5, lean: 1.5 }, fwd: { bw: 9, eh: 8, c: 5.5, lean: 4 }, back: { bw: 9, eh: 8, c: 5.5, lean: -3 }, flat: { bw: 11, eh: 4, c: 8.5, lean: 4 } }[state] || { bw: 9, eh: 8, c: 5.5, lean: 1.5 };
  if (kind === 'big') o = Object.assign({}, o, { bw: 11, eh: o.eh + 3, c: 6 });
  if (kind === 'small') o = Object.assign({}, o, { bw: 7, eh: Math.max(3, o.eh - 2), c: 5.5 });
  if (k < 0.999) o = { bw: Math.max(4, Math.round(o.bw * k)), eh: Math.max(4, Math.round(o.eh * k)), c: o.c * k, lean: o.lean * k };
  const rows = [];
  for (let i = 0; i < o.eh; i++) {
    const w = Math.max(3, o.bw - Math.round(i * (o.bw - 3) / (o.eh - 1)));
    const c = o.c + o.lean * i / (o.eh - 1);
    rows.push([Math.round(c - w / 2), Math.round(c + w / 2) - 1, w]);
  }
  if (kind === 'tuft') {            // lynx tips
    const last = rows[rows.length - 1], ctr = Math.round((last[0] + last[1]) / 2);
    for (let t = 1; t <= 3; t++) rows.push([ctr, ctr + 1, 2, true]);
  }
  return rows;
}

function drawTail(R, F, K, S, tm) {
  let x = R.hx + R.trx, y = R.hy + R.try;
  const B = K.breed || BREEDS.ksh;
  const N = B.tailN || 7, len = 3.4 * (K.kb || 1), th = (B.tail || 5) + (F.puff ? 2 : 0);
  for (let i = 0; i < N; i++) {
    const w = Math.sin(tm * R.tSpd - i * 0.6) * R.tWave * ((i + 1) / N);
    const a = (R.tAng + R.tCurl * i + w + S.tailFlick * (i / N)) * Math.PI / 180;
    const nx = x + Math.cos(a) * len, ny = y + Math.sin(a) * len;
    const col = K.tail[Math.min(9, Math.floor(i * 10 / N))] || ((K.tabby && K.stripe && i % 3 === 2) ? K.stripe : K.base);
    if (i < N - 1) lL(x, y, nx, ny, th, col);
    else lLround(x, y, nx, ny, th, col);     // the last piece with a round brush, so the tip is not a square block
    x = nx; y = ny;
  }
  // fluffy rounded tip
  const tc = K.tail[9] || K.base;
  eL(x, y, Math.max(2, th / 2 - 0.5), Math.max(2, th / 2 - 0.5), tc);
}

function drawBodyLayer(R, F, K) {
  const hx = R.hx, hy = R.hy, cx = R.cx, cy = R.cy, hr = R.hr, cr = R.cr;
  const xa = Math.floor(hx - hr - 1), xb = Math.ceil(cx + cr + 1);
  const span = (cx - hx) || 1;
  for (let x = xa; x <= xb; x++) {
    let top = -1e9, bot = 1e9;
    let d = (x - hx) / (hr + 0.5);
    if (Math.abs(d) <= 1) { const h = Math.sqrt(1 - d * d) * (hr + 0.5); top = Math.max(top, hy + h); bot = Math.min(bot, hy - h); }
    d = (x - cx) / (cr + 0.5);
    if (Math.abs(d) <= 1) { const h = Math.sqrt(1 - d * d) * (cr + 0.5); top = Math.max(top, cy + h); bot = Math.min(bot, cy - h); }
    const tt = (x - hx) / span, tcl = clamp(tt, 0, 1);
    const mid = lerp(hy, cy, tcl) + R.arch * 4 * tcl * (1 - tcl), rad = lerp(hr, cr, tcl);
    if (x >= hx && x <= cx && cx > hx) { top = Math.max(top, mid + rad); bot = Math.min(bot, mid - rad); }
    if (top < bot) continue;
    const yt = Math.floor(top + 0.0001), yb = Math.ceil(bot - 0.0001);
    const xm = ((x % 8) + 8) % 8;
    for (let y = yb; y <= yt; y++) {
      const fromTop = yt - y, fromBot = y - yb;
      let col = K.base;
      if (!F.bellyUp) {
        if (K.tabby && K.stripe && ((xm < 2 && fromTop < 6) || (xm >= 4 && xm < 6 && fromTop < 4))) col = K.stripe;
        if (fromBot < 3) col = K.belly;
        else if (fromBot < 4) col = K.shade2;
        if (K.bib) { const bx = (x - (cx + 2)) / 8, by = (y - (cy - 3)) / 10; if (bx * bx + by * by < 1) col = K.light; }
      } else if (fromTop < 3) col = K.belly;
      const pc = bodyPatchCol(K, tt, (y - mid) / rad);
      if (pc) col = pc;
      pL(x, y, col);
    }
    if (K.breed && K.breed.fluff && !F.bellyUp && ((x * 5) % 3 + 3) % 3 === 0) pL(x, yb - 1, K.belly);
  }
}

/* ---------- eyes: big glossy black eyes (cute, not creepy) ---------- */
const EYEROWS = {
  open: ['.XX.', 'XXXX', 'XXXX', 'XXXX', '.XX.'],
  wide: ['.XXX.', 'XXXXX', 'XXXXX', 'XXXXX', 'XXXXX', '.XXX.'],
  low: ['XXXX', 'XXXX', '.XX.']
};
function paintEye(x, y, rows, K, mode) {
  // x = left, y = bottom row (y-up); rows are listed top -> bottom
  const h = rows.length;
  const body = K.dark ? K.iris : K.pupil;
  for (let r = 0; r < h; r++)
    for (let c = 0; c < rows[r].length; c++)
      if (rows[r][c] === 'X') pS(x + c, y + h - 1 - r, body);
  if (K.dark) {          // bright eyes with a slit pupil on dark fur
    const wd = rows[0].length;
    for (let r = 1; r < h - 1; r++) for (let c = 1; c < wd - 1; c++) pS(x + c, y + h - 1 - r, K.pupil);
  }
  // shine
  if (mode === 'wide' || mode === 'shine') {
    pS(x + 1, y + h - 2, K.white); pS(x + 2, y + h - 2, K.white); pS(x + 1, y + h - 3, K.white); pS(x + 2, y + h - 3, K.white);
    pS(x + 3, y + 1, K.white);
    pS(x + 2, y, K.iris); pS(x + 3, y, K.iris);
  } else if (mode === 'low') {
    pS(x + 1, y + 2, K.white); pS(x + 2, y + 1, K.iris); pS(x + 1, y, K.iris);
  } else {
    pS(x + 1, y + h - 2, K.white); pS(x + 2, y + h - 2, K.white); pS(x + 1, y + h - 3, K.white);
    pS(x + 2, y, K.iris); pS(x + 1, y, K.iris);
  }
}
const EYE = {
  open(x, y, K) { paintEye(x, y, EYEROWS.open, K, 'open'); },
  wide(x, y, K) { paintEye(x - 0.5, y - 1, EYEROWS.wide, K, 'wide'); },
  shine(x, y, K) {
    paintEye(x - 0.5, y - 1, EYEROWS.wide, K, 'shine');
    pS(x + 3, y + 3, K.white);
  },
  half(x, y, K) {
    paintEye(x, y, EYEROWS.low, K, 'low');
    for (let i = 0; i < 4; i++) pS(x + i, y + 3, K.outline);
  },
  blink(x, y, K) { for (let i = 0; i < 4; i++) pS(x + i, y + 2, K.outline); },
  sleep(x, y, K) { pS(x, y + 3, K.outline); pS(x + 1, y + 2, K.outline); pS(x + 2, y + 2, K.outline); pS(x + 3, y + 3, K.outline); },
  happy(x, y, K) { pS(x, y + 2, K.outline); pS(x + 1, y + 3, K.outline); pS(x + 2, y + 3, K.outline); pS(x + 3, y + 2, K.outline); pS(x, y + 1, K.outline); pS(x + 3, y + 1, K.outline); },
  strain(x, y, K, left) {
    const p = left ? [[0, 4], [1, 3], [2, 2], [1, 1], [0, 0]] : [[3, 4], [2, 3], [1, 2], [2, 1], [3, 0]];
    for (const [a, b] of p) pS(x + a, y + b, K.outline);
  },
  dizzy(x, y, K) {
    for (let i = 0; i < 4; i++) { pS(x + i, y + i, K.outline); pS(x + i, y + 3 - i, K.outline); }
  },
  annoyed(x, y, K, left) {
    paintEye(x, y, EYEROWS.low, K, 'low');
    for (let i = 0; i < 4; i++) pS(x + i, y + 3 + (left ? (i < 2 ? 1 : 0) : (i >= 2 ? 1 : 0)), K.outline);
  }
};

/* ---- smooth copy of the sprite for the desktop ----
   The pixels keep their shape, but corners are cleaned (Scale2x, twice) and the picture is drawn with filtering, so the cat
   does not look uneven / crumpled when the screen scale is not a whole number (e.g. 125 % or 150 % Windows scaling). */
const SMK = 4;
const smCanvas = document.createElement('canvas');
smCanvas.width = SW * SMK; smCanvas.height = SH * SMK;
const smCtx = smCanvas.getContext('2d');
const smImg = smCtx.createImageData(SW * SMK, SH * SMK);
const smBuf = new Uint32Array(smImg.data.buffer);
const sm1 = new Uint32Array(SW * 2 * SH * 2);
function scale2xInto(src, w, h, dst, x0, y0, x1, y1) {
  const w2 = w * 2;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = y * w + x, P = src[i];
      const A = y > 0 ? src[i - w] : 0, D = y < h - 1 ? src[i + w] : 0, C = x > 0 ? src[i - 1] : 0, B = x < w - 1 ? src[i + 1] : 0;
      let p1 = P, p2 = P, p3 = P, p4 = P;
      if (C === A && C !== D && A !== B) p1 = A;
      if (A === B && A !== C && B !== D) p2 = B;
      if (D === C && D !== B && C !== A) p3 = C;
      if (B === D && B !== A && D !== C) p4 = D;
      const o = y * 2 * w2 + x * 2;
      dst[o] = p1; dst[o + 1] = p2; dst[o + w2] = p3; dst[o + w2 + 1] = p4;
    }
  }
}
// the same clean-up for any small sprite canvas (4x bigger, corners cleaned)
function smoothCanvas(src) {
  const w = src.width, h = src.height;
  const a = new Uint32Array(src.getContext('2d').getImageData(0, 0, w, h).data.buffer);
  const m = new Uint32Array(w * 2 * h * 2);
  scale2xInto(a, w, h, m, 0, 0, w - 1, h - 1);
  const out = document.createElement('canvas'); out.width = w * SMK; out.height = h * SMK;
  const oc = out.getContext('2d'), oi = oc.createImageData(w * SMK, h * SMK), b = new Uint32Array(oi.data.buffer);
  scale2xInto(m, w * 2, h * 2, b, 0, 0, w * 2 - 1, h * 2 - 1);
  oc.putImageData(oi, 0, 0);
  return out;
}
let smOk = true;
function buildSmooth() {
  if (!smOk) return;
  try {
    let x0 = SW, x1 = -1, y0 = SH, y1 = -1;
    for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) if (spr[y * SW + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    sm1.fill(0); smBuf.fill(0);
    if (x1 < 0) { smCtx.putImageData(smImg, 0, 0); return; }
    x0 = Math.max(0, x0 - 1); y0 = Math.max(0, y0 - 1); x1 = Math.min(SW - 1, x1 + 1); y1 = Math.min(SH - 1, y1 + 1);
    scale2xInto(spr, SW, SH, sm1, x0, y0, x1, y1);
    scale2xInto(sm1, SW * 2, SH * 2, smBuf, x0 * 2, y0 * 2, x1 * 2 + 1, y1 * 2 + 1);
    smCtx.putImageData(smImg, 0, 0);
  } catch (e) { smOk = false; }
}

function renderCat(R, F, S, K) {
  spr.fill(0); lay.fill(0);
  const B = K.breed || BREEDS.ksh;
  if (B.hr) { R.hr += B.hr; R.thigh += B.hr; }
  if (B.cr) R.cr += B.cr;
  if (B.lift) { R.hy += B.lift; R.cy += B.lift; R.hdy += B.lift; }
  if (B.drop) { const bottom = Math.min(R.hy - R.hr, R.cy - R.cr), d = clamp(bottom * 0.7, 0, B.drop); R.hy -= d; R.cy -= d; R.hdy -= d; }
  const hx = R.hx, hy = R.hy, cx = R.cx, cy = R.cy;
  const rootFy = F.bellyUp ? cy + 2 : cy - 4;
  const O = K.outline;
  const bd = F.bellyUp ? { fN: 5, fF: 4, hN: -5, hF: -4 } : { fN: 0, fF: 0, hN: 0, hF: 0 };
  const leg = (rx, ry, px, py, col, rim, bend = 0) => {
    const kx = (rx + px) / 2 + bend, ky = (ry + py) / 2;
    if (rim) { if (bend) { lL(rx, ry, kx, ky, 7, rim); lL(kx, ky, px, py, 7, rim); } else lL(rx, ry, px, py, 7, rim); }   // soft rim so a dark leg still reads against a dark body
    if (bend) { lL(rx, ry, kx, ky, 5, col); lL(kx, ky, px, py, 5, col); } else lL(rx, ry, px, py, 5, col);
    if (K.paw !== K.base && col === K.base) {
      const mx = px + ((bend ? kx : rx) - px) * 0.3, my = py + ((bend ? ky : ry) - py) * 0.3;
      lL(px, py, mx, my, 5, K.paw);
    }
  };

  const span = (R.cx - R.hx) || 1;
  const nearHind = () => {
    leg(hx, hy - 3, R.hNx, R.hNy + 2, K.base, K.rimSoft || K.rim, bd.hN); eL(R.hNx + 1, R.hNy + 1, 3, 2, K.paw);   // soft rim: a hard one drew boxy lines over the rump
  };
  const thigh = () => {
    // soft rim on the front / lower edge only, so the haunch reads without drawing a full circle
    // (no rim line around the haunch: on the phone's bigger pixels it read as a broken ring on the rump)
    eLf(hx, hy - 1, R.thigh, R.thigh, (dx, dy) => bodyPatchCol(K, dx / span, (dy - 1) / R.hr) || K.base);
    if (K.tabby && K.stripe) { rL(hx - 2, hy + 4, 2, 4, K.stripe); rL(hx + 2, hy + 3, 2, 4, K.stripe); }
  };
  const nearFront = () => {
    leg(cx + 2, rootFy, R.fNx, R.fNy + 2, K.base, K.rim, bd.fN); eL(R.fNx + 1, R.fNy + 1, 3, 2, K.paw);
  };

  // one silhouette: legs, tail and body are painted together so no seams show between them
  leg(cx - 4, rootFy, R.fFx, R.fFy + 2, K.shade, 0, bd.fF); eL(R.fFx + 1, R.fFy + 1, 3, 2, K.shade);
  leg(hx, hy - 3, R.hFx, R.hFy + 2, K.shade, 0, bd.hF); eL(R.hFx + 1, R.hFy + 1, 3, 2, K.shade);
  if (!F.tailFront) drawTail(R, F, K, S, S.tm);
  // neck: always bridge chest and head so a fast jump can never tear them apart
  { const nx = R.hdx - cx, ny = R.hdy - 2 - cy, st = Math.max(2, Math.ceil(Math.hypot(nx, ny) / 3)); for (let i = 0; i <= st; i++) eL(cx + nx * i / st, cy + ny * i / st, 8, 8, K.base); }
  drawBodyLayer(R, F, K);
  if (B.fluff) eL(cx + R.cr - 2, cy - 4, 5, 6, K.belly);       // chest ruff
  if (!F.hl) nearHind();
  thigh();
  if (!F.fl) nearFront();
  flush(O);
  softenInner(O, K.rimSoft || K.rim);

  if (F.tailFront) { drawTail(R, F, K, S, S.tm); flush2(O, K.edge); }

  // ---- head ----
  const hdx = Math.round(R.hdx), hdy = Math.round(R.hdy);
  const ns = Math.round(R.yaw * 5), es = Math.round(R.yaw * 3), fy = Math.round(clamp(R.pitch, -1, 1) * 2.5);
  const ys = Math.round(R.yaw * 2);
  if (F.bellyUp) FY = hdy;
  const KH = K.kh || 1, HX = Math.round(B.head[0] * KH * 2) / 2, HY = Math.round(B.head[1] * KH * 2) / 2;
  eLf(hdx, hdy, HX, HY, (dx, dy) => headPatchCol(K, dx / SS, dy / SS) || K.base);
  // cheek fur: grows straight out of the face edge, row by row (so it always sits on the face, whatever the head size)
  {
    const big = !!(B.cheek || B.fluff);
    // thin spikes (one row high) with gaps between them, so it reads as fur tufts and not as a puffed-up cheek
    const ext = big ? [1, 3, 1, 3, 1, 2, 1] : [1, 2, 1, 2];
    const y0 = hdy - (big ? 3 : 4);
    for (let i = 0; i < ext.length; i++) {
      const y = y0 - i, t = (y - hdy) / (HY + 0.5);
      if (Math.abs(t) >= 1) continue;
      const edge = Math.floor((HX + 0.5) * Math.sqrt(1 - t * t)), e = ext[i];
      for (let d = -1; d <= e; d++) { pL(hdx + edge + d, y, K.base); pL(hdx - edge - d, y, K.base); }
    }
  }
  const earY = hdy + Math.round(6 * KH);
  for (const near of [false, true]) {
    const st = F.bellyUp ? 'flat' : (near ? S.earN : S.earF);
    const rows = earRows(st, B.ear, KH);
    const shift = near ? S.tilt * 2 : -S.tilt * 2;
    rows.forEach((r, i) => {
      for (let x = r[0]; x <= r[1]; x++) {
        const ex = near ? x : -x - 1;
        const col = r[3] ? K.shade : (headPatchCol(K, (ys + ex) / SS, (Math.round(6 * KH) + i + shift) / SS) || (near ? K.base : K.shade));
        pL(hdx + ys + ex, earY + i + shift, col);
      }
      // pink inside
      if ((st === 'normal' || st === 'fwd' || st === 'back') && B.ear !== 'fold' && i >= 2 && i <= rows.length - 3) {
        const iw = Math.max(1, r[2] - 5);
        const c0 = Math.round((r[0] + r[1]) / 2 - iw / 2 + 0.5);
        for (let k = 0; k < iw; k++) { const ex = near ? c0 + k : -(c0 + k) - 1; pL(hdx + ys + ex, earY + i + shift, K.ear); }
      }
    });
  }
  // muzzle & markings
  const fl = B.flat ? 2 : 0;
  eL(hdx + ns, hdy - 5 + fy + fl, B.flat ? 4 : 5, 3, K.muzzle);
  if (K.blaze) rL(hdx + ns - 2, hdy - 4 + fy, 5, 14, K.light);
  if (K.tabby && K.stripe) { rL(hdx + ns - 4, hdy + 7, 2, 3, K.stripe); rL(hdx + ns - 1, hdy + 7, 2, 4, K.stripe); rL(hdx + ns + 2, hdy + 7, 2, 3, K.stripe); }
  flush2(O, K.edge);


  // ---- face ----
  const ey = hdy - 3 + fy;
  const exL = hdx - 8 + es, exR = hdx + 4 + es;
  const fn = EYE[S.eyes] || EYE.open;
  fn(exL, ey, K, true); fn(exR, ey, K.right, false);
  if (S.blush) {
    for (const bx of [exL - 1, exR + 2]) { pS(bx, ey - 2, K.blush); pS(bx + 1, ey - 2, K.blush); pS(bx + 2, ey - 2, K.blush); pS(bx, ey - 3, K.blush); pS(bx + 1, ey - 3, K.blush); pS(bx + 2, ey - 3, K.blush); }
  }
  const ncx = hdx + ns, ny = hdy - 4 + fy + fl, my = ny - 2;
  pS(ncx - 1, ny, K.nose); pS(ncx, ny, K.nose); pS(ncx + 1, ny, K.nose); pS(ncx, ny - 1, K.nose);
  const mouth = S.mouth;
  if (mouth === 'open1') {
    for (let j = 0; j < 3; j++) for (let i = -1; i <= 1; i++) pS(ncx + i, my - 1 - j, K.mouthIn);
    pS(ncx, my - 3, K.tongue); pS(ncx - 1, my - 3, K.tongue);
  } else if (mouth === 'open2') {
    for (let j = 0; j < 5; j++) for (let i = -2; i <= 2; i++) if (!(j === 4 && Math.abs(i) === 2)) pS(ncx + i, my - 1 - j, K.mouthIn);
    for (let i = -1; i <= 1; i++) { pS(ncx + i, my - 5, K.tongue); pS(ncx + i, my - 4, K.tongue); }
  } else if (mouth === 'tongue') {
    // the tongue hangs from the middle of the mouth, exactly under the nose (3 wide, rounded tip, a darker line down the middle)
    pS(ncx - 3, my, O); pS(ncx - 2, my - 1, O); pS(ncx - 1, my, O); pS(ncx + 1, my, O); pS(ncx + 2, my - 1, O); pS(ncx + 3, my, O);
    pS(ncx, my, K.tongue);
    for (let i = -1; i <= 1; i++) { pS(ncx + i, my - 1, K.tongue); pS(ncx + i, my - 2, K.tongue); }
    pS(ncx, my - 3, K.tongue); pS(ncx, my - 2, K.tongue2);
  } else if (mouth === 'lick') {
    // a short tongue in the middle of the mouth (the same place as the long one, so it never looks crooked while the head moves)
    pS(ncx - 3, my, O); pS(ncx - 2, my - 1, O); pS(ncx - 1, my, O); pS(ncx + 1, my, O); pS(ncx + 2, my - 1, O); pS(ncx + 3, my, O);
    pS(ncx, my, K.tongue);
    for (let i = -1; i <= 1; i++) pS(ncx + i, my - 1, K.tongue);
    pS(ncx, my - 2, K.tongue);
  } else if (mouth === 'frown') {
    pS(ncx - 3, my - 1, O); pS(ncx - 2, my, O); pS(ncx - 1, my, O); pS(ncx, my - 1, O); pS(ncx + 1, my, O); pS(ncx + 2, my, O); pS(ncx + 3, my - 1, O);
  } else {
    // little "w" mouth
    pS(ncx - 3, my, O); pS(ncx - 2, my - 1, O); pS(ncx - 1, my - 1, O); pS(ncx, my, O);
    pS(ncx + 1, my - 1, O); pS(ncx + 2, my - 1, O); pS(ncx + 3, my, O);
  }

  if (K.outfit && (K.outfit.collar || K.outfit.hat)) drawOutfit(K.outfit, { hdx, hdy, HX, HY, ns, ys, es, ey, exL, exR, tilt: S.tilt || 0, O });
  FY = null;
  // legs that reach in front of the head (face washing, belly-up) are painted last, over eyes, nose and mouth
  if (F.hl) { nearHind(); flush2(O, K.edge); }
  if (F.fl) { nearFront(); flush2(O, K.edge); }

  sBuf.set(spr);
  sCtx.putImageData(sImg, 0, 0);
  buildSmooth();
}
