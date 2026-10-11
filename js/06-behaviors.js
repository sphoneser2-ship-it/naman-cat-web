/* ============ behaviours: what the cat decides to do ============ */

/* ---------- micro actions ---------- */
function* yawn() {
  const e = cat.eyes;
  cat.eyes = 'sleep'; cat.mouth = 'open2'; cat.add.pitch = 0.7; cat.add.hdy = 1;
  yield* wait(1.5);
  cat.mouth = 'closed'; cat.eyes = e; cat.add.pitch = 0; cat.add.hdy = 0;
}
function* lickNose() { cat.mouth = 'lick'; Snd.lick(); yield* wait(0.5); cat.mouth = 'closed'; }
function* headTilt() {
  cat.tilt = chance(0.5) ? 1 : -1; cat.earN = 'fwd'; cat.earF = 'fwd';
  yield* wait(rnd(1, 1.8));
  cat.tilt = 0; cat.earN = 'normal'; cat.earF = 'normal';
}
function* slowBlinkAtViewer() {
  lookViewer(1); cat.slowBlink = true; cat.blinkT = 0; cat.blush = 1;
  yield* wait(1.3);
  cat.slowBlink = false; cat.blush = 0; lookFree();
}
function* pawAdjust() {
  yield* wait(0.5, e => { cat.add.fNx = Math.min(e * 6, 2); });
  cat.add.fNx = 0;
}
function* shiver() {
  yield* wait(0.55, e => { cat.add.hx = Math.sin(e * 55) * 0.8; cat.add.cx = Math.sin(e * 55) * 0.8; });
  cat.add.hx = 0; cat.add.cx = 0;
}
function* sniffSpot() {
  setPose('sniff'); cat.mouth = 'closed';
  yield* wait(rnd(1.2, 2.8), e => { cat.add.hdy = Math.sin(e * 9) * 0.7; cat.add.hdx = Math.sin(e * 5) * 1; });
  cat.add.hdy = 0; cat.add.hdx = 0;
  setPose('stand');
}
function* pauseLook() {
  setPose('stand'); cat.earN = 'fwd'; cat.earF = 'fwd';
  yield* wait(rnd(0.8, 2.2));
  cat.earN = 'normal'; cat.earF = 'normal';
}

function* stretchSeq() {
  S('{n}가 기지개를 켜요');
  setPose('stand'); face('half'); yield* wait(0.4);
  setPose('bow'); face('sleep', chance(0.6) ? 'open2' : 'closed');
  yield* wait(rnd(1.8, 2.8), e => { cat.add.cx = Math.sin(e * 6) * 0.3; });
  cat.add.cx = 0; cat.mouth = 'closed';
  setPose('stand', { arch: 3.5, hdy: 14, pitch: -0.5, tAng: 95, tCurl: -4 }); face('sleep');
  yield* wait(rnd(0.9, 1.5));
  setPose('stand'); face('half');
  if (chance(0.5)) yield* shiver();
  yield* wait(0.3);
  face();
}

/* ---------- idle ---------- */
function* bIdleSit() {
  S('{n}가 가만히 앉아 있어요');
  const toViewer = chance(0.45);
  setPose('sit', toViewer ? { yaw: 0, hdx: 3 } : {});
  face('open');
  if (toViewer) lookViewer(0.9);
  const dur = rnd(5, 13);
  let el = 0, nx = rnd(1.5, 3);
  while (el < dur) {
    el += DT;
    if (el > nx) {
      nx = el + rnd(1.8, 4.5);
      const a = wchoose([{ k: 'tilt', w: 2 }, { k: 'yawn', w: cat.needs.energy < 60 ? 3 : 1 }, { k: 'lick', w: 1.2 },
        { k: 'sblink', w: toViewer ? 3 : 0.5 }, { k: 'mew', w: cat.needs.love < 50 ? 1.2 : 0.3 }, { k: 'none', w: 3 }, { k: 'paw', w: 1 }]);
      if (a === 'tilt') yield* headTilt();
      else if (a === 'yawn') yield* yawn();
      else if (a === 'lick') yield* lickNose();
      else if (a === 'sblink') yield* slowBlinkAtViewer();
      else if (a === 'mew') { sayMeow('mew', 0.6); cat.mouth = 'open1'; yield* wait(0.4); cat.mouth = 'closed'; }
      else if (a === 'paw') yield* pawAdjust();
    }
    if (cat.needs.energy < 30) { cat.add.hdy = -2 + Math.sin(NOW * 0.8) * 1.5; cat.eyes = 'half'; }
    yield;
  }
}
bIdleSit.keepSurface = true;

function* bIdleStand() {
  S('{n}가 두리번거려요');
  setPose('stand'); face('open');
  const dur = rnd(4, 9);
  let el = 0, nx = rnd(1, 2.5);
  while (el < dur) {
    el += DT;
    if (el > nx) {
      nx = el + rnd(1.5, 3.5);
      const a = wchoose([{ k: 'step', w: 3 }, { k: 'shiver', w: 0.6 }, { k: 'tilt', w: 1.5 }, { k: 'none', w: 2 }, { k: 'sit', w: 1 }]);
      if (a === 'step') yield* walkTo(cat.x + cat.dir * rnd(5, 14), cat.gy + rnd(-3, 3), { speed: SPD.stroll });
      else if (a === 'shiver') yield* shiver();
      else if (a === 'tilt') yield* headTilt();
      else if (a === 'sit') return;
    }
    cat.add.tAng = Math.sin(NOW * 0.9) * 10;
    yield;
  }
  cat.add.tAng = 0;
}

function wanderSpot() {
  const icon = visibleIcons().length ? pick(visibleIcons()) : null;
  const list = [
    { x: rnd(24, W - 24), gy: rnd(GY_MIN + 10, GY_MAX), w: 5 },
    { x: rnd(Room.ox + 14, W - 14), gy: rnd(Room.oy + 80, Room.oy + 112), w: isHome() ? 1.8 : 0 },
    { x: Room.bowl.x + rnd(-18, 18), gy: rnd(Room.oy + 100, Room.oy + 112), w: isHome() ? 1 : 0 },
    { x: Room.post.x + rnd(10, 26), gy: rnd(Room.oy + 96, Room.oy + 108), w: isHome() && postOn() ? 0.8 : 0 },
    { x: Room.box.x + rnd(-22, 22), gy: rnd(Room.oy + 94, Room.oy + 106), w: isHome() ? 0.8 : 0 },
    { x: rnd(12, 60), gy: rnd(GY_MIN + 10, GY_MAX), w: 0.8 },
    { x: Desk.cursor.x + rnd(-80, 80), gy: Desk.cursor.y + rnd(-20, 40), w: 1.2 }
  ];
  if (icon) list.push({ x: icon.cx + rnd(-16, 16), gy: icon.cy + rnd(14, 24), w: 1.8 });
  let s;
  for (let i = 0; i < 6; i++) {
    s = wchoose(list.map(o => ({ k: o, w: o.w })));
    if (Math.hypot(s.x - cat.x, s.gy - cat.gy) > 30) break;
  }
  return { x: clamp(s.x, 12, W - 12), gy: clamp(s.gy, GY_MIN, GY_MAX) };
}

function* bWander() {
  S('{n}가 방을 어슬렁거려요');
  const legs = rint(1, 3);
  for (let i = 0; i < legs; i++) {
    const s = wanderSpot();
    const sp = wchoose([{ k: SPD.stroll, w: 5 }, { k: SPD.walk, w: 4 }, { k: SPD.trot, w: 2 }, { k: SPD.run, w: 0.35 }]);
    setPose('stand'); face('open');
    let arrived = false, guard = 0;
    while (!arrived && guard++ < 14) {
      arrived = yield* walkTo(s.x, s.gy, { speed: sp, timeout: rnd(1.2, 3.2) });
      if (arrived) break;
      const a = wchoose([{ k: 'go', w: 5 }, { k: 'pause', w: 2.5 }, { k: 'sniff', w: 2 }]);
      if (a === 'pause') yield* pauseLook();
      else if (a === 'sniff') {
        setPose('sniff'); S('{n}가 바닥 냄새를 킁킁 맡아요');
        yield* walkTo(cat.x + cat.dir * rnd(8, 16), cat.gy + rnd(-4, 4), { speed: SPD.creep, timeout: 2 });
        setPose('stand'); S('{n}가 방을 어슬렁거려요');
      }
    }
    const e = wchoose([{ k: 'look', w: 3 }, { k: 'sniff', w: 2 }, { k: 'none', w: 3 }, { k: 'yawn', w: 0.8 }]);
    if (e === 'look') yield* pauseLook();
    else if (e === 'sniff') yield* sniffSpot();
    else if (e === 'yawn') yield* yawn();
  }
}

/* ---------- grooming ---------- */
function* bGroom() {
  S('{n}가 열심히 그루밍해요');
  const n = rint(2, 4);
  setPose('sit'); face('half');
  yield* wait(0.4);
  let prev = '';
  for (let i = 0; i < n; i++) {
    const kind = wchoose([{ k: 'paw', w: 3 }, { k: 'leg', w: 2 }, { k: 'chest', w: 2 }].filter(o => o.k !== prev));
    prev = kind;
    face('sleep');
    if (kind === 'paw') {
      S('{n}가 앞발로 세수를 해요');
      setPose('groomPaw');
      yield* wait(rnd(3, 5), e => {
        cat.add.fNy = Math.sin(e * 10) * 1.8; cat.add.fNx = Math.cos(e * 10) * 1.2; cat.add.hdy = Math.sin(e * 10 + 1) * 0.6;
        cat.mouth = Math.sin(e * 5) > 0.6 ? 'lick' : 'closed';
      });
    } else if (kind === 'leg') {
      S('{n}가 뒷다리를 핥아요');
      setPose('groomLeg');
      yield* wait(rnd(3, 5), e => {
        cat.add.hdy = Math.sin(e * 13) * 1.1; cat.add.hdx = Math.sin(e * 13 + 1) * 0.8; cat.add.hNy = Math.sin(e * 13) * 0.5;
        cat.mouth = Math.sin(e * 6.5) > 0.4 ? 'lick' : 'closed';
      });
    } else {
      S('{n}가 가슴 털을 정리해요');
      setPose('groomChest');
      yield* wait(rnd(3, 4.5), e => {
        cat.add.hdy = Math.sin(e * 11) * 0.9;
        cat.mouth = Math.sin(e * 5.5) > 0.4 ? 'lick' : 'closed';
      });
    }
    cat.add = {}; cat.mouth = 'closed';
    cat.hairCount++;
    if (chance(0.15)) {  // frozen mid-lick
      setPose('sit'); face('half', 'tongue');
      S('{n}가 혀를 넣는 걸 깜빡했어요');
      yield* wait(rnd(1.5, 3));
      cat.mouth = 'closed';
    }
    setPose('sit'); face('half'); yield* wait(rnd(0.3, 1));
  }
  if (chance(0.4)) yield* headShake();
}
bGroom.keepSurface = true;
function* headShake() {
  yield* wait(0.5, e => { cat.add.hdx = Math.sin(e * 40) * 1.2; });
  cat.add.hdx = 0;
}

/* ---------- resting ---------- */
function restSpot(preferSun) {
  const sun = sunSpot(), list = [];
  if (sun.on) list.push({ k: { x: sun.x, gy: sun.gy, kind: 'sun' }, w: preferSun ? 5 : 2.5 });
  if (isHome()) {
    if (bedOn()) list.push({ k: { x: Room.cushion.x, gy: Room.cushion.gy - 2, kind: 'cushion' }, w: 3 });
    list.push({ k: { x: Room.ox + rnd(70, 140), gy: Room.oy + rnd(100, 111), kind: 'rug' }, w: 1 });
  }
  list.push({ k: { x: cat.x, gy: cat.gy, kind: 'here' }, w: 1.2 });
  const f = freeFloorSpot(rnd(30, W - 30), rnd(GY_MIN + 20, GY_MAX));
  list.push({ k: { x: f.x, gy: f.gy, kind: 'floor' }, w: 1.4 });
  return wchoose(list);
}
function* gotoRest(spot) {
  if (Math.hypot(spot.x - cat.x, (spot.gy - cat.gy) * 1.5) > 6) {
    setPose('stand'); face('open');
    yield* walkTo(spot.x, spot.gy, { speed: wchoose([{ k: SPD.stroll, w: 3 }, { k: SPD.walk, w: 3 }, { k: SPD.trot, w: 1 }]) });
  }
  if (spot.kind !== 'here' && chance(0.7)) {
    yield* turnTo(-cat.dir); yield* wait(0.12);
    setPose('sniff'); yield* wait(0.5);
    setPose('stand');
    yield* turnTo(-cat.dir);
  }
}
function* knead() {
  S('{n}가 꾹꾹이를 해요');
  setPose('loaf'); face('sleep'); cat.purr = 0.55; cat.blush = 1;
  const n = rint(6, 12);
  for (let i = 0; i < n; i++) {
    const near = i % 2 === 0;
    yield* wait(0.4, (e, T) => {
      const u = e / T, lift = Math.sin(Math.PI * u) * 3.5;
      if (near) { cat.add.fNy = lift; cat.add.fNx = u * 2; cat.add.fFy = 0; cat.add.fFx = 0; }
      else { cat.add.fFy = lift; cat.add.fFx = u * 2; cat.add.fNy = 0; cat.add.fNx = 0; }
    });
  }
  cat.add = {}; cat.purr = 0; cat.blush = 0;
}

function* sleepHere(scale = 1) {
  if (cat.surface === 'floor' && chance(0.55)) yield* circleSpot();
  setPose('crouch'); face('half'); yield* wait(0.35);
  setPose('loaf'); yield* wait(rnd(0.8, 1.8));
  let lie = chance(0.7) ? 'curl' : 'lieSide';
  setPose(lie); face('sleep'); cat.asleep = true;
  S('{n}가 쌔근쌔근 자고 있어요');
  const sleepy = clamp(1 - cat.needs.energy / 100, 0.15, 1);
  const dur = lerp(14, 55, sleepy) * scale;
  let el = 0, nz = 1.2, ntw = rnd(3, 8), nmv = rnd(14, 28);
  while (el < dur) {
    el += DT;
    if (el > nz) {
      nz = el + rnd(1.6, 2.4);
      spawn('zzz', cat.headAbs.x + cat.dir * 4, cat.headAbs.y - 8, { vx: 4 * cat.dir, vy: -9, life: 2.2 });
    }
    if (el > ntw) {
      ntw = el + rnd(3, 9);
      const a = wchoose([{ k: 'paw', w: 2 }, { k: 'ear', w: 2 }, { k: 'whisk', w: 1 }, { k: 'mumble', w: 0.7 }, { k: 'tail', w: 1.5 }, { k: 'sigh', w: 1 }]);
      if (a === 'paw') {
        yield* wait(0.5, e => { cat.add.fNy = Math.abs(Math.sin(e * 28)) * 1.6; cat.add.hNy = Math.abs(Math.sin(e * 28 + 1)) * 1.3; });
        cat.add.fNy = 0; cat.add.hNy = 0;
      } else if (a === 'ear') { cat.twN = 0.14; cat.twT = 0.4; }
      else if (a === 'whisk') cat.whisk = 0.3;
      else if (a === 'mumble') { cat.mouth = 'open1'; say('으냥…', 'soft'); yield* wait(0.35); cat.mouth = 'closed'; }
      else if (a === 'tail') cat.tailFlick = 45;
      else if (a === 'sigh') { cat.add.cy = -0.7; yield* wait(0.9); cat.add.cy = 0; }
    }
    if (el > nmv) {
      nmv = el + rnd(12, 25);
      lie = lie === 'curl' ? 'lieSide' : 'curl';
      setPose(lie);
    }
    if (cat.needs.sat < 8 && el > 8 && chance(DT * 0.06)) break;
    if (cat.needs.energy >= 100 && el > 10) break;
    yield;
  }
  cat.asleep = false;
  face('half'); setPose('loaf'); S('{n}가 잠에서 깨어나요'); yield* wait(0.9);
  yield* yawn();
  yield* stretchSeq();
  cat.napCooldown = rnd(55, 110);
}

function* bNap() {
  S('{n}가 졸려서 잘 곳을 찾아요');
  const spot = restSpot(true);
  yield* gotoRest(spot);
  if (spot.kind === 'cushion' && chance(0.7)) yield* knead();
  yield* sleepHere(lifeSleepScale());
}

function* bLoaf() {
  S('{n}가 식빵을 굽고 있어요');
  const spot = restSpot(false);
  yield* gotoRest(spot);
  if (spot.kind === 'cushion' || chance(0.25)) yield* knead();
  setPose('crouch'); face('half'); yield* wait(0.3);
  setPose(chance(0.8) ? 'loaf' : 'sphinx'); face('half');
  S('{n}가 식빵을 굽고 있어요');
  if (cat.content) { cat.purr = 0.3; cat.blush = 1; S('{n}가 만족스러워서 골골거려요'); }
  cat.slowBlink = chance(0.5);
  const dur = rnd(9, 24);
  let el = 0, nx = rnd(2, 5);
  while (el < dur) {
    el += DT;
    if (el > nx) {
      nx = el + rnd(3, 7);
      const a = wchoose([{ k: 'doze', w: 3 }, { k: 'look', w: 2 }, { k: 'lick', w: 1 }, { k: 'yawn', w: 1 }, { k: 'sblink', w: 1.5 }, { k: 'tilt', w: 1 }]);
      if (a === 'doze') {
        cat.eyes = 'sleep';
        yield* wait(rnd(2, 5), e => { cat.add.hdy = -Math.abs(Math.sin(e * 0.9)) * 1.5; });
        cat.add.hdy = 0; cat.eyes = 'half';
      } else if (a === 'lick') yield* lickNose();
      else if (a === 'yawn') yield* yawn();
      else if (a === 'sblink') yield* slowBlinkAtViewer();
      else if (a === 'tilt') yield* headTilt();
    }
    yield;
  }
  cat.slowBlink = false;
  if (cat.needs.energy < 70 && chance(0.55)) yield* sleepHere(0.7);
  else if (cat.poseName === 'loaf' || cat.poseName === 'sphinx') { setPose('stand'); face('half'); yield* wait(0.5); }
}

function* bSunbathe() {
  const sun = sunSpot();
  if (!sun.on) return;
  S('{n}가 햇볕을 쬐러 가요');
  yield* gotoRest({ x: sun.x, gy: sun.gy, kind: 'sun' });
  S('{n}가 햇볕 아래서 노곤해해요');
  setPose('crouch'); face('half'); yield* wait(0.3);
  let pose = 'lieSide';
  setPose(pose); face('half'); cat.blush = 1; cat.purr = 0.12;
  const dur = rnd(16, 34);
  let el = 0, nx = rnd(3, 6);
  while (el < dur) {
    el += DT;
    if (el > nx) {
      nx = el + rnd(4, 8);
      const a = wchoose([{ k: 'roll', w: 2 }, { k: 'loaf', w: 1.5 }, { k: 'eyes', w: 3 }, { k: 'stretch', w: 1 }]);
      if (a === 'roll') {
        pose = 'bellyUp'; setPose(pose); face('happy'); cat.add.fNy = 0;
        yield* wait(rnd(2.5, 5), e => { cat.add.fNy = Math.sin(e * 3) * 1.5; cat.add.hNy = Math.sin(e * 3 + 1) * 1.5; });
        cat.add = {}; pose = 'lieSide'; setPose(pose); face('half');
      } else if (a === 'loaf') { pose = 'loaf'; setPose(pose); face('half'); }
      else if (a === 'eyes') { cat.eyes = cat.eyes === 'half' ? 'sleep' : 'half'; }
      else if (a === 'stretch') {
        setPose('lieSide', { fNx: 20, fFx: 16, hNx: -5, hFx: -9 }); face('sleep', 'open2');
        yield* wait(1.4); setPose(pose); face('half');
      }
    }
    yield;
  }
  cat.blush = 0; cat.purr = 0;
  if (cat.needs.energy < 75 && chance(0.5)) yield* sleepHere(0.6);
  else { yield* yawn(); yield* stretchSeq(); }
}

/* ---------- active ---------- */
function* bStretch() {
  yield* stretchSeq();
  if (chance(0.5)) yield* sniffSpot();
}

function* bScratch() {
  S('{n}가 스크래처로 가요');
  const p = Room.post;
  const side = chance(0.7) ? -1 : 1;
  yield* walkTo(p.x + side * 12, p.gy + 1, { speed: SPD.walk });
  if (cat.dir !== -side) yield* turnTo(-side);
  setPose('sniff'); yield* wait(rnd(0.7, 1.4));
  setPose('stand'); face('wide', 'closed', 'fwd'); yield* wait(0.2);
  S('{n}가 스크래처를 박박 긁어요');
  setPose('scratch'); yield* wait(0.45);
  const n = rint(5, 10);
  for (let i = 0; i < n; i++) {
    const near = i % 2 === 0;
    yield* wait(0.3, (e, T) => {
      const u = e / T, down = Math.sin(Math.PI * u) * -7;
      if (near) { cat.add.fNy = down; cat.add.fFy = 0; } else { cat.add.fFy = down; cat.add.fNy = 0; }
      if (u > 0.5 && !cat._sc) { cat._sc = true; Snd.scratch(); spawn('fur', cat.x + cat.dir * 12, cat.gy - 22, { vx: rnd(-6, 6), vy: rnd(2, 10), life: 0.6, g: 12, col: '#e7d3b0' }); }
      if (u < 0.2) cat._sc = false;
    });
  }
  cat.add = {};
  S('{n}가 몸을 쭉 늘려요');
  setPose('scratch', { cy: 19, hdy: 26, arch: -1 }); face('sleep'); cat.purr = 0.2;
  yield* wait(rnd(1.2, 2));
  cat.purr = 0;
  setPose('stand'); face('half'); yield* wait(0.5);
  if (chance(0.5)) yield* shiver();
}

function* hopToSill(sx) {
  yield* hop(sx, Room.sill.gy, 11, 0.72);
  cat.surface = 'sill'; cat.sortOverride = null;
}
function* bWindow() {
  S('{n}가 창가로 가요');
  const sx = rnd(Room.sill.x0 + 4, Room.sill.x1 - 4);
  yield* walkTo(sx, Room.oy + 78, { speed: SPD.walk });
  setPose('sniff'); yield* wait(0.4); setPose('stand');
  yield* hopToSill(sx);
  S('{n}가 창밖을 바라봐요');
  cat.dir = chance(0.5) ? 1 : -1;
  setPose('sit', { yaw: 0.8 }); face('open', 'closed', 'fwd');
  lookAt(() => (birdWorld() || { x: Room.ox + 143 + Math.sin(NOW * 0.2) * 14, y: Room.oy + 24 + Math.sin(NOW * 0.13) * 6 }), 1);
  let el = 0, chatterT = 0, saidBird = false;
  const dur = rnd(10, 26);
  while ((el < dur || birdPresent()) && el < 70) {
    el += DT;
    if (birdPresent()) {
      const bw = birdWorld(); if (bw && bw.x < cat.x - 6) cat.dir = -1; else if (bw && bw.x > cat.x + 6) cat.dir = 1;
      setPose('crouch', { hdy: 12, pitch: 0.6 }); face('wide', 'closed', 'fwd');
      S('{n}가 새를 보고 흥분했어요!');
      cat.wiggle = 0.35;
      if (!saidBird) { saidBird = true; emote('alert', 1.4); }
      chatterT -= DT;
      if (chatterT <= 0) { chatterT = rnd(2.5, 4); Snd.chatter(); say('캬캬캬', 'jitter'); }
      cat.mouth = Math.sin(NOW * 40) > 0 ? 'open1' : 'closed';
    } else {
      if (saidBird) { saidBird = false; cat.wiggle = 0; cat.mouth = 'closed'; setPose('sit', { yaw: 0.8 }); face('half'); S('{n}가 아쉬운 듯 창밖을 봐요'); }
    }
    yield;
  }
  cat.wiggle = 0; cat.mouth = 'closed';
}
bWindow.keepSurface = true;

function* bZoomies(small, sudden) {
  S('{n}가 갑자기 우다다를 시작해요!');
  cat.zoomCooldown = rnd(240, 420);
  if (sudden) {            // out of nowhere: a startled freeze, then full speed
    cat.asleep = false; cat.add = {}; cat.purr = 0;
    setPose('spook'); face('wide', 'closed', 'flat'); emote('alert', 1); cat.tailFlick = 60;
    yield* wait(0.3);
  } else {
    face('wide', 'closed', 'fwd');
    setPose('crouch'); cat.wiggle = 0.8; yield* wait(rnd(0.5, 0.9)); cat.wiggle = 0;
  }
  const legs = small ? rint(2, 4) : rint(4, 8);
  for (let i = 0; i < legs; i++) {
    let fx, fy, tries = 0;
    do { fx = rnd(14, W - 14); fy = rnd(GY_MIN + 20, GY_MAX); } while (Math.hypot(fx - cat.x, fy - cat.gy) < 90 && tries++ < 10);
    setPose('run'); face('wide', 'closed', 'fwd');
    yield* walkTo(fx, fy, { speed: SPD.sprint * rnd(0.8, 1.1), arrive: false, tol: 8, timeout: 3.5, quick: true });
    cat.needs.fun = Math.min(100, cat.needs.fun + 2.5); cat.needs.energy = Math.max(0, cat.needs.energy - 3);
    const a = wchoose([{ k: 'go', w: 5 }, { k: 'skid', w: 2 }, { k: 'hop', w: 1.5 }, { k: 'spook', w: 1.5 }]);
    if (a === 'skid') {
      burstDust(cat.x, cat.gy + 1, 8, cat.dir); cat.speed *= 0.4;
      setPose('stand'); yield* wait(0.25);
    } else if (a === 'hop') {
      yield* hop(clamp(cat.x + cat.dir * 12, 12, W - 12), cat.gy, 9, 0.45, { pre: 0.05, post: 0.02 });
    } else if (a === 'spook') {
      cat.speed *= 0.3; setPose('spook'); cat.dir = -cat.dir; face('wide', 'closed', 'flat');
      burstDust(cat.x, cat.gy + 1, 4, 0);
      yield* wait(0.5);
    }
  }
  setPose('stand'); face('wide', 'open1', 'fwd');
  S('{n}가 헥헥… 숨을 골라요');
  yield* wait(rnd(1.2, 2), e => { cat.mouth = Math.sin(e * 18) > 0 ? 'open1' : 'closed'; cat.add.cy = Math.sin(e * 18) * 0.5; });
  cat.add = {};
  setPose('sit'); face('half');
  S('{n}는 아무 일도 없었다는 듯 앉아요');
  yield* wait(rnd(0.8, 1.6));
  if (chance(0.6)) yield* lickNose();
}

function* bTailChase() {
  S('{n}가 자기 꼬리를 발견했어요!');
  setPose('sit'); face('wide', 'closed', 'fwd'); yield* wait(0.5);
  lookAt(() => ({ x: cat.x - cat.dir * 13, y: cat.gy - 5 }), 1);
  yield* wait(0.8, e => { cat.tailFlick = Math.sin(e * 14) * 30; });
  setPose('stand', { tWave: 25, tSpd: 10 });
  const n = rint(5, 9);
  for (let i = 0; i < n; i++) {
    yield* turnTo(-cat.dir, true);
    cat.moving = true; cat.speed = 12;
    yield* wait(0.1, () => { cat.x += cat.dir * 0.4; });
  }
  cat.speed = 0;
  S('{n}가 빙글빙글 어지러워해요');
  setPose('sit'); face('dizzy'); emote('star', 1.8);
  yield* wait(1.8, e => { cat.add.hdx = Math.sin(e * 4) * 2.5; cat.add.hdy = Math.cos(e * 4) * 1.2; });
  cat.add = {}; lookFree();
  face('half'); yield* wait(0.5);
  cat.needs.fun = Math.min(100, cat.needs.fun + 6);
}

function* bFlop() {
  S('{n}가 발라당 누웠어요');
  const sp = freeFloorSpot(rnd(40, W - 40), rnd(GY_MIN + 30, GY_MAX));
  yield* gotoRest({ x: sp.x, gy: sp.gy, kind: 'floor' });
  setPose('crouch'); yield* wait(0.3);
  setPose('lieSide'); face('happy'); cat.blush = 1; yield* wait(0.6);
  setPose('bellyUp'); face('happy'); cat.purr = cat.needs.love > 70 ? 0.4 : 0;
  cat.bellyShown = true;
  yield* wait(rnd(5, 10), e => {
    cat.add.fNy = Math.sin(e * 3.3) * 1.5; cat.add.hNy = Math.sin(e * 3.3 + 1) * 1.5;
    cat.add.fFy = Math.sin(e * 3.3 + 2) * 1.2; cat.add.hFy = Math.sin(e * 3.3 + 3) * 1.2;
    return true;
  });
  cat.bellyShown = false;
  cat.add = {}; cat.purr = 0; cat.blush = 0;
  setPose('lieSide'); face('half'); yield* wait(0.6);
  setPose('crouch'); yield* wait(0.3);
  setPose('stand'); yield* wait(0.3);
  if (chance(0.5)) yield* stretchSeq();
}

function* bSneeze() {
  S('{n}가 재채기를 해요');
  setPose('sit'); face('wide'); yield* wait(0.5);
  face('strain', 'open1'); cat.add.hdy = 2; cat.add.pitch = 0.5; yield* wait(0.3);
  cat.add.hdy = -2; cat.add.pitch = -0.5; cat.mouth = 'open2'; Snd.sneeze(); say('에취!', 'pop'); yield* wait(0.25);
  cat.add = {}; face('half'); spawn('dust', cat.headAbs.x + cat.dir * 6, cat.headAbs.y + 3, { vx: cat.dir * 20, vy: 0, life: 0.4 });
  yield* wait(0.6); yield* lickNose();
}

function* bHairball() {
  cat.protect = true;
  try {
    S('{n}가 속이 안 좋은가 봐요…');
    setPose('eat', { hdy: 9, pitch: -0.7 }); face('strain', 'closed', 'back');
    emote('sweat', 2); yield* wait(0.9);
    const n = rint(3, 5);
    for (let i = 0; i < n; i++) {
      Snd.hack(); say('웩', 'jitter');
      yield* wait(0.55, e => { cat.add.cy = Math.sin(e / 0.55 * Math.PI) * 1.6; cat.add.hdx = Math.sin(e / 0.55 * Math.PI) * -2; cat.mouth = e > 0.25 ? 'open1' : 'closed'; });
    }
    cat.add = {}; cat.mouth = 'open2'; yield* wait(0.4);
    addMess('hairball', 'floor', cat.x + cat.dir * 16, cat.gy);
    cat.mouth = 'closed'; face('half'); S('{n}가 헤어볼을 토했어요');
    cat.hairCount = 0;
    setPose('stand'); yield* wait(1);
    yield* lickNose();
  } finally { cat.protect = false; }
}

/* ---------- eating & drinking ---------- */
function* bEat() {
  const B = Room.bowl, n = cat.needs;
  if (B.food <= 1) return;
  S('{n}가 밥 먹으러 가요');
  face('open', 'closed', 'fwd');
  const side = cat.x < B.x ? -1 : 1;
  yield* walkTo(B.x + side * 15, B.gy - 1, { speed: n.sat < 28 ? SPD.run * 0.75 : n.sat < 50 ? SPD.trot : SPD.walk, tol: 2.5, noVigor: true, timeout: 40 });
  if (cat.dir !== -side) yield* turnTo(-side);
  setPose('sniff'); S('{n}가 사료 냄새를 맡아요');
  yield* wait(rnd(0.6, 1.4), e => { cat.add.hdy = Math.sin(e * 8) * 0.6; });
  cat.add = {};
  if (n.sat > 90 && chance(0.6)) {
    S('{n}는 배가 불러서 시큰둥해요'); face('half'); emote('dots', 1.4); yield* wait(0.9);
    return;
  }
  setPose('eat'); S('{n}가 사료를 오독오독 먹어요');
  face('open', 'closed', 'normal');
  lookAtPt(B.x, B.gy - 3, 0);
  let bites = 0;
  const maxB = rint(6, 18);
  while (bites < maxB && B.food > 0.5 && n.sat < 100) {
    cat.mouth = 'open1'; cat.add.hdy = -1;
    yield* wait(0.15);
    cat.mouth = 'closed'; cat.add.hdy = 0;
    Snd.munch();
    const take = Math.min(B.food, 2.4);
    B.food -= take; n.sat = Math.min(100, n.sat + take); n.bowel += take * 1.5;
    cat.lastAte = NOW;
    yield* wait(rnd(0.14, 0.3), e => { cat.mouth = Math.sin(e * 35) > 0 ? 'closed' : 'open1'; });
    cat.mouth = 'closed';
    bites++;
    if (chance(0.09)) { setPose('sniff'); lookFree(); yield* wait(rnd(0.5, 1.2)); setPose('eat'); }
    if (chance(0.06)) { cat.mouth = 'lick'; Snd.lick(); yield* wait(0.4); cat.mouth = 'closed'; }
  }
  cat.add = {};
  if (n.sat >= 99) { emote('heart', 1.5); markContent(); }
  setPose('sit'); face('half'); S('{n}가 입맛을 다셔요');
  yield* wait(0.4); yield* lickNose();
  if (chance(0.5)) yield* lickNose();
}

function* bDrink() {
  S('{n}가 물을 마시러 가요');
  const Wt = Room.water;
  const side = cat.x < Wt.x ? -1 : 1;
  yield* walkTo(Wt.x + side * 15, Wt.gy - 1, { speed: SPD.walk, tol: 1.5 });
  if (cat.dir !== -side) yield* turnTo(-side);
  setPose('drink'); face('half'); S('{n}가 물을 할짝할짝 마셔요');
  const laps = rint(8, 16);
  for (let i = 0; i < laps; i++) {
    cat.mouth = 'tongue'; Snd.lap();
    yield* wait(0.11);
    cat.mouth = 'closed';
    yield* wait(rnd(0.08, 0.2));
    if (chance(0.06)) { setPose('sniff'); yield* wait(0.5); setPose('drink'); }
  }
  if (chance(0.3)) yield* shakePaw();
  setPose('sit'); face('half'); yield* lickNose();
}

/* ---------- toilet ---------- */
function* shuffleX(tx, sp = 14) {
  let guard = 0;
  while (Math.abs(tx - cat.x) > 0.6 && guard++ < 400) {
    cat.x = approach(cat.x, tx, sp * DT);
    yield;
  }
}
function* digSand(n) {
  for (let i = 0; i < n; i++) {
    yield* wait(0.24, (e, T) => {
      const u = e / T;
      cat.add.fNx = -Math.sin(Math.PI * u) * 5; cat.add.fNy = Math.sin(Math.PI * u) * 2;
      if (u > 0.5 && !cat._dg) {
        cat._dg = true; Snd.sand();
        for (let k = 0; k < 3; k++) spawn('sand', cat.x + cat.dir * 8, cat.gy - 7, { vx: -cat.dir * rnd(8, 22), vy: -rnd(8, 18), life: 0.5, g: 70 });
      }
      if (u < 0.2) cat._dg = false;
    });
  }
  cat.add.fNx = 0; cat.add.fNy = 0;
}

function* bToilet() {
  cat.protect = true;
  try {
    const dirty = boxMesses().length;
    const useBox = !(dirty >= 2 && chance(clamp(0.28 * (dirty - 1), 0, 0.9)));
    S('{n}가 갑자기 안절부절못해요');
    setPose('stand', { tAng: 110, tCurl: -3 }); face('open', 'closed', 'back');
    emote('poop', 2.4); sayMeow('mew', 0.8);
    const nL = rint(2, 3);
    for (let i = 0; i < nL; i++) {
      yield* walkTo(clamp(cat.x + rnd(-70, 70), 20, W - 20), clamp(cat.gy + rnd(-30, 30), GY_MIN, GY_MAX), { speed: SPD.trot, timeout: 3 });
      if (chance(0.5)) { setPose('sniff'); yield* wait(rnd(0.5, 1)); setPose('stand', { tAng: 110, tCurl: -3 }); }
    }
    if (useBox) {
      S('{n}가 화장실로 가요');
      const bx = Room.box.x + rnd(-5, 5);
      yield* walkTo(bx, Room.box.by + 7, { speed: SPD.trot });
      setPose('stand'); yield* wait(0.2);
      yield* hop(bx, Room.box.by - 3, 8, 0.55);
      cat.surface = 'box'; cat.sortOverride = Room.box.by;
      S('{n}가 모래를 파고 있어요');
      setPose('sniff'); face('open'); yield* wait(0.7);
      setPose('stand', { hdy: 17, pitch: -0.6, hdx: 22 }, true);
      yield* digSand(rint(4, 7));
      cat.add = {};
      yield* turnTo(-cat.dir);
      const slot = boxSlot();
      yield* shuffleX(clamp(slot + cat.dir * 11, Room.box.x - 12, Room.box.x + 12), 12);
      setPose('poop'); face('strain', 'closed', 'back'); S('{n}가 볼일을 보는 중… 쉿!');
      yield* wait(rnd(2, 3), e => { cat.add.hdy = Math.sin(e * 14) * 0.4; cat.add.cy = Math.sin(e * 9) * 0.3; });
      cat.add = {};
      addMess('poop', 'box', slot, Room.box.by - 3);
      Snd.plop();
      yield* wait(0.5);
      face('open'); emote('note', 1.8); S('{n}가 시원해 보여요');
      setPose('stand'); yield* wait(0.7);
      S('{n}가 모래로 덮어요');
      setPose('stand', { hdy: 17, pitch: -0.6, hdx: 22 }, true);
      yield* digSand(rint(3, 6));
      cat.add = {};
      cat.pawDirty = 12;
      yield* leaveSurface();
    } else {
      S('{n}가 화장실이 더럽다며 투덜대요');
      emote('alert', 1.6); say('흥!', 'pop');
      const fs_ = freeFloorSpot(clamp(cat.x + rnd(-40, 40), 20, W - 20), clamp(cat.gy + rnd(-30, 30), GY_MIN, GY_MAX));
      yield* walkTo(fs_.x, fs_.gy, { speed: SPD.walk });
      setPose('sniff'); yield* wait(rnd(0.8, 1.4));
      lookViewer(1); setPose('stand'); face('half', 'frown'); yield* wait(0.9);
      lookFree();
      setPose('poop'); face('strain', 'closed', 'back'); S('{n}가 바닥에 볼일을 봐요…');
      yield* wait(rnd(2, 3), e => { cat.add.hdy = Math.sin(e * 14) * 0.4; });
      cat.add = {};
      addMess('poop', 'floor', cat.x - cat.dir * 14, cat.gy);
      Snd.plop();
      cat.needs.love = Math.max(0, cat.needs.love - 5);
      yield* wait(0.5);
      face('open'); setPose('stand'); yield* wait(0.5);
    }
    cat.needs.bowel = rnd(0, 12);
    S('{n}가 개운한 표정이에요');
    face('happy'); cat.blush = 1; yield* wait(0.8); cat.blush = 0;
  } finally {
    cat.protect = false;
  }
  cat.forced = chance(0.2) ? 'zoomSmall' : null;
}

/* ---------- social ---------- */
function* bCallUser() {
  const hungry = cat.needs.sat < 30 && Room.bowl.food < 3;
  S(hungry ? '{n}가 밥을 달라고 보채요' : '{n}가 관심을 끌려고 해요');
  yield* walkTo(clamp(Desk.cursor.x + (chance(0.5) ? -34 : 34), 14, W - 14), clamp(Desk.cursor.y + 16, GY_MIN, GY_MAX), { speed: SPD.trot });
  setPose('sit', { yaw: 0, hdx: 3 }); lookViewer(1); face('shine', 'closed', 'fwd');
  const dur = rnd(9, 15);
  let el = 0, nx = 0.8;
  while (el < dur) {
    el += DT;
    if (el > nx) {
      nx = el + rnd(2.5, 4);
      emote(hungry ? 'food' : (cat.needs.love < 32 ? 'heart' : 'ask'), 2);
      sayMeow(hungry ? 'long' : 'meow');
      cat.mouth = 'open2'; yield* wait(0.55); cat.mouth = 'closed';
    }
    yield;
  }
  S('{n}가 토라졌어요…');
  setPose('loaf', { yaw: 0.6 }); face('half', 'frown', 'back'); lookFree();
  cat.needs.love = Math.max(0, cat.needs.love - 3);
  yield* wait(rnd(6, 12));
}

function* bCheckBowl() {
  S('{n}가 밥그릇을 확인하러 가요');
  const B = Room.bowl;
  const side = cat.x < B.x ? -1 : 1;
  yield* walkTo(B.x + side * 15, B.gy - 1, { speed: SPD.trot, tol: 2.5, noVigor: true, timeout: 40 });
  if (cat.dir !== -side) yield* turnTo(-side);
  setPose('sniff'); yield* wait(rnd(1, 1.8), e => { cat.add.hdy = Math.sin(e * 8) * 0.6; });
  cat.add = {};
  if (B.food > 2) return;
  S('{n}가 빈 그릇을 보고 시무룩해요');
  setPose('sit', { yaw: 0, hdx: 3 }); lookViewer(1); face('shine', 'closed', 'fwd');
  yield* wait(0.6); emote('food', 2); sayMeow('long');
  yield* wait(rnd(1.5, 2.5));
}

function* bInspect() {
  const m = pick(Room.messes);
  if (!m) return;
  S('{n}가 어딘가 냄새가 난다며 살펴봐요');
  if (m.where === 'box') {
    yield* walkTo(Room.box.x + rnd(-10, 10), Room.box.by + 8, { speed: SPD.walk });
  } else {
    const side = cat.x < m.x ? -1 : 1;
    yield* walkTo(m.x + side * 15, m.gy - 1, { speed: SPD.walk, tol: 1.5 });
    if (cat.dir !== -side) yield* turnTo(-side);
  }
  setPose('sniff'); yield* wait(rnd(1, 1.8), e => { cat.add.hdy = Math.sin(e * 9) * 0.6; });
  cat.add = {};
  if (m.kind === 'hairball') { face('half'); yield* wait(0.6); return; }
  S('{n}가 냄새에 질색해요');
  setPose('spook'); face('strain', 'frown', 'flat'); emote('sweat', 1.6); Snd.sneeze();
  yield* wait(0.6);
  setPose('stand'); face('half', 'frown'); yield* headShake();
  cat.needs.love = Math.max(0, cat.needs.love - 1.5);
  if (m.age > 50) { say('으엑…', 'jitter'); yield* wait(0.5); }
}

/* ---------- bug & ball ---------- */
function* leapAtFly() {
  const f = Room.fly;
  if (!f) return;
  S('{n}가 벌레에게 몸을 날려요!');
  setPose('crouch'); cat.wiggle = 0.7; face('wide', 'closed', 'fwd');
  yield* wait(0.55); cat.wiggle = 0;
  const f2 = Room.fly;
  if (!f2) return;
  const tx = clamp(f2.x, cat.x - 22, cat.x + 22);
  const h = clamp((cat.gy - f2.y) * 0.4 + 5, 6, 15);
  yield* hop(tx, cat.gy, h, 0.5, { pre: 0.02, post: 0.05 });
  const f3 = Room.fly;
  const close = f3 && Math.abs(f3.x - cat.x) < 16 && (cat.gy - f3.y) < 40;
  if (close && chance(0.42)) {
    Room.fly = null;
    for (let i = 0; i < 4; i++) spawn('spark', cat.x + rnd(-6, 6) + cat.dir * 8, cat.gy - rnd(8, 18), { vy: -6, life: 0.6 });
    Snd.sparkle(); emote('star', 1.6); say('냠!', 'pop');
    face('happy', 'open1'); S('{n}가 벌레를 잡았어요!');
    cat.needs.fun = Math.min(100, cat.needs.fun + 10);
    yield* wait(0.5, e => { cat.mouth = Math.sin(e * 30) > 0 ? 'closed' : 'open1'; });
    cat.mouth = 'closed'; yield* wait(0.5);
  } else {
    S('{n}가 놓쳤다… 모른 척 그루밍!');
    face('half'); setPose('sit'); emote('dots', 1.4);
    yield* wait(0.5); yield* lickNose();
  }
}

function* bWatchFly() {
  S('{n}가 날아다니는 벌레를 쫓아요');
  setPose(chance(0.5) ? 'stand' : 'sit'); face('wide', 'closed', 'fwd');
  lookAt(() => (Room.fly ? { x: Room.fly.x, y: Room.fly.y } : null), 1);
  emote('alert', 1.2);
  let el = 0, nextLeap = rnd(2.5, 5);
  while (Room.fly && el < 32) {
    el += DT;
    const f = Room.fly;
    if (Math.abs(f.x - cat.x) > 16 && sgn(f.x - cat.x) !== cat.dir) { yield* turnTo(sgn(f.x - cat.x)); continue; }
    if (el > nextLeap) {
      nextLeap = el + rnd(3, 6);
      if (chance(0.6)) { yield* leapAtFly(); setPose(chance(0.5) ? 'stand' : 'sit'); face('wide', 'closed', 'fwd'); continue; }
      cat.mouth = 'open1'; Snd.chatter(); say('캬캬', 'jitter'); yield* wait(0.5); cat.mouth = 'closed';
    }
    if (cat.poseName === 'sit') cat.wiggle = 0; else cat.add.tAng = Math.sin(NOW * 6) * 10;
    yield;
  }
  cat.add = {}; lookFree();
  face('half'); yield* wait(0.5);
}

function* bPlayBall() {
  S('{n}가 ' + (Room.ball ? toyOf(Room.ball).n : '장난감') + '을(를) 발견했어요!');
  face('wide', 'closed', 'fwd');
  lookAt(() => (Room.ball ? { x: Room.ball.x, y: Room.ball.gy - Room.ball.z - 2 } : null), 1);
  let el = 0, idle = 0;
  while (Room.ball && el < 30 && cat.needs.energy > 8) {
    el += DT;
    const b = Room.ball;
    if (b.held) { yield; continue; }
    const bs = Math.hypot(b.vx, b.vgy);
    const dx = b.x - cat.x, dy = b.gy - cat.gy, d = Math.hypot(dx, dy * 1.4);
    if (bs > 10) idle = 0; else idle += DT;
    if (idle > 7 && cat.needs.fun > 80) break;
    if (d > 24) {
      setPose(bs > 40 || d > 60 ? 'run' : 'stand'); face('wide', 'closed', 'fwd');
      yield* walkTo(b.x - sgn(dx) * 11, b.gy, { speed: d > 60 ? SPD.run : SPD.trot, arrive: false, tol: 3, timeout: 0.45, quick: true });
      continue;
    }
    if (sgn(dx) !== cat.dir && Math.abs(dx) > 4) { yield* turnTo(sgn(dx), true); continue; }
    if (bs > 25) { setPose('crouch'); cat.wiggle = 0.4; yield; continue; }
    cat.wiggle = 0;
    // position at a good distance
    if (Math.abs(dx) < 7) { yield* walkTo(cat.x - cat.dir * 8, cat.gy, { speed: SPD.walk, timeout: 0.6, tol: 1 }); continue; }
    if (Math.abs(dx) > 14) { yield* walkTo(b.x - cat.dir * 11, b.gy, { speed: SPD.walk, timeout: 0.6, tol: 1 }); continue; }
    const a = wchoose([{ k: 'bat', w: toyOf(b).plush ? 2 : 5 }, { k: 'hug', w: toyOf(b).plush ? 7 : 2 }, { k: 'nudge', w: 1.5 }, { k: 'stare', w: 1.5 }]);
    if (a === 'stare') {
      setPose('crouch'); cat.wiggle = 0.8; yield* wait(rnd(0.6, 1.1)); cat.wiggle = 0;
      continue;
    }
    if (a === 'nudge') {
      setPose('sniff'); yield* wait(0.4);
      b.vx = cat.dir * 22; b.vz = 14; cat.needs.fun = Math.min(100, cat.needs.fun + 0.6); toySound(b);
      yield* wait(0.3); setPose('stand'); continue;
    }
    if (a === 'bat') {
      setPose('stand'); yield* wait(0.12);
      setPose('swat'); Snd.swat();
      yield* wait(0.1);
      if (Room.ball) {
        const bb = Room.ball;
        bb.vx = cat.dir * rnd(50, 115); bb.vgy = rnd(-40, 40); bb.vz = rnd(15, 55); toySound(bb);
        cat.needs.fun = Math.min(100, cat.needs.fun + 1.8);
      }
      yield* wait(0.22); setPose('stand');
      continue;
    }
    // hug & bunny-kick
    S('{n}가 털실공을 껴안고 토끼발차기!');
    setPose('crouch'); cat.wiggle = 0.7; yield* wait(0.5); cat.wiggle = 0;
    if (!Room.ball) continue;
    yield* hop(Room.ball.x - cat.dir * 8, Room.ball.gy, 6, 0.38, { pre: 0.02, post: 0.02 });
    if (!Room.ball) continue;
    const bb = Room.ball; bb.held = true; bb.vx = 0; bb.vgy = 0; bb.vz = 0;
    setPose('lieSide'); yield* wait(0.25);
    setPose('bellyUp'); face('shine', 'open1');
    const T = rnd(1.8, 3);
    yield* wait(T, e => {
      // the toy lies on the belly, between the front paws that hug it and the hind legs that kick it
      const R = cat.R || cat.p; bb.face = cat.dir;
      placeToyAt(bb, cat.x + cat.dir * ((R.cx + R.fNx) / 2 / SS - 0.5), (R.cy + R.cr) / SS + 1.5 + Math.sin(e * 22) * 0.6);
      cat.add.hNy = Math.abs(Math.sin(e * 22)) * 3; cat.add.hFy = Math.abs(Math.sin(e * 22 + 1.5)) * 3;
      cat.add.fNy = Math.sin(e * 6) * 1.5;
      cat.needs.fun = Math.min(100, cat.needs.fun + DT * 3);
    });
    cat.add = {};
    bb.held = false; bb.vx = cat.dir * rnd(70, 120); bb.vgy = rnd(-25, 25); bb.vz = rnd(40, 70);
    Snd.swat(); toySound(bb);
    setPose('lieSide'); yield* wait(0.3); setPose('crouch'); yield* wait(0.25);
    setPose('stand'); face('wide', 'closed', 'fwd');
    S('{n}가 털실공을 신나게 갖고 놀아요');
  }
  cat.wiggle = 0; cat.add = {}; lookFree();
  if (cat.needs.fun > 75) markContent();
  setPose('sit'); face('half'); yield* wait(0.4);
  if (chance(0.7)) yield* lickNose();
}

/* ---------- registry & chooser ---------- */
const BEH = {
  idleSit: bIdleSit, idleStand: bIdleStand, wander: bWander, groom: bGroom, loaf: bLoaf, nap: bNap,
  stretch: bStretch, scratch: bScratch, window: bWindow, sunbathe: bSunbathe, flop: bFlop, zoom: bZoomies,
  zoomSmall: () => bZoomies(true), tailChase: bTailChase, eat: bEat, drink: bDrink, checkBowl: bCheckBowl,
  callUser: bCallUser, inspect: bInspect, fly: bWatchFly, ball: bPlayBall, hairball: bHairball, sneeze: bSneeze,
  toilet: bToilet, loafIcon: bLoafOnIcon, punchIcon: bPunchIcon, follow: bFollowCursor, shy: bShyCursor,
  hunt: bHuntCursor, perch: bPerchWindow, peek: bPeek, pester: bPester, carried: bCarried,
  knock: bKnock, ghost: bGhost, rub: bRub, yowl: bYowl, airHunt: bAirHunt
};

function chooseNext() {
  if (cat.forced) {
    const f = cat.forced; cat.forced = null;
    if (BEH[f]) { startBehavior(BEH[f], f); return; }
  }
  const n = cat.needs, tr = cat.traits, lv = lightLevel();
  const night = clamp((0.8 - lv) / 0.5, 0, 1);
  const sleepy = clamp(1 - n.energy / 100, 0, 1);
  const hungry = clamp((70 - n.sat) / 70, 0, 1);
  const messy = Room.messes.length;
  const sun = sunSpot();
  const w = {};
  w.idleSit = 1.5; w.idleStand = 0.7;
  w.wander = 1.6 * (0.5 + tr.curious);
  w.groom = 0.9 + (cat.lastAte > NOW - 40 ? 1.8 : 0);
  w.loaf = 1.1 + tr.lazy * 1.4 + sleepy;
  w.nap = cat.napCooldown > 0 ? 0.05 : (sleepy * 3.2 + night * 2.2 + tr.lazy * 0.5) * (n.energy > 92 ? 0.1 : 1);
  w.stretch = 0.45;
  w.scratch = 0.4 + tr.play * 0.4;
  w.window = 0;
  w.sunbathe = sun.on ? 1.4 * (0.4 + tr.lazy) * (sleepy + 0.5) : 0;
  w.flop = n.love > 55 && n.energy > 25 ? 0.4 : 0.05;
  w.zoom = cat.zoomCooldown > 0 || n.energy < 45 ? 0 : 0.1 * tr.play * (1 + (n.fun < 40 ? 1 : 0));
  w.tailChase = n.energy > 50 ? 0.12 * tr.play : 0;
  w.eat = Room.bowl.food > 3 && n.sat < 95 ? Math.pow((100 - n.sat) / 100, 1.6) * 5 + (n.sat < 35 ? 9 : 0) : 0;
  w.drink = 0.28 + (cat.lastAte > NOW - 30 ? 1.2 : 0);
  w.checkBowl = Room.bowl.food < 3 && n.sat < 50 ? 1.2 + hungry * 3 : 0.05;
  w.callUser = (n.love < 32 ? 2 : 0) + (n.fun < 22 ? 1 : 0) + (n.sat < 28 && Room.bowl.food < 3 ? 3 : 0);
  w.inspect = messy ? 0.6 * Math.min(3, messy) : 0;
  w.fly = Room.fly ? 6 : 0;
  w.ball = Room.ball ? (n.fun < 75 ? 2.4 : 0.9) * (n.energy > 25 ? 1 : 0.2) * (0.4 + tr.play) : 0;
  w.hairball = cat.hairCount >= 4 ? 0.9 : 0.005;
  w.sneeze = 0.08;
  w.toilet = n.bowel >= 100 ? 100 : (n.bowel > 88 ? 2 : 0);
  const userHere = Desk.cursor.idle < 60;
  w.follow = userHere ? 0.5 + Math.max(0, n.love - 35) / 60 : 0;
  w.shy = userHere ? 0.35 + tr.shy * 0.9 + (n.love < 40 ? 0.7 : 0) : 0;
  w.hunt = userHere ? 0.45 + tr.play * 0.5 : 0;
  const nIcons = visibleIcons().length;
  w.loafIcon = nIcons ? 1.0 + tr.lazy * 0.9 : 0;
  w.punchIcon = nIcons ? 0.35 + tr.mischief * 1.1 : 0;
  w.perch = platforms().length ? 0.7 + tr.curious * 0.5 : 0;
  w.peek = 0.1 + tr.shy * 0.12;
  w.pester = userHere && cat.bored > 0.15 && cat.pesterCooldown <= 0 ? 0.6 + cat.bored * 5 : 0;
  w.carried = 0;
  w.knock = 0.25 + tr.mischief * 0.7;
  w.ghost = 0.3;
  w.rub = 0.4 + n.love / 150;
  w.yowl = isNight() ? 0.8 : 0.05;
  w.airHunt = 0.35 * (0.5 + tr.play);
  if (cat.bored > 0.2) { w.punchIcon *= 1 + 2.5 * cat.bored; w.zoom *= 1 + 2 * cat.bored; w.hunt *= 1 + 1.5 * cat.bored; w.follow *= 1 + cat.bored; w.idleSit *= 0.6; }
  if (cat.weak > 0.2) {                               // hungry: no energy for games, wants food and rest
    const k = 1 - cat.weak * 0.85;
    w.zoom *= 1 - cat.weak; w.punchIcon *= k; w.hunt *= k; w.scratch *= k; w.tailChase = 0; w.wander *= k; w.shy *= k; w.pester *= 0.3;
    w.loaf += cat.weak * 2.5; w.checkBowl += cat.weak * 3; w.callUser += cat.weak * 2;
  }
  if (cat.content) {                                   // satisfied after play: cuddly and calm
    w.loaf = w.loaf * 2.4 + 1; w.groom *= 1.6; w.flop = w.flop * 3 + 0.4; w.follow *= 1.4; w.punchIcon *= 0.3; w.shy *= 0.3; w.pester = 0; w.zoom *= 0.4;
  }
  applyLifeWeights(w);
  const pen = [0.12, 0.3, 0.5, 0.72, 0.9];
  const items = [];
  for (const k in w) {
    let v = w[k];
    for (let i = 0; i < pen.length; i++) if (cat.recent[cat.recent.length - 1 - i] === k) { v *= pen[i]; break; }
    if (v > 0) items.push({ k, w: v });
  }
  const pickK = wchoose(items);
  startBehavior(BEH[pickK], pickK);
}

/* urgent needs that interrupt whatever the cat is doing */
function urgentCheck() {
  if (cat.protect || cat.busy) return;
  if (typeof isHome === 'function' && !isHome()) {
    if ((cat.needs.bowel >= 112 || cat.needs.sat < 22) && cat.label !== 'goHome' && cat.label !== 'pet' && cat.label !== 'carried') interrupt(BEH.goHome, 'goHome');
    return;
  }
  if (cat.needs.bowel >= 118 && cat.label !== 'toilet' && cat.label !== 'pet' && cat.label !== 'carried') interrupt(BEH.toilet, 'toilet');
  // really hungry and there is food: drop everything (even a nap) and go eat
  if (cat.needs.sat < 26 && Room.bowl.food > 3 && cat.hungerUrge <= 0 && !['eat', 'toilet', 'pet', 'carried', 'churu', 'toy', 'hairball'].includes(cat.label)) {
    cat.hungerUrge = 10;
    interrupt(BEH.eat, 'eat');
  }
}

/* the cat hears kibble landing in the bowl */
function hearFood() {
  const n = cat.needs;
  if (cat.protect) return;
  const wake = cat.asleep ? (n.sat < 60 ? 0.6 : 0.1) : (n.sat > 88 ? 0.25 : 0.9);
  if (!chance(wake)) return;
  later(rnd(0.7, 2.6), () => {
    if (cat.protect || cat.label === 'pet' || cat.label === 'churu' || cat.label === 'toy' || cat.label === 'carried') return;
    if (Room.bowl.food > 3) interrupt(BEH.eat, 'eat');
  });
  if (!cat.asleep && cat.label !== 'eat') {
    cat.earN = 'fwd'; cat.earF = 'fwd';
    emote('food', 1.4);
  }
}
