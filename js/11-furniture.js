/* ============ extra furniture: unlocked by presents, placed / put away from the dock, each with its own way to play ============ */
const FURN = {
  cardbox: { n: '골판지 상자', hw: 14, hit: [-14, 14, -16, 2], def: [-330, -22] },
  tower:   { n: '캣타워',      hw: 12, hit: [-12, 12, -44, 2], def: [-560, -30] },
  grass:   { n: '캣그라스',    hw: 8,  hit: [-8, 8, -16, 2],   def: [-230, -16] },
  hammock: { n: '해먹',        hw: 22, hit: [-22, 22, -20, 2], def: [-700, -28] },
  tent:    { n: '텐트',        hw: 26, hit: [-26, 26, -34, 2], def: [-840, -30] }
};
const FURN_KEYS = Object.keys(FURN);
const FURN_LAYERS = { cardbox: [['back', -2.5], ['front', 0.5]], tower: [['all', -0.3]], grass: [['all', 0]], hammock: [['back', -0.8], ['front', 0.9]], tent: [['back', -2], ['front', 0.5]] };
const FURN_STAND = { cardbox: { dy: -2, z: () => 0 }, tower: { dy: 0, z: () => (cat.furnDx > 0 ? 38 : 18) }, hammock: { dy: 0.6, z: () => 8 }, tent: { dy: -1, z: () => 0 } };
Room.postOut = store.get('postOut', true) !== false;           // the scratching post can be put away
const postOn = () => Room.postOut !== false;
Room.bedOut = store.get('bedOut', true) !== false;             // the bed can be put away too (a hammock, a box or a tent can take its place)
const bedOn = () => Room.bedOut !== false;
function setBedOut(on) { Room.bedOut = !!on; store.set('bedOut', !!on); }
function setPostOut(on) {
  Room.postOut = !!on; store.set('postOut', !!on);
  if (!on && cat.label === 'scratch') { cat.gen = null; cat.busy = false; cat.label = ''; }
}
Room.furn = {};
for (const k of FURN_KEYS) Room.furn[k] = { out: false, x: 0, gy: 0, dx: FURN[k].def[0], dy: FURN[k].def[1], level: 1 };
(function () {   // saved placement
  const o = store.get('furn', null);
  if (!o) return;
  for (const k of FURN_KEYS) if (o[k]) { const F = Room.furn[k]; F.out = !!o[k].out; if (typeof o[k].dx === 'number') { F.dx = o[k].dx; F.dy = o[k].dy; } }
})();
function saveFurn() {
  const o = {};
  for (const k of FURN_KEYS) o[k] = { out: Room.furn[k].out, dx: Room.furn[k].dx, dy: Room.furn[k].dy };
  store.set('furn', o);
}
function layoutFurn() {
  for (const k of FURN_KEYS) {
    const F = Room.furn[k];
    F.x = clamp(W + F.dx, 30, W - 30); F.gy = clamp(propBottom() + F.dy, 60, propBottom());
  }
}
const furnOf = k => (Room.furn[k] && Room.furn[k].out ? Room.furn[k] : null);
function setFurnPos(k, x, y) {
  const F = Room.furn[k];
  F.x = clamp(x, 30, W - 30); F.gy = clamp(y, 60, propBottom());
  F.dx = F.x - W; F.dy = F.gy - propBottom();
}
function setFurnOut(k, on) {
  const F = Room.furn[k];
  if (!F || F.out === on) return;
  F.out = on;
  if (on) { layoutFurn(); if (Room.furn[k].gy < 60) setFurnPos(k, F.x, F.gy); }
  else if (cat.furn === k && cat.surface === 'furn') {          // the cat was using it: it hops off
    cat.surface = 'floor'; cat.furn = ''; cat.z = 0; cat.sortOverride = null; cat.gen = null; cat.busy = false; cat.gy = clamp(cat.gy + 6, GY_MIN, GY_MAX);
  }
  saveFurn();
}
function furnAt(x, y) {
  if (!isHome()) return null;
  let best = null;
  for (const k of FURN_KEYS) {
    const F = furnOf(k); if (!F) continue;
    const b = FURN[k].hit;
    if (x >= F.x + b[0] && x <= F.x + b[1] && y >= F.gy + b[2] && y <= F.gy + b[3]) best = k;
  }
  return best;
}

/* ---------- art (art-pixel grid: x right, y down, origin = foot of the piece) ---------- */
function drawFurn(c, k, layer) {
  const F = Room.furn[k];
  const extra = k === 'tower' ? Math.round(Math.sin(Room.t * 2) * 1.6) : (k === 'grass' ? Math.round(clamp(F.level, 0.15, 1) * 20) : 0);
  const spec = layer === 'shadow' ? { ...PSPEC.furn.shadow, key: 'fsh:' + k, name: 'fsh' } : { ...PSPEC.furn[k], key: 'furn:' + k + ':' + layer + ':' + extra, name: 'furn:' + k };
  inArt(c, F.x, F.gy, g => {
    if (layer === 'shadow') { aEll(g, 'rgba(30,20,50,0.2)', 0, 1, FURN[k].hw * SS * 0.9, 3); return; }
    switch (k) {
      case 'cardbox':
        if (layer === 'back') {
          boxO(g, -24, -30, 48, 30, '#7a4d28'); A(g, '#966535', -23, -29, 46, 16); A(g, '#6a421f', -23, -9, 46, 8);
          boxO(g, -26, -38, 22, 9, '#d9a066'); boxO(g, 4, -40, 22, 9, '#c98f58');
        } else {
          boxO(g, -24, -17, 48, 17, '#d9a066'); A(g, '#e8bb82', -23, -16, 46, 2); A(g, '#f0d9a8', -3, -17, 6, 17); A(g, '#b17c47', -23, -2, 46, 2);
          A(g, '#a97440', -18, -9, 11, 1); A(g, '#a97440', -18, -6, 8, 1); A(g, '#e8475f', 10, -12, 8, 5); A(g, '#ffffff', 12, -10, 4, 1);
        }
        break;
      case 'tower': {
        boxO(g, -22, -8, 44, 8, '#a67447'); A(g, '#cf9c68', -21, -7, 42, 1);
        boxO(g, -5, -84, 10, 78, '#e6cb9c');
        for (let y = -82; y < -8; y += 5) { A(g, '#c9a972', -5, y, 10, 1); }
        A(g, '#f8e8c6', -4, -83, 2, 74);
        boxO(g, -24, -40, 48, 6, '#7bb0e0'); A(g, '#b8d8f4', -23, -39, 46, 1);
        boxO(g, -20, -80, 40, 6, '#e8909a'); A(g, '#f6bcc6', -19, -79, 38, 1);
        const sw = Math.round(Math.sin(Room.t * 2) * 1.6);
        A(g, '#ffffff', 14, -74, 1, 16); aEllO(g, '#ffd36e', 14 + sw, -56, 3, 3);
        break;
      }
      case 'grass': {
        const L = clamp(F.level, 0.15, 1);
        for (let i = 0; i < 11; i++) {
          const h = Math.round((9 + (i * 7) % 6) * L), x = -7 + i * 1.4;
          A(g, i % 2 ? '#6fcf6f' : '#4fb35a', Math.round(x), -14 - h, 2, h + 2);
          A(g, '#a8f0a0', Math.round(x), -14 - h, 1, 2);
        }
        boxO(g, -9, -14, 18, 14, '#d9784a'); A(g, '#f09468', -8, -13, 16, 2); A(g, '#b85a32', -8, -3, 16, 3); A(g, '#7a4a30', -8, -14, 16, 2);
        break;
      }
      case 'hammock': {
        if (layer === 'back') {
          for (const sx of [-40, 36]) { boxO(g, sx, -42, 5, 42, '#a67447'); A(g, '#cf9c68', sx + 1, -41, 1, 40); }
          for (let x = -37; x <= 37; x++) {
            const y = -34 + Math.round(15 * (1 - Math.pow(x / 38, 2)));
            A(g, PO, x, y - 1, 1, 1); A(g, '#f2a6c0', x, y, 1, 6); A(g, '#ffd0e0', x, y, 1, 1);
          }
        } else {
          for (let x = -36; x <= 36; x++) {
            const y = -34 + Math.round(15 * (1 - Math.pow(x / 38, 2))) + 4;
            A(g, '#e28aa8', x, y, 1, 3); A(g, PO, x, y + 3, 1, 1);
          }
        }
        break;
      }
      case 'tent': {
        const hw = 52, H = 68, col = '#8fc7ff', lo = '#5fa0e0', hi = '#c6e4ff';
        if (layer === 'back') {
          for (let y = 0; y < 44; y++) { const w = Math.round(Math.sqrt(Math.max(0, 1 - Math.pow((y - 44) / 44, 2))) * 22); A(g, '#2f3a78', -w, -y - 1, w * 2, 1); }
          A(g, '#3f4a8a', -22, -3, 44, 3);
        } else {
          for (let y = 0; y < H; y++) {
            const w = Math.round(hw * (1 - y / H) + 4);
            const doorW = y < 44 ? Math.round(Math.sqrt(Math.max(0, 1 - Math.pow((y - 44) / 44, 2))) * 22) : -1;
            const row = -y - 1;
            const stripe = (y % 14) < 7 ? col : hi;
            // left and right of the door
            if (doorW >= 0) { A(g, PO, -w - 1, row, 1, 1); A(g, stripe, -w, row, w - doorW, 1); A(g, PO, -doorW - 1, row, 1, 1); A(g, PO, doorW, row, 1, 1); A(g, stripe, doorW + 1, row, w - doorW - 1, 1); A(g, PO, w, row, 1, 1); }
            else { A(g, PO, -w - 1, row, 1, 1); A(g, stripe, -w, row, w * 2, 1); A(g, PO, w, row, 1, 1); }
          }
          A(g, lo, -hw, -3, 30, 3); A(g, lo, 22, -3, 30, 3);
          A(g, '#ffd36e', -1, -H - 4, 2, 6); A(g, '#e8475f', 1, -H - 4, 6, 3);
        }
        break;
      }
      default:
    }
  }, spec);
}

/* ---------- moving the cat above the floor ---------- */
function* hopZ(tx, tgy, z1, h = 6, T = 0.5) {
  cat.busy = true;
  try {
    if (Math.abs(tx - cat.x) > 3 && sgn(tx - cat.x) !== cat.dir) cat.dir = sgn(tx - cat.x);
    setPose('crouch'); cat.eyes = 'wide'; yield* wait(0.2);
    const x0 = cat.x, g0 = cat.gy, z0 = cat.z;
    setPose('pounce');
    let t = 0;
    while (t < T) {
      t += DT; const u = Math.min(1, t / T);
      cat.x = lerp(x0, tx, u); cat.gy = lerp(g0, tgy, u); cat.z = lerp(z0, z1, u) + 4 * h * u * (1 - u);
      yield;
    }
    cat.x = tx; cat.gy = tgy; cat.z = z1;
    if (z1 < 1) { burstDust(cat.x, cat.gy + 1, 4, cat.dir); Snd.thump(); }
    setPose('crouch'); yield* wait(0.14);
  } finally { cat.busy = false; }
}
function* leaveFurn() {
  const k = cat.furn, F = Room.furn[k], sp = FURN[k];
  cat.sortOverride = null;
  if (!F || !F.out) { cat.surface = 'floor'; cat.z = 0; cat.furn = ''; return; }
  const side = chance(0.5) ? -1 : 1;
  yield* hopZ(clamp(F.x + side * (sp.hw + 10), 12, W - 12), clamp(F.gy + rnd(2, 8), GY_MIN, GY_MAX), 0, 6, 0.5);
  cat.surface = 'floor'; cat.furn = ''; cat.z = 0;
}
const stickTo = (F, dy = 0, dz = 0) => { cat.x = F.x + (cat.furnDx || 0); cat.gy = F.gy + dy; };

/* ---------- ways to play ---------- */
function* bCardbox() {
  const F = furnOf('cardbox'); if (!F) return;
  S('{n}가 골판지 상자를 발견했어요!'); face('shine', 'closed', 'fwd');
  yield* walkTo(F.x + (cat.x < F.x ? -1 : 1) * 26, F.gy + 2, { speed: SPD.trot, timeout: 25 });
  if (!furnOf('cardbox')) return;
  setPose('sniff'); yield* wait(rnd(0.8, 1.4)); setPose('stand');
  yield* hopZ(F.x, F.gy - 2, 0, 12, 0.5);
  cat.surface = 'furn'; cat.furn = 'cardbox'; cat.sortOverride = F.gy - 0.2; cat.furnDx = 0;
  S('{n}가 상자 안에 쏙 들어갔어요');
  setPose('sit', { yaw: 0, hdx: 3, tAng: 100, tCurl: -7, tWave: 4 }); face('shine'); lookViewer(1); cat.purr = 0.4; emote('heart', 1.2);
  const mode = wchoose([{ k: 'peek', w: 3 }, { k: 'loaf', w: 3 }, { k: 'sleep', w: 2 }]);
  const run = e => { stickTo(furnOf('cardbox') || F, -2); };
  yield* wait(rnd(2, 4), run);
  if (mode === 'peek') {
    const n = rint(3, 5);
    for (let i = 0; i < n && furnOf('cardbox'); i++) {
      setPose('crouch', { hdy: 4, hdx: 3, trx: -2, tAng: 100, tCurl: -7, tWave: 4 }); face('wide'); S('{n}가 상자 속에 숨어서 엿봐요');
      yield* wait(rnd(1, 2.2), run);
      setPose('sit', { yaw: 0, hdx: 3, tAng: 100, tCurl: -7, tWave: 4 }); face('shine'); cat.twN = 0.14; yield* wait(rnd(0.8, 1.6), run);
    }
  } else if (mode === 'loaf') {
    setPose('loaf', { hdx: 4, tAng: 100, tCurl: -8, tWave: 3 }); face('half'); cat.purr = 0.35; S('{n}가 상자 안에서 식빵을 구워요'); cat.furnDx = -1.5;       // (head pulled in and tail up, so the loaf fits inside the box)
    yield* wait(rnd(14, 28), run);
  } else {
    S('{n}가 상자 속에서 쌔근쌔근 자요');
    setPose('curl'); face('sleep'); cat.asleep = true; cat.purr = 0.2; cat.furnDx = -1.6;
    yield* wait(rnd(18, 40), e => { run(e); if (chance(DT * 0.4)) spawn('zzz', cat.headAbs.x + 4, cat.headAbs.y - 8, { vx: 4, vy: -9, life: 2 }); });
    cat.asleep = false; face('half'); yield* yawn();
  }
  cat.purr = 0;
  yield* leaveSurface();
  if (chance(0.5)) yield* stretchSeq();
}
bCardbox.keepSurface = true;

function* bTower() {
  const F = furnOf('tower'); if (!F) return;
  S('{n}가 캣타워를 올려다봐요'); face('shine', 'closed', 'fwd'); lookAtPt(F.x, F.gy - 30, 1);
  yield* walkTo(F.x + (cat.x < F.x ? -1 : 1) * 24, F.gy + 1, { speed: SPD.trot, timeout: 25 });
  if (!furnOf('tower')) return;
  setPose('lookUp'); yield* wait(rnd(0.7, 1.3)); lookFree();
  S('{n}가 캣타워를 타고 올라가요');
  yield* hopZ(F.x - 8, F.gy, 18, 8, 0.55);
  cat.surface = 'furn'; cat.furn = 'tower'; cat.sortOverride = F.gy + 0.7; cat.furnDx = -8;
  yield* wait(0.3, () => { const Fx = furnOf('tower') || F; cat.x = Fx.x + cat.furnDx; cat.gy = Fx.gy; });
  if (chance(0.7)) {
    yield* hopZ(F.x + 8, F.gy, 38, 7, 0.55); cat.furnDx = 8;
  }
  const top = cat.furnDx > 0;
  const run = () => { const Fx = furnOf('tower'); if (Fx) { cat.x = Fx.x + cat.furnDx; cat.gy = Fx.gy; } };
  S(top ? '{n}가 제일 꼭대기에서 세상을 내려다봐요' : '{n}가 타워 위에 올라앉았어요');
  setPose('sit', { yaw: 0.6 }); face('open'); lookViewer(0.6);
  const mode = wchoose([{ k: 'watch', w: 3 }, { k: 'sleep', w: top ? 3 : 1.5 }, { k: 'groom', w: 2 }]);
  if (mode === 'sleep') {
    S('{n}가 높은 곳에서 쌔근쌔근 자요');
    setPose('loaf'); face('sleep'); cat.asleep = true; cat.purr = 0.2;
    yield* wait(rnd(16, 34), e => { run(); if (chance(DT * 0.4)) spawn('zzz', cat.headAbs.x + 4, cat.headAbs.y - 8, { vx: 4, vy: -9, life: 2 }); });
    cat.asleep = false; cat.purr = 0; face('half'); yield* yawn();
  } else if (mode === 'groom') {
    yield* bGroomHere(run);
  } else {
    yield* wait(rnd(10, 22), e => { run(); if (chance(DT * 0.15)) cat.twN = 0.14; });
  }
  yield* leaveSurface();
  if (chance(0.5)) yield* stretchSeq();
}
bTower.keepSurface = true;
function* bGroomHere(run) {
  setPose('groomPaw'); face('sleep');
  yield* wait(rnd(4, 7), e => { run(); cat.add.fNy = Math.sin(e * 10) * 1.8; cat.add.fNx = Math.cos(e * 10) * 1.2; cat.mouth = Math.sin(e * 5) > 0.6 ? 'lick' : 'closed'; });
  cat.add = {}; cat.mouth = 'closed'; setPose('sit'); face('half');
}

function* bGrass() {
  const F = furnOf('grass'); if (!F) return;
  S('{n}가 풀 냄새에 이끌려 가요'); face('shine', 'closed', 'fwd');
  const side = cat.x < F.x ? -1 : 1;
  yield* walkTo(F.x + side * 14, F.gy + 1, { speed: SPD.walk, timeout: 25 });
  if (!furnOf('grass')) return;
  if (cat.dir !== -side) yield* turnTo(-side);
  setPose('sniff'); yield* wait(rnd(0.8, 1.4), e => { cat.add.hdy = Math.sin(e * 8) * 0.7; });
  cat.add = {};
  S('{n}가 캣그라스를 오물오물 뜯어 먹어요');
  setPose('eat'); face('half');
  const bites = rint(5, 10);
  for (let i = 0; i < bites; i++) {
    const Fx = furnOf('grass'); if (!Fx) break;
    cat.mouth = 'open1'; cat.add.hdy = -1; yield* wait(0.18); cat.mouth = 'closed'; cat.add.hdy = 0; Snd.munch();
    Fx.level = Math.max(0.15, Fx.level - 0.06);
    spawn('fur', Fx.x + rnd(-6, 6), Fx.gy - 14, { vx: rnd(-8, 8), vy: -rnd(6, 14), life: 0.7, g: 20, col: '#6fcf6f' });
    yield* wait(rnd(0.2, 0.45));
  }
  cat.add = {}; cat.needs.sat = Math.min(100, cat.needs.sat + 4); cat.needs.fun = Math.min(100, cat.needs.fun + 4); cat.hairCount += 1;
  setPose('sit'); face('half'); S('{n}가 입맛을 다셔요'); yield* wait(0.4); yield* lickNose();
  if (chance(0.25)) cat.forced = 'hairball';
}

function* bHammock() {
  const F = furnOf('hammock'); if (!F) return;
  S('{n}가 해먹이 마음에 들었나 봐요'); face('shine', 'closed', 'fwd');
  yield* walkTo(F.x + (cat.x < F.x ? -1 : 1) * 30, F.gy + 1, { speed: SPD.walk, timeout: 25 });
  if (!furnOf('hammock')) return;
  setPose('sniff'); yield* wait(0.8); setPose('stand');
  yield* hopZ(F.x, F.gy + 0.6, 8, 8, 0.5);
  cat.surface = 'furn'; cat.furn = 'hammock'; cat.sortOverride = F.gy + 0.3; cat.furnDx = 0;
  const run = e => { const Fx = furnOf('hammock') || F; cat.x = Fx.x + Math.sin(Room.t * 1.1) * 0.8; cat.gy = Fx.gy + 0.6; cat.z = 8 + Math.sin(Room.t * 1.1 + 1) * 0.5; };
  S('{n}가 해먹에 누워 흔들흔들해요');
  setPose('curl'); face('half'); cat.purr = 0.3; cat.blush = 1;      // curled up in the middle of the cloth, tail tucked in front
  yield* wait(rnd(3, 6), run);
  face('sleep'); cat.asleep = true;
  S('{n}가 해먹에서 쌔근쌔근 자요');
  yield* wait(rnd(22, 48), e => { run(e); if (chance(DT * 0.4)) spawn('zzz', cat.headAbs.x + 4, cat.headAbs.y - 8, { vx: 4, vy: -9, life: 2 }); });
  cat.asleep = false; cat.purr = 0; cat.blush = 0; face('half'); yield* yawn();
  yield* leaveSurface();
  yield* stretchSeq();
}
bHammock.keepSurface = true;

function* bTent() {
  const F = furnOf('tent'); if (!F) return;
  S('{n}가 텐트 안이 궁금해요'); face('shine', 'closed', 'fwd');
  yield* walkTo(F.x + (cat.x < F.x ? -1 : 1) * 42, F.gy + 2, { speed: SPD.walk, timeout: 25 });
  if (!furnOf('tent')) return;
  setPose('sniff'); yield* wait(rnd(0.8, 1.2)); setPose('stand');
  yield* walkTo(F.x, F.gy - 1, { speed: SPD.creep * 1.6, tol: 1.5, timeout: 6 });
  cat.surface = 'furn'; cat.furn = 'tent'; cat.sortOverride = F.gy - 0.2; cat.furnDx = 0;
  const run = e => { const Fx = furnOf('tent') || F; cat.x = Fx.x; cat.gy = Fx.gy - 1; };
  S('{n}가 텐트 안으로 쏙 들어갔어요');
  setPose('sit', { yaw: 0, hdx: 3 }); face('shine'); lookViewer(1); cat.purr = 0.3;
  yield* wait(rnd(2, 4), run);
  if (chance(0.5)) {
    S('{n}가 텐트 안에서 잠들었어요');
    setPose('curl'); face('sleep'); cat.asleep = true;
    yield* wait(rnd(20, 44), e => { run(e); if (chance(DT * 0.4)) spawn('zzz', cat.headAbs.x + 4, cat.headAbs.y - 8, { vx: 4, vy: -9, life: 2 }); });
    cat.asleep = false; face('half'); yield* yawn();
  } else {
    setPose('loaf'); face('half'); S('{n}가 텐트 안에서 쉬고 있어요');
    yield* wait(rnd(12, 24), run);
  }
  cat.purr = 0;
  yield* leaveSurface();
  yield* stretchSeq();
}
bTent.keepSurface = true;

BEH.cardbox = bCardbox; BEH.tower = bTower; BEH.grass = bGrass; BEH.hammock = bHammock; BEH.tent = bTent;

function applyFurnWeights(w) {
  if (!postOn()) w.scratch = 0;
  const n = cat.needs, tr = cat.traits, sleepy = clamp(1 - n.energy / 100, 0, 1);
  const home = isHome();
  w.cardbox = home && furnOf('cardbox') ? 0.8 + tr.shy * 0.6 + sleepy : 0;
  w.tower = home && furnOf('tower') && n.energy > 25 ? 0.7 + tr.curious * 1.1 + (n.energy < 70 ? 0.4 : 0) : 0;
  w.grass = home && furnOf('grass') ? 0.45 + (cat.hairCount < 3 ? 0.3 : 0) : 0;
  w.hammock = home && furnOf('hammock') ? 0.6 + sleepy * 2.2 + tr.lazy * 0.8 : 0;
  w.tent = home && furnOf('tent') ? 0.6 + tr.shy * 1.0 + sleepy * 1.4 : 0;
}
function updateFurn(dt) {
  if (cat.surface === 'furn' && !cat.busy && FURN_STAND[cat.furn]) {          // the cat rides along when the piece is dragged
    const Fz = furnOf(cat.furn), st = FURN_STAND[cat.furn];
    if (Fz) { cat.x = Fz.x + (cat.furnDx || 0); cat.gy = Fz.gy + st.dy; cat.z = st.z(); }
  }
  for (const k of FURN_KEYS) { const F = Room.furn[k]; if (F.level < 1) F.level = Math.min(1, F.level + dt * 0.006); }
}
