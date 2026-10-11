'use strict';
/* ============ mobile host: replaces the Electron bridge on phones ============
   Loaded before the game scripts. The desktop build talks to Electron through
   window.catdesk; here the same interface is fed from touch events instead.

   Touch rules (desktop uses hover-to-pet and press-to-carry, which collide on a phone):
   - tap the cat (tap, tap, tap)            -> petting
   - rub a finger over the cat              -> petting
   - hold still on the cat ~0.6 s (1 s while it is being petted), then move     -> pick the cat up and carry it (a short buzz confirms the grab)
*/
(function () {
  const OFF = -99999;
  // live wallpaper (Android): the launcher owns long-press, so the cat is never lifted there
  const WALLPAPER = /[?&]wallpaper=1/.test(location.search);
  const HOLD_MS = 600;          // a still press this long grabs the cat
  const HOLD_PETTING_MS = 1000; // while the cat is being petted a resting hand should not lift it so easily
  const MOVE_PX = 12;           // finger travel before the grab that turns the press into rubbing
  const TAP_MS = 300;           // a press shorter than this is a tap
  const TAP_LINGER_MS = 700;    // after a tap the "hand" stays on the cat briefly, so taps in a row keep the petting going
  const FINGER_PX = 28;         // a fingertip is far less precise than a mouse: anything this close counts as touching

  const L = { cursor: [], desk: [] };
  let pos = { x: OFF, y: OFF };
  const emit = () => { for (const f of L.cursor) f(pos); };
  const setPos = (x, y) => { pos = { x, y }; emit(); };

  let press = null;             // { id, sx, sy, at, hit, moved, carried, timer }
  let leaveT = null;

  const isTouch = e => e.pointerType === 'touch' || e.pointerType === 'pen';
  const logical = e => ({ x: e.clientX / S_PX, y: e.clientY / S_PX });
  const overDock = e => e.target && e.target.closest && e.target.closest('[data-hit], #adopt, #skinMenu, #panel');

  // anything the desktop click handler would grab before the cat itself
  // small things (presents, poop, toys) win over the cat; big furniture (bowls, litter box, beds) only when the finger is not on the cat
  function smallThingAt(q) {
    try { return presentHit(q.x, q.y) || giftHit(q.x, q.y) || messAt(q.x, q.y, 9) || ballHit(q.x, q.y) || churuHit(q.x, q.y); } catch (e) { return false; }
  }
  function bigThingAt(q) {
    try { return furnAt(q.x, q.y) || propAt(q.x, q.y); } catch (e) { return false; }
  }
  const catReady = () => typeof cat !== 'undefined' && cat && cat.visible && !cat.onIcon;
  // nearest point that is really on the cat's body, within a finger's reach of q (logical px), or null
  function nearestCat(q) {
    if (!catReady()) return null;
    try {
      if (catHit(q.x, q.y)) return q;
      const r = Math.ceil(FINGER_PX / S_PX);
      let best = null, bd = Infinity;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const d = dx * dx + dy * dy;
        if (d >= bd || d > r * r) continue;
        if (catHit(q.x + dx, q.y + dy)) { best = { x: q.x + dx, y: q.y + dy }; bd = d; }
      }
      return best;
    } catch (e) { return null; }
  }
  function feedOnCat(e) {
    const hit = nearestCat(logical(e));
    if (hit) setPos(hit.x * S_PX, hit.y * S_PX); else setPos(e.clientX, e.clientY);
    return hit;
  }
  function pet(silent) {
    try { if (cat.label !== 'pet' && cat.label !== 'carried') startPetting(silent); } catch (e) { /* game not ready */ }
  }
  const leaveAfter = ms => { clearTimeout(leaveT); leaveT = setTimeout(() => setPos(OFF, OFF), ms); };

  const bathing = () => !!window.__bathOpen;   // the bath (mobile-life.js) handles its own touches

  window.addEventListener('pointerdown', e => {
    if (!isTouch(e) || bathing()) return;
    clearTimeout(leaveT);
    if (overDock(e) || (typeof Adopt !== 'undefined' && Adopt.open)) { setPos(e.clientX, e.clientY); return; }
    const q = logical(e);
    if (smallThingAt(q)) { setPos(e.clientX, e.clientY); return; }   // toys, poop, presents: the game handles them
    let onCat = false; try { onCat = catReady() && !!catHit(q.x, q.y); } catch (err) { onCat = false; }
    if (!onCat && bigThingAt(q)) { setPos(e.clientX, e.clientY); return; }   // bowls, litter box, furniture next to the cat
    const hit = onCat ? q : nearestCat(q);
    if (!hit) { setPos(e.clientX, e.clientY); return; }
    e.stopImmediatePropagation();                          // keep the desktop "press = carry" from firing at once
    if (typeof Snd !== 'undefined' && Snd.wake) Snd.wake();
    // while deciding between tap / rub / grab, the hand is kept off the cat so nothing starts early
    setPos(OFF, OFF);
    press = { id: e.pointerId, sx: e.clientX, sy: e.clientY, at: performance.now(), hit, moved: false, carried: false };
    if (WALLPAPER) return;
    const holdMs = (typeof cat !== 'undefined' && cat && cat.label === 'pet') ? HOLD_PETTING_MS : HOLD_MS;
    press.timer = setTimeout(() => {
      if (!press || press.moved) return;
      press.carried = true;
      try { if (navigator.vibrate) navigator.vibrate(25); } catch (err) { /* not supported */ }
      setPos(press.lx !== undefined ? press.lx : press.sx, press.ly !== undefined ? press.ly : press.sy);
      startCarry(logical({ clientX: pos.x, clientY: pos.y }));
    }, holdMs);
  }, true);

  window.addEventListener('pointermove', e => {
    if (bathing()) return;
    if (e.pointerType === 'mouse') { setPos(e.clientX, e.clientY); return; }
    if (!isTouch(e)) return;
    if (!press) { setPos(e.clientX, e.clientY); return; }
    press.lx = e.clientX; press.ly = e.clientY;
    if (press.carried) { setPos(e.clientX, e.clientY); return; }   // carrying follows the finger exactly
    if (!press.moved && Math.hypot(e.clientX - press.sx, e.clientY - press.sy) > MOVE_PX) {
      press.moved = true; clearTimeout(press.timer);       // moved before the grab: this is rubbing
    }
    if (press.moved) feedOnCat(e);
  }, true);

  function release(e) {
    if (!isTouch(e)) return;
    const p = press; press = null;
    if (!p) { leaveAfter(60); return; }
    clearTimeout(p.timer);
    const quick = performance.now() - p.at < TAP_MS;
    if (!p.carried && !p.moved && quick) {
      // a tap: rest the hand on the cat for a moment and pet
      setPos(p.hit.x * S_PX, p.hit.y * S_PX);
      pet(true);
      leaveAfter(TAP_LINGER_MS);
      return;
    }
    leaveAfter(60);                                        // the finger is gone, so is the "hover"
  }
  window.addEventListener('pointerup', release, true);
  window.addEventListener('pointercancel', release, true);

  // phones may freeze or kill a background page without "beforeunload", so save when hidden
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { try { saveState(); } catch (e) { /* game not ready */ } }
  });

  window.catdesk = {
    mock: true,                                  // reuse the game's own browser layout path
    mobile: true,
    display: { w: innerWidth, h: innerHeight, workBottom: innerHeight - 40, scale: 1 },
    onCursor: f => L.cursor.push(f),
    onDesk: f => { L.desk.push(f); setTimeout(() => f({ icons: [], sx: 75, sy: 98, wins: [] }), 0); },
    onCommand: () => {},
    hideFs: { get: () => false, set: () => false },
    behind: { get: () => false, set: () => false },
    autostart: { get: () => ({ on: false, ok: false }), set: () => ({ on: false, ok: false }) },
    setCapture() {}, setFocusable() {},
    quit() { if (typeof toast === 'function') toast('홈 버튼으로 나가면 돼요. 고양이는 그대로 기다려요'); }
  };
})();
