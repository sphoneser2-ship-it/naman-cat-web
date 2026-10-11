/* ============ more things a cat does ============ */

// dozing off while sitting up: the head sinks, jerks awake, and the cat pretends nothing happened
function* bNodOff() {
  S('{n}가 앉은 채로 꾸벅꾸벅 졸아요');
  setPose('sit'); face('half');
  const rounds = rint(2, 4);
  for (let i = 0; i < rounds; i++) {
    yield* wait(rnd(1.8, 2.8), e => {
      const d = Math.min(e, 2.4);
      cat.add.hdy = -d * 1.5; cat.add.pitch = -d * 0.22;
      cat.eyes = e > 1.1 ? 'sleep' : 'half';
      if (e > 1.6 && chance(DT * 0.8)) spawn('zzz', cat.headAbs.x + cat.dir * 4, cat.headAbs.y - 8, { vx: 4 * cat.dir, vy: -9, life: 1.6 });
    });
    cat.add = {}; face('wide'); cat.twN = 0.14; emote('alert', 0.8);
    cat.add.hdy = 2.2; yield* wait(0.22); cat.add.hdy = 0;
    face('half'); yield* wait(rnd(0.5, 1));
  }
  S('{n}가 졸다가 멋쩍은 듯 그루밍해요');
  face('open'); yield* lickNose();
}
bNodOff.keepSurface = true;

// back arched, tail puffed: hopping sideways at nothing at all
function* bSideHop() {
  S('{n}가 갑자기 옆으로 폴짝폴짝 뛰어요!');
  cat.asleep = false;
  setPose('spook'); face('wide', 'closed', 'flat'); cat.tailFlick = 50;
  yield* wait(0.35);
  const n = rint(3, 6);
  let dirS = chance(0.5) ? -1 : 1;
  for (let i = 0; i < n; i++) {
    const T = 0.42, x0 = cat.x, g0 = cat.gy, dx = dirS * rnd(10, 20);
    let t = 0;
    while (t < T) {
      t += DT; const u = Math.min(1, t / T);
      cat.x = clamp(x0 + dx * u, 12, W - 12); cat.z = 4 * 7 * u * (1 - u);
      yield;
    }
    cat.z = 0; cat.gy = g0; burstDust(cat.x, cat.gy + 1, 3, 0); Snd.thump();
    yield* wait(rnd(0.08, 0.22));
    if (chance(0.6)) dirS = -dirS;
  }
  setPose('stand'); face('wide'); yield* wait(0.5);
  face('half'); emote('dots', 1.2); yield* wait(0.4);
  yield* lickNose();
}

// a few turns on the spot before lying down
function* circleSpot() {
  if (cat.surface !== 'floor' || cat.protect) return;
  S('{n}가 잘 자리를 빙글빙글 돌아요');
  setPose('stand'); face('half');
  const x0 = cat.x, y0 = cat.gy;
  const turns = chance(0.5) ? 2 : 1;
  for (let k = 0; k < turns; k++) {
    for (const [dx, dy] of [[9, 1], [0, -4], [-9, 1], [0, 4]]) {
      yield* walkTo(clamp(x0 + dx, 12, W - 12), clamp(y0 + dy, GY_MIN, GY_MAX), { speed: SPD.creep * 1.5, tol: 1.5, timeout: 1.2, noVigor: true });
    }
  }
  yield* walkTo(x0, y0, { speed: SPD.creep * 1.5, tol: 1.5, timeout: 1.2, noVigor: true });
}

// shaking one paw out (after a drink)
function* shakePaw() {
  setPose('sit'); face('annoyed', 'closed', 'back');
  yield* wait(0.9, e => { cat.add.fNy = 6 + Math.sin(e * 45) * 2; cat.add.fNx = 6; });
  cat.add = {}; face('half'); yield* wait(0.25);
}

BEH.nodOff = bNodOff;
BEH.sideHop = bSideHop;

function applyMotionWeights(w) {
  const n = cat.needs, h = hourNow(), d = ageDays();
  const drowsy = clamp(1 - n.energy / 100, 0, 1);
  w.nodOff = 0.12 + drowsy * 0.9 + ((h >= 13 && h < 16) || h < 5 || h >= 23 ? 0.5 : 0);
  w.sideHop = n.energy > 55 ? 0.1 * (d < 9 ? 3 : 1) * (0.6 + cat.traits.play) : 0;
}
