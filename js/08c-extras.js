/* ============ drawing of the new toys, the brush, catnip, gifts and the sunny spot ============ */

function drawMouseToy(c, b) {
  const lift = Math.min(1, b.z / 30);
  inArt(c, b.x, b.gy, g => aEll(g, `rgba(30,20,50,${0.22 - lift * 0.1})`, 0, 1, 6 - lift * 2, 2), PSPEC.shadowS);
  const dir = b.face || (b.vx < -3 ? -1 : 1);
  b.face = dir;
  const running = !!b.run && !b.carried;
  inArt(c, b.x, b.gy - b.z + (running ? Math.round(Math.sin(Room.t * 30) * 0.7) : 0), g => {
    g.scale(dir, 1);
    const sw = b.carried ? 0 : Math.round(Math.sin(Room.t * (running ? 22 : 5) + b.rot) * (running ? 2.2 : 1.4));
    if (b.carried) { aLine(g, PO, -6, -3, -9, 3, 4); aLine(g, '#e0a9bd', -6, -3, -9, 3, 2); }
    else { aLine(g, PO, -6, -4, -10, -2 + sw, 4); aLine(g, '#e0a9bd', -6, -4, -10, -2 + sw, 2); }       // tail
    aEllO(g, '#b9b2c8', 0, -5, 6, 4); aEll(g, '#d6d0e4', -1, -6, 4, 2);
    aEllO(g, '#b9b2c8', -1, -10, 2, 2); aEll(g, '#ffa6c4', -1, -10, 1, 1);
    aEllO(g, '#b9b2c8', 3, -10, 2, 2); aEll(g, '#ffa6c4', 3, -10, 1, 1);
    A(g, PO, 4, -6, 1, 2); A(g, '#ff7aa6', 7, -5, 2, 2); A(g, '#ffffff', -3, -7, 3, 1);
  }, PSPEC.mouse);
}

function drawNip(c) {
  const N = Room.nip;
  if (!N) return;
  inArt(c, N.x, N.gy, g => {
    aEll(g, 'rgba(30,20,50,0.2)', 0, 1, 8, 2);
    aEllO(g, '#5fbf62', 0, -3, 7, 3); aEll(g, '#86df7f', -2, -4, 4, 1);
    for (const [x, y] of [[-4, -6], [-1, -8], [3, -7], [5, -5], [-6, -4]]) { A(g, PO, x - 1, y - 1, 4, 4); A(g, '#6fcf6f', x, y, 2, 2); A(g, '#a8f0a0', x, y, 1, 1); }
    const s = Math.floor(Room.t * 3) % 3;
    A(g, '#fff6a8', -9 + s * 9, -14 - s * 2, 2, 2);
    A(g, '#fff6a8', 8 - s * 6, -11 + s, 1, 1);
  }, PSPEC.nip);
}

function drawBrush(c) {
  if (Interact.mode !== 'brush') return;
  const C = Desk.cursor;
  const sw = C.speed > 25 ? Math.round(Math.sin(NOW * 22) * 2) : 0;
  inArt(c, C.x + 4, C.y - 4, g => {
    g.translate(sw, 0);
    aLine(g, PO, 4, -6, 18, -22, 6); aLine(g, '#c58a56', 4, -6, 18, -22, 4); aLine(g, '#e4b57c', 5, -7, 17, -21, 1);
    boxO(g, -6, -8, 14, 8, '#7be0c3'); A(g, '#b8f4e3', -5, -7, 12, 2);
    for (let i = 0; i < 5; i++) { A(g, '#ffffff', -5 + i * 3, -1, 1, 3); }
  }, PSPEC.brush);
}

/* a warm patch of sunlight on the floor while the cat sunbathes */
function drawSunPatch(c) {
  if (cat.label !== 'sunbathe') { Room.sunA = Math.max(0, (Room.sunA || 0) - DT * 0.8); if (!Room.sunA) return; }
  else Room.sunA = Math.min(1, (Room.sunA || 0) + DT * 0.6);
  const s = sunSpot();
  if (!s.on && cat.label !== 'sunbathe') return;
  const x = s.x !== undefined ? s.x : cat.x, gy = s.gy !== undefined ? s.gy : cat.gy;
  // light falling through a window: a slanted patch with the shadow of the window frame
  inArt(c, x, gy, g => {
    g.globalAlpha = 0.2 * Room.sunA;
    for (let y = -10; y <= 10; y++) {
      if (Math.abs(y) <= 0) continue;                      // horizontal bar of the frame
      const sh = Math.round(y * 0.9);
      const x0 = -34 + sh, x1 = 34 + sh;
      g.fillStyle = '#ffe9a0';
      g.fillRect(x0, y, 33, 1); g.fillRect(x0 + 35, y, 33, 1);   // vertical bar of the frame between the two halves
    }
    g.globalAlpha = 1;
  });
}

/* a present dropped on the cat */
function drawGift(c, G) {
  const a = G.fade > 0 ? Math.max(0, 1 - G.fade / 1.2) : 1;
  inArt(c, G.x, G.gy, g => {
    g.globalAlpha = a;
    aEll(g, 'rgba(30,20,50,0.2)', 0, 1, 11, 2);
    switch (G.kind) {
      case 'paper':
        boxO(g, -10, -4, 20, 5, '#fffdf5'); A(g, '#b8b0c8', -8, -3, 13, 1); A(g, '#b8b0c8', -8, -1, 9, 1); A(g, '#e8475f', 6, -3, 3, 2);
        break;
      case 'photo':
        boxO(g, -10, -5, 20, 6, '#f4f8ff'); A(g, '#7bc0f0', -9, -4, 18, 3); A(g, '#6fbf6f', -9, -2, 18, 1); A(g, '#ffd04a', 4, -4, 3, 2);
        break;
      case 'box':
        boxO(g, -11, -10, 22, 10, '#d9a066'); A(g, '#e4b57c', -10, -9, 20, 2); A(g, '#f0d9a8', -1, -10, 2, 10); A(g, '#a97440', -10, -1, 20, 1);
        break;
      case 'media':
        aEllO(g, '#2a2548', 0, -4, 8, 4); aEll(g, '#4a4080', 0, -4, 5, 2); aEll(g, '#ff8fb1', 0, -4, 2, 1);
        A(g, '#fff6a8', 4, -12 + Math.round(Math.sin(Room.t * 4) * 1), 2, 4); A(g, '#fff6a8', 6, -12 + Math.round(Math.sin(Room.t * 4) * 1), 2, 1);
        break;
      case 'danger':
        for (let y = 0; y < 10; y++) { const w = 1 + Math.round(y * 0.8); A(g, PO, -w - 1, -11 + y, w * 2 + 3, 1); }
        for (let y = 0; y < 10; y++) { const w = 1 + Math.round(y * 0.8); A(g, '#e8475f', -w, -11 + y, w * 2 + 1, 1); }
        A(g, '#ffffff', -1, -7, 2, 4); A(g, '#ffffff', -1, -2, 2, 1);
        break;
      default:
        boxO(g, -8, -9, 16, 9, '#ff8fb1'); A(g, '#ffc2dc', -7, -8, 14, 2); A(g, '#fff0b0', -1, -9, 2, 9); A(g, '#fff0b0', -8, -5, 16, 2);
        boxO(g, -5, -13, 4, 4, '#fff0b0'); boxO(g, 1, -13, 4, 4, '#fff0b0');
    }
    g.globalAlpha = 1;
  }, PSPEC.gift);
}

/* the present the cat brings */
function giftBoxArt(g, open) {
  boxO(g, -9, -9, 18, 9, '#ff8fb1'); A(g, '#ffc2dc', -8, -8, 16, 2); A(g, '#fff0b0', -1, -9, 2, 9); A(g, '#fff0b0', -9, -5, 18, 2);
  boxO(g, -6, -14, 5, 5, '#fff0b0'); boxO(g, 1, -14, 5, 5, '#fff0b0');
}
function drawPresent(c, P) {
  inArt(c, P.x, P.gy, g => {
    aEll(g, 'rgba(30,20,50,0.2)', 0, 1, 11, 2);
    const bob = Math.round(Math.sin(Room.t * 4) * 1);
    g.translate(0, bob < 0 ? -1 : 0); giftBoxArt(g);
    A(g, '#fff6a8', -12 + Math.floor(Room.t * 3) % 3 * 12, -20, 2, 2);
  }, PSPEC.present);
}
function drawCarry(c) {
  const mp = mouthPoint();
  inArt(c, mp.x, mp.y + 2.5, g => { g.scale(0.8, 0.8); giftBoxArt(g); }, PSPEC.carry);
}
