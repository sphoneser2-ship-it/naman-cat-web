'use strict';
/* ============ tamagotchi extras (phone only) ============
   - daily care stamps: feed, play, pet, clean -> a paw stamp for the day; streaks; every 7 days a special present
   - gift gauge: every bit of care fills it; when full the cat brings a new item (collection)
   - growing up: milestone days are celebrated (a banner, confetti and a present)
   - bedtime: from 21:30 to 7:00 the cat sleeps (wakes for petting, then goes back to sleep)
   - catching a cold when neglected (never dies) and a visit to the vet to get better
   - photo album: take a picture of the room, kept on this device
   - weather and seasons in the window (rain, snow, cherry blossoms, autumn leaves); the cat watches from the sofa */
(function () {
  const A = window.__lifeApi, F = window.NamanFurn, R = window.__room;
  if (!A || !F || !R || typeof cat === 'undefined') return;
  const WALLPAPER = /[?&]wallpaper=1/.test(location.search);
  const KEY = 'naman.mobile.extras.v1';
  const now = () => Date.now();
  const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  const lg = v => v / S_PX;
  const hourNowR = () => R.hourNow();

  /* ---------- saved state ---------- */
  function load() {
    let o = null;
    try { o = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { o = null; }
    o = o || {};
    return { days: o.days || {}, gauge: o.gauge || 0, health: typeof o.health === 'number' ? o.health : 100, sick: !!o.sick,
      stickers: o.stickers || 0, born: o.born || 0, celebrated: o.celebrated || [], lastSeen: o.lastSeen || now(), awake: o.awake || '', lastBackup: o.lastBackup || 0 };
  }
  const X = load();
  function save() { if (WALLPAPER) return; X.lastSeen = now(); try { localStorage.setItem(KEY, JSON.stringify(X)); } catch (e) { /* */ } }
  const pad2 = n => String(n).padStart(2, '0');
  const dayKey = (d = new Date()) => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  const today = () => { const k = dayKey(); return X.days[k] || (X.days[k] = { feed: 0, play: 0, pet: 0, clean: 0, stamp: false }); };
  const TASKS = [
    { k: 'feed', icon: '🍚', name: '밥 주기', need: 1, unit: '번' },
    { k: 'play', icon: '🧶', name: '놀아 주기', need: 30, unit: '초' },
    { k: 'pet', icon: '🤚', name: '쓰다듬기', need: 15, unit: '초' },
    { k: 'clean', icon: '🧹', name: '청소·목욕', need: 1, unit: '번' }
  ];
  const GAUGE_MAX = 20;
  const toastS = m => { try { toast(m); } catch (e) { /* */ } };
  const name = () => A.catName(), nameGa = () => A.nameGa();

  /* ---------- weather & seasons ---------- */
  const SEASON = m => (m >= 2 && m <= 4) ? 'spring' : (m >= 5 && m <= 7) ? 'summer' : (m >= 8 && m <= 10) ? 'autumn' : 'winter';
  function weatherNow() {
    const dev = /[?&]weather=([a-z]+)/.exec(location.search);
    if (dev) return dev[1];
    const d = new Date(), month = d.getMonth(), block = Math.floor(d.getHours() / 6);
    const r = R.seeded(Number(dayKey(d).replace(/-/g, '')) * 7 + block)();
    const s = SEASON(month);
    if (s === 'spring') return r < (month === 3 || month === 2 ? 0.35 : 0.1) ? 'petal' : r < 0.6 ? 'clear' : r < 0.8 ? 'cloudy' : 'rain';
    if (s === 'summer') return r < 0.5 ? 'clear' : r < 0.62 ? 'cloudy' : 'rain';
    if (s === 'autumn') return r < 0.35 ? 'leaf' : r < 0.75 ? 'clear' : r < 0.88 ? 'cloudy' : 'rain';
    return r < 0.42 ? 'snow' : r < 0.8 ? 'clear' : 'cloudy';
  }
  const WEATHER_LABEL = { clear: '☀️ 맑음', cloudy: '☁️ 흐림', rain: '☔ 비', snow: '❄️ 눈', petal: '🌸 벚꽃', leaf: '🍁 낙엽' };
  const WEATHER_WATCH = { rain: '빗방울', snow: '내리는 눈', petal: '날리는 벚꽃잎', leaf: '떨어지는 낙엽' };

  const wx = document.createElement('canvas');
  wx.id = 'weatherFx'; wx.setAttribute('aria-hidden', 'true');
  wx.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;';
  const roomBg = document.getElementById('roomBg');
  if (roomBg && roomBg.nextSibling) document.body.insertBefore(wx, roomBg.nextSibling); else document.body.appendChild(wx);
  const W_ = { kind: '', parts: [], raf: 0, last: 0 };
  function glass() { const l = R.L(); return { x: l.winX + 9, y: l.winY + 9, w: l.winW - 18, h: l.winH - 18 }; }
  function spawnWeather(k, gl, init) {
    const p = { x: gl.x + Math.random() * gl.w, y: init ? gl.y + Math.random() * gl.h : gl.y - 6, t: Math.random() * 6 };
    if (k === 'rain') { p.vy = 260 + Math.random() * 120; p.vx = -40; p.len = 7 + Math.random() * 6; }
    else if (k === 'snow') { p.vy = 18 + Math.random() * 18; p.vx = 0; p.r = 1 + Math.random() * 1.8; }
    else if (k === 'petal') { p.vy = 22 + Math.random() * 16; p.vx = 18 + Math.random() * 14; p.r = 2.2 + Math.random() * 1.2; p.rot = Math.random() * 6; }
    else { p.vy = 26 + Math.random() * 16; p.vx = 12 + Math.random() * 12; p.r = 3 + Math.random() * 1.5; p.rot = Math.random() * 6; p.c = ['#e0722f', '#c9472b', '#e8b33a', '#b8612a'][Math.floor(Math.random() * 4)]; }
    return p;
  }
  function weatherFrame(ts) {
    W_.raf = 0;
    const dpr = Math.min(3, window.devicePixelRatio || 1), Wc = innerWidth, Hc = innerHeight;
    if (wx.width !== Math.round(Wc * dpr) || wx.height !== Math.round(Hc * dpr)) { wx.width = Math.round(Wc * dpr); wx.height = Math.round(Hc * dpr); }
    const g = wx.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, Wc, Hc);
    const k = weatherNow();
    if (k !== W_.kind) { W_.kind = k; W_.parts = []; }
    const gl = glass(), dt = Math.min(0.05, W_.last ? (ts - W_.last) / 1000 : 0.016); W_.last = ts;
    const night = R.skyAt(hourNowR()).night;
    g.save(); g.beginPath(); g.rect(gl.x, gl.y, gl.w, gl.h); g.clip();
    if (k === 'rain' || k === 'cloudy') { g.fillStyle = `rgba(110,122,140,${k === 'rain' ? 0.32 : 0.2})`; g.fillRect(gl.x, gl.y, gl.w, gl.h); }
    const want = { rain: 70, snow: 55, petal: 18, leaf: 14 }[k] || 0;
    while (W_.parts.length < want) W_.parts.push(spawnWeather(k, gl, W_.parts.length < want * 0.9 && !W_.started));
    W_.started = true;
    for (const p of W_.parts) {
      p.t += dt;
      p.y += p.vy * dt; p.x += (p.vx + (k === 'snow' ? Math.sin(p.t * 1.6) * 10 : k === 'petal' || k === 'leaf' ? Math.sin(p.t * 2.2) * 16 : 0)) * dt;
      if (p.y > gl.y + gl.h + 6 || p.x > gl.x + gl.w + 10 || p.x < gl.x - 10) Object.assign(p, spawnWeather(k, gl, false));
      if (k === 'rain') { g.strokeStyle = `rgba(220,232,250,${night > 0.5 ? 0.35 : 0.6})`; g.lineWidth = 1; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.len * 0.15, p.y + p.len); g.stroke(); }
      else if (k === 'snow') { g.fillStyle = 'rgba(255,255,255,0.92)'; g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI * 2); g.fill(); }
      else {
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot + p.t * 2);
        g.fillStyle = k === 'petal' ? 'rgba(255,190,210,0.95)' : p.c;
        g.beginPath(); g.ellipse(0, 0, p.r, p.r * (k === 'petal' ? 0.6 : 0.45), 0, 0, Math.PI * 2); g.fill();
        g.restore();
      }
    }
    if (k === 'snow') { g.fillStyle = 'rgba(255,255,255,0.9)'; g.fillRect(gl.x, gl.y + gl.h - 4, gl.w, 4); }
    if (k === 'rain') {                                   // a few drops sliding down the glass
      g.fillStyle = 'rgba(230,240,255,0.5)';
      const r = R.seeded(Math.floor(ts / 4000));
      for (let i = 0; i < 9; i++) { const x = gl.x + r() * gl.w, y = gl.y + ((r() * gl.h + ts / 40 * (0.3 + r())) % gl.h); g.beginPath(); g.ellipse(x, y, 1.3, 2, 0, 0, Math.PI * 2); g.fill(); }
    }
    g.restore();
    if (want && document.visibilityState === 'visible') W_.raf = requestAnimationFrame(weatherFrame);
  }
  const kickWeather = () => { if (!W_.raf) W_.raf = requestAnimationFrame(weatherFrame); };
  kickWeather();
  setInterval(kickWeather, 30000);
  document.addEventListener('visibilitychange', kickWeather);
  window.addEventListener('resize', () => setTimeout(kickWeather, 0));

  if (WALLPAPER) return;                                  // the wallpaper only shows the room and the weather

  /* ---------- bedtime ---------- */
  const isBedtime = () => { const h = hourNowR(); return h >= 21.5 || h < 7; };
  window.__isBedtime = isBedtime;

  /* ---------- the cat watches the weather from the sofa back ---------- */
  function* bWatchWeather() {
    const k = weatherNow(), l = R.L(), wxC = lg(l.winX + l.winW / 2), wyC = lg(l.winY + l.winH / 2);
    const p = A.plat('sofaBack');
    S('{n}가 창밖을 보러 소파로 가요');
    yield* A.hopOnto('sofaBack', clampN(wxC, p.x0, p.x1));
    setPose('sit'); face('wide', 'closed', 'fwd');
    S('{n}가 ' + (WEATHER_WATCH[k] || '창밖') + '을 구경해요');
    const dur = rnd(10, 22);
    let el = 0, nx = 0;
    while (el < dur && cat.surface === 'platform') {
      el += DT;
      if (el > nx) {
        nx = el + rnd(0.8, 2.2);
        lookAtPt(wxC + rnd(-30, 30), wyC + rnd(-20, 20), 1);
        if (k !== 'rain' && chance(0.35)) { Snd.chatter(); cat.mouth = 'open1'; }
        else cat.mouth = 'closed';
        if (chance(0.4)) cat.tailFlick = 40;
      }
      yield;
    }
    lookFree(); cat.mouth = 'closed';
    yield* A.lounge('sofaBack', rnd(4, 10));
  }
  try { BEH.watchWeather = bWatchWeather; } catch (e) { /* */ }

  /* ---------- weights: bedtime, a cold, the weather ---------- */
  try {
    const base = applyLifeWeights;
    const KEEP_AT_NIGHT = new Set(['nap', 'loaf', 'groom', 'eat', 'drink', 'toilet', 'checkBowl', 'idleSit']);
    applyLifeWeights = function (w) {
      base(w);
      const k = weatherNow();
      if (WEATHER_WATCH[k] && cat.surface !== 'platform') w.watchWeather = k === 'rain' ? 0.5 : 1.3;
      if (X.sick) {
        w.sneeze = (w.sneeze || 0) + 2.5; w.nap = (w.nap || 0) * 2 + 1;
        for (const key of ['zoom', 'tailChase', 'hunt', 'airHunt', 'ball', 'mischief', 'perch', 'watchWeather', 'pester', 'wander']) if (w[key]) w[key] *= 0.25;
      }
      if (isBedtime()) {
        for (const key in w) if (!KEEP_AT_NIGHT.has(key)) w[key] *= 0.03;
        w.nap = (w.nap || 0) + 40; w.idleSit = (w.idleSit || 0) * 0.3;
      }
    };
  } catch (e) { console.error(e); }

  /* ---------- care tracking ---------- */
  function addGauge(n) {
    X.gauge += n;
    if (X.gauge >= GAUGE_MAX) {
      X.gauge -= GAUGE_MAX;
      if (typeof lockedItems === 'function' && lockedItems().length) {
        Present.nextAt = now(); try { store.set('presentAt', Present.nextAt); } catch (e) { /* */ }
        toastS('선물 게이지가 꽉 찼어요! ' + nameGa() + ' 곧 선물을 물어 올 거예요');
      }
    }
    save(); refreshCard();
  }
  function careDone(kind, amount) {
    const t = today();
    t[kind] = (t[kind] || 0) + amount;
    checkStamp();
  }
  function checkStamp() {
    const t = today();
    if (t.stamp || !TASKS.every(T => (t[T.k] || 0) >= T.need)) { save(); refreshCard(); return; }
    t.stamp = true;
    const s = streak();
    save();
    try { (Snd.stamp || Snd.sparkle)(); if (Snd.fanfare) setTimeout(() => Snd.fanfare(), 250); } catch (e) { /* */ }
    for (let i = 0; i < 4; i++) setTimeout(() => A.sparkleAt(rnd(60, innerWidth - 60), rnd(120, innerHeight * 0.5), 16, true), i * 220);
    showBanner('오늘의 돌봄 도장 쾅! 🐾', s > 1 ? s + '일 연속으로 잘 돌봤어요' : '내일도 잘 부탁해요');
    if (s % 7 === 0 && typeof lockedItems === 'function' && lockedItems().length) {
      Present.nextAt = now(); try { store.set('presentAt', Present.nextAt); } catch (e) { /* */ }
      setTimeout(() => toastS(s + '일 연속 도장! 특별 선물이 와요'), 2500);
    }
    refreshCard();
  }
  function streak() {
    let n = 0; const d = new Date();
    if (!(X.days[dayKey(d)] || {}).stamp) d.setDate(d.getDate() - 1);
    for (;;) { const e = X.days[dayKey(d)]; if (!e || !e.stamp) break; n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  // feeding buttons
  for (const id of ['bKibble', 'bChuru']) {
    const b = document.getElementById(id);
    if (b) b.addEventListener('click', () => { careDone('feed', 1); addGauge(1); });
  }
  // cleaning up poop
  try {
    const baseRemove = removeMess;
    removeMess = function (m) { const r = baseRemove(m); careDone('clean', 1); addGauge(2); return r; };
  } catch (e) { /* */ }
  window.addEventListener('naman:care', e => {
    const k = e.detail && e.detail.kind;
    if (k === 'bath') { careDone('clean', 1); addGauge(3); }
    else if (k === 'fix') addGauge(2);
    // mini-games are not part of the daily care stamps: their only reward is the high score
  });

  /* ---------- growing up: milestones ---------- */
  const MILESTONES = [
    [1, '첫날을 무사히 보냈어요!', '{n}가 우리 집이 마음에 드나 봐요', '첫날 기념'],
    [3, '청소년 고양이가 됐어요!', '{n}가 쑥쑥 자라고 있어요', '청소년'],
    [9, '어른 고양이가 됐어요!', '{n}가 다 컸어요. 그래도 여전히 아기 같아요', '어른 고양이'],
    [30, '한 달 생일 축하해요! 🎂', '{n}와 함께한 지 한 달이 됐어요', '한 달 생일'],
    [100, '함께한 지 100일! 🎉', '{n}가 고마워하고 있어요', '100일'],
    [200, '함께한 지 200일!', '{n}와 추억이 많이 쌓였어요', '200일'],
    [365, '1살 생일 축하해요! 🎂', '{n}가 1살이 됐어요', '1살 생일']
  ];
  const fill = s => s.replace('{n}', name());
  function milestoneCheck() {
    if (typeof ageDays !== 'function' || !cat.born) return;
    if (X.born !== cat.born) {                            // a different cat (or the first run): earlier milestones count as done
      X.born = cat.born; X.celebrated = MILESTONES.filter(m => ageDays() >= m[0]).map(m => m[0]); save(); return;
    }
    const d = ageDays();
    let due = MILESTONES.filter(m => d >= m[0] && !X.celebrated.includes(m[0]));
    const months = Math.floor(d / 30);                    // a small birthday every month after the first year
    if (d >= 395 && !X.celebrated.includes('m' + months)) due = due.concat([['m' + months, months + '개월 생일 축하해요! 🎂', '{n}와 함께한 지 ' + months + '개월이에요']]);
    if (!due.length) return;
    for (const m of due) X.celebrated.push(m[0]);
    save();
    const m = due[due.length - 1];
    showBanner(m[1], fill(m[2]));
    try { (Snd.fanfare || Snd.sparkle)(); setTimeout(() => Snd.meow('happy', 0.7), 700); } catch (e) { /* */ }
    for (let i = 0; i < 6; i++) setTimeout(() => A.sparkleAt(rnd(40, innerWidth - 40), rnd(80, innerHeight * 0.45), 18, true), i * 260);
    if (cat.visible && !cat.busy) { emote('heart', 2); try { burstHearts(cat.x, cat.gy - 20, 4); } catch (e) { /* */ } }
    if (typeof lockedItems === 'function' && lockedItems().length) { Present.nextAt = now(); try { store.set('presentAt', Present.nextAt); } catch (e) { /* */ } }
  }
  function nextMilestoneText() {
    if (typeof ageDays !== 'function') return '';
    const d = ageDays(), m = MILESTONES.find(x => x[0] > d);
    if (!m) return '';
    const left = Math.ceil(m[0] - d);
    return m[3] + '까지 ' + left + '일';
  }

  /* ---------- health: a cold when neglected, never worse ---------- */
  function healthTick(dt) {
    const n = cat.needs || {}, hyg = A.st.hyg;
    const bad = (n.sat < 20 ? 6 : 0) + (hyg < 20 ? 4 : 0) + (n.love < 20 ? 3 : 0) + (Room.messes.length >= 3 ? 3 : 0);
    if (bad) X.health = clampN(X.health - bad / 3600 * dt, 0, 100);
    else X.health = clampN(X.health + 3 / 3600 * dt, 0, 100);
    if (hyg < 30 && chance(0.03 / 3600 * dt)) X.health = Math.min(X.health, 35);
    if (!X.sick && X.health < 40) {
      X.sick = true; save();
      toastS(nameGa() + ' 감기에 걸렸어요! 🏥 병원 버튼을 눌러 주세요');
      if (cat.visible && !cat.busy) emote('sweat', 2);
    }
    if (X.sick && cat.visible && !cat.asleep && !cat.busy && chance(dt / 40)) emote('sweat', 1.6);
  }

  /* ---------- the vet ---------- */
  const vet = { open: false, step: 0, prog: 0, down: false, px: 0, py: 0, pill: null, done: 0, raf: 0, last: 0, beatT: 0, checkup: false };
  const vel = document.createElement('div');
  vel.id = 'vet'; vel.className = 'xover'; vel.hidden = true; vel.setAttribute('data-hit', '');
  vel.innerHTML = '<canvas class="xcv"></canvas><div class="bathTop"><div class="bsteps"><span data-s="0">① 진찰</span><span data-s="1">② 약 먹기</span><span data-s="2">③ 칭찬</span></div>' +
    '<div class="bbar"><i class="xbar"></i></div><p class="xhint"></p></div><button class="xclose" type="button" aria-label="병원 나가기">✕</button>';
  document.body.appendChild(vel);
  const vcv = vel.querySelector('canvas');
  const VET_HINT = ['청진기를 고양이 몸에 대고 꾹 누르고 있어요', '알약을 끌어서 고양이 입에 쏙 넣어 줘요', '잘 참았어요! 쓰다듬어서 칭찬해 줘요'];
  function vetLayout() {
    const Wc = innerWidth, Hc = innerHeight, tw = Math.min(Wc * 0.8, 360), k = clampN(Math.round(tw / 48), 4, 8);
    const tx = Wc / 2, tableY = Math.round(Hc * 0.6);
    return { Wc, Hc, tw, k, tx, tableY, feetY: tableY };
  }
  const toScreen = (L, x, y) => ({ x: L.tx + (x - cat.x) * L.k, y: L.feetY + (y - cat.gy) * L.k });
  function overCatV(px, py) {
    const L = vetLayout(), r = 20 / L.k, x = cat.x + (px - L.tx) / L.k, y = cat.gy + (py - L.feetY) / L.k;
    for (const [dx, dy] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]]) if (catHit(x + dx, y + dy)) return true;
    return false;
  }
  function* bVetHold() {
    cat.busy = true;
    try { cat.dir = 1; cat.z = 0; setPose('sit'); face('wide', 'closed', 'back'); while (window.__bathOpen && vet.open) { cat.z = 0; yield; } }
    finally { cat.busy = false; cat.purr = 0; }
    if (vet.done) { S('{n}가 기운을 차렸어요'); setPose('stand'); yield* shiver(); setPose('sit'); face('happy'); emote('heart', 1.8); yield* wait(1.5); }
  }
  bVetHold.keepSurface = true;
  function vetUi() {
    for (const s of vel.querySelectorAll('[data-s]')) s.classList.toggle('on', +s.dataset.s === vet.step);
    vel.querySelector('.xhint').textContent = vet.done ? (vet.checkup ? '아주 건강해요! 칭찬 스티커를 받았어요' : '다 나았어요! 칭찬 스티커를 받았어요') : VET_HINT[vet.step];
    vel.querySelector('.xbar').style.width = Math.round((vet.done ? 1 : (vet.step + clampN(vet.prog, 0, 1)) / 3) * 100) + '%';
  }
  function startVet() {
    if (vet.open || window.__bathOpen) return;
    if (!cat.visible) { toastS(nameGa() + ' 지금 방에 없어요'); return; }
    if (cat.protect) { toastS('지금은 볼일 중이에요. 조금 이따가 가요'); return; }
    openDock(false); Room.emote = null;
    vet.open = true; window.__bathOpen = true;
    vet.step = 0; vet.prog = 0; vet.done = 0; vet.pill = null; vet.checkup = !X.sick;
    startBehavior(bVetHold, 'vet');
    vel.hidden = false; vetUi();
    toastS(vet.checkup ? '정기 검진을 받아요' : nameGa() + ' 동물병원에 왔어요');
    vet.last = 0; vet.raf = requestAnimationFrame(vetFrame);
  }
  function endVet(ok) {
    if (!vet.open) return;
    if (ok) {
      X.health = 100; X.sick = false; X.stickers++;
      if (cat.needs) cat.needs.love = clampN(cat.needs.love + (vet.checkup ? 2 : 5), 0, 100);
      addGauge(3);
      setTimeout(() => toastS(vet.checkup ? nameGa() + ' 아주 건강하대요!' : nameGa() + ' 다 나았어요!'), 200);
    }
    vet.open = false; window.__bathOpen = false; vel.hidden = true;
    cancelAnimationFrame(vet.raf); save();
  }
  vel.querySelector('.xclose').addEventListener('click', () => endVet(false));
  vcv.addEventListener('pointerdown', e => {
    if (!vet.open) return;
    e.preventDefault(); try { vcv.setPointerCapture(e.pointerId); } catch (err) { /* */ }
    vet.down = true; vet.px = e.clientX; vet.py = e.clientY;
    if (vet.step === 1) { const P = pillHome(); if (Math.hypot(e.clientX - P.x, e.clientY - P.y) < 40) vet.pill = { x: e.clientX, y: e.clientY }; }
  });
  vcv.addEventListener('pointermove', e => {
    if (!vet.open) return;
    const d = Math.min(60, Math.hypot(e.clientX - vet.px, e.clientY - vet.py));
    vet.px = e.clientX; vet.py = e.clientY;
    if (vet.pill) { vet.pill.x = e.clientX; vet.pill.y = e.clientY; }
    if (vet.down && vet.step === 2 && !vet.done && overCatV(e.clientX, e.clientY)) {
      vet.prog += d / 900;
      if (chance(d / 120)) { const L = vetLayout(); A.sparkleAt(e.clientX, e.clientY - 10, 2, false); }
    }
  });
  function vetUp() {
    vet.down = false;
    if (vet.step === 1 && vet.pill) {
      const L = vetLayout(), h = toScreen(L, cat.headAbs.x, cat.headAbs.y + 3);
      if (Math.hypot(vet.pill.x - h.x, vet.pill.y - h.y) < 46) {
        try { (Snd.gulp || Snd.munch)(); } catch (e) { /* */ }
        face('happy'); cat.mouth = 'open1'; setTimeout(() => { cat.mouth = 'closed'; }, 500);
        vet.prog = 1;
      } else toastS('고양이 입 쪽으로 가져가 봐요');
      vet.pill = null;
    }
  }
  vcv.addEventListener('pointerup', vetUp); vcv.addEventListener('pointercancel', vetUp);
  function pillHome() { const L = vetLayout(); return { x: L.tx + L.tw * 0.36, y: L.tableY + 46 }; }
  function drawPill(g, x, y) {
    g.save(); g.translate(x, y); g.rotate(-0.5);
    g.fillStyle = '#ff7c9c'; R.roundRect(g, -14, -7, 14, 14, 7); g.fill();
    g.fillStyle = '#ffffff'; R.roundRect(g, 0, -7, 14, 14, 7); g.fill();
    g.fillRect(-1, -7, 4, 14); g.fillStyle = '#ff7c9c'; g.fillRect(-2, -7, 2, 14);
    g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 1; R.roundRect(g, -14, -7, 28, 14, 7); g.stroke();
    g.restore();
  }
  function vetFrame(ts) {
    if (!vet.open) return;
    const dt = Math.min(0.05, vet.last ? (ts - vet.last) / 1000 : 0.016); vet.last = ts;
    const L = vetLayout(), dpr = Math.min(3, window.devicePixelRatio || 1);
    if (vcv.width !== Math.round(L.Wc * dpr) || vcv.height !== Math.round(L.Hc * dpr)) { vcv.width = Math.round(L.Wc * dpr); vcv.height = Math.round(L.Hc * dpr); }
    const g = vcv.getContext('2d'), t = ts / 1000;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (window.__scenes) window.__scenes.vet(g, L, t, dpr, vet.step === 0 && vet.down);
    else {
    // clinic room
    const wg = g.createLinearGradient(0, 0, 0, L.Hc); wg.addColorStop(0, '#eaf7f1'); wg.addColorStop(1, '#d6efe4');
    g.fillStyle = wg; g.fillRect(0, 0, L.Wc, L.Hc);
    g.fillStyle = '#c9e8da'; g.fillRect(0, L.tableY + 70, L.Wc, L.Hc);
    g.fillStyle = '#ffffff'; R.roundRect(g, L.Wc / 2 - 34, L.Hc * 0.16, 68, 68, 14); g.fill();
    g.fillStyle = '#ff6f7d'; g.fillRect(L.Wc / 2 - 8, L.Hc * 0.16 + 12, 16, 44); g.fillRect(L.Wc / 2 - 22, L.Hc * 0.16 + 26, 44, 16);
    // poster and plant
    g.fillStyle = '#fff8e6'; R.roundRect(g, 22, L.Hc * 0.3, 70, 90, 8); g.fill();
    g.fillStyle = '#ffb35c'; g.beginPath(); g.arc(57, L.Hc * 0.3 + 38, 16, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#8a6a4c'; g.fillRect(36, L.Hc * 0.3 + 66, 42, 4); g.fillRect(36, L.Hc * 0.3 + 74, 30, 4);
    // exam table
    g.fillStyle = '#9bc7d6'; R.roundRect(g, L.tx - L.tw / 2, L.tableY - 4, L.tw, 18, 9); g.fill();
    g.fillStyle = '#ffffff'; R.roundRect(g, L.tx - L.tw / 2 + 8, L.tableY - 10, L.tw - 16, 10, 5); g.fill();
    g.fillStyle = '#8fb5c3'; g.fillRect(L.tx - L.tw * 0.35, L.tableY + 14, 10, 60); g.fillRect(L.tx + L.tw * 0.35 - 10, L.tableY + 14, 10, 60);
    }
    // the cat, drawn by the game at clinic scale
    if (vet.step !== 1 || !vet.prog) face(vet.step === 2 ? 'happy' : 'half', 'closed', vet.step === 0 ? 'back' : 'normal');
    g.save();
    g.setTransform(L.k * dpr, 0, 0, L.k * dpr, (L.tx - cat.x * L.k) * dpr, (L.feetY - cat.gy * L.k) * dpr);
    g.imageSmoothingEnabled = false;
    try { drawCat(g, NOW); } catch (e) { /* */ }
    g.restore();
    // step 0: stethoscope held on the cat
    if (vet.step === 0 && !vet.done) {
      if (vet.down && overCatV(vet.px, vet.py)) {
        vet.prog += dt / 2.5;
        if (ts > vet.beatT) { vet.beatT = ts + 720; try { (Snd.heart || Snd.tick)(); } catch (e) { /* */ } }
        const s = 1 + 0.25 * Math.max(0, Math.sin(ts / 83));
        g.fillStyle = '#ff5d86'; g.save(); g.translate(vet.px + 26, vet.py - 30); g.scale(s, s);
        g.beginPath(); g.moveTo(0, 6); g.bezierCurveTo(-12, -4, -6, -14, 0, -6); g.bezierCurveTo(6, -14, 12, -4, 0, 6); g.fill(); g.restore();
      }
      if (vet.down) {
        g.strokeStyle = '#5b6a7a'; g.lineWidth = 3; g.beginPath(); g.moveTo(vet.px, vet.py); g.quadraticCurveTo(vet.px + 40, vet.py + 60, vet.px + 70, vet.py + 120); g.stroke();
        g.fillStyle = '#c8d3dc'; g.beginPath(); g.arc(vet.px, vet.py, 11, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#8796a5'; g.beginPath(); g.arc(vet.px, vet.py, 6, 0, Math.PI * 2); g.fill();
      }
    }
    // step 1: the pill
    if (vet.step === 1 && !vet.done && vet.prog < 1) {
      const P = vet.pill || pillHome();
      if (!vet.pill) { g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(pillHome().x, pillHome().y + 8, 30, 9, 0, 0, Math.PI * 2); g.fill(); }
      drawPill(g, P.x, P.y + (vet.pill ? 0 : Math.sin(t * 3) * 2));
      if (!vet.pill) { g.fillStyle = '#2f5866'; g.font = '700 12px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText('끌어서 먹이기', pillHome().x, pillHome().y + 34); }
    }
    if (vet.done) {
      g.fillStyle = '#ffd84d';
      for (let i = 0; i < 5; i++) { const a = t * 1.4 + i * 1.256, r = 20 * L.k; const x = L.tx + Math.cos(a) * r, y = L.feetY - 12 * L.k + Math.sin(a) * r * 0.5; g.beginPath(); for (let j = 0; j < 10; j++) { const aa = j * Math.PI / 5, rr = j % 2 ? 4 : 9; g.lineTo(x + Math.cos(aa) * rr, y + Math.sin(aa) * rr); } g.closePath(); g.fill(); }
      if (performance.now() - vet.done > 2000) { endVet(true); return; }
    } else if (vet.prog >= 1) {
      vet.step++; vet.prog = 0;
      if (vet.step >= 3) { vet.done = performance.now(); try { (Snd.fanfare || Snd.sparkle)(); setTimeout(() => Snd.meow('happy', 0.6), 500); } catch (e) { /* */ } A.sparkleAt(L.tx, L.feetY - 12 * L.k, 28, true); face('happy'); }
      vetUi();
    }
    if (vet.down) vetUi();
    vet.raf = requestAnimationFrame(vetFrame);
  }

  /* ---------- photo album (IndexedDB on this device) ---------- */
  const DB_NAME = 'naman-album', MAX_PHOTOS = 80;
  function db() {
    return new Promise((res, rej) => {
      const r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = () => r.result.createObjectStore('photos', { keyPath: 'id' });
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
  }
  async function dbAll() { const d = await db(); return new Promise((res, rej) => { const q = d.transaction('photos').objectStore('photos').getAll(); q.onsuccess = () => res(q.result.sort((a, b) => b.id - a.id)); q.onerror = () => rej(q.error); }); }
  async function dbPut(o) { const d = await db(); return new Promise((res, rej) => { const tx = d.transaction('photos', 'readwrite'); tx.objectStore('photos').put(o); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); }
  async function dbDel(id) { const d = await db(); return new Promise((res, rej) => { const tx = d.transaction('photos', 'readwrite'); tx.objectStore('photos').delete(id); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); }
  async function takePhoto() {
    openDock(false);
    await new Promise(r => setTimeout(r, 120));
    const Wc = innerWidth, Hc = innerHeight, sc = 1.5;
    const c = document.createElement('canvas'); c.width = Math.round(Wc * sc); c.height = Math.round(Hc * sc);
    const g = c.getContext('2d');
    for (const id of ['roomBg', 'weatherFx', 'stage']) { const el = document.getElementById(id); if (el && el.width) g.drawImage(el, 0, 0, c.width, c.height); }
    const d = new Date(), label = d.getFullYear() + '.' + pad2(d.getMonth() + 1) + '.' + pad2(d.getDate()) + '  ' + name();
    g.font = `700 ${Math.round(16 * sc)}px system-ui, sans-serif`; g.textAlign = 'right';
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillText(label, c.width - 14 * sc + 1.5, c.height - 18 * sc + 1.5);
    g.fillStyle = '#ffd36b'; g.fillText(label, c.width - 14 * sc, c.height - 18 * sc);
    // flash
    const fl = document.createElement('div'); fl.className = 'xflash'; document.body.appendChild(fl);
    setTimeout(() => fl.classList.add('off'), 30); setTimeout(() => fl.remove(), 600);
    try { (Snd.shutter || Snd.tick)(); } catch (e) { /* */ }
    c.toBlob(async blob => {
      if (!blob) { toastS('사진을 찍지 못했어요'); return; }
      try {
        await dbPut({ id: Date.now(), blob, day: dayKey(d), name: name() });
        const all = await dbAll();
        for (const old of all.slice(MAX_PHOTOS)) await dbDel(old.id);
        toastS('찰칵! 앨범에 저장했어요 (' + Math.min(all.length, MAX_PHOTOS) + '장)');
      } catch (e) { toastS('사진을 저장하지 못했어요'); }
    }, 'image/jpeg', 0.85);
  }

  /* ---------- modal cards: stamp board and album ---------- */
  const card = document.createElement('div');
  card.id = 'xcard'; card.className = 'xmodal'; card.hidden = true; card.setAttribute('data-hit', '');
  card.innerHTML = '<div class="xbox" data-hit><button class="xx" type="button" aria-label="닫기">✕</button><div class="xbody"></div></div>';
  document.body.appendChild(card);
  const cbody = card.querySelector('.xbody');
  let cardView = '', urls = [];
  card.querySelector('.xx').addEventListener('click', closeCard);
  card.addEventListener('click', e => { if (e.target === card) closeCard(); });
  function closeCard() { card.hidden = true; cardView = ''; for (const u of urls) URL.revokeObjectURL(u); urls = []; }
  function refreshCard() { if (cardView === 'stamps') renderStamps(); }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function renderStamps() {
    const t = today(), s = streak();
    const rows = TASKS.map(T => {
      const v = Math.min(T.need, Math.floor(t[T.k] || 0)), ok = v >= T.need;
      return `<li class="${ok ? 'ok' : ''}"><span class="ti">${T.icon}</span><span class="tn">${T.name}</span><span class="tv">${ok ? '완료' : (T.need > 1 ? v + '/' + T.need + T.unit : '아직')}</span></li>`;
    }).join('');
    const cells = [];
    const d = new Date(); d.setDate(d.getDate() - 13);
    for (let i = 0; i < 14; i++) {
      const k = dayKey(d), e = X.days[k], isToday = i === 13;
      cells.push(`<div class="sc${e && e.stamp ? ' on' : ''}${isToday ? ' today' : ''}"><b>${e && e.stamp ? '🐾' : ''}</b><i>${d.getMonth() + 1}/${d.getDate()}</i></div>`);
      d.setDate(d.getDate() + 1);
    }
    const have = typeof Unlocks !== 'undefined' ? Unlocks.have.size : 0, total = typeof Unlocks !== 'undefined' ? Unlocks.catalog.length : 0;
    const age = typeof ageLabel === 'function' ? ageLabel() : '';
    const nm = nextMilestoneText();
    cbody.innerHTML = `<h2>${esc(name())}의 돌봄 도장판</h2><p class="xsub">${esc(age)}${nm ? ' · ' + esc(nm) : ''}</p>
      <h3>오늘 할 일 <small>4개 다 하면 도장 쾅!</small></h3><ul class="tasks">${rows}</ul>
      <h3>도장 <small>${s ? s + '일 연속 · ' : ''}7일 연속이면 특별 선물</small></h3><div class="stamps">${cells.join('')}</div>
      <h3>선물 게이지 <small>${X.gauge}/${GAUGE_MAX}</small></h3><div class="gauge"><i style="width:${Math.round(X.gauge / GAUGE_MAX * 100)}%"></i></div>
      <div class="xstats"><span>🎁 모은 물건 <b>${have}/${total}</b></span><span>🏥 칭찬 스티커 <b>${X.stickers}</b></span><span>${WEATHER_LABEL[weatherNow()] || ''}</span></div>`;
  }
  async function renderAlbum(focusId) {
    for (const u of urls) URL.revokeObjectURL(u); urls = [];
    let all = [];
    try { all = await dbAll(); } catch (e) { cbody.innerHTML = '<h2>앨범</h2><p class="xsub">이 기기에서는 앨범을 열 수 없어요</p>'; return; }
    if (focusId) {
      const p = all.find(x => x.id === focusId);
      if (!p) return renderAlbum();
      const u = URL.createObjectURL(p.blob); urls.push(u);
      cbody.innerHTML = `<h2>${esc(p.day.replace(/-/g, '.'))}</h2><img class="xbig" src="${u}" alt="${esc(p.name)} 사진">
        <div class="xrow"><button type="button" data-a="back">◀ 앨범</button><button type="button" data-a="save">${APP() ? '사진첩에 저장' : '저장'}</button><button type="button" data-a="share">보내기</button></div>
        <div class="xrow"><button type="button" data-a="del" class="danger">지우기</button></div>`;
      cbody.querySelector('[data-a=back]').onclick = () => renderAlbum();
      cbody.querySelector('[data-a=del]').onclick = async () => { await dbDel(p.id); toastS('사진을 지웠어요'); renderAlbum(); };
      const fname = 'naman-' + p.day + '-' + p.id + '.jpg';
      cbody.querySelector('[data-a=save]').onclick = async () => {
        if (APP()) { window.NamanAndroid.savePhoto(fname, await blobToB64(p.blob)); return; }
        download(p.blob, fname);
      };
      cbody.querySelector('[data-a=share]').onclick = () => sendFile(p.blob, fname, 'image/jpeg');
      return;
    }
    if (!all.length) { cbody.innerHTML = '<h2>앨범</h2><p class="xsub">아직 사진이 없어요. 📷 사진 버튼으로 찍어 봐요</p>'; return; }
    const th = all.map(p => { const u = URL.createObjectURL(p.blob); urls.push(u); return `<button type="button" class="th" data-id="${p.id}"><img src="${u}" alt=""><i>${esc(p.day.slice(5).replace('-', '/'))}</i></button>`; }).join('');
    cbody.innerHTML = `<h2>앨범 <small>${all.length}장</small></h2><div class="thumbs">${th}</div>`;
    for (const b of cbody.querySelectorAll('.th')) b.onclick = () => renderAlbum(+b.dataset.id);
  }
  function openCard(view) { cardView = view; card.hidden = false; openDock(false); if (view === 'stamps') renderStamps(); else if (view === 'backup') renderBackup(); else renderAlbum(); }

  /* ---------- files: Android app bridge, or the browser ---------- */
  const APP = () => !!(window.NamanAndroid && window.NamanAndroid.saveFile);
  const blobToB64 = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] || ''); r.onerror = () => rej(r.error); r.readAsDataURL(b); });
  function b64ToBlob(b64, type) { const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new Blob([u], { type }); }
  function download(blob, fname) {
    const u = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = u; a.download = fname; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 4000);
  }
  async function sendFile(blob, fname, type) {
    if (APP()) { window.NamanAndroid.shareFile(fname, type, await blobToB64(blob)); return; }
    const file = new File([blob], fname, { type });
    try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file] }); return; } } catch (e) { return; }
    download(blob, fname);
  }

  /* ---------- backup and restore ---------- */
  const SAVE_PREFIXES = ['catdesk.', 'naman.mobile.'];
  const isSaveKey = k => typeof k === 'string' && SAVE_PREFIXES.some(p => k.indexOf(p) === 0);
  async function makeBackup(withPhotos) {
    try { saveState(); } catch (e) { /* */ }
    try { flushDiary(); } catch (e) { /* */ }
    save(); A.save();
    const local = {};
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (isSaveKey(k)) local[k] = localStorage.getItem(k); }
    const data = { app: 'naman-cat', kind: 'backup', v: 1, at: new Date().toISOString(), cat: name(), local, photos: [] };
    if (withPhotos) { for (const p of await dbAll()) data.photos.push({ id: p.id, day: p.day, name: p.name, b64: await blobToB64(p.blob) }); }
    return new Blob([JSON.stringify(data)], { type: 'application/json' });
  }
  async function backupTo(mode) {
    const box = cbody.querySelector('#bkPhotos'), withPhotos = !!(box && box.checked);
    toastS('백업 파일을 만드는 중이에요');
    const blob = await makeBackup(withPhotos), fname = 'naman-cat-' + name() + '-' + dayKey() + '.json';
    X.lastBackup = now(); save();
    if (mode === 'share') await sendFile(blob, fname, 'application/json');
    else if (APP()) window.NamanAndroid.saveFile(fname, 'application/json', await blobToB64(blob));
    else download(blob, fname);
    if (cardView === 'backup') renderBackup();
  }
  async function restoreFrom(file) {
    let data = null;
    try { data = JSON.parse(await file.text()); } catch (e) { data = null; }
    if (!data || data.app !== 'naman-cat' || !data.local || typeof data.local !== 'object') { toastS('나만 없어 고양이 백업 파일이 아니에요'); return; }
    const when = String(data.at || '').slice(0, 10).replace(/-/g, '.');
    if (!window.confirm((data.cat || '고양이') + ' 백업(' + when + ')으로 바꿀까요?\n지금 있는 고양이 데이터는 이 백업으로 덮어써져요.')) return;
    // from here on nothing may write the old cat back before the page restarts
    const setItem = Storage.prototype.setItem, removeItem = Storage.prototype.removeItem;
    const old = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (isSaveKey(k)) old.push(k); }
    for (const k of old) removeItem.call(localStorage, k);
    for (const [k, v] of Object.entries(data.local)) if (isSaveKey(k) && typeof v === 'string') setItem.call(localStorage, k, v);
    Storage.prototype.setItem = function () {}; Storage.prototype.removeItem = function () {};
    try {
      if (Array.isArray(data.photos) && data.photos.length) {
        for (const p of await dbAll()) await dbDel(p.id);
        for (const p of data.photos) if (p && p.b64) await dbPut({ id: p.id, blob: b64ToBlob(p.b64, 'image/jpeg'), day: p.day || dayKey(), name: p.name || '' });
      }
    } catch (e) { /* the cat itself is restored even if the photos are not */ }
    toastS('불러왔어요! 다시 시작해요');
    setTimeout(() => location.reload(), 700);
  }
  async function renderBackup() {
    let n = 0; try { n = (await dbAll()).length; } catch (e) { n = 0; }
    const last = X.lastBackup ? new Date(X.lastBackup) : null;
    cbody.innerHTML = `<h2>백업 · 불러오기</h2>
      <p class="xsub">폰을 바꿀 때나 실수로 새 고양이를 입양했을 때, 백업 파일로 지금 고양이를 되살릴 수 있어요.</p>
      <h3>백업 <small>${last ? '마지막 백업 ' + (last.getMonth() + 1) + '/' + last.getDate() : '아직 백업한 적 없어요'}</small></h3>
      <label class="xchk"><input type="checkbox" id="bkPhotos" ${n ? 'checked' : 'disabled'}> 사진도 함께 넣기 (${n}장)</label>
      <div class="xrow"><button type="button" data-a="bsave">파일로 저장</button><button type="button" data-a="bshare">카톡·드라이브로 보내기</button></div>
      <h3>불러오기 <small>새 폰에서 백업 파일을 골라요</small></h3>
      <div class="xrow"><button type="button" data-a="bload">백업 파일 고르기</button></div>
      <input type="file" id="bkFile" accept=".json,application/json,text/plain" hidden>`;
    cbody.querySelector('[data-a=bsave]').onclick = () => backupTo('save');
    cbody.querySelector('[data-a=bshare]').onclick = () => backupTo('share');
    const inp = cbody.querySelector('#bkFile');
    cbody.querySelector('[data-a=bload]').onclick = () => inp.click();
    inp.onchange = () => { if (inp.files && inp.files[0]) restoreFrom(inp.files[0]); };
  }

  /* ---------- dock: health meter and buttons ---------- */
  (function buildUi() {
    const mh = document.getElementById('mHyg');
    if (mh && !document.getElementById('mHealth')) {
      const nl = document.createElement('li'); nl.innerHTML = '<span>건강</span><div class="bar" id="mHealth"></div>';
      mh.parentElement.after(nl);
    }
    const row = document.getElementById('btns3');
    if (row && !document.getElementById('bVet')) {
      const add = (id, emo, label, fn) => { const b = document.createElement('button'); b.id = id; b.type = 'button'; b.innerHTML = `<span class="emo">${emo}</span>${label}`; b.addEventListener('click', () => { try { Snd.wake(); } catch (e) { /* */ } fn(); }); row.appendChild(b); };
      add('bVet', '🏥', '병원', startVet);
      add('bPhoto', '📷', '사진', takePhoto);
      add('bAlbum', '🖼️', '앨범', () => openCard('album'));
      add('bStamps', '📅', '도장판', () => openCard('stamps'));
    }
    const menu = document.getElementById('menu');
    if (menu && !document.getElementById('mBackup')) {
      const b = document.createElement('button'); b.id = 'mBackup'; b.type = 'button'; b.textContent = '백업 · 불러오기';
      b.addEventListener('click', () => { menu.hidden = true; try { Interact.menuOpen = false; } catch (e) { /* */ } openCard('backup'); });
      const ref = document.getElementById('mNew'); if (ref) menu.insertBefore(b, ref); else menu.appendChild(b);
    }
  })();
  try {
    const baseHud = updateHud;
    updateHud = function (dt) {
      baseHud(dt);
      if (typeof hudT === 'undefined' || hudT !== 0.25) return;
      if (document.getElementById('mHealth')) setBar('mHealth', X.health);
      const md = document.getElementById('dMood');
      if (md) {
        if (X.sick) { md.textContent = '감기 걸렸어요 🤧'; md.hidden = false; }
        else if (isBedtime() && md.hidden) { md.textContent = '잘 시간이에요 💤'; md.hidden = false; }
      }
      if (X.sick) document.getElementById('dockTab').classList.add('alert');
      const ck = document.getElementById('dClock');
      if (ck && WEATHER_LABEL[weatherNow()]) ck.textContent += ' ' + WEATHER_LABEL[weatherNow()].split(' ')[0];
      const bv = document.getElementById('bVet'); if (bv) bv.classList.toggle('need', X.sick);
      const bs = document.getElementById('bStamps'); if (bs) bs.classList.toggle('need', !today().stamp);
    };
  } catch (e) { console.error(e); }

  /* ---------- clocks ---------- */
  (function catchUp() {
    const away = (now() - X.lastSeen) / 3600000;
    if (away > 0.5 && A.st.hyg < 20) X.health = clampN(X.health - Math.min(away, 24) * 4, 0, 100);
    if (!X.sick && X.health < 40) X.sick = true;
    save();
    if (X.sick) setTimeout(() => toastS(nameGa() + ' 감기에 걸렸어요! 🏥 병원 버튼을 눌러 주세요'), 4200);
  })();
  let lastT = now(), lastFun = null, saveT = 0, msT = 25, wasBed = isBedtime();
  setInterval(() => {
    const t = now(), dt = Math.min(5, (t - lastT) / 1000); lastT = t;
    if (typeof Adopt !== 'undefined' && Adopt.open) return;
    // care: petting and playing count in seconds
    if (cat.label === 'pet') careDone('pet', dt);
    const fun = cat.needs ? cat.needs.fun : null;
    if (lastFun !== null && fun > lastFun + 0.05 && cat.label !== 'pet') { careDone('play', dt); if (chance(dt / 10)) addGauge(1); }
    if (cat.label === 'pet' && chance(dt / 8)) addGauge(1);
    lastFun = fun;
    if (!window.__bathOpen) healthTick(dt);
    // good morning
    const bed = isBedtime();
    if (wasBed && !bed && cat.visible && !cat.busy) { cat.forced = 'stretch'; try { Snd.meow('trill', 0.7); } catch (e) { /* */ } toastS('좋은 아침! ' + nameGa() + ' 일어났어요. 밥을 챙겨 주세요'); }
    if (!wasBed && bed) toastS(nameGa() + ' 졸린가 봐요. 이제 잘 시간이에요');
    wasBed = bed;
    msT += dt; if (msT > 30) { msT = 0; milestoneCheck(); }
    saveT += dt; if (saveT > 15) { saveT = 0; save(); }
  }, 1000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); });

  window.__extrasDev = { X, makeBackup, restoreFrom, weatherNow, isBedtime, startVet, endVet, vet, takePhoto, openCard, careDone, streak, milestoneCheck, dbAll };
})();
