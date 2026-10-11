/* ============ desktop behaviours: folders, cursor, window edges, screen edges ============ */

function* bFall() {
  S('{n}가 발을 헛디뎠어요!');
  face('wide', 'closed', 'flat'); emote('alert', 1);
  yield* hop(cat.x, clamp(cat.gy + 14, GY_MIN, GY_MAX), 4, 0.4, { pre: 0.02, post: 0.15 });
  cat.surface = 'floor'; cat.plat = null;
  face('half'); yield* wait(0.3); yield* lickNose();
}

/* ---------- sit on a folder like a loaf of bread ---------- */
function nearestIcons(n) {
  return visibleIcons().slice().sort((a, b) => Math.hypot(a.cx - cat.x, a.cy - cat.gy) - Math.hypot(b.cx - cat.x, b.cy - cat.gy)).slice(0, n);
}
function* bLoafOnIcon() {
  const cands = nearestIcons(14);
  if (!cands.length) return;
  const ic = pick(cands);
  S('{n}가 폴더 하나를 찜했어요');
  yield* walkTo(ic.cx, ic.cy + 13, { speed: wchoose([{ k: SPD.stroll, w: 3 }, { k: SPD.walk, w: 4 }, { k: SPD.trot, w: 1 }]), tol: 2 });
  if (!iconAt(ic.cx, ic.cy, 6) || !visibleIcons().includes(ic)) return;
  yield* turnTo(-cat.dir); yield* wait(0.1);
  setPose('sniff'); yield* wait(0.5); setPose('stand');
  yield* turnTo(-cat.dir);
  if (chance(0.5)) {
    S('{n}가 폴더를 꾹꾹이로 다져요');
    yield* knead();
  }
  setPose('crouch'); face('half'); yield* wait(0.3);
  setPose(chance(0.8) ? 'loaf' : 'sphinx'); face('half');
  S('{n}가 폴더를 깔고 식빵을 굽는 중');
  cat.slowBlink = chance(0.6);
  const dur = rnd(18, 48);
  let el = 0, nx = rnd(2, 5), annoyed = 0;
  while (el < dur) {
    el += DT;
    const C = Desk.cursor;
    const onIt = C.x > ic.x - 6 && C.x < ic.x + ic.w + 6 && C.y > ic.y - 6 && C.y < ic.y + ic.h + 6;
    if (onIt) {
      annoyed += DT;
      if (annoyed > 1.0) { cat.earN = 'flat'; cat.earF = 'flat'; face('annoyed', 'closed', 'flat'); cat.tailFlick = 40; S('{n}가 마우스가 올라오자 신경질을 내요'); }
      if (annoyed > 2.6) { say('흥!', 'pop'); break; }
    } else if (annoyed > 0) {
      annoyed = Math.max(0, annoyed - DT * 2);
      if (annoyed === 0) { face('half'); S('{n}가 폴더를 깔고 식빵을 굽는 중'); }
    }
    if (!visibleIcons().includes(ic)) break;
    if (el > nx) {
      nx = el + rnd(3, 7);
      const a = wchoose([{ k: 'doze', w: 3 }, { k: 'look', w: 1.5 }, { k: 'lick', w: 1 }, { k: 'yawn', w: 1 }, { k: 'sblink', w: 1.5 }]);
      if (a === 'doze') {
        cat.eyes = 'sleep';
        yield* wait(rnd(2, 5), e => { cat.add.hdy = -Math.abs(Math.sin(e * 0.9)) * 1.5; });
        cat.add.hdy = 0; cat.eyes = 'half';
      } else if (a === 'lick') yield* lickNose();
      else if (a === 'yawn') yield* yawn();
      else if (a === 'sblink') yield* slowBlinkAtViewer();
    }
    yield;
  }
  cat.slowBlink = false;
  if (annoyed < 2.6 && cat.needs.energy < 70 && chance(0.5)) yield* sleepHere(0.7);
}

/* ---------- 냥냥펀치: bat a folder, then run away ---------- */
function* bPunchIcon() {
  const cands = nearestIcons(16);
  if (!cands.length) return;
  const ic = pick(cands);
  const side = chance(0.5) ? -1 : 1;
  S('{n}가 폴더를 노려봐요…');
  yield* walkTo(ic.cx + side * 14, ic.cy + 9, { speed: SPD.trot, tol: 2 });
  if (!visibleIcons().includes(ic)) return;
  if (cat.dir !== -side) yield* turnTo(-side);
  setPose('crouch'); face('wide', 'closed', 'fwd'); lookAtPt(ic.cx, ic.cy, 1);
  cat.wiggle = 0.8;
  yield* wait(rnd(0.7, 1.4));
  cat.wiggle = 0;
  // tentative tap, then check the surroundings
  setPose('swat'); Snd.swat(); yield* wait(0.18);
  setPose('crouch'); lookViewer(0.9); yield* wait(0.5);
  lookAtPt(ic.cx, ic.cy, 1);
  S('{n}가 폴더에 냥냥펀치를 날려요!'); emote('punch', 1.4);
  const n = rint(8, 16);
  for (let i = 0; i < n; i++) {
    if (!visibleIcons().includes(ic)) break;
    const near = i % 2 === 0;
    setPose('swat', near ? {} : { fNx: 8, fNy: 0, fFx: 15, fFy: 9 });
    cat.add.hx = 1.2;
    yield* wait(0.07);
    Snd.swat();
    spawn('impact', ic.cx, ic.cy, { life: 0.35, rot: rnd(3) });
    spawn('wob', ic.cx, ic.cy, { life: 0.3 });
    if (i % 4 === 1) say(pick(['퍽!', '탁!', '퍽퍽!', '냥!']), 'pop');
    cat.add.hx = 0;
    setPose('crouch');
    yield* wait(rnd(0.05, 0.12));
  }
  cat.add = {};
  cat.needs.fun = Math.min(100, cat.needs.fun + 6);
  setPose('sit'); face('half'); lookViewer(0.8);
  S('{n}는 아무 짓도 안 했다는 표정이에요'); emote('dots', 1.4);
  yield* wait(rnd(0.8, 1.6));
  lookFree();
  if (chance(0.7)) {
    S('{n}가 도망쳐요!');
    face('wide', 'closed', 'back'); setPose('run');
    const fx = clamp(cat.x + (cat.x < W / 2 ? 1 : -1) * rnd(160, 320), 14, W - 14);
    const fy = clamp(cat.gy + rnd(-60, 60), GY_MIN, GY_MAX);
    yield* walkTo(fx, fy, { speed: SPD.sprint, arrive: false, tol: 8, timeout: 3.5, quick: true });
    setPose('stand'); yield* wait(0.2);
    setPose('sit'); lookAtPt(ic.cx, ic.cy, 0.8); face('open');
    yield* wait(rnd(1, 2));
    lookFree();
  }
}

/* ---------- the mouse cursor ---------- */
function* pounceCursor() {
  const C = Desk.cursor;
  S('{n}가 커서를 사냥해요!');
  setPose('crouch'); face('wide', 'closed', 'fwd'); cat.wiggle = 0.9;
  yield* wait(rnd(0.6, 1.1)); cat.wiggle = 0;
  if (sgn(C.x - cat.x) !== cat.dir && Math.abs(C.x - cat.x) > 4) yield* turnTo(sgn(C.x - cat.x), true);
  const tx = clamp(C.x - cat.dir * 8, cat.x - 34, cat.x + 34);
  const gyT = clamp(C.y + 9, GY_MIN, GY_MAX);
  yield* hop(tx, resolveWall(tx, gyT, cat.gy), 8, 0.42, { pre: 0.08 });
  setPose('swat'); Snd.swat();
  spawn('impact', C.x, C.y, { life: 0.35, rot: rnd(3) });
  say('잡았다!', 'pop'); emote('star', 1.4);
  cat.needs.fun = Math.min(100, cat.needs.fun + 4);
  yield* wait(0.35);
  setPose('crouch'); yield* wait(0.2);
}

function* bFollowCursor() {
  const C = Desk.cursor;
  S('{n}가 마우스 커서를 졸졸 따라와요');
  face('open', 'closed', 'fwd'); setPose('stand');
  lookAt(() => ({ x: C.x, y: C.y }), 1);
  const dur = rnd(12, 28);
  let el = 0, sat = 0;
  while (el < dur) {
    el += DT;
    const dx = C.x - cat.x, ty = clamp(C.y + 10, GY_MIN, GY_MAX), dy = ty - cat.gy;
    const dist = Math.hypot(dx, dy * 1.2);
    if (C.speed > 280 && dist > 36) {
      setPose('run'); face('wide', 'closed', 'fwd'); sat = 0;
      yield* walkTo(C.x - sgn(dx) * 20, ty, { speed: SPD.run, timeout: 0.3, arrive: false, quick: true, tol: 4 });
      continue;
    }
    if (dist > 38) {
      setPose('stand'); face('open', 'closed', 'fwd'); sat = 0;
      yield* walkTo(C.x - sgn(dx) * 24, ty, { speed: dist > 90 ? SPD.trot : SPD.walk, timeout: 0.4, arrive: true, tol: 3 });
      continue;
    }
    if (Math.abs(dx) > 6 && sgn(dx) !== cat.dir) { yield* turnTo(sgn(dx)); continue; }
    setPose('sit'); face('open'); sat += DT;
    cat.add.tAng = Math.sin(NOW * 2.4) * 8;
    if (C.idle > 3 && sat > 2.5 && chance(DT * 0.7)) { cat.add.tAng = 0; yield* pounceCursor(); sat = 0; setPose('stand'); continue; }
    if (C.idle > 12 && sat > 6) break;
    yield;
  }
  cat.add = {}; lookFree();
  setPose('sit'); face('half'); yield* wait(0.4);
}

function* bHuntCursor() {
  const C = Desk.cursor;
  S('{n}가 커서를 노리고 살금살금 다가가요');
  face('wide', 'closed', 'fwd'); setPose('crouch');
  lookAt(() => ({ x: C.x, y: C.y }), 1);
  let el = 0;
  while (el < 14) {
    el += DT;
    const dx = C.x - cat.x, ty = clamp(C.y + 9, GY_MIN, GY_MAX), dist = Math.hypot(dx, (ty - cat.gy) * 1.2);
    if (C.speed > 350 && dist < 140) {                     // too fast: dart after it
      setPose('run'); yield* walkTo(C.x - sgn(dx) * 14, ty, { speed: SPD.sprint, timeout: 0.35, arrive: false, quick: true, tol: 4 });
      setPose('crouch'); continue;
    }
    if (dist > 36) {
      setPose('crouch'); cat.wiggle = 0;
      yield* walkTo(C.x - sgn(dx) * 22, ty, { speed: dist > 120 ? SPD.walk : SPD.creep * 1.3, timeout: 0.4, arrive: false, tol: 3 });
      continue;
    }
    if (Math.abs(dx) > 6 && sgn(dx) !== cat.dir) { yield* turnTo(sgn(dx), true); continue; }
    cat.wiggle = 0.5;
    if (C.speed < 140 && chance(DT * 1.4)) { yield* pounceCursor(); if (chance(0.5)) break; setPose('crouch'); continue; }
    yield;
  }
  cat.wiggle = 0; cat.add = {}; lookFree();
  setPose('sit'); face('half'); yield* wait(0.4);
}

function* bShyCursor() {
  const C = Desk.cursor;
  S('{n}가 마우스를 피해 도망다녀요');
  face('open', 'closed', 'back'); setPose('sit');
  lookAt(() => ({ x: C.x, y: C.y }), 1);
  const dur = rnd(15, 32);
  let el = 0;
  while (el < dur) {
    el += DT;
    const dist = Math.hypot(C.x - cat.x, (C.y - cat.gy) * 0.9);
    if (dist < 50 || (dist < 80 && C.speed > 260)) {
      const ang = Math.atan2(cat.gy - C.y, cat.x - C.x) + rnd(-0.7, 0.7);
      const d = rnd(90, 160);
      const tx = clamp(cat.x + Math.cos(ang) * d, 14, W - 14);
      const ty = clamp(cat.gy + Math.sin(ang) * d * 0.7, GY_MIN, GY_MAX);
      setPose('run'); face('wide', 'closed', 'flat'); S('{n}가 슝! 도망쳐요');
      yield* walkTo(tx, ty, { speed: dist < 30 ? SPD.sprint : SPD.run, timeout: 1.6, arrive: false, quick: true, tol: 6 });
      setPose('stand'); yield* wait(0.2);
      setPose('sit'); face('open', 'closed', 'fwd'); S('{n}가 멀리서 커서를 지켜봐요');
      if (chance(0.4)) { emote('ask', 1.2); }
      continue;
    }
    if (dist > 130 && C.idle > 2.5) {
      setPose('crouch'); face('wide', 'closed', 'fwd'); S('{n}가 슬금슬금 다가오다 멈춰요');
      yield* walkTo(C.x + (cat.x < C.x ? -85 : 85), clamp(C.y + 10, GY_MIN, GY_MAX), { speed: SPD.creep * 1.4, timeout: 0.5, arrive: false, tol: 5 });
      continue;
    }
    setPose('sit'); face('open', 'closed', 'fwd');
    if (chance(DT * 0.25)) cat.tailFlick = 40;
    yield;
  }
  lookFree();
}

/* ---------- sit on the top edge of an app window ---------- */
function* edgeWalk(p, tx) {
  yield* standUpIfSeated();
  tx = clamp(tx, p.x0, p.x1);
  let guard = 0;
  while (Math.abs(tx - cat.x) > 2 && guard++ < 1200) {
    if (sgn(tx - cat.x) !== cat.dir) { yield* turnTo(sgn(tx - cat.x)); continue; }
    cat.moving = true;
    cat.speed = approach(cat.speed, SPD.stroll, DT * 60);
    cat.x += cat.dir * cat.speed * DT;
    yield;
  }
}
function* bPerchWindow() {
  const list = platforms().filter(p => platformVisibleAt(p, clamp(cat.x, p.x0, p.x1)));
  if (!list.length) return;
  const p = pick(list);
  S('{n}가 열린 창문 위로 올라가요');
  const px = rnd(p.x0, p.x1);
  setPose('stand'); face('open');
  yield* walkTo(px, p.y + 6, { speed: SPD.walk, tol: 3 });
  const p2 = platformById(p.id);
  if (!p2) return;
  setPose('crouch'); yield* wait(0.25);
  yield* hop(px, p2.y, 8, 0.5);
  cat.surface = 'platform'; cat.plat = p.id;
  S('{n}가 창문 모서리에 앉아 아래를 내려다봐요');
  setPose('sit'); face('open');
  const dur = rnd(14, 38);
  let el = 0, nx = rnd(1.5, 3);
  while (el < dur && cat.surface === 'platform') {
    el += DT;
    if (el > nx) {
      nx = el + rnd(2.5, 6);
      const a = wchoose([{ k: 'walk', w: 3 }, { k: 'groom', w: 1.5 }, { k: 'yawn', w: 1 }, { k: 'tilt', w: 1.2 }, { k: 'loaf', w: 1.5 }, { k: 'none', w: 2 }]);
      const pl = platformById(cat.plat);
      if (!pl) break;
      if (a === 'walk') { setPose('stand'); yield* edgeWalk(pl, rnd(pl.x0, pl.x1)); setPose('sit'); }
      else if (a === 'groom') yield* bGroom();
      else if (a === 'yawn') yield* yawn();
      else if (a === 'tilt') yield* headTilt();
      else if (a === 'loaf') {
        setPose('crouch'); yield* wait(0.3); setPose('loaf'); face('half');
        S('{n}가 창문 위에서 식빵을 구워요');
        yield* wait(rnd(5, 12));
        setPose('sit'); face('open');
      }
    }
    yield;
  }
}
bPerchWindow.keepSurface = true;

/* ---------- peek in from the edge of the screen ---------- */
function* bPeek() {
  const left = cat.x < W / 2 ? chance(0.7) : chance(0.3);
  const gy = clamp(cat.gy + rnd(-40, 40), GY_MIN + 10, Room.oy - 10 > GY_MIN + 20 ? Room.oy - 10 : GY_MAX);
  S('{n}가 화면 가장자리로 가요');
  setPose('stand');
  const edgeX = left ? 22 : W - 22;
  yield* walkTo(edgeX, gy, { speed: SPD.walk });
  // walk (on all four paws) until half the body is off-screen, then turn round and sit
  const ox = left ? 1 : W - 1;
  yield* turnTo(left ? -1 : 1);
  setPose('stand');
  yield* walkXOnly(ox, SPD.stroll);
  yield* turnTo(left ? 1 : -1);
  setPose('sit'); face('open');
  S('{n}가 화면 끝에서 빼꼼 쳐다봐요');
  let t = 0;
  cat.speed = 0;
  lookAt(() => ({ x: Desk.cursor.x, y: Desk.cursor.y }), 1);
  const dur = rnd(6, 14);
  while (t < dur) {
    t += DT;
    if (chance(DT * 0.3)) { cat.twN = 0.14; }
    if (chance(DT * 0.15)) { yield* headTilt(); }
    if (Desk.cursor.speed > 400 && Math.hypot(Desk.cursor.x - cat.x, Desk.cursor.y - cat.gy) < 60) { emote('alert', 1); break; }
    yield;
  }
  lookFree(); setPose('stand'); face('open');
  yield* walkXOnly(edgeX, SPD.walk);
}
// straight walk along x with the legs moving (never slide a sitting cat)
function* walkXOnly(tx, sp) {
  yield* standUpIfSeated();
  let g = 0;
  while (Math.abs(tx - cat.x) > 0.8 && g++ < 1500) {
    cat.moving = true;
    cat.speed = approach(cat.speed, sp, DT * 60);
    cat.x += sgn(tx - cat.x) * Math.min(cat.speed * DT, Math.abs(tx - cat.x));
    yield;
  }
}

/* ---------- being picked up and moved aside ---------- */
function* bCarried() {
  S('{n}가 번쩍 들려서 대롱대롱 매달렸어요');
  cat.surface = 'floor'; cat.plat = null; cat.sortOverride = null; cat.speed = 0; cat.wiggle = 0;
  setPose('carried'); face('half', 'closed', 'back'); lookFree();
  Snd.meow('mew', 0.45);
  const C = Desk.cursor;
  let t = 0;
  try {
    while (Interact.drag && Interact.drag.kind === 'cat') {
      t += DT;
      const wantG = clamp(C.y + 40, GY_MIN, GY_MAX);
      cat.x += (C.x - cat.dir * 2 - cat.x) * Math.min(1, DT * 12);
      cat.gy += (wantG - cat.gy) * Math.min(1, DT * 12);
      cat.x = clamp(cat.x, 8, W - 8);
      cat.z = Math.max(5, cat.gy - (C.y + 32));
      if (Math.abs(C.vx) > 50) cat.dir = sgn(C.vx);
      const sw = clamp(-C.vx * 0.04, -5, 5), idle = Math.sin(t * 2.2) * 1.2;
      cat.add.hx = sw * 0.8 + idle; cat.add.cx = sw * 0.4 + idle * 0.5; cat.add.hdx = sw * 0.3;
      cat.add.fNx = sw * 0.3; cat.add.hNx = sw * 0.6; cat.add.hFx = sw * 0.6;
      cat.add.tAng = clamp(-C.vx * 0.1, -20, 20);
      if (t > 4 && cat.eyes === 'half') face('sleep', 'closed', 'back');
      yield;
    }
  } finally { cat.z = 0; cat.add = {}; }
  // let go: a short drop
  const z0 = Math.max(cat.z, 6);
  const dropped = t;
  cat.busy = true;
  try {
    let u = 0;
    while (u < 0.2) { u += DT; cat.z = z0 * (1 - u / 0.2); yield; }
    cat.z = 0;
  } finally { cat.busy = false; cat.z = 0; }
  burstDust(cat.x, cat.gy + 1, 5, 0); Snd.thump();
  cat.petCooldown = Math.max(cat.petCooldown, 5);
  setPose('crouch'); face('wide', 'closed', 'flat'); yield* wait(0.18);
  if (dropped < 1.2 && cat.affinity > 0.5) {
    S('{n}가 얌전히 비켜줬어요'); setPose('sit'); face('half'); yield* shiver(); yield* lickNose();
  } else if (dropped > 4 || cat.affinity < 0.4) {
    S('{n}가 기분이 상했어요'); cat.affinity = Math.max(0.2, cat.affinity - 0.02); cat.needs.love = Math.max(0, cat.needs.love - 3);
    setPose('stand'); face('annoyed', 'closed', 'flat'); cat.tailFlick = 55; emote('alert', 1.2); Snd.hiss();
    yield* wait(0.4);
    yield* walkTo(clamp(cat.x + (chance(0.5) ? -1 : 1) * rnd(50, 90), 14, W - 14), clamp(cat.gy + rnd(-10, 10), GY_MIN, GY_MAX), { speed: SPD.trot });
    setPose('sit'); face('half'); yield* wait(0.4); yield* bGroom();
  } else {
    S('{n}가 몸을 털고 아무 일 없었던 척해요'); setPose('stand'); face('half'); yield* shiver();
    setPose('sit'); yield* wait(0.3); yield* bGroom();
  }
}

/* ---------- bored: pester the user until someone plays ---------- */
function* bPester() {
  cat.pesterCooldown = rnd(30, 55);
  S('{n}가 심심해서 자꾸 귀찮게 해요');
  const C = Desk.cursor;
  face('shine', 'closed', 'fwd');
  let el = 0;
  const dur = rnd(14, 24);
  while (el < dur && cat.needs.fun < 45) {
    el += DT;
    const dx = C.x - cat.x, dist = Math.hypot(dx, (C.y + 10 - cat.gy) * 1.2);
    if (dist > 32) {
      setPose('stand'); face('shine', 'closed', 'fwd'); lookAt(() => ({ x: C.x, y: C.y }), 1);
      yield* walkTo(C.x - sgn(dx) * 14, clamp(C.y + 12, GY_MIN, GY_MAX), { speed: SPD.trot, timeout: 0.4, arrive: true, tol: 3 });
      continue;
    }
    if (Math.abs(dx) > 5 && sgn(dx) !== cat.dir) { yield* turnTo(sgn(dx), true); continue; }
    const a = wchoose([{ k: 'swat', w: 4 }, { k: 'meow', w: 2.5 }, { k: 'stare', w: 2 }, { k: 'flop', w: 1 }, { k: 'bump', w: 1.5 }]);
    lookAt(() => ({ x: C.x, y: C.y }), 1);
    if (a === 'swat') {
      S('{n}가 마우스를 툭툭 건드려요');
      const n = rint(2, 5);
      for (let i = 0; i < n; i++) {
        setPose('swat', i % 2 ? { fNx: 8, fNy: 0, fFx: 15, fFy: 9 } : {});
        yield* wait(0.08); Snd.swat();
        spawn('impact', C.x, C.y, { life: 0.3, rot: rnd(3) });
        setPose('sit'); yield* wait(rnd(0.15, 0.35));
      }
    } else if (a === 'meow') {
      S('{n}가 놀아달라고 울어요');
      setPose('sit'); emote('ask', 1.6); sayMeow(pick(['meow', 'long', 'mew']));
      cat.mouth = 'open2'; yield* wait(0.6); cat.mouth = 'closed'; yield* wait(rnd(0.6, 1.4));
    } else if (a === 'stare') {
      setPose('sit', { yaw: 0, hdx: 3 }); lookViewer(1); face('shine'); cat.tailFlick = 40;
      yield* wait(rnd(1.5, 3)); face('shine', 'closed', 'fwd');
    } else if (a === 'flop') {
      S('{n}가 바로 옆에 발라당 누웠어요');
      setPose('lieSide'); yield* wait(0.4); setPose('bellyUp'); face('shine');
      yield* wait(rnd(1.5, 2.5), e => { cat.add.fNy = Math.sin(e * 6) * 2; cat.add.hNy = Math.sin(e * 6 + 1) * 2; });
      cat.add = {}; setPose('crouch'); yield* wait(0.3);
    } else {
      S('{n}가 머리를 들이밀어요');
      setPose('stand'); yield* wait(0.2);
      for (let i = 0; i < 2; i++) { cat.add.hdx = 4; face('happy'); yield* wait(0.25); cat.add.hdx = 0; face('shine'); yield* wait(0.25); }
      burstHearts(cat.headAbs.x, cat.headAbs.y - 8, 1);
    }
  }
  cat.add = {}; lookFree();
  setPose('sit'); face('half'); yield* wait(0.4);
}

/* ---------- happy after play / pets / a good meal ---------- */
function markContent() {
  if (cat.content) return;
  cat.contentUntil = NOW + rnd(40, 65);
  emote('heart', 1.8); burstHearts(cat.headAbs.x, cat.headAbs.y - 8, 2);
}

/* ---------- unpredictable cat things ---------- */
// pushes something off the "table": taps the water bowl (or another prop) a bit further away while looking innocent
function* bKnock() {
  const k = pick(['water', 'water', 'bowl'].concat(bedOn() ? ['cushion'] : []));
  const p = Room[k];
  S('{n}가 슬금슬금 무언가를 노려요…');
  const side = cat.x < p.x ? -1 : 1;
  yield* walkTo(p.x + side * 15, propY(k) + 1, { speed: SPD.walk, tol: 2 });
  if (cat.dir !== -side) yield* turnTo(-side);
  setPose('crouch'); face('wide', 'closed', 'fwd'); lookAtPt(p.x, propY(k) - 4, 1);
  yield* wait(rnd(0.8, 1.6));
  for (let i = 0; i < 2; i++) {
    setPose('swat'); Snd.swat(); yield* wait(0.1);
    setPose('crouch'); yield* wait(rnd(0.4, 0.8));
  }
  S('{n}가 앞발로 슬쩍 밀어 버렸어요');
  setPose('swat'); Snd.swat();
  setPropPos(k, p.x - side * rnd(7, 12), propY(k) + rnd(-1, 2));
  spawn('impact', p.x, propY(k) - 5, { life: 0.3, rot: rnd(3) });
  yield* wait(0.3);
  setPose('sit'); face('half'); lookViewer(1); emote('dots', 1.5);
  S('{n}는 아무것도 안 했다는 표정이에요');
  yield* wait(rnd(1.5, 2.8));
  lookFree();
}

// stares at something nobody else can see
function* bGhost() {
  S('{n}가 허공을 뚫어져라 쳐다봐요…');
  setPose(chance(0.5) ? 'sit' : 'stand'); face('wide', 'closed', 'fwd');
  let gx = cat.x + rnd(-60, 60), gy = cat.gy - rnd(20, 60), vx = rnd(-18, 18), vy = rnd(-8, 8);
  lookAt(() => ({ x: gx, y: gy }), 1);
  const dur = rnd(3.5, 7);
  let el = 0, ear = 0;
  while (el < dur) {
    el += DT;
    gx += vx * DT; gy += vy * DT;
    if (chance(DT * 0.8)) { vx = rnd(-30, 30); vy = rnd(-14, 14); }
    ear -= DT;
    if (ear <= 0) { ear = rnd(0.3, 0.8); cat.earN = pick(['fwd', 'normal', 'back']); cat.earF = pick(['fwd', 'normal', 'back']); }
    if (chance(DT * 0.2)) cat.tailFlick = 40;
    yield;
  }
  emote('alert', 1);
  if (chance(0.6)) {
    S('{n}가 갑자기 뭔가를 쫓아가요!');
    setPose('spook'); face('wide', 'closed', 'flat'); yield* wait(0.25);
    lookFree(); setPose('run');
    const ang = rnd(Math.PI * 2);
    yield* walkTo(clamp(cat.x + Math.cos(ang) * rnd(60, 130), 14, W - 14), clamp(cat.gy + Math.sin(ang) * rnd(30, 70), GY_MIN, GY_MAX), { speed: SPD.sprint, arrive: false, tol: 8, timeout: 2.5, quick: true });
    setPose('stand'); face('half'); yield* wait(0.5); yield* lickNose();
  } else {
    lookFree(); face('half'); yield* wait(0.5); yield* headShake();
  }
}

// head-bunting furniture
function* bRub() {
  const k = pick(['box', 'bowl'].concat(postOn() ? ['post'] : [], bedOn() ? ['cushion'] : []));
  const p = Room[k], hw = { post: 9, box: 19, bowl: 8, cushion: 17 }[k];
  S('{n}가 가구에 얼굴을 비벼요');
  const side = cat.x < p.x ? -1 : 1;
  yield* walkTo(p.x + side * (hw + 12), propY(k) + 2, { speed: SPD.walk, tol: 2 });
  if (cat.dir !== -side) yield* turnTo(-side);
  setPose('stand'); face('happy'); cat.blush = 1; cat.purr = 0.35;
  const n = rint(3, 6);
  for (let i = 0; i < n; i++) {
    yield* wait(0.5, e => { const u = Math.sin(e / 0.5 * Math.PI); cat.add.hdx = 3 * u; cat.add.hdy = -1 * u; cat.add.cx = 1.5 * u; cat.add.pitch = 0.2; });
  }
  cat.add = {}; cat.blush = 0; cat.purr = 0;
  burstHearts(cat.headAbs.x, cat.headAbs.y - 8, 1);
  if (chance(0.5)) { yield* turnTo(-cat.dir); S('{n}가 반대쪽 볼도 비벼요'); setPose('stand'); face('happy'); cat.blush = 1; yield* wait(1.2); cat.blush = 0; }
  face('half'); yield* wait(0.4);
}

// midnight serenade
function* bYowl() {
  S('{n}가 한밤중의 노래를 불러요');
  setPose('sit', { yaw: 0, hdx: 3 }); lookViewer(1); face('open');
  yield* wait(rnd(0.6, 1.4));
  const n = rint(2, 4);
  for (let i = 0; i < n; i++) {
    face('strain', 'open2', 'back'); cat.add.pitch = 0.5; Snd.meow('long', 1.15);
    yield* wait(rnd(1.0, 1.5));
    cat.add.pitch = 0; face('open'); yield* wait(rnd(0.6, 1.4));
  }
  lookFree(); yield* lickNose();
}

// stalks and pounces on absolutely nothing
function* bAirHunt() {
  S('{n}가 보이지 않는 사냥감을 노려요');
  face('wide', 'closed', 'fwd'); setPose('crouch');
  const dir = cat.dir;
  const tx = clamp(cat.x + dir * rnd(35, 80), 16, W - 16), ty = clamp(cat.gy + rnd(-14, 14), GY_MIN, GY_MAX);
  lookAtPt(tx, ty - 4, 1);
  yield* walkTo(tx - dir * 22, ty, { speed: SPD.creep * 1.3, timeout: 6, arrive: false, tol: 3 });
  cat.wiggle = 0.9; yield* wait(rnd(0.7, 1.4)); cat.wiggle = 0;
  yield* hop(tx, ty, 8, 0.42, { pre: 0.08 });
  setPose('swat'); Snd.swat(); yield* wait(0.3);
  setPose('crouch', { hdy: 8, pitch: -0.5 }); face('shine'); emote('ask', 1.5);
  S('{n}가 앞발 밑을 확인해요… 아무것도 없다?');
  yield* wait(1);
  lookFree(); setPose('sit'); face('half'); yield* lickNose();
}

// out of nowhere: freeze, then explode into a run (can interrupt almost anything)
function* bAmbush() {
  yield* bZoomies(false, true);
}
function surpriseCheck(dt) {
  cat.surpriseT -= dt;
  if (cat.surpriseT > 0) return;
  cat.surpriseT = rnd(180, 480);
  if (cat.protect || cat.busy || cat.needs.energy < 30 || cat.weak > 0.4) return;
  if (['pet', 'carried', 'toy', 'churu', 'toilet', 'ball', 'hairball'].includes(cat.label)) return;
  if (cat.asleep && !chance(0.25)) return;
  if (Interact.drag) return;
  interrupt(chance(0.4) ? bAmbush : (chance(0.5) ? bGhost : bAirHunt), 'ambush');
}
