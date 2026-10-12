'use strict';
/* ============ raising the cat like a tamagotchi (phone only) ============
   - furniture tops: the cat jumps onto the sofa seat, the sofa back and the TV cabinet, lounges there,
     and can be carried and set down on them
   - mischief: now and then the cat wrecks something (never the same thing twice in a row); tap it to fix it
   - hygiene: the cat slowly gets grubby; the bath button opens a bathtub where you scrub, rinse and towel it
   State lives in this browser (localStorage), separate from the desktop save. */
(function () {
  if (!window.NamanFurn || typeof cat === 'undefined') return;
  const F = window.NamanFurn;
  const KEY = 'naman.mobile.life.v1';
  const WALLPAPER = /[?&]wallpaper=1/.test(location.search);
  const DEV = /[?&]mischief=1/.test(location.search);
  const HYG_PER_H = 2.6;                 // full -> empty in about a day and a half
  const MAX_BROKEN = 4;
  const now = () => Date.now();
  const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  const lg = v => v / S_PX;              // CSS px -> game px

  /* ---------- saved state ---------- */
  function load() {
    let o = null;
    try { o = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { o = null; }
    o = o || {};
    return {
      hyg: typeof o.hyg === 'number' ? o.hyg : 88, broken: o.broken || {}, lastSeen: o.lastSeen || now(),
      nextAt: o.nextAt || 0, recent: o.recent || [], hints: o.hints || 0, baths: o.baths || 0, repairs: o.repairs || 0, sparkleUntil: 0
    };
  }
  const st = load();
  window.__life = st;
  function save() {
    if (WALLPAPER) return;               // the wallpaper only shows the room; the app owns the save
    st.lastSeen = now();
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* storage blocked */ }
  }
  const nBroken = () => Object.keys(st.broken).length;
  const catName = () => (cat && cat.name) || '고양이';
  const josa = (w, a, b) => { const c = w.charCodeAt(w.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 ? a : b; };
  const nameGa = () => catName() + josa(catName(), '이가', '가');

  /* ---------- furniture tops ---------- */
  const plat = id => F.platforms().find(p => p.id === id);
  const frontY = () => GY_MIN + 1;

  // hops never fight the platform tracker: the cat is "in the air" until it lands
  function* hopOnto(id, px) {
    const p = plat(id);
    px = clampN(px, p.x0, p.x1);
    if (cat.surface === 'platform' && cat.plat === id) { yield* edgeWalk(p, px); return p; }
    if (cat.surface === 'platform' && id === 'sofaBack' && cat.plat === 'sofaSeat') { /* straight up from the seat */ }
    else {
      if (cat.surface !== 'floor') yield* leaveSurface();
      if (id === 'sofaBack') yield* hopOnto('sofaSeat', px);
      else yield* walkTo(px, frontY(), { speed: SPD.walk, tol: 3 });
    }
    const p2 = plat(id);
    setPose('crouch'); face('wide', 'closed', 'fwd'); lookAtPt(px, p2.y - 6, 1);
    yield* wait(rnd(0.25, 0.55));
    lookFree();
    cat.surface = 'air'; cat.plat = null;
    yield* hop(px, p2.y, id === 'sofaSeat' ? 7 : 6, id === 'sofaBack' ? 0.42 : 0.5);
    cat.surface = 'platform'; cat.plat = id;
    setPose('stand'); face();
    return p2;
  }
  try {
    const baseLeave = leaveSurface;
    leaveSurface = function* () {
      if (cat.surface === 'platform' || cat.surface === 'air') {
        const high = cat.gy < GY_MIN - 40;
        cat.surface = 'air'; cat.plat = null;
        yield* hop(clampN(cat.x + rnd(-10, 10), 10, W - 10), GY_MIN + rnd(1, 8), high ? 7 : 5, high ? 0.55 : 0.45);
        cat.surface = 'floor'; cat.sortOverride = null; cat.plat = null;
        return;
      }
      yield* baseLeave();
    };
    // behaviours that may stay where they are (sitting, grooming, being petted) also stay on furniture
    wrapBehavior = function* (fn) {
      const keep = fn.keepSurface && (cat.surface === 'sill' || cat.surface === 'furn' || cat.surface === 'platform');
      if (cat.surface !== 'floor' && !keep) yield* leaveSurface();
      yield* fn();
    };
  } catch (e) { console.error(e); }

  const PERCH_TEXT = {
    sofaSeat: { go: '{n}가 소파 위로 폴짝 올라가요', on: '{n}가 소파에 자리를 잡았어요', loaf: '{n}가 소파 위에서 식빵을 구워요', nap: '{n}가 소파에서 꾸벅꾸벅 졸아요' },
    sofaBack: { go: '{n}가 소파 등받이로 올라가요', on: '{n}가 등받이 위에서 방을 내려다봐요', loaf: '{n}가 등받이 위에서 식빵을 구워요', nap: '{n}가 등받이 위에서 아슬아슬하게 졸아요' },
    cabinet: { go: '{n}가 TV장 위로 뛰어올라요', on: '{n}가 TV장 위에 앉아 꼬리를 늘어뜨려요', loaf: '{n}가 TV장 위에서 식빵을 구워요', nap: '{n}가 TV장 위에서 졸아요' }
  };
  function* lounge(id, dur) {
    const T = PERCH_TEXT[id];
    S(T.on); setPose('sit'); face('open');
    let el = 0, nx = rnd(1.5, 3);
    while (el < dur && cat.surface === 'platform') {
      el += DT;
      if (el > nx) {
        nx = el + rnd(2.5, 6);
        const a = wchoose([{ k: 'walk', w: 2.5 }, { k: 'groom', w: 1.5 }, { k: 'yawn', w: 1 }, { k: 'tilt', w: 1.2 }, { k: 'loaf', w: 1.6 },
          { k: 'nap', w: id === 'sofaSeat' ? 1.2 : 0.3 }, { k: 'none', w: 2 }]);
        const pl = plat(cat.plat || id);
        if (!pl) break;
        if (a === 'walk') { setPose('stand'); yield* edgeWalk(pl, rnd(pl.x0, pl.x1)); setPose('sit'); }
        else if (a === 'groom') yield* bGroom();
        else if (a === 'yawn') yield* yawn();
        else if (a === 'tilt') yield* headTilt();
        else if (a === 'loaf') { setPose('crouch'); yield* wait(0.3); setPose('loaf'); face('half'); S(T.loaf); yield* wait(rnd(5, 12)); setPose('sit'); face('open'); }
        else if (a === 'nap') {
          setPose('crouch'); yield* wait(0.3); setPose('curl'); face('sleep'); cat.asleep = true; S(T.nap);
          yield* wait(rnd(10, 25)); cat.asleep = false; setPose('sit'); face('half'); yield* yawn();
        }
      }
      yield;
    }
  }
  function* bPerchFurn() {
    const id = wchoose([{ k: 'sofaSeat', w: 3 }, { k: 'sofaBack', w: 1.4 }, { k: 'cabinet', w: 1.8 }]);
    const p = plat(id);
    S(PERCH_TEXT[id].go); setPose('stand'); face('open');
    yield* hopOnto(id, rnd(p.x0, p.x1));
    yield* lounge(id, rnd(14, 40));
  }
  try { BEH.perch = bPerchFurn; } catch (e) { /* older game build */ }

  // set the cat down on the sofa or the cabinet by carrying it there
  try {
    const baseCarried = bCarried;
    bCarried = function* () {
      const g = baseCarried();
      let r = g.next();
      while (!r.done) {
        if (!(Interact.drag && Interact.drag.kind === 'cat')) {
          const C = Desk.cursor, foot = C.y + 36;
          let best = null, bd = 18;
          for (const p of F.platforms()) {
            if (C.x < p.x0 - 3 || C.x > p.x1 + 3) continue;
            const d = Math.abs(foot - p.y);
            if (d < bd) { bd = d; best = p; }
          }
          if (best) { g.return(); yield* setDownOn(best, C.x); return; }
        }
        yield r.value;
        r = g.next();
      }
    };
  } catch (e) { console.error(e); }
  function* setDownOn(p, x) {
    cat.add = {}; cat.surface = 'platform'; cat.plat = p.id;
    cat.x = clampN(x, p.x0, p.x1); cat.gy = p.y;
    cat.busy = true;
    try { let u = 0; while (u < 0.18) { u += DT; cat.z = 8 * (1 - u / 0.18); yield; } }
    finally { cat.busy = false; cat.z = 0; }
    burstDust(cat.x, cat.gy + 1, 4, 0); Snd.thump();
    setPose('crouch'); face('wide', 'closed', 'normal'); yield* wait(0.25);
    S('{n}를 ' + p.t + ' 위에 올려 줬어요');
    setPose('sit'); face('half'); yield* shiver();
    yield* lounge(p.id, rnd(8, 24));
  }

  /* ---------- mischief ---------- */
  function* innocent() {
    setPose('sit'); face('half'); lookViewer(1); emote(pick(['dots', 'dots', 'ask', 'note']), 1.6);
    S(pick(['{n}는 아무것도 안 했다는 표정이에요', '{n}가 시치미를 뚝 떼요', '{n}가 딴청을 피워요', '{n}가 "내가 안 그랬다냥" 하는 얼굴이에요', '{n}가 슬쩍 눈을 피해요']));
    yield* wait(rnd(1.6, 2.8));
    lookFree();
  }
  function* scratchLoop(n, col, dy, onHalf) {
    setPose('scratch'); yield* wait(0.4);
    for (let i = 0; i < n; i++) {
      const near = i % 2 === 0;
      yield* wait(0.3, (e, T) => {
        const u = e / T, down = Math.sin(Math.PI * u) * -7;
        if (near) { cat.add.fNy = down; cat.add.fFy = 0; } else { cat.add.fFy = down; cat.add.fNy = 0; }
        if (u > 0.5 && !cat._sc) { cat._sc = true; Snd.scratch(); spawn('fur', cat.x + cat.dir * 11, cat.gy - dy, { vx: rnd(-6, 6), vy: rnd(2, 10), life: 0.7, g: 12, col }); }
        if (u < 0.2) cat._sc = false;
      });
      if (i === 2 && onHalf) onHalf();
    }
    cat.add = {};
  }
  function wreck(key, v) {
    st.broken[key] = v;
    st.recent.push(key); while (st.recent.length > 3) st.recent.shift();
    save(); F.repaint();
    const SFX = { lampFall: 'crash', plantTip: 'crashSoft', curtainTear: 'rip', tissueShred: 'crinkle', cushionToss: 'puff', tvPaws: 'tapTap', rugFlip: 'fwip', sofaFur: 'puff', sofaScratch: 'rip' };
    (Snd[SFX[key]] || Snd.thud)();
    const E = EVENTS[key];
    const hint = st.hints < 4 ? ' 눌러서 고쳐 주세요' : '';
    st.hints++;
    setTimeout(() => { if (typeof toast === 'function') toast(nameGa() + ' ' + E.did + '!' + hint); }, 300);
    highlight(4000);
  }

  const EVENTS = {
    sofaScratch: {
      name: '소파', did: '소파를 긁어 놨어요', fix: '소파를 꿰매서 고쳤어요', taps: 3,
      make: () => ({ where: pick(['L', 'R', 'F']), u: rnd(0.2, 0.8), seed: rint(1, 9999) }),
      *run(v) {
        const s = F.G().sofa;
        const ax = v.where === 'L' ? s.x0 + s.arm / 2 : v.where === 'R' ? s.x1 - s.arm / 2 : s.x0 + s.arm + (s.x1 - s.x0 - s.arm * 2) * v.u;
        const side = v.where === 'L' ? 1 : v.where === 'R' ? -1 : (chance(0.5) ? 1 : -1);
        S('{n}가 소파를 노려봐요…');
        yield* walkTo(lg(ax) + side * 9, frontY(), { speed: SPD.walk, tol: 2 });
        yield* turnTo(-side);
        setPose('sniff'); yield* wait(rnd(0.6, 1.2));
        setPose('stand'); face('wide', 'closed', 'fwd'); yield* wait(0.2);
        S('{n}가 소파를 박박 긁어요!');
        yield* scratchLoop(rint(6, 9), '#e0a594', 20, () => wreck('sofaScratch', v));
        S('{n}가 기지개를 쭉 켜요'); setPose('scratch', { cy: 19, hdy: 26, arch: -1 }); face('sleep'); yield* wait(1.2);
        setPose('stand'); face('half'); yield* wait(0.3);
        yield* innocent();
      }
    },
    curtainTear: {
      name: '커튼', did: '커튼을 찢어 놨어요', fix: '커튼을 새것처럼 꿰맸어요', taps: 3,
      make: () => ({ side: chance(0.5) ? -1 : 1, seed: rint(1, 9999) }),
      *run(v) {
        const C = F.G().curtain(v.side);
        const id = v.side < 0 ? 'sofaBack' : 'cabinet';
        S('{n}가 커튼 쪽을 올려다봐요…');
        yield* hopOnto(id, lg(C.cx));
        face('wide', 'closed', 'fwd'); setPose('stand'); yield* wait(0.4);
        S('{n}가 커튼에 매달려 발톱을 걸어요!');
        yield* scratchLoop(rint(5, 8), '#d3dfca', 26, () => wreck('curtainTear', v));
        Snd.scratch(); setPose('stand'); yield* wait(0.3);
        yield* innocent();
      }
    },
    lampFall: {
      name: '스탠드', did: '스탠드를 넘어뜨렸어요', fix: '스탠드를 다시 세웠어요', taps: 1,
      make: () => ({ dir: chance(0.5) ? -1 : 1 }),
      *run(v) {
        const L = F.G().lamp;
        S('{n}가 스탠드 갓을 뚫어져라 봐요…');
        yield* walkTo(lg(L.x) - v.dir * 10, frontY(), { speed: SPD.walk, tol: 2 });
        yield* turnTo(v.dir);
        setPose('crouch'); face('wide', 'closed', 'fwd'); lookAtPt(lg(L.x), lg(L.shadeBot), 1);
        yield* wait(rnd(0.8, 1.5));
        for (let i = 0; i < 2; i++) { setPose('swat'); Snd.swat(); yield* wait(0.12); setPose('crouch'); yield* wait(rnd(0.35, 0.7)); }
        setPose('swat'); Snd.swat(); yield* wait(0.15);
        wreck('lampFall', v); Snd.thump();
        burstDust(lg(L.x) + v.dir * 30, frontY() + 4, 9, v.dir);
        lookFree();
        S('{n}가 깜짝 놀라 도망가요!');
        setPose('spook'); face('wide', 'closed', 'flat'); yield* wait(0.3);
        yield* walkTo(clampN(cat.x - v.dir * rnd(40, 70), 14, W - 14), clampN(cat.gy + rnd(10, 30), GY_MIN, GY_MAX), { speed: SPD.run, arrive: false, timeout: 3, quick: true, noVigor: true });
        yield* turnTo(v.dir);
        yield* innocent();
      }
    },
    plantTip: {
      name: '화분', did: '화분을 떨어뜨렸어요', fix: '화분을 다시 심어서 올려놨어요', taps: 2,
      make: () => ({ dx: rnd(6, 26) }),
      *run(v) {
        const P = F.G().plant;
        S('{n}가 TV장 위 화분이 궁금해요…');
        yield* hopOnto('cabinet', lg(P.x) + 11);
        yield* turnTo(-1);
        setPose('sniff'); yield* wait(rnd(0.8, 1.4));
        setPose('crouch'); face('wide', 'closed', 'fwd'); yield* wait(0.4);
        for (let i = 0; i < 2; i++) { setPose('swat'); Snd.swat(); yield* wait(0.12); setPose('crouch'); yield* wait(rnd(0.3, 0.6)); }
        setPose('swat'); Snd.swat();
        wreck('plantTip', v);
        burstDust(lg(P.x + v.dx), frontY() + 6, 8, 0);
        yield* wait(0.4);
        setPose('crouch'); lookAtPt(lg(P.x + v.dx), frontY() + 6, 1); S('{n}가 떨어진 화분을 내려다봐요'); yield* wait(1);
        lookFree();
        yield* leaveSurface();
        yield* walkTo(lg(P.x + v.dx) + 8, frontY() + 3, { speed: SPD.walk, tol: 3 });
        setPose('sniff'); S('{n}가 흙을 헤집다가 흙투성이가 됐어요'); yield* wait(1.2);
        st.hyg = clampN(st.hyg - 8, 0, 100); save();
        yield* innocent();
      }
    },
    cushionToss: {
      name: '쿠션', did: '쿠션을 떨어뜨렸어요', fix: '쿠션을 소파에 올려놨어요', taps: 1,
      make: () => {
        const s = F.G().sofa, which = chance(0.5) ? 'L' : 'R';
        const cx = which === 'L' ? s.x0 + s.arm + 22 : s.x1 - s.arm - 22;
        return { which, x: clampN(cx + (which === 'L' ? -1 : 1) * rnd(10, 40), 24, F.G().Wc - 24), tilt: rnd(-0.6, 0.6) };
      },
      *run(v) {
        const s = F.G().sofa, cx = v.which === 'L' ? s.x0 + s.arm + 22 : s.x1 - s.arm - 22, side = v.which === 'L' ? 1 : -1;
        S('{n}가 소파 쿠션을 노려요…');
        yield* hopOnto('sofaSeat', lg(cx) + side * 12);
        yield* turnTo(-side);
        setPose('crouch'); face('wide', 'closed', 'fwd'); yield* wait(rnd(0.5, 1));
        setPose('swat'); Snd.swat(); yield* wait(0.15); setPose('crouch'); yield* wait(0.3);
        setPose('swat'); Snd.swat();
        wreck('cushionToss', v); Snd.plop();
        burstDust(lg(v.x), frontY() + 10, 6, 0);
        yield* wait(0.4);
        S('{n}가 쿠션 자리를 차지했어요');
        yield* edgeWalk(plat('sofaSeat'), lg(cx));
        setPose('crouch'); yield* wait(0.3); setPose('loaf'); face('half'); yield* wait(rnd(2, 4));
        yield* innocent();
      }
    },
    tvPaws: {
      name: 'TV', did: 'TV 화면에 발자국을 찍었어요', fix: 'TV 화면을 반짝반짝 닦았어요', taps: 3,
      make: () => ({ seed: rint(1, 9999) }),
      *run(v) {
        const T = F.G().tv;
        S('{n}가 TV에 비친 자기 모습을 봐요…');
        yield* hopOnto('cabinet', lg(T.x0) + 2);
        yield* turnTo(1);
        setPose('stand'); face('wide', 'closed', 'fwd'); yield* wait(0.5);
        S('{n}가 TV 화면을 꾹꾹 눌러요');
        for (let i = 0; i < 4; i++) {
          setPose('scratch'); Snd.tick(); yield* wait(0.25);
          if (i === 1) wreck('tvPaws', v);
          setPose('stand'); yield* wait(0.2);
          yield* edgeWalk(plat('cabinet'), clampN(cat.x + 6, 0, lg(T.x1)));
        }
        yield* innocent();
      }
    },
    tissueShred: {
      name: '휴지', did: '휴지를 다 뽑아서 뜯어 놨어요', fix: '휴지를 깨끗이 주웠어요', taps: 3,
      make: () => { const s = F.G().sofa; return { x: s.x0 + s.arm + rnd(20, 80), seed: rint(1, 9999) }; },
      *run(v) {
        const s = F.G().sofa;
        S('{n}가 소파 팔걸이의 휴지 상자를 발견했어요…');
        yield* hopOnto('sofaSeat', lg(s.x0 + s.arm) + 6);
        yield* turnTo(-1);
        setPose('crouch'); face('wide', 'closed', 'fwd'); yield* wait(0.6);
        setPose('swat'); Snd.crinkle(); yield* wait(0.2);
        wreck('tissueShred', v);
        yield* leaveSurface();
        S('{n}가 휴지를 갈기갈기 뜯어요!');
        yield* walkTo(lg(v.x), frontY() + 8, { speed: SPD.trot, tol: 3 });
        for (let i = 0; i < 6; i++) {
          setPose(i % 2 ? 'swat' : 'crouch'); Snd.crinkle();
          spawn('fur', cat.x + cat.dir * 8, cat.gy - 4, { vx: rnd(-14, 14), vy: rnd(-16, -6), life: 0.8, g: 30, col: '#ffffff' });
          yield* wait(rnd(0.2, 0.4));
          if (i === 3) yield* turnTo(-cat.dir, true);
        }
        yield* innocent();
      }
    },
    rugFlip: {
      name: '러그', did: '러그를 뒤집어 놨어요', fix: '러그를 반듯하게 폈어요', taps: 1,
      make: () => ({ side: chance(0.5) ? -1 : 1 }),
      *run(v) {
        const r = F.G().rug;
        S('{n}가 갑자기 우다다 달려요!');
        yield* walkTo(lg(r.x - v.side * r.rw * 0.9), lg(r.y), { speed: SPD.trot, tol: 4 });
        yield* turnTo(v.side);
        setPose('crouch'); face('wide', 'closed', 'flat'); cat.wiggle = 1; yield* wait(0.5); cat.wiggle = 0;
        yield* walkTo(lg(r.x + v.side * r.rw * 1.05), lg(r.y) + 2, { speed: SPD.sprint, arrive: false, tol: 6, timeout: 3, quick: true, noVigor: true });
        wreck('rugFlip', v); Snd.thump();
        burstDust(cat.x, cat.gy, 7, v.side);
        yield* walkTo(clampN(cat.x + v.side * 20, 14, W - 14), cat.gy + 6, { speed: SPD.run, arrive: true, timeout: 1.5 });
        yield* turnTo(-v.side);
        yield* innocent();
      }
    },
    sofaFur: {
      name: '소파 털', did: '소파를 털투성이로 만들었어요', fix: '소파 털을 돌돌이로 떼어 냈어요', taps: 3,
      make: () => ({ seed: rint(1, 9999) }),
      *run(v) {
        const p = plat('sofaSeat');
        S('{n}가 소파에서 뒹굴고 싶어요');
        yield* hopOnto('sofaSeat', rnd(p.x0, p.x1));
        setPose('crouch'); yield* wait(0.3); setPose('lieSide'); face('happy'); yield* wait(0.6);
        S('{n}가 소파에서 데굴데굴 굴러요');
        for (let i = 0; i < 3; i++) {
          setPose(i % 2 ? 'lieSide' : 'bellyUp'); cat.wiggle = 1;
          for (let j = 0; j < 3; j++) spawn('fur', cat.x + rnd(-8, 8), cat.gy - rnd(2, 8), { vx: rnd(-8, 8), vy: rnd(-10, -3), life: 0.9, g: 10, col: '#f2e6d4' });
          yield* wait(0.6);
          if (i === 1) wreck('sofaFur', v);
        }
        cat.wiggle = 0;
        setPose('sit'); yield* bGroom();
        yield* innocent();
      }
    }
  };

  function pickEvent() {
    const free = Object.keys(EVENTS).filter(k => !st.broken[k]);
    if (!free.length) return null;
    const fresh = free.filter(k => !st.recent.includes(k));
    return pick(fresh.length ? fresh : free);
  }
  function* bMischief() {
    const key = pickEvent();
    if (!key) return;
    const E = EVENTS[key];
    yield* E.run(E.make());
  }
  try { BEH.mischief = bMischief; } catch (e) { /* older game build */ }

  function nextGap() {
    if (DEV) return 25000;
    const n = cat.needs || {};
    let k = 1;
    if ((n.fun !== undefined && n.fun < 40) || (n.love !== undefined && n.love < 35)) k *= 0.55;   // bored or lonely cats get up to more mischief
    if (cat.content) k *= 1.5;
    return rnd(7, 22) * 60000 * k;
  }

  /* ---------- favour the furniture a bit ---------- */
  try {
    const baseWeights = applyLifeWeights;
    applyLifeWeights = function (w) {
      baseWeights(w);
      if (cat.surface === 'platform') { w.perch = 0; if (w.idleSit) w.idleSit *= 2; if (w.groom) w.groom *= 1.5; }
      else if (w.perch) w.perch *= 2.4;
    };
  } catch (e) { console.error(e); }

  /* ---------- hygiene ---------- */
  const grime = () => clampN((80 - st.hyg) / 65, 0, 1);
  function seededList(seed, n, f) { const r = window.__room.seeded(seed), out = []; for (let i = 0; i < n; i++) out.push(f(r)); return out; }
  const DIRT_COL = ['rgba(104,84,58,0.85)', 'rgba(125,104,76,0.8)', 'rgba(88,70,50,0.85)', 'rgba(140,120,88,0.75)'];
  const SPECKS = seededList(77, 160, r => ({ ox: (r() - 0.5) * 36, oy: 1 + r() * 32, s: r() < 0.25 ? 2 : 1, c: DIRT_COL[Math.floor(r() * 4)] }));
  const DROPS = seededList(91, 120, r => ({ ox: (r() - 0.5) * 36, oy: 1 + r() * 32 }));
  // calls fn(x, y, item) for up to n spots that are really on the cat's body (game px)
  function onBody(list, n, fn) {
    let k = 0;
    for (const it of list) {
      if (k >= n) break;
      const x = cat.x + cat.dir * it.ox, y = cat.gy - cat.z - it.oy;
      if (catHit(x, y)) { fn(x, y, it); k++; }
    }
  }
  function drawGrime(ctx) {
    if (!cat.visible || window.__bathOpen) return;
    const gr = grime();
    if (gr > 0) {
      onBody(SPECKS, Math.round(gr * 34), (x, y, it) => { ctx.fillStyle = it.c; ctx.fillRect(Math.round(x), Math.round(y), it.s, 1); });
    }
    if (st.hyg < 35 && !cat.asleep) {                     // a whiff of stink
      const t = NOW * 1.6, bx = cat.x - cat.dir * 5, by = cat.gy - cat.z - 22;
      ctx.strokeStyle = 'rgba(110,140,80,0.75)'; ctx.lineWidth = 1;
      for (let i = 0; i < 2; i++) {
        const ph = (t + i * 0.5) % 1, x0 = bx + (i ? 5 : -3), y0 = by - ph * 12;
        ctx.globalAlpha = Math.sin(ph * Math.PI);
        ctx.beginPath(); ctx.moveTo(x0, y0);
        for (let j = 1; j <= 5; j++) ctx.lineTo(x0 + Math.sin(j * 1.7 + t * 4) * 2, y0 - j * 2.4);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    if (st.sparkleUntil > now() && chance(0.06)) spawn('spark', cat.x + rnd(-9, 9), cat.gy - rnd(6, 22), { vy: -5, life: 0.7 });
  }
  try {
    const baseDraw = drawWorld;
    drawWorld = function (ctx, W_, H_) { baseDraw(ctx, W_, H_); try { drawGrime(ctx); } catch (e) { /* never break the frame */ } };
  } catch (e) { console.error(e); }

  /* ---------- dock: meters and buttons ---------- */
  function buildUi() {
    const mc = document.getElementById('mClean');
    if (mc && !document.getElementById('mHyg')) {
      const li = mc.parentElement; li.querySelector('span').textContent = '방 청결';
      const nl = document.createElement('li'); nl.innerHTML = '<span>몸 청결</span><div class="bar" id="mHyg"></div>';
      li.after(nl);
    }
    const b2 = document.getElementById('btns2');
    if (b2 && !document.getElementById('btns3')) {
      const row = document.createElement('div'); row.className = 'btns'; row.id = 'btns3';
      row.innerHTML = '<button id="bBath" type="button"><span class="emo">🛁</span>목욕</button><button id="bFix" type="button"><span class="emo">🔧</span>집 고치기<b id="fixN" hidden></b></button>';
      b2.after(row);
      document.getElementById('bBath').addEventListener('click', () => { try { Snd.wake(); } catch (e) { /* */ } startBath(); });
      document.getElementById('bFix').addEventListener('click', () => {
        const n = nBroken();
        if (!n) { toast('고칠 곳이 없어요. 집이 깨끗해요'); return; }
        openDock(false); highlight(5000);
        toast('반짝이는 곳을 눌러서 고쳐 주세요');
      });
    }
    const tip = document.querySelector('#panel .tip');
    if (tip && !tip.dataset.life) { tip.dataset.life = '1'; tip.textContent += ' 고양이가 망가뜨린 물건은 눌러서 고쳐요. 목욕은 고양이를 문질러서 씻겨요.'; }
  }
  try {
    const baseHud = updateHud;
    updateHud = function (dt) {
      baseHud(dt);
      if (typeof hudT === 'undefined' || hudT !== 0.25) return;      // only right after the game refreshed the dock
      if (document.getElementById('mHyg')) setBar('mHyg', st.hyg);
      const nb = nBroken(), tab = document.getElementById('dockTab'), badge = document.getElementById('tabBadge');
      if (st.hyg < 25 || nb) tab.classList.add('alert');
      if (nb) { badge.textContent = String(Room.messes.length + nb); badge.hidden = false; }
      const fx = document.getElementById('fixN'); if (fx) { fx.textContent = nb ? ' ' + nb : ''; fx.hidden = !nb; }
      const md = document.getElementById('dMood');
      if (md && md.hidden && st.hyg < 30) { md.textContent = '몸이 꼬질꼬질해요'; md.hidden = false; }
    };
  } catch (e) { console.error(e); }

  /* ---------- repair by tapping ---------- */
  const fx = document.createElement('canvas');
  fx.id = 'lifeFx'; fx.setAttribute('aria-hidden', 'true');
  fx.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:2;pointer-events:none;';
  document.body.appendChild(fx);
  const fxs = { hiUntil: 0, sparks: [], taps: {}, raf: 0 };
  function fxKick() { if (!fxs.raf) fxs.raf = requestAnimationFrame(fxFrame); }
  function highlight(ms) { fxs.hiUntil = Math.max(fxs.hiUntil, performance.now() + ms); fxKick(); }
  function sparkleAt(x, y, n, big) {
    for (let i = 0; i < n; i++) {
      const a = rnd(Math.PI * 2), sp = rnd(30, big ? 140 : 80);
      fxs.sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30, t: 0, life: rnd(0.5, big ? 1.1 : 0.7), r: rnd(3, big ? 7 : 5), c: pick(['#ffe27a', '#ffffff', '#9fe3ff', '#ffb8d2']) });
    }
    fxKick();
  }
  function star(g, x, y, r) {
    g.beginPath();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.38 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    g.closePath(); g.fill();
  }
  let fxLast = 0;
  function fxFrame(ts) {
    fxs.raf = 0;
    const dt = Math.min(0.05, fxLast ? (ts - fxLast) / 1000 : 0.016); fxLast = ts;
    const dpr = Math.min(3, window.devicePixelRatio || 1), Wc = innerWidth, Hc = innerHeight;
    if (fx.width !== Math.round(Wc * dpr) || fx.height !== Math.round(Hc * dpr)) { fx.width = Math.round(Wc * dpr); fx.height = Math.round(Hc * dpr); }
    const g = fx.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, Wc, Hc);
    let busy = false;
    if (ts < fxs.hiUntil && nBroken()) {
      busy = true;
      const z = F.zones(), pulse = 0.5 + 0.5 * Math.sin(ts / 180);
      for (const k in z) {
        const r = z[k];
        // no box around broken things (it looked odd); only a small count once you start fixing one
        const need = EVENTS[k].taps, got = fxs.taps[k] || 0;
        if (need > 1 && got > 0) {
          g.font = '800 14px system-ui, sans-serif'; g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = 'rgba(60,40,30,0.55)';
          g.strokeText(`톡톡 ${got}/${need}`, r.cx, r.y0 - 6); g.fillStyle = '#ffffff'; g.fillText(`톡톡 ${got}/${need}`, r.cx, r.y0 - 6);
        }
      }
    }
    fxs.sparks = fxs.sparks.filter(p => (p.t += dt) < p.life);
    for (const p of fxs.sparks) {
      busy = true;
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; p.vx *= 0.97;
      g.globalAlpha = 1 - p.t / p.life; g.fillStyle = p.c; star(g, p.x, p.y, p.r);
    }
    g.globalAlpha = 1;
    if (busy) fxKick(); else fxLast = 0;
  }
  function repairTap(k, r) {
    const E = EVENTS[k];
    fxs.taps[k] = (fxs.taps[k] || 0) + 1;
    if (fxs.taps[k] < E.taps) {
      (Snd.hammer || Snd.tick)(); sparkleAt(r.cx + rnd(-10, 10), r.cy + rnd(-8, 8), 5, false); highlight(1500);
      return;
    }
    delete fxs.taps[k]; delete st.broken[k];
    st.repairs++; save(); F.repaint(); care('fix');
    (Snd.chime || Snd.sparkle)(); sparkleAt(r.cx, r.cy, 22, true);
    toast(E.fix + (nBroken() ? '' : ' 집이 다시 깨끗해졌어요'));
    // the cat notices (and is a little bit sorry)
    if (cat.visible && !cat.busy && cat.label !== 'carried' && cat.label !== 'pet' && chance(0.5)) emote('ask', 1.2);
  }
  window.addEventListener('pointerdown', e => {
    if (WALLPAPER || window.__bathOpen) return;
    if (typeof Adopt !== 'undefined' && Adopt.open) return;
    if (e.target && e.target.closest && e.target.closest('[data-hit], #panel, #adopt, #skinMenu')) return;
    if (!nBroken()) return;
    const z = F.zones();
    for (const k in z) {
      const r = z[k];
      if (e.clientX >= r.x0 && e.clientX <= r.x1 && e.clientY >= r.y0 && e.clientY <= r.y1) {
        e.stopImmediatePropagation();
        repairTap(k, r);
        return;
      }
    }
  }, true);

  /* ---------- the bath ---------- */
  const bath = { open: false, step: 0, prog: 0, foam: [], drops: [], down: false, px: 0, py: 0, gStart: 0, result: '', doneT: 0, meowT: 0, faceT: 0, raf: 0, last: 0 };
  const el = document.createElement('div');
  el.id = 'bath'; el.hidden = true; el.setAttribute('data-hit', '');
  el.innerHTML = '<canvas id="bathCv"></canvas><div class="bathTop"><div class="bsteps"><span data-s="0">① 비누칠</span><span data-s="1">② 헹구기</span><span data-s="2">③ 말리기</span></div>' +
    '<div class="bbar"><i id="bathBar"></i></div><p id="bathHint">고양이를 문질러서 거품을 내요</p></div><button id="bathClose" type="button" aria-label="목욕 그만하기">✕</button>';
  document.body.appendChild(el);
  const cv = el.querySelector('#bathCv');
  const HINTS = ['고양이를 문질러서 거품을 내요', '손가락을 움직여 샤워기로 거품을 헹궈요', '수건으로 문질러서 물기를 닦아요'];
  const RUB_PX = 1500;

  function bathLayout() {
    const Wc = innerWidth, Hc = innerHeight;
    const tw = Math.min(Wc * 0.86, 400), k = clampN(Math.round(tw / 50), 4, 8);
    const tx = Wc / 2, rimY = Math.round(Hc * 0.64);
    return { Wc, Hc, tw, th: tw * 0.36, k, tx, rimY, feetY: rimY + 8 * k };
  }
  function* bBathHold() {
    cat.busy = true;
    try {
      cat.dir = 1; cat.z = 0; setPose('sit'); face('wide', 'closed', 'back'); lookFree();
      while (window.__bathOpen) { cat.z = 0; yield; }
    } finally { cat.busy = false; cat.purr = 0; }
    if (bath.result === 'done') {
      S('{n}가 보송보송해졌어요'); setPose('stand'); face('half'); yield* shiver();
      setPose('sit'); face('happy'); emote('heart', 1.8); burstHearts(cat.x, cat.gy - 20, 3);
      yield* wait(1.6);
    } else { S('{n}가 몸을 부르르 털어요'); setPose('stand'); yield* shiver(); }
  }
  bBathHold.keepSurface = true;

  function startBath() {
    if (bath.open) return;
    if (!cat.visible) { toast(nameGa() + ' 지금 방에 없어요'); return; }
    if (cat.protect) { toast('지금은 볼일 중이에요. 조금 이따가 씻겨요'); return; }
    if (cat.label === 'carried') return;
    openDock(false);
    Room.emote = null;
    bath.open = true; window.__bathOpen = true;
    bath.step = 0; bath.prog = 0; bath.rinseT = 0; bath.foam = []; bath.drops = []; bath.result = ''; bath.doneT = 0;
    bath.gStart = grime();
    startBehavior(bBathHold, 'bath');
    el.hidden = false;
    setStepUi();
    if (st.hyg > 90) toast(nameGa() + ' "벌써 또 씻어?" 하는 얼굴이에요');
    else toast(nameGa() + ' 욕조에 쏙 들어갔어요');
    try { if (Snd.splash) Snd.splash(); Snd.meow('mew', 0.5); } catch (e) { /* */ }
    bath.last = 0; bath.raf = requestAnimationFrame(bathFrame);
  }
  function setStepUi() {
    for (const s of el.querySelectorAll('[data-s]')) s.classList.toggle('on', +s.dataset.s === bath.step);
    el.querySelector('#bathHint').textContent = bath.result === 'done' ? '반짝반짝 깨끗해졌어요!' : HINTS[bath.step];
    el.querySelector('#bathBar').style.width = Math.round((bath.result === 'done' ? 1 : (bath.step + clampN(bath.prog, 0, 1)) / 3) * 100) + '%';
  }
  function endBath(done) {
    if (!bath.open) return;
    const gain = done ? 100 : [0, 35, 70][bath.step] + clampN(bath.prog, 0, 1) * 30;
    if (gain > 0) st.hyg = done ? 100 : clampN(st.hyg + gain, 0, 100);
    if (done) {
      st.baths++; st.sparkleUntil = now() + 30000; care('bath');
      if (cat.needs) cat.needs.love = clampN(cat.needs.love + 6, 0, 100);
      setTimeout(() => toast(nameGa() + ' 깨끗해졌어요! 애정이 올랐어요'), 200);
    }
    bath.result = done ? 'done' : 'stop';
    bath.open = false; window.__bathOpen = false;
    el.hidden = true; cat.purr = 0; if (Snd.shower) Snd.shower(false);
    cancelAnimationFrame(bath.raf);
    save();
  }
  el.querySelector('#bathClose').addEventListener('click', () => endBath(false));

  // is this point (CSS px, in the bath) on the cat?
  function overCatBath(px, py) {
    const B = bathLayout(), r = 22 / B.k;
    const x = cat.x + (px - B.tx) / B.k, y = cat.gy + (py - B.feetY) / B.k;
    for (const [dx, dy] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]]) if (catHit(x + dx, y + dy)) return true;
    return false;
  }
  function onBathMove(px, py, d) {
    const B = bathLayout();
    if (bath.result === 'done') return;
    if (bath.step === 0 || bath.step === 2) {
      if (!overCatBath(px, py)) return;
      bath.prog += d / RUB_PX * (bath.step === 2 ? 1.3 : 1);
      if (bath.step === 0) {
        if (bath.foam.length < 90 && chance(Math.min(1, d / 14))) bath.foam.push({ dx: px - B.tx + rnd(-10, 10), dy: py - B.feetY + rnd(-8, 8), r: rnd(5, 11), w: rnd(6) });
        if (chance(d / 400)) Snd.pop();
      }
      if (bath.step === 2 && Snd.rub && chance(d / 160)) Snd.rub();
      if (performance.now() > bath.meowT) {
        bath.meowT = performance.now() + rnd(1800, 3500);
        if (bath.step === 0) { face('annoyed', 'open1', 'back'); Snd.meow('mew', 0.35); bath.faceT = performance.now() + 600; }
      }
    }
  }
  function nextStep() {
    bath.step++; bath.prog = 0;
    if (bath.step === 1) {
      // make sure there is plenty of foam to rinse off
      const B = bathLayout();
      while (bath.foam.length < 34) {
        const ang = rnd(Math.PI * 2), rr = rnd(0.2, 1);
        bath.foam.push({ dx: Math.cos(ang) * rr * 14 * B.k, dy: -12 * B.k + Math.sin(ang) * rr * 9 * B.k, r: rnd(5, 11), w: rnd(6) });
      }
      bath.foam0 = bath.foam.length;
      face('half', 'closed', 'back');
    }
    if (bath.step === 2) { face('happy', 'closed', 'normal'); cat.purr = 0.4; }
    if (bath.step >= 3) {
      bath.result = 'done'; bath.doneT = performance.now(); face('happy');
      (Snd.fanfare || Snd.sparkle)(); setTimeout(() => Snd.meow('happy', 0.6), 500);
      const B = bathLayout(); sparkleAt(B.tx, B.feetY - 12 * B.k, 30, true);
    }
    setStepUi();
  }
  cv.addEventListener('pointerdown', e => {
    if (!bath.open) return;
    e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (err) { /* */ }
    bath.down = true; bath.px = e.clientX; bath.py = e.clientY;
  });
  cv.addEventListener('pointermove', e => {
    if (!bath.open) return;
    const d = Math.min(60, Math.hypot(e.clientX - bath.px, e.clientY - bath.py));
    bath.px = e.clientX; bath.py = e.clientY;
    if (bath.down) onBathMove(e.clientX, e.clientY, d);
  });
  for (const t of ['pointerup', 'pointercancel']) cv.addEventListener(t, () => { bath.down = false; });

  /* bath drawing */
  function drawBathRoom(g, B) {
    const { Wc, Hc } = B;
    const wg = g.createLinearGradient(0, 0, 0, Hc); wg.addColorStop(0, '#e6f4f6'); wg.addColorStop(1, '#cfe7ec');
    g.fillStyle = wg; g.fillRect(0, 0, Wc, Hc);
    const ts = 34;
    g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 1.5;
    for (let y = 0; y < B.rimY + B.th; y += ts) { g.beginPath(); g.moveTo(0, y); g.lineTo(Wc, y); g.stroke(); }
    for (let x = (Wc / 2) % ts; x < Wc; x += ts) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, B.rimY + B.th); g.stroke(); }
    // floor
    const fy = B.rimY + B.th * 0.92;
    g.fillStyle = '#b9d3d8'; g.fillRect(0, fy, Wc, Hc - fy);
    g.strokeStyle = 'rgba(255,255,255,0.45)';
    for (let x = 0; x < Wc; x += 48) { g.beginPath(); g.moveTo(x, fy); g.lineTo(x - 20, Hc); g.stroke(); }
    // shelf with bottles
    const sy = B.rimY - B.th * 1.55, sx = Wc - Math.min(110, Wc * 0.28);
    g.fillStyle = '#ffffff'; g.fillRect(sx, sy, Wc - sx - 14, 6);
    const bottles = [['#ff9db5', 14, 30], ['#8fd3c3', 12, 24], ['#ffd27a', 16, 34]];
    let bx = sx + 8;
    for (const [c, w, h] of bottles) { window.__room.roundRect(g, bx, sy - h, w, h, 4); g.fillStyle = c; g.fill(); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(bx + 3, sy - h + 6, 3, h - 12); bx += w + 8; }
    // a little mirror on the left
    g.fillStyle = '#ffffff'; window.__room.roundRect(g, 18, sy - 60, 54, 70, 26); g.fill();
    g.fillStyle = '#d9eef7'; window.__room.roundRect(g, 23, sy - 55, 44, 60, 22); g.fill();
  }
  function drawTubBack(g, B) {
    const { tx, rimY, tw } = B;
    g.fillStyle = '#d5e6ee'; g.beginPath(); g.ellipse(tx, rimY, tw / 2 - 6, 16, 0, Math.PI, 0); g.fill();
    const wg = g.createLinearGradient(0, rimY - 14, 0, rimY + 14); wg.addColorStop(0, '#9fd6ec'); wg.addColorStop(1, '#7cc4e2');
    g.fillStyle = wg; g.beginPath(); g.ellipse(tx, rimY + 4, tw / 2 - 12, 12, 0, 0, Math.PI * 2); g.fill();
    // the far half of the rim is behind the cat
    g.strokeStyle = '#ffffff'; g.lineWidth = 7; g.beginPath(); g.ellipse(tx, rimY, tw / 2 - 3, 15, 0, Math.PI, Math.PI * 2); g.stroke();
    g.strokeStyle = 'rgba(120,150,170,0.25)'; g.lineWidth = 1; g.beginPath(); g.ellipse(tx, rimY, tw / 2 - 7, 12, 0, Math.PI, Math.PI * 2); g.stroke();
  }
  function drawTubFront(g, B, t) {
    const { tx, rimY, tw, th } = B, x0 = tx - tw / 2, x1 = tx + tw / 2;
    // water in front of the cat, a bit see-through
    g.fillStyle = 'rgba(140,205,235,0.55)'; g.beginPath(); g.ellipse(tx, rimY + 4, tw / 2 - 12, 12, 0, 0, Math.PI); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) { const wx = tx - tw * 0.3 + i * tw * 0.28 + Math.sin(t * 2 + i) * 6; g.beginPath(); g.ellipse(wx, rimY + 8, 12, 2.5, 0, 0, Math.PI * 2); g.stroke(); }
    // tub body
    const bg = g.createLinearGradient(x0, 0, x1, 0); bg.addColorStop(0, '#e9eef2'); bg.addColorStop(0.35, '#ffffff'); bg.addColorStop(1, '#dfe6ea');
    g.fillStyle = bg; g.beginPath();
    g.moveTo(x0, rimY); g.ellipse(tx, rimY, tw / 2, 16, 0, Math.PI, 0, true);
    g.lineTo(x1 - 6, rimY + th * 0.7); g.quadraticCurveTo(x1 - 14, rimY + th, x1 - 50, rimY + th);
    g.lineTo(x0 + 50, rimY + th); g.quadraticCurveTo(x0 + 14, rimY + th, x0 + 6, rimY + th * 0.7); g.closePath(); g.fill();
    // rim
    // only the near half of the rim is in front of the cat
    g.strokeStyle = '#ffffff'; g.lineWidth = 7; g.beginPath(); g.ellipse(tx, rimY, tw / 2 - 3, 15, 0, 0, Math.PI); g.stroke();
    g.strokeStyle = 'rgba(120,150,170,0.25)'; g.lineWidth = 1; g.beginPath(); g.ellipse(tx, rimY, tw / 2 - 7, 12, 0, 0, Math.PI); g.stroke();
    // feet
    g.fillStyle = '#e2b257';
    for (const fx of [x0 + 34, x1 - 34]) { g.beginPath(); g.ellipse(fx, rimY + th + 6, 10, 8, 0, 0, Math.PI * 2); g.fill(); }
    // rubber duck
    const dx = tx + tw * 0.3 + Math.sin(t * 0.8) * 10, dy = rimY + 2 + Math.sin(t * 2.2) * 1.5;
    g.fillStyle = '#ffd23f'; g.beginPath(); g.ellipse(dx, dy, 13, 8, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(dx + 7, dy - 9, 6.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ff8a2a'; g.beginPath(); g.ellipse(dx + 14, dy - 8, 4, 2.2, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2a2a2a'; g.beginPath(); g.arc(dx + 9, dy - 11, 1.3, 0, Math.PI * 2); g.fill();
  }
  function drawBubble(g, x, y, r) {
    g.fillStyle = 'rgba(255,255,255,0.88)'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(170,205,230,0.8)'; g.lineWidth = 1; g.stroke();
    g.fillStyle = 'rgba(255,255,255,1)'; g.beginPath(); g.arc(x - r * 0.35, y - r * 0.35, r * 0.25, 0, Math.PI * 2); g.fill();
  }
  function drawTool(g, x, y, step, t) {
    g.save(); g.translate(x, y);
    if (step === 0) {                                     // sponge
      g.rotate(-0.2); g.fillStyle = '#ffd95a'; window.__room.roundRect(g, -18, -12, 36, 24, 7); g.fill();
      g.fillStyle = '#f2b33a'; for (const [hx, hy] of [[-9, -4], [4, 3], [10, -5], [-3, 6]]) { g.beginPath(); g.arc(hx, hy, 2.2, 0, Math.PI * 2); g.fill(); }
    } else if (step === 1) {                              // shower head
      g.fillStyle = '#b8c4cc'; g.fillRect(14, -40, 7, 34);
      g.fillStyle = '#d7e0e6'; g.beginPath(); g.ellipse(0, -8, 20, 9, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#9aa8b2'; for (let i = -2; i <= 2; i++) { g.beginPath(); g.arc(i * 6, -6, 1.4, 0, Math.PI * 2); g.fill(); }
    } else {                                              // towel
      g.rotate(0.15); g.fillStyle = '#ff9fbf'; window.__room.roundRect(g, -22, -14, 44, 28, 6); g.fill();
      g.fillStyle = '#ffffff'; g.fillRect(-22, 6, 44, 3);
    }
    g.restore();
  }
  function bathFrame(ts) {
    if (!bath.open) return;
    const dt = Math.min(0.05, bath.last ? (ts - bath.last) / 1000 : 0.016); bath.last = ts;
    const B = bathLayout(), dpr = Math.min(3, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(B.Wc * dpr) || cv.height !== Math.round(B.Hc * dpr)) { cv.width = Math.round(B.Wc * dpr); cv.height = Math.round(B.Hc * dpr); }
    const g = cv.getContext('2d'), t = ts / 1000;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (window.__scenes) window.__scenes.bath(g, B, t, dpr); else drawBathRoom(g, B);
    drawTubBack(g, B);
    // the cat itself, drawn by the game at bath scale
    if (performance.now() > bath.faceT && bath.step === 0 && bath.result !== 'done') face('half', 'closed', 'back');
    const bob = Math.sin(t * 2.4) * 0.6;
    g.save();
    g.setTransform(B.k * dpr, 0, 0, B.k * dpr, (B.tx - cat.x * B.k) * dpr, (B.feetY + bob * B.k - cat.gy * B.k) * dpr);
    g.imageSmoothingEnabled = false;
    try { drawCat(g, NOW); } catch (e) { /* game not ready */ }
    // dirt washes off with the soap
    const gLeft = bath.step === 0 ? bath.gStart * (1 - clampN(bath.prog, 0, 1)) : 0;
    if (gLeft > 0) onBody(SPECKS, Math.round(gLeft * 34), (x, y, it) => { g.fillStyle = it.c; g.fillRect(Math.round(x), Math.round(y), it.s, 1); });
    // wet fur while rinsing and drying
    const wet = bath.step === 1 ? 16 : bath.step === 2 ? Math.round(16 * (1 - clampN(bath.prog, 0, 1))) : 0;
    if (wet > 0) onBody(DROPS, wet, (x, y) => { g.fillStyle = 'rgba(120,200,240,0.85)'; g.fillRect(x, y, 1, 1.4); g.fillStyle = 'rgba(255,255,255,0.9)'; g.fillRect(x, y, 0.5, 0.5); });
    g.restore();
    drawTubFront(g, B, t);
    // shower water
    if (bath.step === 1 && bath.down) {
      for (let i = 0; i < 4; i++) bath.drops.push({ x: bath.px + rnd(-16, 16), y: bath.py - 4, vy: rnd(260, 380) });
      let popped = false;
      bath.foam = bath.foam.filter(f => {
        const fxp = B.tx + f.dx, fyp = B.feetY + f.dy;
        const hit = Math.abs(fxp - bath.px) < 26 && fyp > bath.py - 10 && chance(dt * 2.5);
        if (hit) popped = true;
        return !hit;
      });
      if (popped && chance(0.3)) Snd.pop();

      bath.rinseT = (bath.rinseT || 0) + dt;
      bath.prog = Math.min((1 - bath.foam.length / Math.max(1, bath.foam0 || 1)) / 0.85, bath.rinseT / 3);     // the last few bubbles slide off by themselves
      if (bath.prog >= 1) bath.foam = [];
    }
    if (Snd.shower) Snd.shower(bath.step === 1 && bath.down && bath.result !== 'done');
    bath.drops = bath.drops.filter(d => { d.y += d.vy * dt; return d.y < B.rimY + 10; });
    g.strokeStyle = 'rgba(120,190,230,0.8)'; g.lineWidth = 1.6;
    for (const d of bath.drops) { g.beginPath(); g.moveTo(d.x, d.y); g.lineTo(d.x, d.y + 7); g.stroke(); }
    // foam
    for (const f of bath.foam) drawBubble(g, B.tx + f.dx + Math.sin(t * 1.5 + f.w) * 1.2, B.feetY + f.dy, f.r);
    if (bath.down && bath.result !== 'done') drawTool(g, bath.px, bath.py, bath.step, t);
    // celebration
    if (bath.result === 'done') {
      g.fillStyle = 'rgba(255,240,170,0.9)';
      for (let i = 0; i < 6; i++) { const a = t * 1.5 + i, r = 18 * B.k; star(g, B.tx + Math.cos(a) * r, B.feetY - 12 * B.k + Math.sin(a) * r * 0.6, 6 + 3 * Math.sin(t * 6 + i)); }
      if (performance.now() - bath.doneT > 1900) { endBath(true); return; }
    } else if (bath.prog >= 1) nextStep();
    if (bath.down || bath.step === 1) setStepUi();
    bath.raf = requestAnimationFrame(bathFrame);
  }

  // the room's cursor feed must stay out of the way while bathing
  window.__bathStart = startBath;
  function care(kind) { try { window.dispatchEvent(new CustomEvent('naman:care', { detail: { kind } })); } catch (e) { /* */ } }
  // shared with mobile-extras.js
  window.__lifeApi = { st, save, hopOnto, lounge, sparkleAt, highlight, plat, frontY, nBroken, nameGa, catName, care,
    bathOpen: () => bath.open, bathLayout };

  /* ---------- clocks ---------- */
  function catchUp() {
    const away = (now() - st.lastSeen) / 3600000;
    if (away > 0) st.hyg = clampN(st.hyg - Math.min(away, 48) * HYG_PER_H, 0, 100);
    let n = away > 6 ? 2 : away > 1.5 ? 1 : 0, did = 0;
    while (n-- > 0 && nBroken() < MAX_BROKEN - 1) {
      const k = pickEvent(); if (!k) break;
      st.broken[k] = EVENTS[k].make(); st.recent.push(k); did++;
    }
    while (st.recent.length > 3) st.recent.shift();
    if (!st.nextAt || st.nextAt < now()) st.nextAt = now() + (DEV ? 8000 : rnd(3, 8) * 60000);
    save(); F.repaint();
    if (did) setTimeout(() => { toast(nameGa() + ' 혼자 있는 동안 사고를 쳤어요. 집 고치기를 눌러 봐요'); highlight(5000); }, 2500);
  }

  if (WALLPAPER) {
    // show what the app saved: wrecked things and a grubby cat, nothing changes here
    setInterval(() => { const o = load(); st.hyg = o.hyg; st.broken = o.broken; F.repaint(); }, 60000);
    F.repaint();
    return;
  }

  buildUi();
  catchUp();
  let lastT = now(), saveT = 0;
  setInterval(() => {
    const t = now(), dt = Math.min(5, (t - lastT) / 1000); lastT = t;
    if (typeof Adopt !== 'undefined' && Adopt.open) return;
    // hygiene
    let rate = HYG_PER_H / 3600;
    if (Room.clean < 60) rate *= 1.5;
    if (!bath.open) st.hyg = clampN(st.hyg - rate * dt, 0, 100);
    if (cat.label === 'groom') st.hyg = Math.min(100, st.hyg + 0.03 * dt);
    if (st.hyg < 30 && cat.needs) cat.needs.love = Math.max(0, cat.needs.love - 0.03 * dt);
    if (st.hyg < 25 && typeof Room.nextFly === 'number') Room.nextFly -= dt * 1.5;
    // mischief
    if (t >= st.nextAt && cat.visible && !window.__bathOpen && !(window.__isBedtime && window.__isBedtime()) && !cat.asleep && !cat.forced && nBroken() < MAX_BROKEN &&
        cat.label !== 'carried' && cat.label !== 'pet') {
      cat.forced = 'mischief';
      st.nextAt = t + nextGap();
      save();
    }
    saveT += dt; if (saveT > 15) { saveT = 0; save(); }
  }, 1000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); });

  window.__lifeDev = { st, EVENTS, force: k => { cat.forced = 'mischief'; if (k) st.recent = Object.keys(EVENTS).filter(x => x !== k); }, startBath, endBath, bath, highlight };
})();
