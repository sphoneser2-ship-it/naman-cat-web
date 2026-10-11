'use strict';
/* ============ high-resolution room behind the pixel cat (phone only) ============
   Drawn at the device's real pixel density on its own canvas, under the game canvas.
   The window shows the real local time: dawn, day, sunset, night (stars, moon, lit windows).
   The cat's walkable area is limited to the floor so it never strolls up the wall. */
(function () {
  const bg = document.createElement('canvas');
  bg.id = 'roomBg';
  bg.setAttribute('aria-hidden', 'true');
  bg.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;';
  document.body.insertBefore(bg, document.body.firstChild);
  document.documentElement.style.background = '#efe6da';

  const WALLPAPER = /[?&]wallpaper=1/.test(location.search);
  let Wc = 0, Hc = 0, dpr = 1;

  // layout in CSS pixels
  const L = () => {
    const floorY = Math.round(Hc * (WALLPAPER ? 0.5 : 0.56));
    const winW = Math.min(Math.round(Wc * 0.62), 340);
    const winH = Math.min(Math.round(Hc * 0.24), Math.round(winW * 0.82));
    const winX = Math.round((Wc - winW) / 2);
    const winY = Math.max(Math.round(Hc * 0.11), Math.round(floorY - winH - Hc * 0.13));
    return { floorY, winX, winY, winW, winH };
  };

  /* ---------- colour helpers ---------- */
  const hx = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mix = (a, b, t) => { const A = hx(a), B = hx(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; };
  const mixHex = (a, b, t) => { const A = hx(a), B = hx(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  function seeded(seed) { let a = seed | 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  /* ---------- sky by local time ---------- */
  // [hour, top colour, horizon colour, night amount 0..1]
  const SKY = [
    [0, '#0b1433', '#1d2b57', 1], [4.5, '#0e1a40', '#24325f', 1],
    [5.5, '#2d3f7c', '#e9a07f', 0.55], [6.5, '#6fa8e8', '#ffd9b0', 0.1],
    [8, '#5aa7f0', '#cfe9ff', 0], [15.5, '#5fa9ef', '#d7ecff', 0],
    [17.3, '#6b8fd6', '#ffd29a', 0.05], [18.3, '#5a4f93', '#f39062', 0.3],
    [19.2, '#272c66', '#b5607e', 0.7], [20.2, '#101a42', '#2a3566', 1], [24, '#0b1433', '#1d2b57', 1]
  ];
  function skyAt(h) {
    for (let i = 1; i < SKY.length; i++) {
      if (h <= SKY[i][0]) {
        const a = SKY[i - 1], b = SKY[i], t = (h - a[0]) / (b[0] - a[0]);
        return { top: mixHex(a[1], b[1], t), hor: mixHex(a[2], b[2], t), night: a[3] + (b[3] - a[3]) * t };
      }
    }
    return { top: SKY[0][1], hor: SKY[0][2], night: 1 };
  }
  const hourNowLocal = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60; };
  const devHour = () => { const m = /[?&]hour=([0-9.]+)/.exec(location.search); return m ? parseFloat(m[1]) : null; };

  /* ---------- drawing ---------- */
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  function drawWall(g, lay) {
    const { floorY } = lay;
    const wg = g.createLinearGradient(0, 0, 0, floorY);
    wg.addColorStop(0, '#f4ece2'); wg.addColorStop(1, '#ebdfd0');
    g.fillStyle = wg; g.fillRect(0, 0, Wc, floorY);
    // soft vertical wallpaper stripes
    g.fillStyle = 'rgba(160,130,100,0.045)';
    for (let x = 12; x < Wc; x += 26) g.fillRect(x, 0, 8, floorY);
    // corner shading at the top
    const tg = g.createLinearGradient(0, 0, 0, 90); tg.addColorStop(0, 'rgba(90,70,50,0.10)'); tg.addColorStop(1, 'rgba(90,70,50,0)');
    g.fillStyle = tg; g.fillRect(0, 0, Wc, 90);
  }

  function drawFloor(g, lay) {
    const { floorY } = lay;
    const fg = g.createLinearGradient(0, floorY, 0, Hc);
    fg.addColorStop(0, '#c39466'); fg.addColorStop(1, '#a87a50');
    g.fillStyle = fg; g.fillRect(0, floorY, Wc, Hc - floorY);
    // planks: rows get taller toward the viewer
    const rnd = seeded(7);
    let y = floorY, row = 0, hgt = 14;
    while (y < Hc) {
      const h = Math.round(hgt);
      g.fillStyle = row % 2 ? 'rgba(255,240,220,0.05)' : 'rgba(80,45,20,0.04)';
      g.fillRect(0, y, Wc, h);
      g.fillStyle = 'rgba(70,40,18,0.22)'; g.fillRect(0, y, Wc, 1);
      let x = -rnd() * 160;
      while (x < Wc) { x += 120 + rnd() * 90; g.fillStyle = 'rgba(70,40,18,0.18)'; g.fillRect(Math.round(x), y + 1, 1, h - 1); }
      for (let i = 0; i < 3; i++) {                          // faint grain
        g.strokeStyle = 'rgba(90,55,25,0.06)'; g.lineWidth = 1; g.beginPath();
        const gy = y + 3 + rnd() * (h - 5), gx = rnd() * Wc;
        g.moveTo(gx, gy); g.bezierCurveTo(gx + 40, gy - 1.5, gx + 80, gy + 1.5, gx + 130, gy); g.stroke();
      }
      y += h; row++; hgt *= 1.12;
    }
    // shadow where the floor meets the wall
    const sg = g.createLinearGradient(0, floorY, 0, floorY + 26); sg.addColorStop(0, 'rgba(60,35,15,0.28)'); sg.addColorStop(1, 'rgba(60,35,15,0)');
    g.fillStyle = sg; g.fillRect(0, floorY, Wc, 26);
    // baseboard
    g.fillStyle = '#fbf7f1'; g.fillRect(0, floorY - 12, Wc, 12);
    g.fillStyle = 'rgba(0,0,0,0.07)'; g.fillRect(0, floorY - 12, Wc, 1);
    g.fillStyle = 'rgba(0,0,0,0.10)'; g.fillRect(0, floorY - 1, Wc, 1);
    // round rug in the middle of the floor
    const rx = Wc * 0.5, ry = floorY + (Hc - floorY) * 0.42, rw = Math.min(Wc * 0.36, 170), rh = rw * 0.28;
    g.fillStyle = 'rgba(60,40,20,0.12)'; g.beginPath(); g.ellipse(rx, ry + 4, rw, rh, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#b9cbd3'; g.beginPath(); g.ellipse(rx, ry, rw, rh, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#f2f5f2'; g.lineWidth = 3; g.beginPath(); g.ellipse(rx, ry, rw - 10, rh - 4, 0, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(rx, ry, rw - 22, rh - 9, 0, 0, Math.PI * 2); g.stroke();
  }

  function drawWindow(g, lay, h) {
    const { winX: x, winY: y, winW: w, winH: hh } = lay;
    const sky = skyAt(h);
    const fr = 9;                                              // frame thickness
    const ix = x + fr, iy = y + fr, iw = w - fr * 2, ih = hh - fr * 2;

    // shadow of the window recess
    g.fillStyle = 'rgba(80,60,40,0.12)'; roundRect(g, x - 3, y - 2, w + 6, hh + 8, 6); g.fill();

    g.save(); g.beginPath(); g.rect(ix, iy, iw, ih); g.clip();
    const sg = g.createLinearGradient(0, iy, 0, iy + ih);
    sg.addColorStop(0, sky.top); sg.addColorStop(1, sky.hor);
    g.fillStyle = sg; g.fillRect(ix, iy, iw, ih);

    const rnd = seeded(Math.floor(Date.now() / 86400000));    // stars and clouds change once a day
    if (sky.night > 0.3) {                                     // stars
      g.fillStyle = `rgba(255,255,240,${(sky.night - 0.3) * 1.2})`;
      for (let i = 0; i < 40; i++) { const sx = ix + rnd() * iw, sy = iy + rnd() * ih * 0.7, r = rnd() < 0.15 ? 1.4 : 0.8; g.beginPath(); g.arc(sx, sy, r, 0, Math.PI * 2); g.fill(); }
    }
    // sun (6:00-18:40) or moon (18:40-6:00) on a gentle arc
    const dayP = (h - 6) / 12.7, nightP = ((h + 24 - 18.7) % 24) / 11.3;
    if (dayP > 0 && dayP < 1) {
      const sx = ix + iw * (0.08 + dayP * 0.84), sy = iy + ih * (0.78 - Math.sin(dayP * Math.PI) * 0.6);
      const low = 1 - Math.sin(dayP * Math.PI);
      const glow = g.createRadialGradient(sx, sy, 2, sx, sy, 34); glow.addColorStop(0, `rgba(255,${Math.round(240 - low * 60)},${Math.round(190 - low * 90)},0.55)`); glow.addColorStop(1, 'rgba(255,230,180,0)');
      g.fillStyle = glow; g.beginPath(); g.arc(sx, sy, 34, 0, Math.PI * 2); g.fill();
      g.fillStyle = mix('#fff6d6', '#ffb36b', low); g.beginPath(); g.arc(sx, sy, 10, 0, Math.PI * 2); g.fill();
    } else if (nightP > 0 && nightP < 1) {
      const mx = ix + iw * (0.1 + nightP * 0.8), my = iy + ih * (0.7 - Math.sin(nightP * Math.PI) * 0.5);
      const glow = g.createRadialGradient(mx, my, 2, mx, my, 26); glow.addColorStop(0, 'rgba(230,235,255,0.35)'); glow.addColorStop(1, 'rgba(230,235,255,0)');
      g.fillStyle = glow; g.beginPath(); g.arc(mx, my, 26, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#f3f1e4'; g.beginPath(); g.arc(mx, my, 8, 0, Math.PI * 2); g.fill();
      g.fillStyle = sky.top; g.beginPath(); g.arc(mx + 4, my - 2, 7, 0, Math.PI * 2); g.fill();   // crescent
    }
    if (sky.night < 0.6) {                                     // clouds
      const ca = 0.85 * (1 - sky.night / 0.6);
      for (let i = 0; i < 3; i++) {
        const cx = ix + rnd() * iw, cy = iy + ih * (0.15 + rnd() * 0.35), s = 0.7 + rnd() * 0.6;
        g.fillStyle = `rgba(255,255,255,${ca})`;
        for (const [dx, dy, r] of [[-14, 2, 9], [0, -3, 12], [14, 1, 9], [6, 4, 8], [-6, 4, 8]]) { g.beginPath(); g.arc(cx + dx * s, cy + dy * s, r * s, 0, Math.PI * 2); g.fill(); }
      }
    }
    // distant skyline with lit windows at night
    const base = iy + ih;
    const bcol = mix('#7d8fa8', '#151b33', sky.night);
    let bx = ix - 6;
    while (bx < ix + iw) {
      const bw = 16 + rnd() * 22, bh = ih * (0.14 + rnd() * 0.26);
      g.fillStyle = bcol; g.fillRect(bx, base - bh, bw, bh);
      if (sky.night > 0.45) {
        for (let wy = base - bh + 4; wy < base - 4; wy += 6) for (let wx = bx + 3; wx < bx + bw - 3; wx += 5) {
          if (rnd() < 0.35) { g.fillStyle = `rgba(255,214,130,${0.25 + rnd() * 0.6})`; g.fillRect(wx, wy, 2, 3); }
        }
      }
      bx += bw + 2 + rnd() * 6;
    }
    // trees in front
    const tcol = mix('#5f9c6b', '#13261f', sky.night);
    g.fillStyle = tcol;
    for (let tx = ix + 8; tx < ix + iw; tx += 34 + rnd() * 26) { const r = 10 + rnd() * 8; g.beginPath(); g.arc(tx, base - r * 0.6, r, 0, Math.PI * 2); g.fill(); }
    // glass sheen
    const gl = g.createLinearGradient(ix, iy, ix + iw, iy + ih); gl.addColorStop(0, 'rgba(255,255,255,0.16)'); gl.addColorStop(0.35, 'rgba(255,255,255,0)'); gl.addColorStop(0.6, 'rgba(255,255,255,0.06)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gl; g.fillRect(ix, iy, iw, ih);
    g.restore();

    // frame and muntins
    g.fillStyle = '#fdfbf7';
    g.fillRect(x, y, w, fr); g.fillRect(x, y + hh - fr, w, fr); g.fillRect(x, y, fr, hh); g.fillRect(x + w - fr, y, fr, hh);
    g.fillRect(x + w / 2 - 3, y, 6, hh); g.fillRect(x, y + hh * 0.45 - 3, w, 6);
    g.strokeStyle = 'rgba(120,95,70,0.25)'; g.lineWidth = 1; g.strokeRect(ix + 0.5, iy + 0.5, iw - 1, ih - 1);
    // sill
    g.fillStyle = '#fdfbf7'; roundRect(g, x - 10, y + hh - 2, w + 20, 10, 3); g.fill();
    g.fillStyle = 'rgba(80,60,40,0.16)'; g.fillRect(x - 8, y + hh + 8, w + 16, 4);

    // curtains, tied back
    for (const side of [-1, 1]) {
      const cx = side < 0 ? x - 22 : x + w + 22, top = y - 18, bottom = y + hh + 34;
      const cw = Math.min(46, w * 0.2);
      const grad = g.createLinearGradient(cx - cw, 0, cx + cw, 0);
      grad.addColorStop(0, '#c9d6c0'); grad.addColorStop(0.5, '#dfe8d6'); grad.addColorStop(1, '#c2cfb8');
      g.fillStyle = grad; g.beginPath();
      const inner = cx - side * cw * 0.2, outer = cx + side * cw * 0.55, tie = top + (bottom - top) * 0.62;
      g.moveTo(outer, top); g.lineTo(cx - side * cw * 0.65, top);
      g.quadraticCurveTo(inner - side * 6, tie - 30, inner + side * 8, tie);
      g.quadraticCurveTo(inner - side * 4, tie + 20, cx - side * cw * 0.45, bottom);
      g.lineTo(outer, bottom); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(110,130,100,0.25)'; g.lineWidth = 1.2;
      for (let k = 1; k <= 3; k++) { const fx = cx + side * (cw * 0.55 - k * cw * 0.28); g.beginPath(); g.moveTo(fx, top + 4); g.lineTo(fx + side * 4, bottom - 4); g.stroke(); }
      g.fillStyle = '#b48a5e'; roundRect(g, Math.min(inner, outer) - 2, tie - 3, Math.abs(outer - inner) + 4, 6, 3); g.fill();
    }
    // rod
    g.fillStyle = '#9b7550'; roundRect(g, x - 44, y - 22, w + 88, 5, 2.5); g.fill();
    for (const ex of [x - 46, x + w + 46]) { g.beginPath(); g.arc(ex, y - 19.5, 4, 0, Math.PI * 2); g.fill(); }

    return sky;
  }

  function drawDaylight(g, lay, sky, h) {
    const day = 1 - sky.night;
    if (day <= 0.05) return;
    // a soft patch of window light on the floor, sliding with the sun
    const p = Math.min(1, Math.max(0, (h - 7) / 11));
    const cx = lay.winX + lay.winW * (0.85 - p * 0.7), top = lay.floorY + 6, bottom = Math.min(Hc, lay.floorY + (Hc - lay.floorY) * 0.7);
    const wTop = lay.winW * 0.55, wBot = lay.winW * 0.95;
    const grd = g.createLinearGradient(0, top, 0, bottom); grd.addColorStop(0, `rgba(255,236,190,${0.20 * day})`); grd.addColorStop(1, 'rgba(255,236,190,0)');
    g.fillStyle = grd; g.beginPath();
    g.moveTo(cx - wTop / 2, top); g.lineTo(cx + wTop / 2, top); g.lineTo(cx + wBot / 2 + (p - 0.5) * 80, bottom); g.lineTo(cx - wBot / 2 + (p - 0.5) * 80, bottom); g.closePath(); g.fill();
  }

  function drawNightTint(g, sky) {
    if (sky.night <= 0.05) return;
    g.fillStyle = `rgba(25,28,66,${0.30 * sky.night})`; g.fillRect(0, 0, Wc, Hc);
    // a warm lamp glow so the room is not gloomy
    // (the floor lamp drawn by mobile-furniture.js says where it is, and whether it is still standing)
    const lamp = window.__roomLamp || { x: Wc * 0.88, y: Hc * 0.42, on: true };
    if (!lamp.on) return;
    const lg = g.createRadialGradient(lamp.x, lamp.y, 10, lamp.x, lamp.y, Wc * 0.8);
    lg.addColorStop(0, `rgba(255,200,130,${0.24 * sky.night})`); lg.addColorStop(1, 'rgba(255,200,130,0)');
    g.fillStyle = lg; g.fillRect(0, 0, Wc, Hc);
  }

  function paint() {
    Wc = window.innerWidth; Hc = window.innerHeight; dpr = Math.min(3, window.devicePixelRatio || 1);
    bg.width = Math.round(Wc * dpr); bg.height = Math.round(Hc * dpr);
    const g = bg.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.imageSmoothingEnabled = true;
    const lay = L();
    const h = devHour() ?? hourNowLocal();
    drawWall(g, lay);
    drawFloor(g, lay);
    const sky = drawWindow(g, lay, h);
    drawDaylight(g, lay, sky, h);
    if (typeof window.__roomDecor === 'function') { try { window.__roomDecor(g, lay, sky, h, Wc, Hc); } catch (e) { console.error(e); } }
    drawNightTint(g, sky);
    if (typeof window.__roomDecorNight === 'function') { try { window.__roomDecorNight(g, lay, sky, h, Wc, Hc); } catch (e) { console.error(e); } }
  }

  /* ---------- keep the cat on the floor ---------- */
  // furniture stands along the wall; mobile-furniture.js sets how deep it reaches into the room
  function floorLogical() { return Math.round((L().floorY + (window.__roomFloorDepth || 10)) / S_PX); }
  try {
    const baseLayout = layoutWorld;
    layoutWorld = function (cssW, cssH, wb) {
      baseLayout(cssW, cssH, wb);
      Wc = cssW; Hc = cssH;
      GY_MIN = Math.min(Math.max(GY_MIN, floorLogical()), GY_MAX - 20);
      if (typeof cat !== 'undefined' && cat && cat.surface === 'floor') cat.gy = clamp(cat.gy, GY_MIN, GY_MAX);
    };
    applyLayout();
  } catch (e) { /* game not ready: the room still draws */ }

  /* ---------- the cat's sunbathing spot follows this room's own window light ---------- */
  try {
    sunSpot = function () {
      const h = devHour() ?? hourNowLocal();
      if (skyAt(h).night > 0.5) return { on: false };          // no sunbathing at night
      const lay = L(), p = Math.min(1, Math.max(0, (h - 7) / 11));
      const top = lay.floorY + 6, bottom = Math.min(Hc, lay.floorY + (Hc - lay.floorY) * 0.7);
      const x = lay.winX + lay.winW * (0.85 - p * 0.7) + (p - 0.5) * 40, y = (top + bottom) / 2;
      return { on: true, x: clamp(x / S_PX, 30, W - 30), gy: clamp(y / S_PX, GY_MIN + 4, GY_MAX - 10), a: 1 };
    };
    drawSunPatch = function () {};                              // the high-resolution light patch is already on the floor
  } catch (e) { /* older game build */ }

  // shared with mobile-furniture.js / mobile-life.js
  window.__room = { L, skyAt, roundRect, seeded, mix, mixHex, hourNow: () => devHour() ?? hourNowLocal(), repaint: paint, size: () => ({ w: Wc, h: Hc }) };

  paint();
  window.addEventListener('resize', () => setTimeout(paint, 0));
  setInterval(paint, 60000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') paint(); });
})();
