/* ============ new tools & toys: toy mouse, catnip, brush ============ */

/* ---------- toy mouse: stalk, pounce, and sometimes bring it to you as a present ---------- */
function* bPlayMouse() {
  S('{n}가 쥐돌이를 발견했어요!');
  face('wide', 'closed', 'fwd');
  lookAt(() => (Room.ball ? { x: Room.ball.x, y: Room.ball.gy - Room.ball.z - 2 } : null), 1);
  setPose('crouch'); cat.wiggle = 0.4;
  let el = 0, carried = false, bats = 0;
  try {
    while (Room.ball && isHunt(Room.ball) && el < 40 && cat.needs.energy > 8) {
      el += DT;
      const b = Room.ball;
      if (b.held || b.ptrHeld) { yield; continue; }
      const dx = b.x - cat.x, dy = b.gy - cat.gy, d = Math.hypot(dx, dy * 1.4);
      const bs = Math.hypot(b.vx, b.vgy);
      if (d > 26) {
        setPose(d > 70 ? 'run' : 'crouch'); face('wide', 'closed', 'fwd'); cat.wiggle = 0;
        yield* walkTo(b.x - sgn(dx) * 11, b.gy, { speed: d > 70 ? SPD.run : SPD.creep * 1.6, arrive: false, tol: 3, timeout: 0.45, quick: true });
        continue;
      }
      if (sgn(dx) !== cat.dir && Math.abs(dx) > 4) { yield* turnTo(sgn(dx), true); continue; }
      if (bs > 25) { setPose('crouch'); cat.wiggle = 0.5; yield; continue; }
      cat.wiggle = 0;
      const a = wchoose([{ k: 'bat', w: 4 }, { k: 'pounce', w: 3 }, { k: 'carry', w: bats > 2 ? 4 : 0.6 }, { k: 'stare', w: 1.5 }]);
      if (a === 'stare') { setPose('crouch'); cat.wiggle = 0.9; yield* wait(rnd(0.6, 1.2)); cat.wiggle = 0; continue; }
      if (a === 'bat') {
        setPose('stand'); yield* wait(0.1); setPose('swat'); Snd.swat(); yield* wait(0.1);
        if (Room.ball) { const bb = Room.ball; bb.vx = cat.dir * rnd(40, 90); bb.vgy = rnd(-30, 30); bb.vz = rnd(14, 40); bb.face = cat.dir; bb.run = false; bb.runT = 1.2; }
        cat.needs.fun = Math.min(100, cat.needs.fun + 2);
        bats++; yield* wait(0.22); setPose('crouch'); continue;
      }
      if (a === 'pounce') {
        setPose('crouch'); cat.wiggle = 0.9; yield* wait(rnd(0.4, 0.8)); cat.wiggle = 0;
        if (!Room.ball) continue;
        yield* hop(clamp(Room.ball.x - cat.dir * 5, 12, W - 12), Room.ball.gy, 7, 0.4, { pre: 0.04, post: 0.05 });
        cat.needs.fun = Math.min(100, cat.needs.fun + 3);
        if (Room.ball && Math.hypot(Room.ball.x - cat.x, (Room.ball.gy - cat.gy) * 1.4) < 18) { Room.ball.run = false; Room.ball.runT = 1.8; Room.ball.vx = Room.ball.vgy = 0; }
        bats++; continue;
      }
      // carry it in the mouth to the user, like a hunting trophy
      S('{n}가 쥐돌이를 물고 어딘가로 가요');
      setPose('sniff'); yield* wait(0.4);
      if (!Room.ball || Room.ball.ptrHeld) continue;
      carried = true; b.held = true; b.vx = b.vgy = b.vz = 0; b.carried = true;
      face('shine', 'open1', 'fwd');
      const hold = () => {
        const bb = Room.ball; if (!bb) return;
        const mg = mouthGrip();                              // the middle of the mouth, just ahead of the muzzle
        bb.face = cat.dir; bb.carried = true; bb.run = false;
        placeToyAt(bb, mg.x, mg.up, true); bb.gy = cat.gy + 0.4; bb.z -= 0.4;
      };
      const tx = clamp(Desk.cursor.x + (chance(0.5) ? -30 : 30), 14, W - 14), ty = clamp(Desk.cursor.y + 16, GY_MIN, GY_MAX);
      let guard = 0, ok = true;
      while (guard++ < 400) {
        if (!Room.ball || Room.ball.ptrHeld) { ok = false; break; }
        hold();
        const ddx = tx - cat.x, ddy = ty - cat.gy;
        if (Math.abs(ddx) < 4 && Math.abs(ddy) < 5) break;
        setPose('stand', { hdy: 28 }, true);
        yield* walkTo(tx, ty, { speed: SPD.trot, timeout: 0.2, arrive: false, tol: 3, quick: true });
        hold();
      }
      if (Room.ball && ok) {
        S('{n}가 선물을 가져왔어요!');
        hold(); setPose('sit', { yaw: 0, hdx: 3 }); lookViewer(1);
        yield* wait(0.3); hold();
        const bb = Room.ball; bb.held = false; bb.carried = false; bb.x = cat.x + cat.dir * 10; bb.gy = cat.gy + 0.5; bb.z = 3; bb.vx = cat.dir * 8; bb.vz = 12; bb.run = false; bb.runT = 1.6;
        face('shine', 'open1'); emote('heart', 1.8); sayMeow('chirp', 0.8);
        cat.slowBlink = true; yield* wait(1.4); cat.slowBlink = false;
        markContent(); cat.needs.love = Math.min(100, cat.needs.love + 6);
        break;
      }
    }
  } finally {
    if (Room.ball && Room.ball.held && !Room.ball.ptrHeld) { Room.ball.held = false; Room.ball.carried = false; }
    cat.wiggle = 0; cat.add = {}; lookFree();
  }
  cat.toyCooldown = rnd(2, 5);
  setPose('sit'); face('half'); if (cat.needs.fun > 70) markContent();
  yield* wait(0.4); if (chance(0.6)) yield* lickNose();
}
BEH.mouse = bPlayMouse;

/* the toy mouse scurries around on its own, in short dashes, and runs away from a cat that gets close */
function updateMouseToy(b, dt) {
  b.runT = (b.runT === undefined ? 0 : b.runT) - dt;
  if (b.z > 0.5 || b.carried) return;
  if (b.runT <= 0) {
    if (b.run) { b.run = false; b.runT = rnd(0.5, 2); }
    else {
      b.run = true; b.runT = rnd(0.7, 1.8);
      const d = cat.visible ? Math.hypot(b.x - cat.x, (b.gy - cat.gy) * 1.4) : 999;
      b.ang = d < 38 && chance(0.7) ? Math.atan2(b.gy - cat.gy, b.x - cat.x) + rnd(-0.7, 0.7) : rnd(Math.PI * 2);
      b.sp = rnd(30, 56);
    }
  }
  if (!b.run) return;
  // turn back from the edges of the screen
  if ((b.x < 16 && Math.cos(b.ang) < 0) || (b.x > W - 16 && Math.cos(b.ang) > 0)) b.ang = Math.PI - b.ang;
  if ((b.gy < GY_MIN + 6 && Math.sin(b.ang) < 0) || (b.gy > GY_MAX - 4 && Math.sin(b.ang) > 0)) b.ang = -b.ang;
  b.vx = Math.cos(b.ang) * b.sp; b.vgy = Math.sin(b.ang) * b.sp * 0.55;
  b.face = b.vx < 0 ? -1 : 1;
}

/* ---------- catnip ---------- */
const NIP = { cd: 0 };
function placeNip() {
  if (Room.nip) { Room.nip = null; toast('캣닢을 치웠어요'); return; }
  if (NIP.cd > 0) { toast('캣닢은 한 번 쓰고 한참 쉬어야 해요 (' + Math.ceil(NIP.cd / 60) + '분 뒤)'); return; }
  if (cat.protect) { toast('지금은 볼일 중이에요'); return; }
  const x = clamp(cat.x + (chance(0.5) ? -1 : 1) * rnd(34, 70), 24, W - 30), gy = clamp(cat.gy + rnd(-6, 6), GY_MIN + 4, GY_MAX);
  Room.nip = { x, gy, t: 0 };
  Snd.pop(); toast('캣닢을 놓았어요');
  if (!cat.asleep || cat.needs.energy > 40) interrupt(bNip, 'nip');
  else later(1.5, () => { if (Room.nip) interrupt(bNip, 'nip'); });
}
function* bNip() {
  const N = Room.nip;
  if (!N) return;
  S('{n}가 캣닢 냄새에 코를 킁킁거려요');
  face('wide', 'closed', 'fwd'); emote('alert', 1.2);
  yield* walkTo(N.x - cat.dir * 8, N.gy, { speed: SPD.trot, tol: 2, timeout: 12 });
  if (!Room.nip) return;
  yield* turnTo(sgn(N.x - cat.x), true);
  setPose('sniff'); face('shine'); S('{n}가 캣닢을 킁킁 맡아요');
  yield* wait(2.2, e => { cat.add.hdy = Math.sin(e * 9) * 0.8; cat.add.hdx = Math.sin(e * 6) * 1.2; });
  cat.add = {};
  // rubbing the cheek on it
  S('{n}가 캣닢에 얼굴을 비벼요');
  setPose('crouch', { hdy: 9, pitch: -0.5 }); face('happy'); cat.blush = 1; cat.purr = 0.8;
  yield* wait(3, e => { cat.add.hdx = Math.sin(e * 8) * 2.4; cat.add.hdy = Math.sin(e * 16) * 0.5; cat.needs.love = Math.min(100, cat.needs.love + 3 * DT); });       // the affection gauge fills while it enjoys the catnip
  cat.add = {};
  // roll around
  S('{n}가 캣닢에 취해 데굴데굴 굴러요');
  setPose('lieSide'); face('happy'); yield* wait(0.5);
  setPose('bellyUp'); face('happy', 'open1');
  yield* wait(rnd(4, 6), e => {
    cat.add.fNy = Math.sin(e * 6) * 2.5; cat.add.hNy = Math.sin(e * 6 + 1) * 2.5; cat.add.fFy = Math.sin(e * 6 + 2) * 2; cat.add.hFy = Math.sin(e * 6 + 3) * 2;
    cat.add.cx = Math.sin(e * 3) * 1.2;
    cat.needs.love = Math.min(100, cat.needs.love + 3.5 * DT);
    if (chance(DT * 3)) burstHearts(cat.headAbs.x, cat.headAbs.y - 8, 1);
  });
  cat.add = {};
  setPose('lieSide'); face('half'); yield* wait(0.4);
  setPose('stand'); face('dizzy'); cat.blush = 1; cat.purr = 0;
  S('{n}가 해롱해롱 걸어요');
  yield* wait(4, e => {
    cat.add.hdx = Math.sin(e * 3) * 2; cat.add.hdy = Math.cos(e * 2.3) * 1.5; cat.add.cx = Math.sin(e * 3 + 1) * 1;
    if (chance(DT * 0.8)) { cat.moving = true; cat.speed = 9; cat.x = clamp(cat.x + cat.dir * 5 * DT * 6, 12, W - 12); }
  });
  cat.add = {};
  Room.nip = null;
  const n = cat.needs;
  n.fun = Math.min(100, n.fun + 35); n.love = Math.min(100, n.love + 15); cat.affinity = Math.min(0.98, cat.affinity + 0.02); n.energy = Math.max(10, n.energy - 15);
  NIP.cd = 480;
  // then the zoomies
  yield* bZoomies(true, true);
  S('{n}가 지쳐서 쓰러져요');
  yield* sleepHere(0.5);
}
BEH.nip = bNip;
function updateTools(dt) {
  NIP.cd = Math.max(0, NIP.cd - dt);
  if (Room.nip) Room.nip.t += dt;
  if (Room.nip && Room.nip.t > 120 && cat.label !== 'nip') Room.nip = null;
}
