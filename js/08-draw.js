/* ============ drawing: one frame of the desktop overlay ============ */
const OUTC = '#33264f';
const R_ = (c, col, x, y, w, h) => { c.fillStyle = col; c.fillRect(x, y, w, h); };

function drawEmote(c) {
  const e = Room.emote;
  if (!e) return;
  const h = cat.headAbs;
  const u = e.t / e.dur, pop = Math.min(1, e.t / 0.12);
  c.globalAlpha = u > 0.8 ? (1 - u) / 0.2 : 1;
  const spr_ = EMOTE[e.type] || EMOTE.heart;
  c.drawImage(spr_, Math.round(h.x - 5), Math.round(h.y - 22 - (1 - pop) * 4 - Math.sin(e.t * 5) * 0.8));
  c.globalAlpha = 1;
}

// browser preview only: stand-ins for the real desktop icons and windows
function drawFakeIcons(c) {
  for (const ic of Desk.icons) {
    R_(c, '#f4c542', ic.cx - 6, ic.cy - 5, 12, 9); R_(c, '#f9dc7c', ic.cx - 6, ic.cy - 5, 5, 2); R_(c, 'rgba(255,255,255,0.6)', ic.cx - 8, ic.cy + 7, 16, 2);
  }
  for (const w of Desk.wins) { c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1; c.strokeRect(w.x, w.y, w.w, w.h); R_(c, 'rgba(255,255,255,0.25)', w.x, w.y, w.w, 6); }
}

function drawWorld(ctx, W_, H_) {
  ctx.clearRect(0, 0, W_, H_);
  if (Host.mock) drawFakeIcons(ctx);

  // furniture along the bottom-right edge + everything that moves, sorted by depth
  drawParts(ctx, 'ground');          // paw prints lie on the floor, under the cat and the furniture
  drawSunPatch(ctx);
  drawNip(ctx);
  const items = [];
  const home = isHome();
  if (!Adopt.open) {
  if (home && postOn()) items.push({ y: Room.post.gy, f: c => { propShadow(c, Room.post.x, Room.post.gy, 9); drawPost(c); } });
  if (home) items.push({ y: Room.box.by - 2, f: c => { propShadow(c, Room.box.x, Room.box.by, 18); drawBoxBack(c); } });
  if (home) items.push({ y: Room.box.by + 0.5, f: drawBoxFront });
  if (home && !Adopt.open) for (const k of FURN_KEYS) {
    const F = furnOf(k); if (!F) continue;
    items.push({ y: F.gy - 3.5, f: c => drawFurn(c, k, 'shadow') });
    for (const [layer, dy] of FURN_LAYERS[k]) items.push({ y: F.gy + dy, f: c => drawFurn(c, k, layer) });
  }
  if (Room.present) { const P = Room.present; items.push({ y: P.gy - 0.6, f: c => drawPresent(c, P) }); }
  if (Room.carry) items.push({ y: cat.gy + 0.4, f: drawCarry });
  if (Room.gift) { const G = Room.gift; items.push({ y: G.gy - 0.6, f: c => drawGift(c, G) }); }
  if (home) items.push({ y: Room.bowl.gy, f: c => { propShadow(c, Room.bowl.x, Room.bowl.gy, 8); drawBowl(c); } });
  if (home) items.push({ y: Room.water.gy, f: c => { propShadow(c, Room.water.x, Room.water.gy, 8); drawWater(c); } });
  if (home && bedOn()) items.push({ y: Room.cushion.gy - 6, f: c => { propShadow(c, Room.cushion.x, Room.cushion.gy, 16); drawCushion(c); } });
  }                                   // the furniture appears once the cat has been adopted
  if (home) for (const m of Room.messes) items.push({ y: m.gy - 0.5, f: c => drawMess(c, m) });
  if (Room.ball) items.push({ y: !Room.ball.ptrHeld && (Room.ball.carried || (Room.ball.held && cat.label === 'ball')) ? cat.gy + 0.6 : Room.ball.gy, f: drawBall });
  if (cat.visible) items.push({ y: cat.sortOverride !== null && cat.sortOverride !== undefined ? cat.sortOverride : cat.gy, f: c => drawCat(c, NOW) });
  items.sort((a, b) => a.y - b.y);
  for (const it of items) it.f(ctx);

  drawParts(ctx, 'air');
  drawWand(ctx); drawLaser(ctx); drawChuru(ctx); drawScoop(ctx); drawBrush(ctx);
  if (cat.visible) drawEmote(ctx);
}
