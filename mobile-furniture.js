'use strict';
/* ============ living-room furniture (phone only) ============
   Sofa, floor lamp, TV on a low cabinet, a plant and a wall clock, drawn at full device resolution on the
   room canvas (mobile-room.js) so they match the room, not the pixel cat.
   - the tops of the sofa seat, the sofa back and the TV cabinet are platforms the cat can jump onto
   - anything the cat has wrecked (mobile-life.js keeps the list) is drawn wrecked until it is fixed
   Everything here is in CSS pixels unless it says "logical" (game pixels = CSS / S_PX). */
(function () {
  if (!window.__room) return;
  const R = window.__room;
  const roundRect = R.roundRect;

  const broken = () => (window.__life && window.__life.broken) || {};
  const clampN = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- layout ---------- */
  function G() {
    const { w: Wc, h: Hc } = R.size();
    const lay = R.L();
    const floorY = lay.floorY, baseY = floorY + 36;
    const sw = Math.min(Wc * 0.505, 330), sx0 = Math.round(Wc * 0.045), sx1 = Math.round(sx0 + sw);
    const arm = clampN(Math.round(sw * 0.11), 16, 26);
    const sofa = {
      x0: sx0, x1: sx1, arm, legY: baseY - 6, frontTop: baseY - 40, seatBack: baseY - 54, seatMid: baseY - 47,
      backTop: baseY - 104, armTop: baseY - 68
    };
    const cw = Math.min(Wc * 0.34, 230), cx1 = Math.round(Wc * 0.965), cx0 = Math.round(cx1 - cw);
    const cab = { x0: cx0, x1: cx1, top: baseY - 44, topBack: baseY - 54, legY: baseY - 5 };
    const tvW = Math.round(Math.min(100, cw * 0.66)), tvH = Math.round(tvW * 0.6);
    const tvCx = Math.round(cx1 - tvW / 2 - 10), tvBot = cab.top - 14;
    const tv = { x0: tvCx - tvW / 2, x1: tvCx + tvW / 2, y0: tvBot - tvH, y1: tvBot, cx: tvCx };
    const plant = { x: Math.round(cx0 + Math.min(22, (tv.x0 - cx0) / 2)), y: cab.top - 4 };
    const lamp = { x: Math.round((sx1 + cx0) / 2), y: baseY - 14, shadeBot: floorY - 50, shadeTop: floorY - 84 };
    const clock = { x: Math.round(Wc / 2), y: Math.round(lay.winY - 48), r: 17 };
    const curtain = side => {
      const x = lay.winX, w = lay.winW, cwd = Math.min(46, w * 0.2), cx = side < 0 ? x - 22 : x + w + 22;
      const bottom = lay.winY + lay.winH + 34, outer = cx + side * cwd * 0.55, inner = cx - side * cwd * 0.45;
      return { cx, cw: cwd, bottom, x0: Math.min(outer, inner), x1: Math.max(outer, inner) };
    };
    const rug = { x: Wc * 0.5, y: floorY + (Hc - floorY) * 0.42, rw: Math.min(Wc * 0.36, 170) };
    rug.rh = rug.rw * 0.28;
    return { Wc, Hc, lay, floorY, baseY, sofa, cab, tv, plant, lamp, clock, curtain, rug };
  }

  /* ---------- small drawing helpers ---------- */
  const ell = (g, x, y, rx, ry, col) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2); g.fill(); };
  const rr = (g, x, y, w, h, r, col) => { g.fillStyle = col; roundRect(g, x, y, w, h, Math.min(r, w / 2, h / 2)); g.fill(); };
  const vgrad = (g, y0, y1, a, b) => { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; };
  const floorShadow = (g, x0, x1, y) => {
    const gr = g.createLinearGradient(0, y - 4, 0, y + 10); gr.addColorStop(0, 'rgba(50,30,15,0.30)'); gr.addColorStop(1, 'rgba(50,30,15,0)');
    g.fillStyle = gr; roundRect(g, x0 - 4, y - 4, x1 - x0 + 8, 14, 6); g.fill();
  };

  const SOFA = { main: '#cf8f7f', dark: '#b6735f', light: '#e0a594', top: '#e9b6a6', seam: 'rgba(120,60,45,0.25)', leg: '#7a5236' };

  function drawPaw(g, x, y, s, col) {
    g.fillStyle = col;
    g.beginPath(); g.ellipse(x, y, 4.2 * s, 3.4 * s, 0, 0, Math.PI * 2); g.fill();
    for (const [dx, dy] of [[-4.4, -4.6], [-1.5, -6.6], [1.6, -6.6], [4.5, -4.6]]) { g.beginPath(); g.ellipse(x + dx * s, y + dy * s, 1.5 * s, 1.8 * s, 0, 0, Math.PI * 2); g.fill(); }
  }
  function fluff(g, x, y, s, col) { for (const [dx, dy, r] of [[0, 0, 3], [3, -1, 2.4], [-3, 1, 2.2], [1, 2, 2]]) ell(g, x + dx * s, y + dy * s, r * s, r * s * 0.85, col); }

  /* ---------- sofa ---------- */
  function drawSofa(g, f, B) {
    const s = f.sofa, w = s.x1 - s.x0;
    floorShadow(g, s.x0, s.x1, f.baseY);
    // legs
    g.fillStyle = SOFA.leg;
    for (const lx of [s.x0 + 6, s.x1 - 10, s.x0 + w * 0.5 - 2]) g.fillRect(lx, s.legY - 1, 4, 7);
    // backrest
    g.fillStyle = vgrad(g, s.backTop, s.seatBack, SOFA.light, SOFA.main);
    roundRect(g, s.x0 + 4, s.backTop, w - 8, s.seatBack - s.backTop + 6, 12); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.18)'; roundRect(g, s.x0 + 10, s.backTop + 3, w - 20, 6, 3); g.fill();
    // back cushions seams
    g.strokeStyle = SOFA.seam; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(s.x0 + w / 2, s.backTop + 10); g.lineTo(s.x0 + w / 2, s.seatBack - 2); g.stroke();
    // seat top (the band the cat sits on)
    g.fillStyle = vgrad(g, s.seatBack, s.frontTop, SOFA.dark, SOFA.top);
    roundRect(g, s.x0 + s.arm - 2, s.seatBack, w - s.arm * 2 + 4, s.frontTop - s.seatBack + 4, 5); g.fill();
    g.beginPath(); g.moveTo(s.x0 + w / 2, s.seatBack + 2); g.lineTo(s.x0 + w / 2, s.frontTop); g.stroke();
    // front of the seat
    g.fillStyle = vgrad(g, s.frontTop, s.legY, SOFA.main, SOFA.dark);
    roundRect(g, s.x0 + s.arm - 4, s.frontTop, w - s.arm * 2 + 8, s.legY - s.frontTop, 4); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(s.x0 + s.arm, s.frontTop + 2, w - s.arm * 2, 2);
    g.beginPath(); g.moveTo(s.x0 + w / 2, s.frontTop + 3); g.lineTo(s.x0 + w / 2, s.legY - 3); g.stroke();
    // arms
    for (const side of [-1, 1]) {
      const ax = side < 0 ? s.x0 : s.x1 - s.arm;
      g.fillStyle = vgrad(g, s.armTop, s.legY, SOFA.light, SOFA.dark);
      roundRect(g, ax, s.armTop, s.arm, s.legY - s.armTop, 9); g.fill();
      g.fillStyle = SOFA.top; roundRect(g, ax + 2, s.armTop + 1, s.arm - 4, 9, 5); g.fill();
      g.fillStyle = 'rgba(80,35,25,0.10)'; g.fillRect(side < 0 ? ax + s.arm - 3 : ax, s.armTop + 12, 3, s.legY - s.armTop - 14);
    }
    // throw cushions (one may be on the floor)
    const cushions = [{ x: s.x0 + s.arm + 22, col: '#f3e6cf', tilt: -0.12, k: 'L' }, { x: s.x1 - s.arm - 22, col: '#7fb3ad', tilt: 0.14, k: 'R' }];
    for (const c of cushions) {
      if (B.cushionToss && B.cushionToss.which === c.k) continue;
      drawCushion(g, c.x, s.seatBack + 4, c.col, c.tilt);
    }
    // tissue box on the left arm (or knocked off)
    if (!B.tissueShred) drawTissueBox(g, s.x0 + s.arm / 2, s.armTop + 2, false);

    // ---- damage ----
    if (B.sofaScratch) {
      const v = B.sofaScratch;
      let x0, x1, y0, y1;
      if (v.where === 'F') { const cx = s.x0 + s.arm + (w - s.arm * 2) * v.u; x0 = cx - 14; x1 = cx + 14; y0 = s.frontTop + 4; y1 = s.legY - 4; }
      else { const ax = v.where === 'L' ? s.x0 : s.x1 - s.arm; x0 = ax + 2; x1 = ax + s.arm - 2; y0 = s.armTop + 14; y1 = s.legY - 4; }
      const rnd = R.seeded(v.seed || 3);
      g.lineCap = 'round';
      for (let k = 0; k < 3; k++) {
        const gx = x0 + (x1 - x0) * (0.2 + k * 0.3), top = y0 + rnd() * 6;
        for (let j = 0; j < 3; j++) {
          const lx = gx + (j - 1) * 2.6;
          g.strokeStyle = j % 2 ? 'rgba(255,236,226,0.95)' : 'rgba(110,50,38,0.55)'; g.lineWidth = j % 2 ? 1.4 : 1.1;
          g.beginPath(); g.moveTo(lx, top);
          for (let yy = top; yy < y1 - 2; yy += 5) g.lineTo(lx + (rnd() - 0.5) * 2.2, yy + 5);
          g.stroke();
        }
      }
      for (let i = 0; i < 3; i++) fluff(g, x0 + (x1 - x0) * rnd(), y1 + 1 - rnd() * 4, 0.9, '#fff8f0');
      fluff(g, (x0 + x1) / 2 + 9, f.baseY + 6, 0.8, '#fff8f0');
    }
    if (B.sofaFur) {
      const rnd = R.seeded(B.sofaFur.seed || 5);
      for (let i = 0; i < 9; i++) {
        const fx = s.x0 + s.arm + 8 + rnd() * (w - s.arm * 2 - 16), fy = s.seatBack + 3 + rnd() * (s.frontTop - s.seatBack - 3);
        fluff(g, fx, fy, 0.55 + rnd() * 0.35, i % 3 ? 'rgba(250,240,225,0.95)' : 'rgba(214,170,120,0.95)');
      }
    }
  }
  function drawCushion(g, x, bottom, col, tilt) {
    g.save(); g.translate(x, bottom - 13); g.rotate(tilt);
    g.fillStyle = 'rgba(60,30,20,0.18)'; roundRect(g, -14, -11, 30, 27, 8); g.fill();
    g.fillStyle = col; roundRect(g, -15, -14, 30, 27, 8); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.25)'; roundRect(g, -11, -11, 14, 6, 3); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.08)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-8, 4); g.quadraticCurveTo(0, 7, 8, 4); g.stroke();
    g.restore();
  }
  function drawTissueBox(g, cx, bottom, tipped) {
    g.save(); g.translate(cx, bottom); if (tipped) g.rotate(1.35);
    rr(g, -12, -12, 24, 12, 3, '#9cc7e6');
    g.fillStyle = '#ffffff'; g.fillRect(-12, -9, 24, 2);
    ell(g, 0, -12, 6, 2, '#5c88a8');
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(-4, -12); g.quadraticCurveTo(-2, -22, 3, -19); g.quadraticCurveTo(5, -14, 4, -12); g.closePath(); g.fill();
    g.restore();
  }

  /* ---------- lamp ---------- */
  function lampShape(g, f, lit) {
    const L = f.lamp, h = L.y - L.shadeTop;
    // base and pole (drawn upright around (0,0) = base)
    ell(g, 0, 0, 11, 3.5, '#8c6b43');
    rr(g, -7, -4, 14, 4, 2, '#b08850');
    g.fillStyle = '#b8955e'; g.fillRect(-1.5, -(L.y - L.shadeBot), 3, L.y - L.shadeBot - 3);
    const sb = -(L.y - L.shadeBot), st = -h;
    const sg = g.createLinearGradient(-20, 0, 20, 0);
    sg.addColorStop(0, lit ? '#ffe7b8' : '#efe3cf'); sg.addColorStop(0.5, lit ? '#fff4d8' : '#fbf3e6'); sg.addColorStop(1, lit ? '#f6d39a' : '#e3d4bd');
    g.fillStyle = sg; g.beginPath(); g.moveTo(-12, st); g.lineTo(12, st); g.lineTo(20, sb); g.lineTo(-20, sb); g.closePath(); g.fill();
    g.fillStyle = 'rgba(120,90,50,0.25)'; g.fillRect(-20, sb - 2, 40, 2);
  }
  function drawLamp(g, f, B, night) {
    const L = f.lamp;
    if (B.lampFall) {
      const dir = B.lampFall.dir || 1;
      g.save(); g.translate(L.x, f.baseY + 10);
      ell(g, dir * 46, 4, 58, 6, 'rgba(50,30,15,0.18)');
      g.rotate(dir * (Math.PI / 2 - 0.1));
      lampShape(g, f, false);
      g.restore();
      // a bulb that rolled out
      ell(g, L.x + dir * 96, f.baseY + 14, 4, 4, 'rgba(255,255,255,0.85)');
      window.__roomLamp = { x: L.x, y: L.shadeBot, on: false };
      return;
    }
    g.save(); g.translate(L.x, L.y);
    ell(g, 0, 2, 16, 4, 'rgba(50,30,15,0.22)');
    lampShape(g, f, night > 0.3);
    g.restore();
    window.__roomLamp = { x: L.x, y: L.shadeBot + 6, on: true };
  }

  /* ---------- TV cabinet, TV, plant ---------- */
  function drawCabinet(g, f, B) {
    const c = f.cab, w = c.x1 - c.x0;
    floorShadow(g, c.x0, c.x1, f.baseY);
    g.fillStyle = '#6e4a30'; for (const lx of [c.x0 + 6, c.x1 - 10]) g.fillRect(lx, c.legY - 1, 4, 6);
    // body
    g.fillStyle = vgrad(g, c.top, c.legY, '#f6f0e7', '#e3d8c9');
    roundRect(g, c.x0, c.top, w, c.legY - c.top, 3); g.fill();
    g.strokeStyle = 'rgba(120,95,70,0.22)'; g.lineWidth = 1;
    const doors = 3;
    for (let i = 0; i < doors; i++) {
      const dx = c.x0 + 5 + i * (w - 10) / doors;
      g.strokeRect(dx + 1.5, c.top + 6.5, (w - 10) / doors - 3, c.legY - c.top - 12);
      ell(g, dx + (w - 10) / doors / 2, c.top + (c.legY - c.top) / 2, 2, 2, '#c4a27a');
    }
    // wooden top
    g.fillStyle = vgrad(g, c.topBack, c.top, '#c29365', '#d9b086');
    roundRect(g, c.x0 - 4, c.topBack, w + 8, c.top - c.topBack + 2, 3); g.fill();
    g.fillStyle = '#a77a50'; g.fillRect(c.x0 - 4, c.top, w + 8, 3);
  }
  function drawTV(g, f, B, night) {
    const t = f.tv, c = f.cab;
    // stand
    rr(g, t.cx - 14, c.top - 9, 28, 4, 2, '#30323a');
    g.fillStyle = '#3a3c45'; g.fillRect(t.cx - 3, t.y1, 6, c.top - 9 - t.y1);
    // screen
    rr(g, t.x0 - 3, t.y0 - 3, t.x1 - t.x0 + 6, t.y1 - t.y0 + 6, 4, '#1f2128');
    const sg = g.createLinearGradient(t.x0, t.y0, t.x1, t.y1); sg.addColorStop(0, '#3a4252'); sg.addColorStop(1, '#171b24');
    g.fillStyle = sg; g.fillRect(t.x0, t.y0, t.x1 - t.x0, t.y1 - t.y0);
    g.save(); g.beginPath(); g.rect(t.x0, t.y0, t.x1 - t.x0, t.y1 - t.y0); g.clip();
    g.fillStyle = 'rgba(255,255,255,0.07)'; g.beginPath(); g.moveTo(t.x0 + 10, t.y0); g.lineTo(t.x0 + 34, t.y0); g.lineTo(t.x0 + 4, t.y1); g.lineTo(t.x0 - 20, t.y1); g.closePath(); g.fill();
    if (B.tvPaws) {
      const rnd = R.seeded(B.tvPaws.seed || 9);
      for (let i = 0; i < 6; i++) drawPaw(g, t.x0 + 10 + rnd() * (t.x1 - t.x0 - 20), t.y0 + 12 + rnd() * (t.y1 - t.y0 - 16), 0.9, 'rgba(225,230,240,0.42)');
    }
    g.restore();
    ell(g, t.x1 - 6, t.y1 + 1.5, 1.2, 1.2, night > 0.4 ? '#ff6a5a' : '#7a3a34');      // standby light
  }
  function drawPlant(g, f, B) {
    const p = f.plant;
    if (B.plantTip) {
      const v = B.plantTip, x = p.x + (v.dx || 0), y = f.baseY + 14;
      // soil spill
      ell(g, x + 10, y + 3, 22, 6, 'rgba(92,62,38,0.85)');
      for (let i = 0; i < 7; i++) ell(g, x - 6 + i * 6 + Math.sin(i * 7) * 3, y + 4 + Math.cos(i * 5) * 3, 2, 1.4, '#5a3c24');
      g.save(); g.translate(x, y); g.rotate(-1.4);
      g.fillStyle = '#c7744f'; g.beginPath(); g.moveTo(-9, -16); g.lineTo(9, -16); g.lineTo(7, 0); g.lineTo(-7, 0); g.closePath(); g.fill();
      rr(g, -10, -18, 20, 4, 2, '#d88660');
      g.restore();
      for (const [dx, dy, a] of [[18, -2, 0.3], [26, 4, -0.5], [12, 6, 1.1]]) { g.save(); g.translate(x + dx, y + dy); g.rotate(a); ell(g, 0, 0, 8, 3, '#5e9b5a'); g.restore(); }
      return;
    }
    // leaves
    const leaves = [[-9, -26, -0.6], [9, -27, 0.6], [0, -34, 0], [-12, -18, -1], [12, -19, 1], [-4, -30, -0.3], [5, -31, 0.3]];
    for (const [dx, dy, a] of leaves) { g.save(); g.translate(p.x + dx, p.y + dy); g.rotate(a); ell(g, 0, 0, 4.2, 9, '#5e9b5a'); ell(g, -1, -1, 1.6, 6, 'rgba(255,255,255,0.18)'); g.restore(); }
    g.fillStyle = '#c7744f'; g.beginPath(); g.moveTo(p.x - 9, p.y - 16); g.lineTo(p.x + 9, p.y - 16); g.lineTo(p.x + 7, p.y); g.lineTo(p.x - 7, p.y); g.closePath(); g.fill();
    rr(g, p.x - 10, p.y - 18, 20, 4, 2, '#d88660');
  }

  /* ---------- wall clock (real time) ---------- */
  function drawClock(g, f) {
    const c = f.clock;
    if (c.y < c.r + 10) return;
    const now = new Date(), devH = /[?&]hour=([0-9.]+)/.exec(location.search);
    const hh = devH ? parseFloat(devH[1]) : now.getHours() + now.getMinutes() / 60, mm = (hh % 1) * 60;
    ell(g, c.x + 1, c.y + 2, c.r + 3, c.r + 3, 'rgba(80,60,40,0.15)');
    ell(g, c.x, c.y, c.r + 3, c.r + 3, '#8a6a4c');
    ell(g, c.x, c.y, c.r, c.r, '#fffaf0');
    g.fillStyle = '#6b5442';
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.fillRect(c.x + Math.sin(a) * (c.r - 4) - 0.8, c.y - Math.cos(a) * (c.r - 4) - 0.8, 1.6, 1.6); }
    g.strokeStyle = '#4a3a2e'; g.lineCap = 'round';
    const ha = (hh % 12) / 12 * Math.PI * 2, ma = mm / 60 * Math.PI * 2;
    g.lineWidth = 2.2; g.beginPath(); g.moveTo(c.x, c.y); g.lineTo(c.x + Math.sin(ha) * c.r * 0.5, c.y - Math.cos(ha) * c.r * 0.5); g.stroke();
    g.lineWidth = 1.4; g.beginPath(); g.moveTo(c.x, c.y); g.lineTo(c.x + Math.sin(ma) * c.r * 0.78, c.y - Math.cos(ma) * c.r * 0.78); g.stroke();
    ell(g, c.x, c.y, 1.6, 1.6, '#c0573f');
  }

  /* ---------- damage that is not part of a piece of furniture ---------- */
  function drawCurtainTear(g, f, side, seed) {
    const C = f.curtain(side), rnd = R.seeded(seed || 11);
    const x0 = C.x0, x1 = C.x1, b = C.bottom;
    // a rip through the lower part
    g.fillStyle = '#e9dccb';
    g.beginPath(); const rx = x0 + (x1 - x0) * (0.35 + rnd() * 0.3);
    g.moveTo(rx, b - 46); g.lineTo(rx + 4, b - 30); g.lineTo(rx - 2, b - 18); g.lineTo(rx + 6, b); g.lineTo(rx - 5, b); g.lineTo(rx - 7, b - 18); g.lineTo(rx - 1, b - 32); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(110,130,100,0.45)'; g.lineWidth = 1; g.stroke();
    // shreds hanging below the hem
    for (let i = 0; i < 5; i++) {
      const sx = x0 + 3 + (x1 - x0 - 8) * (i / 4), len = 8 + rnd() * 18, wd = 3 + rnd() * 3;
      g.fillStyle = i % 2 ? '#d3dfca' : '#c5d2bb';
      g.beginPath(); g.moveTo(sx, b - 1); g.lineTo(sx + wd, b - 1); g.lineTo(sx + wd * 0.7 + (rnd() - 0.5) * 3, b + len); g.lineTo(sx + wd * 0.2, b + len * 0.75); g.closePath(); g.fill();
    }
    g.strokeStyle = 'rgba(150,170,140,0.8)'; g.lineWidth = 0.8;
    for (let i = 0; i < 4; i++) { const tx = x0 + rnd() * (x1 - x0); g.beginPath(); g.moveTo(tx, b); g.quadraticCurveTo(tx + 4, b + 10, tx - 1, b + 16 + rnd() * 8); g.stroke(); }
  }
  function drawTissueMess(g, f, v) {
    const s = f.sofa, cx = v.x != null ? v.x : s.x0 + 40, rnd = R.seeded(v.seed || 13);
    drawTissueBox(g, s.x0 + s.arm + 14, f.baseY + 12, true);
    for (let i = 0; i < 12; i++) {
      const tx = cx + (rnd() - 0.4) * 110, ty = f.baseY + 8 + rnd() * 44;
      g.fillStyle = 'rgba(80,60,40,0.12)'; g.beginPath(); g.ellipse(tx + 1, ty + 2, 5, 2, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ffffff'; g.beginPath();
      g.moveTo(tx - 5, ty); g.lineTo(tx - 2, ty - 4 - rnd() * 2); g.lineTo(tx + 3, ty - 3); g.lineTo(tx + 5, ty + 1); g.lineTo(tx, ty + 2); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(160,170,190,0.5)'; g.lineWidth = 0.6; g.stroke();
    }
  }
  function drawRugFlip(g, f, side) {
    const r = f.rug, ex = r.x + side * r.rw, fx = r.x + side * r.rw * 0.66;
    // the folded-over corner shows bare floor where it used to lie...
    g.save(); g.beginPath(); g.ellipse(r.x, r.y, r.rw + 2, r.rh + 2, 0, 0, Math.PI * 2); g.clip();
    g.fillStyle = '#bb8b5e'; g.beginPath(); g.moveTo(fx, r.y - r.rh - 4); g.lineTo(ex + side * 4, r.y - r.rh - 4); g.lineTo(ex + side * 4, r.y + r.rh + 4); g.lineTo(fx + side * 8, r.y + r.rh + 4); g.closePath(); g.fill();
    g.fillStyle = 'rgba(70,40,18,0.18)'; for (let k = 0; k < 3; k++) g.fillRect(Math.min(fx, ex) - 4, r.y - r.rh + k * r.rh * 0.7, Math.abs(ex - fx) + 8, 1);
    g.restore();
    // ...and lies on top of the rug, underside up
    const fx2 = fx - side * (Math.abs(ex - fx) * 0.75);
    g.fillStyle = 'rgba(40,30,20,0.18)'; g.beginPath(); g.moveTo(fx, r.y - r.rh + 4); g.lineTo(fx2, r.y - r.rh * 0.2 + 6); g.lineTo(fx + side * 6, r.y + r.rh + 4); g.closePath(); g.fill();
    g.fillStyle = '#ddd2c2'; g.beginPath(); g.moveTo(fx, r.y - r.rh + 2); g.lineTo(fx2, r.y - r.rh * 0.3); g.lineTo(fx + side * 6, r.y + r.rh); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(150,130,105,0.5)'; g.lineWidth = 0.8;
    for (let k = 1; k < 5; k++) { const u = k / 5; g.beginPath(); g.moveTo(fx + (fx2 - fx) * u, r.y - r.rh + 2 + (r.rh * 0.7 - 2) * u); g.lineTo(fx + side * 6 * (1 - u) + (fx2 - fx) * u * 0.3, r.y + r.rh - u * 6); g.stroke(); }
    g.strokeStyle = '#f2f5f2'; g.lineWidth = 2; g.beginPath(); g.moveTo(fx, r.y - r.rh + 2); g.lineTo(fx + side * 6, r.y + r.rh); g.stroke();
  }

  /* ---------- painting entry points (called by mobile-room.js) ---------- */
  window.__roomFloorDepth = 30;          // the cat's paws stop at the same line as the sofa and TV cabinet legs (baseY = floorY + 36; paws sit ~6 px below gy)
  window.__roomDecor = function (g, lay, sky, h) {
    const f = G(), B = broken(), night = sky.night;
    if (B.rugFlip) drawRugFlip(g, f, B.rugFlip.side || 1);
    drawClock(g, f);
    for (const side of [-1, 1]) if (B.curtainTear && B.curtainTear.side === side) drawCurtainTear(g, f, side, B.curtainTear.seed);
    drawCabinet(g, f, B);
    drawTV(g, f, B, night);
    if (!B.plantTip) drawPlant(g, f, B);
    drawSofa(g, f, B);
    drawLamp(g, f, B, night);
    // things lying on the floor in front of the furniture
    if (B.cushionToss) drawCushion(g, B.cushionToss.x, f.baseY + 30, B.cushionToss.which === 'L' ? '#f3e6cf' : '#7fb3ad', B.cushionToss.tilt || 0.4);
    if (B.plantTip) drawPlant(g, f, B);
    if (B.tissueShred) drawTissueMess(g, f, B.tissueShred);
  };
  // after the night tint: a lamp that is on still glows
  window.__roomDecorNight = function (g, lay, sky) {
    if (sky.night <= 0.3 || broken().lampFall) return;
    const f = G(), L = f.lamp;
    const gl = g.createRadialGradient(L.x, L.shadeBot - 14, 4, L.x, L.shadeBot - 14, 60);
    gl.addColorStop(0, `rgba(255,226,160,${0.55 * sky.night})`); gl.addColorStop(1, 'rgba(255,226,160,0)');
    g.fillStyle = gl; g.beginPath(); g.arc(L.x, L.shadeBot - 14, 60, 0, Math.PI * 2); g.fill();
    g.save(); g.translate(L.x, L.y); g.globalAlpha = 0.85 * sky.night; lampShape(g, f, true); g.restore();
    const cone = g.createLinearGradient(0, L.shadeBot, 0, f.baseY + 30);
    cone.addColorStop(0, `rgba(255,220,150,${0.22 * sky.night})`); cone.addColorStop(1, 'rgba(255,220,150,0)');
    g.fillStyle = cone; g.beginPath(); g.moveTo(L.x - 20, L.shadeBot); g.lineTo(L.x + 20, L.shadeBot); g.lineTo(L.x + 46, f.baseY + 30); g.lineTo(L.x - 46, f.baseY + 30); g.closePath(); g.fill();
  };

  /* ---------- what the game and mobile-life.js need ---------- */
  // tap areas (CSS px) for every wrecked thing, padded to finger size
  function zones() {
    const f = G(), B = broken(), out = {}, s = f.sofa;
    const pad = (x0, y0, x1, y1) => { const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, w = Math.max(48, x1 - x0 + 12), h = Math.max(48, y1 - y0 + 12); return { x0: cx - w / 2, y0: cy - h / 2, x1: cx + w / 2, y1: cy + h / 2, cx, cy }; };
    if (B.sofaScratch) {
      const v = B.sofaScratch;
      if (v.where === 'F') { const cx = s.x0 + s.arm + (s.x1 - s.x0 - s.arm * 2) * v.u; out.sofaScratch = pad(cx - 16, s.frontTop, cx + 16, s.legY); }
      else { const ax = v.where === 'L' ? s.x0 : s.x1 - s.arm; out.sofaScratch = pad(ax, s.armTop + 10, ax + s.arm, s.legY + 6); }
    }
    if (B.sofaFur) out.sofaFur = pad(s.x0 + s.arm, s.seatBack, s.x1 - s.arm, s.frontTop + 4);
    if (B.curtainTear) { const C = f.curtain(B.curtainTear.side); out.curtainTear = pad(C.x0, C.bottom - 50, C.x1, C.bottom + 24); }
    if (B.lampFall) { const d = B.lampFall.dir || 1, L = f.lamp, len = L.y - L.shadeTop; out.lampFall = pad(Math.min(L.x, L.x + d * len), f.baseY - 14, Math.max(L.x, L.x + d * (len + 20)), f.baseY + 30); }
    if (B.plantTip) { const x = f.plant.x + (B.plantTip.dx || 0); out.plantTip = pad(x - 20, f.baseY - 4, x + 36, f.baseY + 24); }
    if (B.cushionToss) { const x = B.cushionToss.x; out.cushionToss = pad(x - 18, f.baseY + 4, x + 18, f.baseY + 32); }
    if (B.tvPaws) out.tvPaws = pad(f.tv.x0, f.tv.y0, f.tv.x1, f.tv.y1);
    if (B.tissueShred) { const cx = B.tissueShred.x != null ? B.tissueShred.x : s.x0 + 40; out.tissueShred = pad(Math.max(0, cx - 50), f.baseY - 4, cx + 70, f.baseY + 56); }
    if (B.rugFlip) { const r = f.rug, sd = B.rugFlip.side || 1; out.rugFlip = pad(Math.min(r.x + sd * r.rw * 0.1, r.x + sd * r.rw), r.y - r.rh, Math.max(r.x + sd * r.rw * 0.1, r.x + sd * r.rw), r.y + r.rh); }
    return out;
  }
  // furniture tops in logical game pixels
  function platformsLogical() {
    const f = G(), s = f.sofa, c = f.cab, k = S_PX;
    return [
      { id: 'sofaSeat', i: 0, x0: (s.x0 + s.arm + 8) / k, x1: (s.x1 - s.arm - 8) / k, y: s.seatMid / k, t: '소파' },
      { id: 'sofaBack', i: 0, x0: (s.x0 + 14) / k, x1: (s.x1 - 14) / k, y: (s.backTop + 5) / k, t: '소파 등받이' },
      { id: 'cabinet', i: 0, x0: (c.x0 + 6) / k, x1: (c.x1 - 6) / k, y: (c.top - 5) / k, t: 'TV장' }
    ];
  }

  window.NamanFurn = { G, zones, platforms: platformsLogical, repaint: () => R.repaint() };

  // the game's own platforms are open windows on the desktop; on the phone they are the furniture tops
  try {
    platforms = function () { return platformsLogical(); };
    platformVisibleAt = function () { return true; };
  } catch (e) { /* older game build */ }

  try { applyLayout(); } catch (e) { /* game not ready */ }
  R.repaint();
})();
