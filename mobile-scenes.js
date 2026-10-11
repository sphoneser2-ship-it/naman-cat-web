'use strict';
/* ============ bathroom and vet clinic backdrops (phone only) ============
   Drawn once per screen size into an offscreen canvas at device resolution, then copied each frame;
   only the small moving bits (steam, bubbles, the heart monitor) are drawn live. */
(function () {
  const rr = (g, x, y, w, h, r) => { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const fill = (g, c) => { g.fillStyle = c; g.fill(); };
  const lin = (g, x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  const ell = (g, x, y, rx, ry, c) => { g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2); g.fillStyle = c; g.fill(); };
  const cache = {};
  function cached(name, W, H, dpr, draw) {
    const key = name + W + 'x' + H + '@' + dpr;
    if (!cache[key]) {
      const c = document.createElement('canvas'); c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); draw(g);
      for (const k in cache) if (k.indexOf(name) === 0) delete cache[k];
      cache[key] = c;
    }
    return cache[key];
  }
  function blit(g, img, W, H) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(img, 0, 0); g.restore(); }

  /* ---------------- bathroom ---------------- */
  function bathStatic(g, B) {
    const { Wc: W, Hc: H, tx, rimY, tw, th } = B;
    const floorY = Math.round(rimY + th * 0.9), wainY = Math.round(rimY - th * 0.55);
    // upper wall: soft mint tiles with a little bevel each
    g.fillStyle = '#e4f4f2'; g.fillRect(0, 0, W, wainY);
    const ts = 30, ox = (W / 2) % ts;
    for (let y = 0; y < wainY; y += ts) for (let x = ox - ts; x < W; x += ts) {
      g.fillStyle = ((x / ts + y / ts) | 0) % 2 ? '#e1f3f1' : '#d9efed'; g.fillRect(x + 1, y + 1, ts - 2, ts - 2);
      g.fillStyle = 'rgba(255,255,255,0.65)'; g.fillRect(x + 1, y + 1, ts - 2, 2); g.fillRect(x + 1, y + 1, 2, ts - 2);
      g.fillStyle = 'rgba(70,120,120,0.07)'; g.fillRect(x + 1, y + ts - 3, ts - 2, 2);
    }
    // patterned border row
    g.fillStyle = '#9fd3cf'; g.fillRect(0, wainY - 14, W, 14);
    for (let x = ox - ts; x < W; x += 15) { ell(g, x + 7, wainY - 7, 3.2, 3.2, '#ffffff'); ell(g, x + 7, wainY - 7, 1.4, 1.4, '#ffb7c9'); }
    g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(0, wainY - 15, W, 2); g.fillRect(0, wainY, W, 2);
    // lower wall: deeper teal tiles
    g.fillStyle = '#bfe2df'; g.fillRect(0, wainY + 2, W, floorY - wainY - 2);
    for (let y = wainY + 2; y < floorY; y += 22) for (let x = ox - 22; x < W; x += 22) {
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x + 1, y + 1, 20, 2);
      g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, 22, 22);
    }
    // frosted window with soft light
    const wx = Math.round(W * 0.08), wy = Math.round(H * 0.17), ww = Math.round(W * 0.3), wh = Math.round(ww * 1.15);
    g.fillStyle = '#ffffff'; rr(g, wx - 7, wy - 7, ww + 14, wh + 14, ww / 2 + 7); g.fill();
    g.fillStyle = lin(g, 0, wy, 0, wy + wh, [[0, '#f6fbff'], [1, '#d8eef7']]); rr(g, wx, wy, ww, wh, ww / 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(wx + ww / 2 - 2, wy + 4, 4, wh - 8); g.fillRect(wx + 4, wy + wh * 0.55, ww - 8, 4);
    g.fillStyle = 'rgba(255,255,255,0.5)'; for (let i = 0; i < 9; i++) ell(g, wx + 10 + (i * 37) % (ww - 20), wy + 16 + (i * 53) % (wh - 30), 3, 3, 'rgba(255,255,255,0.7)');
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = lin(g, wx, wy, wx + ww * 2.2, floorY, [[0, 'rgba(255,250,225,0.16)'], [1, 'rgba(255,250,225,0)']]);
    g.beginPath(); g.moveTo(wx + ww * 0.2, wy + wh); g.lineTo(wx + ww, wy + wh * 0.6); g.lineTo(wx + ww * 2.6, floorY); g.lineTo(wx + ww * 1.1, floorY); g.closePath(); g.fill();
    g.restore();
    // towel bar with rolled towels (right wall)
    const bx = Math.round(W * 0.66), by = Math.round(H * 0.2);
    g.fillStyle = '#c9d3da'; rr(g, bx, by, W * 0.27, 5, 2.5); g.fill(); ell(g, bx, by + 2.5, 4, 4, '#aeb9c2'); ell(g, bx + W * 0.27, by + 2.5, 4, 4, '#aeb9c2');
    const towel = (x, w, c1, c2) => { g.fillStyle = c1; rr(g, x, by - 2, w, 46, 6); g.fill(); g.fillStyle = c2; g.fillRect(x, by + 30, w, 5); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x + 3, by + 2, 3, 26); };
    towel(bx + 8, W * 0.11, '#ffb3c7', '#ffffff'); towel(bx + 12 + W * 0.11, W * 0.1, '#9fd0f5', '#ffffff');
    // shelf with bottles and a little plant
    const sy = Math.round(wainY - th * 0.95), sx = Math.round(W * 0.6);
    g.fillStyle = '#f7efe4'; rr(g, sx, sy, W * 0.36, 7, 3); g.fill(); g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(sx + 4, sy + 7, W * 0.36 - 8, 4);
    const bottle = (x, w, h, c, cap) => { g.fillStyle = c; rr(g, x, sy - h, w, h, 5); g.fill(); g.fillStyle = cap; rr(g, x + w * 0.3, sy - h - 6, w * 0.4, 7, 2); g.fill(); g.fillStyle = 'rgba(255,255,255,0.75)'; rr(g, x + 3, sy - h + 7, w - 6, h * 0.35, 3); g.fill(); g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(x + 3, sy - h + 4, 2, h - 8); };
    bottle(sx + 8, 15, 34, '#ff9db5', '#e86b8c'); bottle(sx + 28, 13, 26, '#8fd3c3', '#5bb39f'); bottle(sx + 46, 17, 38, '#ffd27a', '#e3a93c');
    g.fillStyle = '#d9784a'; rr(g, sx + W * 0.36 - 30, sy - 16, 20, 16, 3); g.fill();
    for (const [dx, dy, a] of [[-6, -26, -0.5], [4, -28, 0.4], [-1, -32, 0], [8, -22, 0.9], [-9, -20, -1]]) { g.save(); g.translate(sx + W * 0.36 - 20 + dx, sy - 16 + dy + 8); g.rotate(a); ell(g, 0, 0, 3.5, 8, '#5fae6a'); g.restore(); }
    // shower pipe and head over the tub's right end
    const px = tx + tw / 2 - 26;
    g.fillStyle = lin(g, px - 4, 0, px + 4, 0, [[0, '#9aa6b0'], [0.5, '#eef3f6'], [1, '#8b97a1']]);
    g.fillRect(px - 3, H * 0.13, 6, rimY - H * 0.13 - 12);
    g.fillRect(px - 26, H * 0.13, 26, 6);
    g.fillStyle = '#d5dde3'; g.beginPath(); g.ellipse(px - 30, H * 0.13 + 10, 16, 8, -0.25, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#9aa6b0'; for (let i = -2; i <= 2; i++) ell(g, px - 31 + i * 5, H * 0.13 + 12 + Math.abs(i), 1.2, 1.2, '#9aa6b0');
    // floor: pale tiles in perspective
    g.fillStyle = lin(g, 0, floorY, 0, H, [[0, '#c7dde1'], [1, '#b3cdd2']]); g.fillRect(0, floorY, W, H - floorY);
    g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1;
    for (let i = -8; i <= 8; i++) { g.beginPath(); g.moveTo(W / 2 + i * 40, floorY); g.lineTo(W / 2 + i * 90, H); g.stroke(); }
    for (let y = floorY + 14, s = 14; y < H; s *= 1.25, y += s) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.fillStyle = 'rgba(40,70,80,0.18)'; g.fillRect(0, floorY, W, 3);
    // fluffy bath mat in front of the tub
    const my = floorY + (H - floorY) * 0.42;
    ell(g, tx, my + 4, tw * 0.42, 22, 'rgba(40,70,80,0.12)');
    ell(g, tx, my, tw * 0.42, 20, '#ffc9d6');
    g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.setLineDash([3, 4]); g.beginPath(); g.ellipse(tx, my, tw * 0.42 - 8, 14, 0, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
    for (let a = 0; a < Math.PI * 2; a += 0.12) { const x = tx + Math.cos(a) * tw * 0.42, y = my + Math.sin(a) * 20; g.strokeStyle = '#ffb3c6'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 4, y + Math.sin(a) * 3); g.stroke(); }
    // shadow under the tub
    ell(g, tx, floorY + 4, tw * 0.5, 10, 'rgba(40,70,80,0.2)');
    // gentle vignette
    const vg = g.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.3, W / 2, H * 0.55, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(30,60,70,0.16)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  const steam = [];
  function bath(g, B, t, dpr) {
    blit(g, cached('bath', B.Wc, B.Hc, dpr, gg => bathStatic(gg, B)));
    // faucet on the far rim (behind the cat)
    const fx = B.tx + B.tw / 2 - 30, fy = B.rimY - 10;
    g.fillStyle = lin(g, fx - 10, 0, fx + 10, 0, [[0, '#a3afb8'], [0.5, '#f3f7f9'], [1, '#93a0aa']]);
    rr(g, fx - 5, fy - 22, 10, 24, 4); g.fill(); rr(g, fx - 18, fy - 24, 18, 7, 3.5); g.fill();
    ell(g, fx - 14, fy - 28, 4, 3, '#ff9db5'); ell(g, fx + 10, fy - 16, 4, 3, '#8fc7ff');
    // steam
    if (steam.length < 7 && Math.random() < 0.04) steam.push({ x: B.tx + (Math.random() - 0.5) * B.tw * 0.6, y: B.rimY - 6, t: 0, life: 3 + Math.random() * 2 });
    for (let i = steam.length - 1; i >= 0; i--) {
      const s = steam[i]; s.t += 1 / 60; if (s.t > s.life) { steam.splice(i, 1); continue; }
      const u = s.t / s.life, a = Math.sin(u * Math.PI) * 0.22;
      g.strokeStyle = `rgba(255,255,255,${a})`; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath();
      for (let k = 0; k <= 6; k++) { const y = s.y - u * 70 - k * 7, x = s.x + Math.sin(t * 1.5 + k * 0.9 + s.x) * 6; k ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    }
  }

  /* ---------------- vet clinic ---------------- */
  function vetStatic(g, L) {
    const { Wc: W, Hc: H, tx, tableY, tw } = L;
    const floorY = tableY + 74, railY = Math.round(tableY - 40);
    g.fillStyle = lin(g, 0, 0, 0, railY, [[0, '#eef8f3'], [1, '#e2f3ea']]); g.fillRect(0, 0, W, railY);
    g.fillStyle = 'rgba(120,180,150,0.06)'; for (let x = 10; x < W; x += 24) g.fillRect(x, 0, 10, railY);
    g.fillStyle = '#ffffff'; g.fillRect(0, railY - 3, W, 7); g.fillStyle = 'rgba(0,0,0,0.06)'; g.fillRect(0, railY + 4, W, 2);
    g.fillStyle = '#cde9dc'; g.fillRect(0, railY + 4, W, floorY - railY - 4);
    for (let x = 0; x < W; x += 34) { g.fillStyle = 'rgba(255,255,255,0.28)'; g.fillRect(x, railY + 10, 1, floorY - railY - 14); }
    // floor: soft vinyl with faint tiles in perspective and a round rug under the table
    g.fillStyle = lin(g, 0, floorY, 0, H, [[0, '#efe9df'], [1, '#e2dacd']]); g.fillRect(0, floorY, W, H - floorY);
    g.strokeStyle = 'rgba(150,130,100,0.13)'; g.lineWidth = 1;
    for (let i = -8; i <= 8; i++) { g.beginPath(); g.moveTo(W / 2 + i * 44, floorY); g.lineTo(W / 2 + i * 110, H); g.stroke(); }
    for (let y = floorY + 16, st = 16; y < H; st *= 1.3, y += st) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(0, floorY, W, 3);
    const rugY = floorY + 26;
    ell(g, tx, rugY + 3, tw * 0.55, 30, 'rgba(0,0,0,0.06)'); ell(g, tx, rugY, tw * 0.55, 28, '#bfe6d6');
    g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.setLineDash([4, 4]); g.beginPath(); g.ellipse(tx, rugY, tw * 0.55 - 10, 20, 0, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
    for (let i = 0; i < 5; i++) { const a = -0.6 + i * 0.3; g.save(); g.translate(tx + Math.cos(a + Math.PI / 2) * tw * 0.4, rugY + Math.sin(a + Math.PI / 2) * 14); ell(g, 0, 0, 3.2, 2.4, '#ffffff'); for (const [dx, dy] of [[-3, -3], [-1, -4.5], [1.2, -4.5], [3.2, -3]]) ell(g, dx, dy, 1, 1.2, '#ffffff'); g.restore(); }
    // window with blinds (top right)
    const wx = Math.round(W * 0.6), wy = Math.round(H * 0.12), ww = Math.round(W * 0.32), wh = Math.round(ww * 0.95);
    g.fillStyle = '#ffffff'; rr(g, wx - 6, wy - 6, ww + 12, wh + 12, 6); g.fill();
    g.fillStyle = lin(g, 0, wy, 0, wy + wh, [[0, '#8fd0ff'], [1, '#d9f1ff']]); g.fillRect(wx, wy, ww, wh);
    ell(g, wx + ww * 0.7, wy + wh * 0.3, 10, 10, '#fff6c8');
    ell(g, wx + ww * 0.25, wy + wh * 0.4, 14, 6, 'rgba(255,255,255,0.9)');
    for (let y = wy + 4; y < wy + wh * 0.55; y += 7) { g.fillStyle = '#f7f7f2'; g.fillRect(wx, y, ww, 4); g.fillStyle = 'rgba(0,0,0,0.06)'; g.fillRect(wx, y + 4, ww, 1); }
    g.fillStyle = '#e6e2d8'; g.fillRect(wx - 2, wy + wh * 0.55, ww + 4, 5);
    // clinic sign: round plaque with a cross and the clinic name
    const cx = Math.round(W * 0.3), cy = Math.round(H * 0.16);
    ell(g, cx, cy + 3, 34, 34, 'rgba(0,0,0,0.08)'); ell(g, cx, cy, 34, 34, '#ffffff'); ell(g, cx, cy, 29, 29, '#ff8b98');
    g.fillStyle = '#ffffff'; rr(g, cx - 6, cy - 18, 12, 36, 3); g.fill(); rr(g, cx - 18, cy - 6, 36, 12, 3); g.fill();
    g.fillStyle = '#4a7b6a'; g.font = '700 13px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText('냥냥 동물병원', cx, cy + 52);
    // poster with a cat and a heart
    const px = 18, py = Math.round(H * 0.3);
    g.fillStyle = '#fff8e6'; rr(g, px, py, 74, 96, 8); g.fill(); g.strokeStyle = '#f0d9a8'; g.lineWidth = 2; g.stroke();
    ell(g, px + 37, py + 46, 18, 16, '#ffb35c'); g.beginPath(); g.moveTo(px + 22, py + 36); g.lineTo(px + 25, py + 22); g.lineTo(px + 32, py + 32); g.fill(); g.beginPath(); g.moveTo(px + 52, py + 36); g.lineTo(px + 49, py + 22); g.lineTo(px + 42, py + 32); g.fill();
    ell(g, px + 31, py + 45, 2, 2.5, '#4a3158'); ell(g, px + 43, py + 45, 2, 2.5, '#4a3158');
    g.fillStyle = '#ff6f7d'; g.beginPath(); g.moveTo(px + 37, py + 86); g.bezierCurveTo(px + 22, py + 76, px + 28, py + 66, px + 37, py + 73); g.bezierCurveTo(px + 46, py + 66, px + 52, py + 76, px + 37, py + 86); g.fill();
    // cabinet with treat jars and a heart monitor
    const kx = Math.round(W * 0.66), ky = railY - 4, kw = Math.round(W * 0.3);
    g.fillStyle = '#f6f3ec'; rr(g, kx, ky - 60, kw, 60, 4); g.fill(); g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(kx, ky - 4, kw, 4);
    g.fillStyle = 'rgba(160,210,230,0.45)'; g.fillRect(kx + 6, ky - 54, kw / 2 - 9, 46); g.fillRect(kx + kw / 2 + 3, ky - 54, kw / 2 - 9, 46);
    const jar = (x, c) => { g.fillStyle = 'rgba(255,255,255,0.85)'; rr(g, x, ky - 34, 16, 22, 4); g.fill(); g.fillStyle = c; g.fillRect(x + 2, ky - 22, 12, 9); g.fillStyle = '#c99b6d'; g.fillRect(x + 1, ky - 37, 14, 4); };
    jar(kx + 10, '#ffb35c'); jar(kx + 30, '#9fd0f5'); jar(kx + kw / 2 + 8, '#ff9db5'); jar(kx + kw / 2 + 28, '#a8e6a3');
    // monitor frame (the line is drawn live)
    g.fillStyle = '#3a4656'; rr(g, kx + kw * 0.15, ky - 100, kw * 0.7, 36, 5); g.fill();
    g.fillStyle = '#1f2a35'; g.fillRect(kx + kw * 0.15 + 4, ky - 96, kw * 0.7 - 8, 28);
    // plant on the floor
    const pl = Math.round(W * 0.07);
    g.fillStyle = '#e8d9c2'; rr(g, pl - 14, floorY - 30, 28, 30, 4); g.fill();
    for (const [dx, dy, a] of [[-8, -46, -0.5], [6, -50, 0.4], [-1, -58, 0], [12, -40, 0.9], [-13, -38, -1], [2, -44, 0.2]]) { g.save(); g.translate(pl + dx, floorY - 30 + dy + 14); g.rotate(a); ell(g, 0, 0, 5, 13, '#5fae6a'); ell(g, -1, -1, 1.5, 9, 'rgba(255,255,255,0.2)'); g.restore(); }
    // exam table: stainless top on a pedestal, with a paper sheet and a soft towel
    ell(g, tx, floorY + 2, tw * 0.32, 8, 'rgba(0,0,0,0.12)');
    g.fillStyle = lin(g, tx - 12, 0, tx + 12, 0, [[0, '#9fa9b2'], [0.5, '#e6ebef'], [1, '#8d98a2']]);
    g.fillRect(tx - 10, tableY + 10, 20, floorY - tableY - 12);
    g.fillStyle = '#8d98a2'; rr(g, tx - tw * 0.22, floorY - 8, tw * 0.44, 8, 4); g.fill();
    g.fillStyle = lin(g, 0, tableY - 6, 0, tableY + 14, [[0, '#f1f5f8'], [0.5, '#cfd8df'], [1, '#a9b4bd']]);
    rr(g, tx - tw / 2, tableY - 4, tw, 18, 8); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.75)'; g.fillRect(tx - tw / 2 + 10, tableY - 2, tw - 20, 2);
    g.fillStyle = '#fbfbf8'; rr(g, tx - tw * 0.36, tableY - 9, tw * 0.72, 8, 3); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.08)'; g.setLineDash([2, 3]); g.beginPath(); g.moveTo(tx - tw * 0.36 + 4, tableY - 5); g.lineTo(tx + tw * 0.36 - 4, tableY - 5); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#ffd6e2'; rr(g, tx - tw * 0.22, tableY - 12, tw * 0.44, 7, 3); g.fill();
    // little tray with cotton and a thermometer
    const ty = tableY + 30, txr = tx - tw * 0.4;
    g.fillStyle = '#dfe6ec'; rr(g, txr - 24, ty, 48, 8, 3); g.fill();
    ell(g, txr - 10, ty - 3, 6, 5, '#ffffff'); ell(g, txr - 3, ty - 4, 5, 4, '#ffffff');
    g.fillStyle = '#ffffff'; rr(g, txr + 4, ty - 3, 18, 3, 1.5); g.fill(); ell(g, txr + 4, ty - 1.5, 2, 2, '#ff6f7d');
    const vg = g.createRadialGradient(W / 2, H * 0.5, Math.min(W, H) * 0.3, W / 2, H * 0.5, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(40,70,60,0.12)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  function vet(g, L, t, dpr, beating) {
    blit(g, cached('vet', L.Wc, L.Hc, dpr, gg => vetStatic(gg, L)));
    // heart monitor line
    const kw = Math.round(L.Wc * 0.3), kx = Math.round(L.Wc * 0.66), ky = Math.round(L.tableY - 40) - 4;
    const x0 = kx + kw * 0.15 + 6, x1 = kx + kw * 0.85 - 6, y = ky - 82, w = x1 - x0;
    g.strokeStyle = '#6dfca0'; g.lineWidth = 1.6; g.beginPath();
    const speed = beating ? 1.4 : 0.8;
    for (let i = 0; i <= 60; i++) {
      const u = i / 60, ph = (u * 2 + t * speed) % 1;
      const yy = ph > 0.42 && ph < 0.5 ? y - 9 * Math.sin((ph - 0.42) / 0.08 * Math.PI) : ph > 0.5 && ph < 0.55 ? y + 4 : y;
      i ? g.lineTo(x0 + u * w, yy) : g.moveTo(x0 + u * w, yy);
    }
    g.stroke();
  }

  window.__scenes = { bath, vet };
})();
