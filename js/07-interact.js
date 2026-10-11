/* ============ interaction ============
   Nothing here needs the mouse to be captured:
   - petting happens by moving the cursor over the cat (hover),
   - the feather wand / laser follow the real cursor,
   - only poop, the food bowl, the yarn ball and the little dock take clicks.            */
const Toy = {
  wand: { x: 300, y: 200, vx: 0, vy: 0, active: false, speed: 0, caught: false },
  laser: { x: 300, y: 200, active: false, speed: 0 }
};

const Interact = {
  mode: 'none', modeT: 0,
  pet: { touching: false, stroking: false, zone: '', fromSleep: false, dwell: 0 },
  petRetry: 0, toyT: 1.2,
  churu: null,
  scoop: null,
  hover: '',               // what the cursor currently targets: cat | mess | bowl | ball | ''
  cleaned: 0
};

/* ---------- hit tests ---------- */
function catHit(x, y) {
  const R = cat.R || cat.p, hp = cat.headAbs;
  const hx = R.hx / SS, cx = R.cx / SS, hy = R.hy / SS, cy = R.cy / SS, hr = R.hr / SS, cr = R.cr / SS;
  const dh = Math.hypot(x - hp.x, (y - hp.y) * 1.1);
  if (dh < 9) return (y > hp.y + 3 && Math.abs(x - hp.x) < 7) ? 'chin' : 'head';
  // the haunch itself counts as the rump (the spot for 궁디팡팡), not only the strip behind it
  if (!cat.tgt.bellyUp && Math.hypot(x - (cat.x + cat.dir * hx), y - (cat.gy - cat.z - hy)) < hr + 3 && (x - cat.x) * cat.dir < cx - 2) return 'tail';
  const bx = cat.x + cat.dir * (hx + cx) / 2, by = cat.gy - cat.z - (hy + cy) / 2;
  const rx = Math.abs(cx - hx) / 2 + 7, ry = Math.max(hr, cr) + 3;
  const nx = (x - bx) / rx, ny = (y - by) / ry;
  if (nx * nx + ny * ny < 1) {
    if ((x - cat.x) * cat.dir < hx - 4) return 'tail';
    if (cat.tgt.bellyUp && cat.p.hy < 9 * SS) return 'belly';
    return y < by - 2 ? 'back' : 'side';
  }
  if ((x - cat.x) * cat.dir < hx - 6 && (x - cat.x) * cat.dir > hx - 22 && Math.abs(y - (cat.gy - cat.z - hy - 2)) < 10) return 'tail';
  return null;
}
function bowlHit(x, y) {
  const b = Room.bowl;
  return x > b.x - 10 && x < b.x + 10 && y > b.gy - 11 && y < b.gy + 2;
}
function ballHit(x, y) {
  const b = Room.ball;
  return !!b && Math.hypot(b.x - x, (b.gy - b.z - 3) - y) < 8;
}

/* ---------- kibble / treats ---------- */
function pourKibble() {
  const B = Room.bowl;
  if (B.food >= 96) { toast('그릇이 가득 찼어요'); return; }
  const amount = Math.min(100 - B.food, 38);
  const n = 9;
  for (let i = 0; i < n; i++) {
    spawn('kibble', 0, 0, {
      sx: B.x + rnd(-9, 9), sy: B.gy - 34 + rnd(-4, 4),
      tx: B.x + rnd(-4, 4), ty: B.gy - 7 + rnd(-1, 1), h: rnd(2, 6), life: rnd(0.3, 0.45), t: -i * 0.04,
      cb: i === n - 1 ? () => { B.food = Math.min(100, B.food + amount); Snd.kibble(); hearFood(); } : null
    });
  }
  toast('사료를 부었어요');
}
const churuGy = C => clamp(C.y + 14, GY_MIN + 6, GY_MAX);
function giveChuru() {
  if (cat.protect) { toast('지금은 볼일 중이에요'); return; }
  if (Interact.churu) { Interact.churu = null; toast('츄르를 치웠어요'); return; }
  if (cat.needs.sat >= 98) { toast(cat.name + '는 배가 불러서 관심이 없어요'); emote('dots', 1.4); return; }
  const dir = chance(0.5) ? -1 : 1;
  const x = clamp(cat.x + dir * rnd(34, 70), 24, W - 30);
  const y = clamp(cat.gy - 12, 40, GY_MAX);
  Interact.churu = { x, y, t: 0, age: 0, dur: 16, eaten: 0, drag: false };
  Snd.pop();
  toast('츄르를 잡고 끌어서 옮길 수 있어요');
  if (!cat.asleep || cat.needs.sat < 70) interrupt(bChuru, 'churu');
  else { cat.earN = 'fwd'; later(1.2, () => { if (Interact.churu) interrupt(bChuru, 'churu'); }); }
}
function spawnBall(kind = 'yarn') {
  const x = clamp(cat.x + (chance(0.5) ? -1 : 1) * rnd(24, 60), 20, W - 20);
  Room.ball = { kind, face: 1, x, gy: clamp(cat.gy + rnd(-10, 10), GY_MIN + 6, GY_MAX), z: 28, vx: rnd(-20, 20), vgy: rnd(-8, 8), vz: 0, rot: 0, held: false, ptrHeld: false };
  Snd.pop();
  later(rnd(0.5, 1.2), () => {
    const lb = isHunt(Room.ball) ? 'mouse' : 'ball';
    if (Room.ball && !cat.protect && cat.label !== 'pet' && cat.label !== 'ball' && cat.label !== 'mouse' && cat.needs.energy > 12) interrupt(BEH[lb], lb);
  });
}
// right-click: put the toys and the treat away
function dismissToys() {
  let did = false;
  if (Interact.mode !== 'none') { Interact.mode = 'none'; did = true; }
  if (Interact.churu) { Interact.churu = null; did = true; }
  if (Interact.hover === 'ball' && Room.ball) { Room.ball = null; did = true; }
  if (did) { Snd.pop(); toast('장난감을 치웠어요'); }
  return did;
}
// a plain left click anywhere (except on the dock / menu / adoption card) puts the fishing rod or laser away
function dismissPlayToys() {
  if (Adopt.open || Interact.drag || dockDrag || (Interact.mode !== 'wand' && Interact.mode !== 'laser' && Interact.mode !== 'brush')) return;
  const C = Desk.cursor, el = document.elementFromPoint(C.x * S_PX, C.y * S_PX);
  if (el && el.closest && el.closest('[data-hit]')) return;
  Interact.mode = 'none'; Snd.pop(); toast('장난감을 치웠어요');
}
function putBallAway() { const nm = Room.ball ? toyOf(Room.ball).n : '장난감'; Room.ball = null; toast(nm + '을(를) 치웠어요'); }

function setMode(m) {
  Interact.mode = Interact.mode === m ? 'none' : m;
  Interact.modeT = Interact.mode === 'none' ? 0 : 90;
  Interact.toyT = rnd(0.3, 0.8);
  Toy.wand.x = Desk.cursor.x; Toy.wand.y = Desk.cursor.y; Toy.wand.vx = Toy.wand.vy = 0;
  Snd.pop();
  toast(Interact.mode === 'wand' ? '낚싯대가 커서를 따라다녀요' : Interact.mode === 'laser' ? '레이저 점이 커서를 따라다녀요' : Interact.mode === 'brush' ? '빗을 들었어요. 고양이 위에서 쓱쓱 문질러 보세요' : '놀이를 마쳤어요');
}

/* ---------- toys physics ---------- */
function updateToys(dt) {
  const C = Desk.cursor;
  const w = Toy.wand;
  w.active = Interact.mode === 'wand';
  if (w.active) {
    const k = 70, c = 9;
    w.vx += ((C.x - w.x) * k - w.vx * c) * dt;
    w.vy += ((C.y - w.y) * k - w.vy * c) * dt;
    w.x += w.vx * dt; w.y += w.vy * dt;
    w.speed = Math.hypot(w.vx, w.vy);
  } else w.speed *= 0.9;
  const l = Toy.laser;
  l.active = Interact.mode === 'laser';
  if (l.active) { l.speed = C.speed; l.x = C.x; l.y = C.y; }
  if (Interact.mode !== 'none') {
    Interact.modeT -= dt;
    if (Interact.modeT <= 0) { Interact.mode = 'none'; toast('놀이 시간이 끝났어요'); }
  }

  const b = Room.ball;
  if (b) {
    if (isHunt(b) && !b.ptrHeld && !b.held) updateMouseToy(b, dt);
    if (b.ptrHeld) {
      b.x = clamp(C.x, 6, W - 6); b.gy = clamp(C.y + 4, GY_MIN, GY_MAX); b.z = 4;
      b.vx = b.vgy = b.vz = 0; b.held = true;
    } else if (!b.held) {
      const TT = toyOf(b);
      b.vz -= (TT.grav || 260) * dt; b.z += b.vz * dt;
      if (b.z < 0) { b.z = 0; if (Math.abs(b.vz) > 22) { if (Math.abs(b.vz) > 40) toySound(b); b.vz = -b.vz * TT.rest; } else b.vz = 0; }
      b.x += b.vx * dt; b.gy += b.vgy * dt;
      const fr = b.z <= 0.1 ? Math.exp(-TT.fric * dt) : Math.exp(-(TT.air || 0.2) * dt);
      b.vx *= fr; b.vgy *= fr;
      if (b.x < 7) { b.x = 7; b.vx = Math.abs(b.vx) * 0.7; }
      if (b.x > W - 7) { b.x = W - 7; b.vx = -Math.abs(b.vx) * 0.7; }
      if (b.gy < GY_MIN) { b.gy = GY_MIN; b.vgy = Math.abs(b.vgy) * 0.7; }
      if (b.gy > GY_MAX) { b.gy = GY_MAX; b.vgy = -Math.abs(b.vgy) * 0.7; }
      if (b.x > Room.ox - 2 && b.gy < wallBottom() && b.gy > Room.oy - 4) b.gy = b.gy < Room.oy + 30 ? Room.oy - 4 : wallBottom();
      b.rot += b.vx * dt * 0.35;
    }
  }
}

/* ---------- petting ---------- */
function acceptPet(fromSleep) {
  const n = cat.needs;
  let p = 0.62 + 0.3 * cat.affinity;
  if (fromSleep) p -= 0.12;
  if (n.sat < 22) p -= 0.2;
  if (n.love < 45) p += 0.2;
  if (n.love > 92) p -= 0.28;
  if (cat.petCooldown > 0) p -= 0.55;
  if (Interact.mode === 'brush') p += 0.18;
  p -= Math.min(0.2, Room.messes.length * 0.05);
  return chance(clamp(p, 0.12, 0.97));
}

function* rejectPet() {
  cat.petCooldown = rnd(9, 14);
  cat.affinity = Math.max(0.2, cat.affinity - 0.03);
  S('{n}가 지금은 싫다는 눈치예요');
  setPose(cat.poseName === 'curl' || cat.poseName === 'lieSide' ? 'loaf' : 'stand');
  face('annoyed', 'closed', 'flat'); cat.tailFlick = 50;
  emote('alert', 1.2);
  if (chance(0.5)) { Snd.hiss(); say('캭!', 'pop'); } else sayMeow('low', 0.7);
  yield* wait(0.5);
  setPose('stand'); face('half', 'closed', 'back');
  const dir = Math.random() < 0.5 ? -1 : 1;
  yield* walkTo(clamp(cat.x + dir * rnd(40, 80), 14, W - 14), clamp(cat.gy + rnd(-10, 10), GY_MIN, GY_MAX), { speed: SPD.trot });
  setPose('sit'); face('half'); S('{n}가 괜히 딴청을 피워요');
  yield* wait(0.5);
  yield* bGroom();
}

function* swatAway() {
  S('{n}가 그만 만지라고 해요!');
  cat.petCooldown = rnd(12, 18);
  cat.affinity = Math.max(0.2, cat.affinity - 0.015);
  cat.purr = 0;
  setPose('swat'); face('annoyed', 'open1', 'flat');
  Snd.swat(); say('냥!', 'pop'); emote('alert', 1.2);
  yield* wait(0.3);
  setPose('stand'); face('half', 'closed', 'back'); cat.tailFlick = 60;
  yield* walkTo(clamp(cat.x - cat.dir * rnd(40, 70), 14, W - 14), clamp(cat.gy + rnd(-8, 8), GY_MIN, GY_MAX), { speed: SPD.trot });
  setPose('sit'); face('half'); S('{n}가 삐친 듯 털을 고르고 있어요');
  yield* wait(0.4);
  yield* bGroom();
}

function* bPet() {
  const P = Interact.pet, n = cat.needs, C = Desk.cursor;
  const fromSleep = Interact.petFromSleep;
  if (!acceptPet(fromSleep)) { yield* rejectPet(); return; }
  S('{n}를 쓰다듬는 중');
  const lying = ['loaf', 'sphinx', 'curl', 'lieSide', 'bellyUp'].includes(cat.poseName);
  if (fromSleep) {
    face('half'); cat.mouth = 'open1'; sayMeow('chirp', 0.6);
    yield* wait(0.5); cat.mouth = 'closed';
  }
  const stay = cat.surface === 'sill' || cat.surface === 'platform' || cat.surface === 'furn';
  if (stay || lying) setPose(cat.poseName === 'bellyUp' ? 'bellyUp' : (stay ? 'sit' : 'loaf'));
  else setPose('sit');
  face('happy'); cat.purr = 0.5; cat.blush = 1; lookFree();
  let idle = 0, over = 0, warned = false, heartT = 0, bellyT = 0, active = 0;
  let rump = 0, rumpGone = 0, butt = false, prevSp = 0, bump = 0, patN = 0, brushT = 0, headT = 0;
  const baseLying = lying || stay;
  for (;;) {
    const touching = P.touching;
    const stroking = P.stroking;
    const zone = P.zone;
    if (touching) idle = 0; else idle += DT;
    if (idle > 1.6) break;
    // ---- rump rubs: the cat pushes its bottom up and wiggles its tail
    // the hand can move between the head and the rump at any time: head = normal stroking, rump = 궁디팡팡, and back again
    const pat = C.speed > 70 && prevSp <= 70 && touching && zone === 'tail';        // a quick pat
    const onHead = touching && (zone === 'head' || zone === 'chin');
    headT = onHead ? headT + DT : 0;
    if (touching && zone === 'tail') { rumpGone = 0; if (stroking) rump += DT; } else { rumpGone += DT; rump = Math.max(0, rump - DT * (onHead ? 4 : 0.6)); }
    if (pat && !butt) { rump += 0.35; rumpGone = 0; }
    if (!baseLying && !butt && rump > 0.3) {
      butt = true; setPose('buttUp'); face('happy'); cat.blush = 1; emote('heart', 1.4);
      S('{n}가 엉덩이를 치켜들고 좋아해요');
    } else if (butt && (rumpGone > 1.0 || headT > 0.15)) {
      butt = false; rump = 0; rumpGone = 0; cat.add = {}; setPose('sit'); face('happy'); S('{n}를 쓰다듬는 중');
    }
    if (butt) {
      // every quick tap ("팡팡") makes the bottom bounce up into the hand
      const tap = C.speed > 70 && prevSp <= 70 && touching && zone === 'tail';
      if (tap) { bump = 1; patN++; if (patN % 2 === 0) burstHearts(cat.x - cat.dir * 12, cat.gy - 26, 1); if (chance(0.25)) Snd.meow('chirp', 0.35); }
      bump *= Math.exp(-DT * 7);
      cat.add.hy = 4 * bump; cat.add.cy = -1.5 * bump; cat.add.tWave = 12; cat.add.tSpd = 6;
      cat.purr = 0.9;
    } else if (baseLying && touching && stroking && zone !== 'head' && zone !== 'chin') {
      // content cats knead while they are stroked
      const k = Math.max(0, Math.sin(NOW * 5));
      cat.add.fNy = k * 3; cat.add.fFy = Math.max(0, Math.sin(NOW * 5 + Math.PI)) * 3;
    } else if (touching && stroking && (zone === 'head' || zone === 'chin')) {
      cat.add.cx = Math.sin(NOW * 5) * 0.8; cat.add.pitch = 0.3 + Math.sin(NOW * 5) * 0.2;      // pushing the head into the hand
    }
    prevSp = C.speed;
    if (touching) {
      active += DT;
      cat.eyes = (zone === 'head' || zone === 'chin') ? 'happy' : 'sleep';
      cat.mouth = 'closed';
      cat.purr = stroking ? 0.85 : 0.5;
      const hp = cat.headAbs;
      const dxp = (C.x - hp.x) * cat.dir, dyp = C.y - hp.y;
      if (!butt) {
        cat.add.hdx = clamp(dxp * 0.3, -2, 3);
        cat.add.hdy = clamp(-dyp * 0.2, -2, 2);
        if (zone === 'chin') cat.add.pitch = 0.6;
        else if (!(stroking && zone === 'head')) cat.add.pitch = 0;
        if (!(stroking && zone === 'head')) cat.add.cx = zone === 'back' && stroking ? Math.sin(NOW * 6) * 0.3 : 0;
        cat.add.arch = zone === 'back' && stroking ? 1 : 0;
      }
      if (stroking) {
        const brushing = Interact.mode === 'brush';
        if (brushing) {
          brushT += DT;
          if (chance(DT * 12)) spawn('fur', C.x + rnd(-5, 5), C.y + rnd(-4, 4), { vx: rnd(-16, 16), vy: rnd(-14, -2), life: 0.9, g: 14, col: cat.K ? cat.K.base : '#fff' });
          if (zone === 'back' || zone === 'side') { cat.add.arch = 1.2; cat.add.pitch = 0.3; }
        }
        const gain = (butt && zone === 'tail' ? 5.5 : zone === 'head' || zone === 'chin' ? 5 : zone === 'back' ? 3.5 : 2) * (brushing ? 1.5 : 1);
        n.love = Math.min(100, n.love + gain * DT);
        n.fun = Math.min(100, n.fun + 0.5 * DT);
        cat.affinity = Math.min(0.98, cat.affinity + 0.0007 * DT);
        const rate = (zone === 'head' ? 0.5 : zone === 'chin' ? 0.35 : zone === 'back' ? 0.9 : zone === 'belly' ? 2.4 : zone === 'tail' ? (butt ? 0.6 : 2.0) : 1.1) / 22;
        over += rate * DT * (n.love > 94 ? 1.8 : 1) * (brushing && (zone === 'back' || zone === 'side') ? 0.35 : 1);
        heartT -= DT;
        if (heartT <= 0) { heartT = zone === 'head' ? 0.4 : 0.7; burstHearts(cat.headAbs.x, cat.headAbs.y - 8, 1); }
      } else n.love = Math.min(100, n.love + 0.8 * DT);
      if (zone === 'belly') {
        bellyT += stroking ? DT : 0;
        if (bellyT > 1.3) {
          bellyT = -2;
          if (chance(0.5)) {
            S('{n}가 배를 만지자 덥석! 함정이었어요');
            face('shine', 'open2', 'flat'); cat.purr = 0;
            Snd.swat(); say('앙!', 'pop'); emote('alert', 1.1);
            yield* wait(0.9, e => {
              cat.add.fNy = 11 + Math.sin(e * 32) * 2; cat.add.fFy = 12 + Math.sin(e * 32 + 1) * 2;
              cat.add.hNy = 3 + Math.abs(Math.sin(e * 28)) * 4; cat.add.hFy = 3 + Math.abs(Math.sin(e * 28 + 2)) * 4;
            });
            cat.add = {}; over = Math.max(over, 0.45); face('happy'); cat.purr = 0.4;
            S('{n}를 쓰다듬는 중');
          }
        }
      }
    } else {
      cat.eyes = 'sleep'; cat.purr = butt ? 0.6 : 0.3; cat.add.hdx = 0; cat.add.hdy = 0; if (!butt) cat.add.pitch = 0; cat.add.arch = 0;
      over = Math.max(0, over - 0.08 * DT);
    }
    if (over > 0.68 && !warned) {
      warned = true; face('annoyed', 'closed', 'flat'); cat.tailFlick = 40; cat.purr = 0.15;
      say('냥…', 'soft'); emote('ask', 1.2);
      S('{n}의 꼬리가 살랑살랑… 슬슬 그만 만지는 게 좋겠어요');
    }
    if (over >= 1) { cat.add = {}; yield* swatAway(); return; }
    if (warned && over < 0.45) { warned = false; face('happy'); S('{n}를 쓰다듬는 중'); }
    yield;
  }
  cat.add = {}; cat.purr = 0; cat.blush = 0;
  if (brushT > 3) { diaryNote('brush'); cat.hairCount = Math.max(0, cat.hairCount - 2); n.love = Math.min(100, n.love + 6); }
  if (butt) { setPose('stand'); face('happy'); yield* wait(0.5); }
  Interact.petRetry = 3;
  if (active < 0.6) { face('half'); return; }
  S('{n}가 만족스러운 표정이에요');
  if (n.love > 85) markContent();
  if (lying || stay) {
    face('half'); cat.purr = 0.2; yield* wait(rnd(2, 4)); cat.purr = 0;
    if (!stay && n.energy < 70 && chance(0.5)) yield* sleepHere(0.6);
    return;
  }
  const a = wchoose([{ k: 'groom', w: 3 }, { k: 'stare', w: 2 }, { k: 'away', w: 1.5 }, { k: 'flop', w: n.love > 70 ? 1.5 : 0.2 }]);
  if (a === 'groom') { setPose('sit'); face('half'); yield* wait(0.4); yield* bGroom(); }
  else if (a === 'stare') {
    setPose('sit', { yaw: 0, hdx: 3 }); lookViewer(1); face('open'); yield* slowBlinkAtViewer(); yield* wait(rnd(1, 3));
  } else if (a === 'flop') { cat.forced = 'flop'; }
  else {
    setPose('stand'); face('open');
    yield* walkTo(clamp(cat.x + rnd(-60, 60), 14, W - 14), clamp(cat.gy + rnd(-12, 12), GY_MIN, GY_MAX), { speed: SPD.walk });
  }
}

bPet.keepSurface = true;

/* ---------- treat tube held by a hand ---------- */
function* bChuru() {
  const C = Interact.churu, n = cat.needs;
  if (!C) return;
  S('{n}가 츄르 냄새에 달려와요!');
  face('shine', 'closed', 'fwd'); setPose('stand'); emote('food', 1.4);
  let lickT = 0, heartT = 0, refused = false;
  try {
    while (Interact.churu === C && C.t < C.dur) {
      if (!C.drag) C.t += DT;
      if (n.sat >= 98) {
        if (!refused) {
          refused = true; S('{n}는 배불러서 고개를 돌려요'); face('half', 'closed', 'flat'); lookFree();
          setPose('sit'); emote('dots', 1.6); cat.purr = 0;
        }
        if (C.t > 2.5) break;
        yield; continue;
      }
      const gy = churuGy(C), dx = C.x - cat.x;
      if (Math.abs(dx) > 13 && sgn(dx) !== cat.dir) { yield* turnTo(sgn(dx), true); continue; }
      const wantX = C.x - cat.dir * 13;
      const ex = wantX - cat.x, ey = gy - cat.gy;
      const d = Math.hypot(ex, ey * 1.4);
      // "close enough" must be looser than walkTo's own arrival test, otherwise the cat shuffles forever without eating
      if (Math.abs(ex) > 6 || Math.abs(ey) > 6) {
        refused = false;
        setPose('stand'); face('shine', 'closed', 'fwd'); cat.purr = 0;
        yield* walkTo(wantX, gy, { speed: d > 28 ? SPD.run : d > 9 ? SPD.trot : SPD.walk, timeout: 0.35, tol: 2, arrive: !C.drag && d < 24, quick: true });
        continue;
      }
      setPose('stand', { hdy: 29, pitch: 0.3 }, true);
      // keep licking while the tube drifts: shuffle along with it
      { const vx = clamp(ex * 3, -24, 24), vy = clamp(ey * 2, -14, 14); cat.x += vx * DT; cat.gy += vy * DT * 0.7; if (Math.abs(vx) + Math.abs(vy) > 3) { cat.moving = true; cat.speed = Math.abs(vx) + Math.abs(vy) * 0.7; } }
      S('{n}가 츄르를 쭉쭉 핥아요');
      face('half'); cat.blush = 1; cat.purr = 0.6;
      lickT -= DT;
      if (lickT <= 0) {
        lickT = 0.3;
        cat.mouth = 'tongue'; Snd.lick();
        later(0.14, () => { if (cat.label === 'churu') cat.mouth = 'closed'; });
      }
      C.eaten += DT;
      n.sat = Math.min(100, n.sat + 2.0 * DT); n.love = Math.min(100, n.love + 2.4 * DT);
      n.fun = Math.min(100, n.fun + 1.2 * DT); n.bowel += 3.2 * DT; cat.lastAte = NOW;
      cat.add.hdx = Math.sin(NOW * 12) * 0.5 + clamp(ex * 0.4, -2.5, 2.5);
      heartT -= DT;
      if (heartT <= 0) { heartT = 0.9; burstHearts(cat.headAbs.x, cat.headAbs.y - 8, 1); }
      yield;
    }
  } finally {
    if (Interact.churu === C) Interact.churu = null;     // never leave a stale tube behind
  }
  cat.add = {}; cat.purr = 0; cat.blush = 0; lookFree();
  setPose('sit'); face('happy', 'lick'); S('{n}가 입맛을 다셔요');
  yield* wait(0.7); yield* lickNose();
  if (C.eaten > 3) { emote('heart', 1.6); markContent(); }
}

function* bWatchToy() {
  S('{n}가 장난감을 가만히 지켜봐요…');
  const tg = () => (Interact.mode === 'wand' ? Toy.wand : Toy.laser);
  setPose(chance(0.5) ? 'sit' : 'crouch'); face('wide', 'closed', 'fwd');
  lookAt(() => ({ x: tg().x, y: tg().y }), 1);
  let el = 0;
  const dur = rnd(2, 3.5);
  while (el < dur && Interact.mode !== 'none') {
    el += DT;
    if (chance(DT * 1.4)) cat.tailFlick = 35;
    yield;
  }
  lookFree();
}

/* ---------- feather wand ---------- */
function toyFun(rate) {
  const n = cat.needs;
  n.fun = Math.min(100, n.fun + rate * DT);
  n.love = Math.min(100, n.love + rate * 0.12 * DT);
  n.energy = Math.max(0, n.energy - rate * 0.45 * DT);
}

function* holdFeather() {
  const T = Toy.wand;
  T.caught = true;
  S('{n}가 깃털을 낚아챘어요!');
  setPose('crouch', { hdy: 8, pitch: -0.5 }); face('shine', 'open1', 'fwd');
  cat.needs.fun = Math.min(100, cat.needs.fun + 5);
  Snd.swat(); emote('star', 1.4);
  const hold = rnd(1.4, 3);
  let el = 0;
  while (el < hold) {
    el += DT;
    cat.mouth = Math.sin(el * 20) > 0 ? 'open1' : 'closed';
    cat.add.hdy = Math.sin(el * 20) * 0.6;
    toyFun(2.5);
    if (!T.active || Desk.cursor.speed > 300) break;
    yield;
  }
  T.caught = false; cat.add = {}; cat.mouth = 'closed';
}

function* pounceAtWand() {
  const T = Toy.wand;
  cat.wiggle = 0;
  const fy = T.y;
  const tx = clamp(T.x - cat.dir * 4, cat.x - 30, cat.x + 30);
  const gyT = fy >= cat.gy - 4 ? clamp(fy, GY_MIN, GY_MAX) : cat.gy;
  yield* hop(tx, resolveWall(tx, gyT, cat.gy), 8, 0.42, { pre: 0.1, post: 0.05 });
  const caught = T.active && Math.abs(T.x - cat.x) < 15 && Math.abs(T.y - cat.gy) < 16 && (T.speed < 100 || chance(0.35));
  if (caught) yield* holdFeather();
  else {
    S('{n}가 아깝게 놓쳤어요!');
    face('wide', 'closed', 'fwd'); emote('ask', 1.2);
    toyFun(1);
    yield* wait(0.45);
  }
}

function* batHigh() {
  const T = Toy.wand;
  setPose('stand'); face('wide', 'closed', 'fwd');
  yield* wait(0.12);
  const h = clamp(cat.gy - T.y, 8, 30);
  yield* hop(clamp(T.x, cat.x - 8, cat.x + 8), cat.gy, clamp(h * 0.5, 5, 13), 0.46, { pre: 0.1, post: 0.05, air: 'scratch' });
  const caught = T.active && Math.abs(T.x - cat.x) < 16 && (cat.gy - T.y) < 38 && T.speed < 90 && chance(0.55);
  if (caught) yield* holdFeather();
  else { toyFun(1); S('{n}가 허공을 휘저었어요!'); face('wide'); yield* wait(0.3); }
}

function* bPlayWand() {
  const T = Toy.wand;
  S('{n}가 낚싯대에서 눈을 떼지 못해요!');
  face('wide', 'closed', 'fwd');
  lookAt(() => (T.active ? { x: T.x, y: T.y } : null), 1);
  setPose('crouch');
  let lost = 0, el = 0, still = 0;
  try {
    for (;;) {
      el += DT;
      if (!T.active) { lost += DT; if (lost > 2) break; } else lost = 0;
      if (cat.needs.fun >= 99 && el > 6 && chance(DT * 0.3)) break;
      if (el > 80) break;
      const fx = T.x, fy = T.y;
      const floorLevel = fy >= cat.gy - 4;
      const height = floorLevel ? 0 : cat.gy - fy;
      const tgy = floorLevel ? clamp(fy, GY_MIN, GY_MAX) : cat.gy;
      const dx = fx - cat.x, adx = Math.abs(dx);
      if (T.speed < 18) still += DT; else still = 0;
      if (!T.active) { setPose('crouch'); cat.wiggle = 0; yield; continue; }
      if (adx > 10 && sgn(dx) !== cat.dir) { yield* turnTo(sgn(dx), true); continue; }
      if (height > 12 && adx < 28) {
        if (still > 0.2 || chance(DT * 0.9)) { yield* batHigh(); continue; }
        setPose('lookUp'); face('wide', 'closed', 'fwd'); toyFun(0.8); yield; continue;
      }
      if (adx > 52) {
        setPose('stand'); face('wide', 'closed', 'fwd'); cat.wiggle = 0;
        yield* walkTo(fx - cat.dir * 30, tgy, { speed: T.speed > 30 ? SPD.trot : SPD.walk, timeout: 0.4, arrive: false, quick: true, tol: 4 });
        continue;
      }
      if (adx > 26) {
        setPose('crouch'); cat.wiggle = 0;
        if (T.speed > 110) yield* walkTo(fx - cat.dir * 24, tgy, { speed: SPD.run, timeout: 0.35, arrive: false, quick: true, tol: 4 });
        else yield* walkTo(fx - cat.dir * 22, tgy, { speed: SPD.creep * 1.4, timeout: 0.5, arrive: false, tol: 2 });
        toyFun(1.2);
        continue;
      }
      toyFun(1.5);
      if (T.speed > 75) {
        setPose('crouch'); cat.wiggle = 0.5;
        if (chance(DT * 2.2)) yield* pounceAtWand(); else yield;
        continue;
      }
      setPose('crouch'); cat.wiggle = 0.9;
      yield* wait(rnd(0.35, 0.8));
      yield* pounceAtWand();
    }
  } finally { T.caught = false; cat.wiggle = 0; }
  cat.wiggle = 0; cat.add = {}; lookFree();
  Interact.toyT = rnd(0.8, 1.6);
  cat.toyCooldown = rnd(2, 5);
  setPose('sit'); face('half');
  if (cat.needs.fun > 70) { markContent(); S('{n}가 실컷 놀고 만족해요'); }
  yield* wait(0.5); yield* lickNose();
}

/* ---------- laser dot ---------- */
function* bPlayLaser() {
  const L = Toy.laser;
  S('{n}가 빨간 점을 노려봐요!');
  face('wide', 'closed', 'fwd');
  lookAt(() => (L.active ? { x: L.x, y: L.y } : null), 1);
  setPose('crouch');
  let lost = 0, el = 0, frustr = 0, still = 0, lx = L.x, ly = L.y;
  try {
    for (;;) {
      el += DT;
      if (!L.active) { lost += DT; if (lost > 2) break; } else lost = 0;
      if (frustr >= 5 || el > 80) break;
      const tx = L.x, ty = clamp(L.y, GY_MIN, GY_MAX);
      const dx = tx - cat.x, d = Math.hypot(dx, (ty - cat.gy) * 1.4);
      const moving = Math.hypot(L.x - lx, L.y - ly) / DT > 14;
      lx = L.x; ly = L.y;
      still = moving ? 0 : still + DT;
      if (!L.active) { setPose('crouch'); yield; continue; }
      if (Math.abs(dx) > 6 && sgn(dx) !== cat.dir) { yield* turnTo(sgn(dx), true); continue; }
      toyFun(1.6);
      if (d > 14 && (moving || still < 0.5)) {
        setPose('run'); face('wide', 'closed', 'fwd'); cat.wiggle = 0;
        yield* walkTo(tx - cat.dir * 4, ty, { speed: d > 50 ? SPD.sprint : SPD.run, arrive: false, tol: 3, timeout: 0.3, quick: true });
        continue;
      }
      if (d > 14) {
        setPose('crouch');
        yield* walkTo(tx - cat.dir * 8, ty, { speed: SPD.creep * 1.5, timeout: 0.4, tol: 3 });
        continue;
      }
      if (still > 0.25) {
        setPose('crouch'); cat.wiggle = 0.9;
        yield* wait(rnd(0.3, 0.6)); cat.wiggle = 0;
        yield* hop(tx, resolveWall(tx, ty, cat.gy), 6, 0.36, { pre: 0.05, post: 0.05 });
        S('{n}가 앞발 밑을 확인해요… 없다?');
        setPose('crouch', { hdy: 8, pitch: -0.5 }); face('shine'); emote('ask', 1.6);
        cat.needs.fun = Math.min(100, cat.needs.fun + 3);
        yield* wait(1.0);
        frustr++;
        S('{n}가 빨간 점을 노려봐요!');
        face('wide', 'closed', 'fwd'); setPose('crouch');
      } else { setPose('crouch'); cat.wiggle = 0.4; yield; }
    }
  } finally { cat.wiggle = 0; }
  cat.wiggle = 0; cat.add = {}; lookFree();
  Interact.toyT = rnd(0.8, 1.6);
  cat.toyCooldown = rnd(2, 5);
  setPose('sit');
  if (frustr >= 5) {
    S('{n}가 잡히지 않는 점에 허탈해해요…'); face('half', 'frown'); emote('sweat', 1.8);
    cat.needs.fun = Math.max(0, cat.needs.fun - 6);
    yield* wait(1.2);
  } else { face('half'); if (cat.needs.fun > 70) markContent(); }
  yield* lickNose();
}

/* ---------- cleaning ---------- */
function useScoop(x, y) {
  const m = messAt(x, y, 10);
  Interact.scoop = { t: 0, x, y, hit: !!m };
  if (!m) { Snd.scratch(); return; }
  Snd.scoop();
  const mx = m.x, my = m.where === 'box' ? Room.box.by - 6 : m.gy - 3;
  removeMess(m);
  for (let i = 0; i < 6; i++) spawn('spark', mx + rnd(-6, 6), my + rnd(-8, 2), { vy: -rnd(6, 16), life: 0.7 });
  spawn('poof', mx, my - 2, { life: 0.55, rot: rnd(3) });
  Interact.cleaned++;
  later(0.15, () => Snd.sparkle());
  toast(m.kind === 'hairball' ? '헤어볼을 치웠어요' : '깨끗해졌어요!');
}

/* ---------- pointer (only receives events where the window captures the mouse) ---------- */
const PROP_BOX = { post: [-8, 8, -42, 1], box: [-17, 17, -12, 1], bowl: [-7, 7, -9, 1], water: [-7, 7, -9, 1], cushion: [-15, 15, -10, 2] };
function propAt(x, y) {
  if (!isHome()) return null;
  for (const k of ['bowl', 'water', 'post', 'box', 'cushion']) {
    if (k === 'post' && !postOn()) continue;
    if (k === 'cushion' && !bedOn()) continue;
    const b = PROP_BOX[k], p = Room[k], py = propY(k);
    if (x >= p.x + b[0] && x <= p.x + b[1] && y >= py + b[2] && y <= py + b[3]) return k;
  }
  return null;
}
function churuHit(x, y) {
  const C = Interact.churu;
  return !!C && x > C.x - 4 && x < C.x + 22 && y > C.y - 26 && y < C.y + 5;
}
function logicalFromEvent(e) { return { x: e.clientX / S_PX, y: e.clientY / S_PX }; }

function onPointerDown(e) {
  if (Adopt.open) return;
  if (e.target && e.target.closest && e.target.closest('[data-hit]')) return;     // the dock handles its own clicks
  Snd.wake();
  const q = logicalFromEvent(e);
  Desk.cursor.x = q.x; Desk.cursor.y = q.y;
  if (presentHit(q.x, q.y)) { openPresent(); return; }
  if (giftHit(q.x, q.y)) { removeGift(); Snd.pop(); return; }
  if (messAt(q.x, q.y, 9)) { useScoop(q.x, q.y); return; }
  if (ballHit(q.x, q.y)) {
    const b = Room.ball; b.ptrHeld = true; b.held = true; Interact.draggingBall = true; Interact.ballDown = { x: q.x, y: q.y, moved: false };
    window.addEventListener('pointerup', onBallRelease, { once: true });
    return;
  }
  if (churuHit(q.x, q.y)) { startDrag('churu', null, q); return; }
  { const fk = furnAt(q.x, q.y); if (fk) { startDrag('furn', fk, q); return; } }
  const k = propAt(q.x, q.y);
  if (k) { startDrag('prop', k, q); return; }
  if (!Prefs.passOnly && !cat.onIcon && catHit(q.x, q.y)) startCarry(q);
}
function onBallRelease() {
  const b = Room.ball, C = Desk.cursor;
  Interact.draggingBall = false;
  if (!b) return;
  // a plain click (pressed and let go without dragging) puts the yarn ball away
  const bd = Interact.ballDown; Interact.ballDown = null;
  if (bd && !bd.moved && Math.hypot(C.x - bd.x, C.y - bd.y) < 3) { putBallAway(); Snd.pop(); return; }
  b.ptrHeld = false; b.held = false;
  b.vx = clamp(C.vx * 0.5, -160, 160) + rnd(-8, 8); b.vgy = clamp(C.vy * 0.4, -90, 90); b.vz = Math.hypot(C.vx, C.vy) > 20 ? 30 : 8;
  if (!b.vx && !b.vgy) { b.vx = rnd(-30, 30); b.vgy = rnd(-15, 15); }
  cat.earN = 'fwd'; cat.earF = 'fwd';
  later(rnd(0.4, 1), () => {
    const lb = isHunt(Room.ball) ? 'mouse' : 'ball';
    if (Room.ball && !cat.protect && cat.label !== 'pet' && cat.label !== 'ball' && cat.label !== 'mouse' && cat.label !== 'carried' && cat.needs.energy > 12) interrupt(BEH[lb], lb);
  });
}

/* dragging furniture, the treat tube, and the cat itself */
function startDrag(kind, key, q) {
  const D = Interact.drag = { kind, key, moved: false, sx: q.x, sy: q.y, ox: 0, oy: 0 };
  if (kind === 'prop') { D.ox = Room[key].x - q.x; D.oy = propY(key) - q.y; }
  if (kind === 'furn') { const F = Room.furn[key]; D.ox = F.x - q.x; D.oy = F.gy - q.y; }
  if (kind === 'churu') { D.ox = Interact.churu.x - q.x; D.oy = Interact.churu.y - q.y; Interact.churu.drag = true; }
  document.body.style.cursor = 'grabbing';
  window.addEventListener('pointermove', onDragMove);
  window.addEventListener('pointerup', onDragEnd, { once: true });
  window.addEventListener('pointercancel', onDragEnd, { once: true });
}
function onDragMove(e) {
  const D = Interact.drag;
  if (!D) return;
  const q = logicalFromEvent(e);
  Desk.cursor.x = q.x; Desk.cursor.y = q.y;
  if (!D.moved && Math.hypot(q.x - D.sx, q.y - D.sy) > 2.5) D.moved = true;
  if (!D.moved) return;
  if (D.kind === 'prop') setPropPos(D.key, q.x + D.ox, q.y + D.oy);
  else if (D.kind === 'furn') setFurnPos(D.key, q.x + D.ox, q.y + D.oy);
  else if (D.kind === 'churu' && Interact.churu) { const C = Interact.churu; C.x = clamp(q.x + D.ox, 10, W - 26); C.y = clamp(q.y + D.oy, 36, GY_MAX); }
}
function onDragEnd() {
  const D = Interact.drag;
  Interact.drag = null;
  window.removeEventListener('pointermove', onDragMove);
  document.body.style.cursor = '';
  if (!D) return;
  if (D.kind === 'furn' && D.moved) { saveFurn(); Snd.pop(); }
  if (D.kind === 'prop') {
    if (D.moved) { savePropPos(); Snd.pop(); }
    else if (D.key === 'bowl') pourKibble();
  }
  if (D.kind === 'churu' && Interact.churu) {
    Interact.churu.drag = false;
    if (!D.moved) { Interact.churu = null; Snd.pop(); toast('츄르를 치웠어요'); }     // a plain click puts the treat away
  }
}
function startCarry(q) {
  if (cat.protect) { toast('지금은 볼일 중이라 만지면 안 돼요'); emote('alert', 1); return; }
  Interact.petFromSleep = false;
  startDrag('cat', null, q);
  Interact.drag.moved = true;
  interrupt(bCarried, 'carried');
}

function startPetting(silent) {
  if (cat.protect) { if (!silent) toast('지금은 방해하지 말라는 눈치예요'); return; }
  if (cat.label === 'pet') return;
  Interact.petFromSleep = cat.asleep;
  Interact.petRetry = 4;
  interrupt(bPet, 'pet');
}

/* ---------- per-frame ---------- */
function interactUpdate(dt) {
  const C = Desk.cursor;
  C.vx = lerp(C.vx || 0, (C.x - (C.lx === undefined ? C.x : C.lx)) / dt, 0.35);
  C.vy = lerp(C.vy || 0, (C.y - (C.ly === undefined ? C.y : C.ly)) / dt, 0.35);
  C.lx = C.x; C.ly = C.y;
  if (Interact.ballDown && !Interact.ballDown.moved && Math.hypot(C.x - Interact.ballDown.x, C.y - Interact.ballDown.y) > 3) Interact.ballDown.moved = true;
  if (Interact.scoop) { Interact.scoop.t += dt; if (Interact.scoop.t > 0.4) Interact.scoop = null; }

  // what is under the cursor
  const z = catHit(C.x, C.y);
  Interact.hover = (giftHit(C.x, C.y) || presentHit(C.x, C.y)) ? 'gift' : furnAt(C.x, C.y) ? 'prop' : messAt(C.x, C.y, 9) ? 'mess' : ballHit(C.x, C.y) ? 'ball' : churuHit(C.x, C.y) ? 'churu' : propAt(C.x, C.y) ? 'prop' : (z && !cat.onIcon) ? 'cat' : '';
  if (Interact.churu) { Interact.churu.age += dt; if (Interact.churu.age > 60 && cat.label !== 'churu') Interact.churu = null; }

  // petting by hovering and stroking
  const P = Interact.pet;
  P.touching = !!z; P.zone = z || '';
  P.stroking = !!z && C.speed > 6 && C.speed < 900;
  P.dwell = z ? P.dwell + dt : 0;
  Interact.petRetry = Math.max(0, Interact.petRetry - dt);
  if (z && P.dwell > 0.35 && Interact.petRetry <= 0 && cat.label !== 'pet' && cat.label !== 'churu' && cat.label !== 'carried' && !cat.protect && !Interact.draggingBall && !Interact.drag && !Desk.lbtn && (Interact.mode === 'none' || Interact.mode === 'brush') && cat.label !== 'toy' && cat.speed < 40 && C.speed < 400) startPetting(true);

  updateToys(dt);

  // toy interest
  const toyOn = (Interact.mode === 'wand' && Toy.wand.active) || (Interact.mode === 'laser' && Toy.laser.active);
  if (toyOn) {
    Interact.toyT -= dt;
    if (Interact.toyT <= 0 && cat.label !== 'toy' && cat.label !== 'pet' && cat.label !== 'churu' && cat.label !== 'carried' && !cat.protect && !cat.busy && cat.toyCooldown <= 0) {
      const n = cat.needs;
      const near = Math.hypot(C.x - cat.x, C.y - cat.gy) < 70 && C.speed > 20;
      const w = 0.78 + 0.2 * cat.traits.play + (n.fun < 50 ? 0.15 : 0) + (near ? 0.2 : 0) - (n.energy < 20 ? 0.45 : 0) - (cat.asleep ? 0.3 : 0) - (n.fun > 96 ? 0.35 : 0) - cat.weak * 0.4;
      if (chance(clamp(w, 0.1, 0.98))) interrupt(Interact.mode === 'wand' ? bPlayWand : bPlayLaser, 'toy');
      else {
        // a moody cat still watches closely, then may join in a moment later
        cat.toyCooldown = rnd(2, 4);
        if (!cat.asleep) interrupt(bWatchToy, 'watchToy');
      }
      Interact.toyT = rnd(0.5, 1.2);
    }
  } else Interact.toyT = Math.max(Interact.toyT, 0.8);
}
