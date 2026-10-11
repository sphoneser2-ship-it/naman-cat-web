'use strict';
/* ============ sounds (phone only) ============
   Cuter kitten meows and the sound effects of the phone extras (bath, vet, stamps, camera...).
   Everything is synthesised, so there are no sound files to license. If recordings are put in
   www/sounds/ with a sounds.json like {"meow": ["meow1.mp3"], "mew": ["mew1.mp3"]}, those play instead. */
(function () {
  if (typeof Snd === 'undefined') return;
  let ctx = null, master = null, noiseBuf = null, shower = null;
  const samples = {};

  function init() {
    if (ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.6; master.connect(ctx.destination);
      const len = ctx.sampleRate;
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      loadSamples();
    } catch (e) { ctx = null; }
  }
  // Browsers only let a page start sound from a finished tap (touchend / pointerup / click), not from the
  // moment the finger lands. The game used to wake its audio on "pointerdown", so on phones it never started.
  function unlock() {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* iOS 17+: play even in silent mode */ }
    init();
    if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
    try { Snd.wake(); } catch (e) { /* */ }
  }
  for (const t of ['pointerup', 'touchend', 'click', 'keydown']) window.addEventListener(t, unlock, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && ctx && ctx.state !== 'running') ctx.resume().catch(() => {}); });
  window.__sndState = () => (ctx ? ctx.state : 'none');
  const quiet = () => { try { return typeof isQuiet === 'function' && isQuiet(); } catch (e) { return false; } };
  const ok = () => ctx && ctx.state === 'running' && Snd.on;
  const vol = v => v * (quiet() ? 0.3 : 1);

  function env(g, t0, a, d, peak) {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
  }
  function tone(f, dur, v, type = 'sine', delay = 0, to = 0) {
    if (!ok()) return;
    const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    env(g, t, Math.min(0.012, dur / 4), dur, vol(v));
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, f, q, v, type = 'bandpass', delay = 0, sweep = 0) {
    if (!ok()) return;
    const t = ctx.currentTime + delay, s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; fl.type = type; fl.frequency.setValueAtTime(f, t);
    if (sweep) fl.frequency.linearRampToValueAtTime(Math.max(40, f + sweep), t + dur);
    fl.Q.value = q; env(g, t, Math.min(0.01, dur / 3), dur, vol(v));
    s.connect(fl); fl.connect(g); g.connect(master); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  function bell(f, v, delay = 0, dur = 0.9) { tone(f, dur, v, 'sine', delay); tone(f * 2.01, dur * 0.5, v * 0.25, 'sine', delay); }

  /* ---------- recorded meows, if any were added ---------- */
  async function loadSamples() {
    try {
      const r = await fetch('sounds/sounds.json', { cache: 'no-store' });
      if (!r.ok) return;
      const map = await r.json();
      for (const kind in map) {
        samples[kind] = [];
        for (const f of map[kind]) {
          try { const b = await (await fetch('sounds/' + f)).arrayBuffer(); samples[kind].push(await ctx.decodeAudioData(b)); } catch (e) { /* skip that file */ }
        }
      }
    } catch (e) { /* no recordings: synthesised meows */ }
  }
  function playSample(kind, v) {
    const list = samples[kind] || (kind !== 'meow' && samples.meow);
    if (!list || !list.length) return false;
    const s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = list[Math.floor(Math.random() * list.length)];
    s.playbackRate.value = 0.95 + Math.random() * 0.12;
    g.gain.value = vol(0.9 * v);
    s.connect(g); g.connect(master); s.start();
    return true;
  }

  /* ---------- a kitten's meow: a buzzy voice through two moving "mouth" formants ---------- */
  const VOICES = {
    mew:   { d: 0.3,  f: 1000, up: 1.22, end: 0.78, f1: [850, 1250, 760], f2: [2100, 3000, 1700] },
    meow:  { d: 0.58, f: 760,  up: 1.3,  end: 0.7,  f1: [700, 1150, 620], f2: [1800, 2800, 1400] },
    long:  { d: 0.95, f: 640,  up: 1.22, end: 0.66, f1: [650, 1100, 560], f2: [1700, 2700, 1300] },
    chirp: { d: 0.15, f: 1100, up: 1.4,  end: 1.3,  f1: [900, 1300, 1200], f2: [2400, 3200, 3000] },
    low:   { d: 0.45, f: 430,  up: 1.08, end: 0.8,  f1: [500, 750, 480], f2: [1400, 1900, 1200] },
    happy: { d: 0.22, f: 940,  up: 1.35, end: 1.0,  f1: [850, 1300, 1000], f2: [2200, 3100, 2500] },
    trill: { d: 0.45, f: 820,  up: 1.25, end: 1.1,  f1: [700, 1000, 900], f2: [1900, 2500, 2300], trill: true },
    yawn:  { d: 0.8,  f: 520,  up: 1.4,  end: 0.5,  f1: [600, 1200, 400], f2: [1500, 2600, 1000], breath: true }
  };
  function voice(kind, v) {
    const p = VOICES[kind] || VOICES.meow;
    let kitten = 1;
    try { if (typeof ageDays === 'function') kitten = ageDays() < 3 ? 1.15 : ageDays() < 9 ? 1.07 : 1; } catch (e) { /* */ }
    const t = ctx.currentTime, dur = p.d * (0.9 + Math.random() * 0.2), f0 = p.f * kitten * (0.94 + Math.random() * 0.12);
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(f0 * 0.9, t);
    o.frequency.linearRampToValueAtTime(f0 * p.up, t + dur * 0.3);
    o.frequency.linearRampToValueAtTime(f0 * p.end, t + dur);
    const vib = ctx.createOscillator(), vg = ctx.createGain(); vib.frequency.value = 6 + Math.random() * 2; vg.gain.value = f0 * 0.015; vib.connect(vg); vg.connect(o.frequency);
    const mk = (fr, q, gain) => {
      const b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.Q.value = q;
      b.frequency.setValueAtTime(fr[0], t); b.frequency.linearRampToValueAtTime(fr[1], t + dur * 0.32); b.frequency.linearRampToValueAtTime(fr[2], t + dur);
      const g = ctx.createGain(); g.gain.value = gain; o.connect(b); b.connect(g); return g;
    };
    const out = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200;
    mk(p.f1, 5, 1).connect(out); mk(p.f2, 7, 0.55).connect(out);
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(vol(0.42 * v), t + Math.min(0.05, dur * 0.2));
    amp.gain.setValueAtTime(vol(0.42 * v), t + dur * 0.6);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let trem = null;
    if (p.trill) { trem = ctx.createOscillator(); const tg = ctx.createGain(); trem.frequency.value = 26; tg.gain.value = 0.35; trem.connect(tg); tg.connect(amp.gain); trem.start(t); trem.stop(t + dur + 0.05); }
    out.connect(lp); lp.connect(amp); amp.connect(master);
    o.start(t); vib.start(t); o.stop(t + dur + 0.05); vib.stop(t + dur + 0.05);
    if (p.breath) noise(dur * 0.9, 1800, 0.7, 0.05 * v, 'bandpass', 0.05, -900);
  }
  Snd.meow = function (kind = 'meow', v = 1) {
    init();
    if (!ok()) return;
    if (playSample(kind, v)) return;
    voice(kind, v);
  };

  /* ---------- effects ---------- */
  Object.assign(Snd, {
    pop() { const f = 520 + Math.random() * 260; tone(f, 0.07, 0.13, 'sine', 0, f * 2.1); },
    sparkle() { [2093, 2637, 3136].forEach((f, i) => tone(f, 0.18, 0.05, 'triangle', i * 0.06)); },
    chime() { bell(1568, 0.09); bell(2349, 0.07, 0.12); },
    fanfare() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 0.09, 'triangle', i * 0.11)); [523, 659, 784].forEach(f => tone(f, 0.7, 0.05, 'triangle', 0.5)); bell(2093, 0.05, 0.5, 1.2); },
    stamp() { tone(150, 0.14, 0.32, 'sine', 0, 60); noise(0.06, 700, 1, 0.18, 'lowpass'); bell(1760, 0.06, 0.12); },
    shutter() { noise(0.025, 6000, 1, 0.28, 'highpass'); noise(0.05, 2200, 2, 0.2, 'bandpass', 0.07); tone(3000, 0.03, 0.04, 'square', 0.07); },
    splash() { noise(0.35, 900, 0.8, 0.32, 'lowpass', 0, -500); for (let i = 0; i < 5; i++) { const f = 400 + Math.random() * 500; tone(f, 0.06, 0.06, 'sine', 0.08 + i * 0.05 + Math.random() * 0.03, f * 1.8); } },
    rub() { noise(0.16, 1300 + Math.random() * 400, 0.9, 0.08, 'bandpass', 0, 300); },
    heart() { tone(78, 0.09, 0.4, 'sine', 0, 55); tone(70, 0.1, 0.32, 'sine', 0.16, 50); },
    gulp() { tone(420, 0.12, 0.18, 'sine', 0, 180); noise(0.05, 900, 2, 0.08, 'bandpass', 0.05); },
    hammer() { tone(950, 0.05, 0.14, 'sine', 0, 700); noise(0.04, 1600, 2, 0.12, 'bandpass'); },
    tap() { tone(1400, 0.035, 0.06, 'sine', 0, 1100); },
    shower(on) {
      init();
      if (on && ok() && !shower) {
        const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
        s.buffer = noiseBuf; s.loop = true; f.type = 'bandpass'; f.frequency.value = 3800; f.Q.value = 0.6;
        g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(vol(0.12), ctx.currentTime + 0.15);
        s.connect(f); f.connect(g); g.connect(master); s.start(); shower = { s, g };
      } else if (!on && shower) {
        const sh = shower; shower = null;
        try { sh.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.08); sh.s.stop(ctx.currentTime + 0.4); } catch (e) { /* */ }
      }
    }
  });

  // yawns are heard now
  try {
    const baseYawn = yawn;
    yawn = function* () { if (!cat.asleep && Math.random() < 0.7) Snd.meow('yawn', 0.5); yield* baseYawn(); };
  } catch (e) { /* older build */ }

  /* ================= more sounds: everyday cat life ================= */
  const R = (a, b) => a + Math.random() * (b - a);
  Object.assign(Snd, {
    // pouring kibble: a cascade of little pellets into the bowl, then a rattle as it settles
    pour() {
      tone(1050, 0.5, 0.03, 'sine', 0.05);                                   // the bowl rings softly
      for (let i = 0; i < 30; i++) { const t = Math.pow(i / 30, 1.3) * 0.85; noise(0.025, R(2200, 4200), 5, R(0.08, 0.16), 'bandpass', t); }
    },
    kibble() { for (let i = 0; i < 8; i++) noise(0.03, R(2000, 3600), 5, R(0.06, 0.12), 'bandpass', i * 0.05 + R(0, 0.03)); },
    // eating: crunchy bites
    munch() { noise(0.045, R(2600, 3600), 2.2, 0.26); noise(0.035, R(1800, 2400), 2, 0.18, 'bandpass', 0.055); tone(R(160, 200), 0.05, 0.08, 'sine', 0.01, 90); },
    nom() { tone(R(380, 440), 0.09, 0.05, 'sine', 0, 300); tone(R(380, 440), 0.09, 0.05, 'sine', 0.13, 300); },
    // drinking: little wet laps
    lap() { noise(0.05, R(2600, 3400), 3, 0.12, 'bandpass', 0, -1200); tone(R(900, 1200), 0.04, 0.035, 'sine', 0.02, 600); },
    lick() { noise(0.07, R(3800, 4600), 1.6, 0.07, 'highpass'); },
    // the litter box
    sand() { for (let i = 0; i < 4; i++) noise(0.07, R(1500, 2600), 0.9, 0.13, 'highpass', i * 0.11 + R(0, 0.03)); },
    strain() { Snd.meow('low', 0.35); },
    plop() { tone(330, 0.16, 0.22, 'sine', 0, 110); tone(620, 0.06, 0.05, 'sine', 0.02, 300); noise(0.05, 500, 1, 0.08, 'lowpass', 0.03); },
    toot() { tone(170, 0.18, 0.12, 'square', 0, 120); noise(0.15, 300, 2, 0.05, 'lowpass'); },
    scoop() { noise(0.12, 900, 1.2, 0.24, 'bandpass', 0, 1600); noise(0.1, 2600, 2, 0.1, 'bandpass', 0.13); bell(2349, 0.03, 0.22, 0.4); },
    // moving around
    whoosh() { noise(0.18, 900, 0.8, 0.07, 'bandpass', 0, 1400); },
    thump() { tone(R(105, 125), 0.11, 0.22, 'sine', 0, 55); noise(0.04, 400, 1, 0.05, 'lowpass'); },
    patter() { noise(0.02, R(700, 1100), 1.5, 0.045, 'bandpass'); },
    scratch() { noise(0.09, R(2600, 3200), 1.3, 0.2, 'bandpass', 0, -900); noise(0.06, 4200, 1, 0.06, 'highpass', 0.04); },
    swat() { noise(0.09, 1500, 1, 0.18, 'bandpass', 0, 1800); },
    swish() { noise(0.14, 1800, 0.7, 0.06, 'bandpass', 0, 1600); },
    // body sounds
    sneeze() { noise(0.05, 2500, 1, 0.05, 'highpass'); tone(900, 0.12, 0.08, 'triangle', 0.08, 560); noise(0.16, 3600, 0.8, 0.18, 'highpass', 0.08); },
    hack() { for (let i = 0; i < 3; i++) { noise(0.12, 300, 1.4, 0.22, 'lowpass', i * 0.22, 140); tone(200, 0.08, 0.05, 'sawtooth', i * 0.22, 140); } },
    breath(out) { noise(out ? 0.9 : 0.7, out ? 700 : 1000, 0.6, 0.018, 'bandpass', 0, out ? -300 : 300); },
    snore() { tone(95, 0.5, 0.03, 'sawtooth', 0, 80); noise(0.5, 400, 1, 0.015, 'lowpass'); },
    // affection
    heartPop() { const f = R(1500, 1900); tone(f, 0.08, 0.035, 'sine', 0, f * 1.3); },
    // things breaking (mischief)
    crash() { noise(0.4, 3500, 0.7, 0.24, 'highpass'); tone(130, 0.2, 0.22, 'sine', 0, 55); for (let i = 0; i < 6; i++) tone(R(2500, 5000), 0.12, 0.03, 'triangle', R(0.02, 0.3)); },
    crashSoft() { tone(150, 0.18, 0.24, 'sine', 0, 60); noise(0.3, 900, 0.8, 0.16, 'lowpass', 0.02); for (let i = 0; i < 5; i++) noise(0.03, R(1500, 3000), 3, 0.05, 'bandpass', R(0.1, 0.4)); },
    rip() { noise(0.45, 2600, 0.7, 0.22, 'bandpass', 0, 2200); },
    puff() { noise(0.2, 600, 0.6, 0.18, 'lowpass', 0, -300); },
    tapTap() { for (let i = 0; i < 3; i++) tone(R(1300, 1600), 0.03, 0.06, 'sine', i * 0.12); },
    fwip() { noise(0.22, 1200, 0.6, 0.14, 'bandpass', 0, -800); tone(140, 0.1, 0.1, 'sine', 0.18, 70); },
    // presents, UI, ambience
    present() { [1568, 1976, 2349].forEach((f, i) => bell(f, 0.05, i * 0.09, 0.6)); },
    bird() { const b = R(2600, 3400); tone(b, 0.07, 0.025, 'sine', 0, b * 1.3); tone(b * 1.1, 0.08, 0.02, 'sine', 0.1, b * 1.4); if (Math.random() < 0.5) tone(b * 0.95, 0.09, 0.02, 'sine', 0.24, b * 1.25); },
    cricket() { for (let i = 0; i < 3; i++) tone(4300, 0.03, 0.012, 'sine', i * 0.06); }
  });

  // pouring kibble used to be silent until the last pellet landed
  try { const basePour = pourKibble; pourKibble = function () { const r = basePour.apply(this, arguments); Snd.pour(); return r; }; } catch (e) { /* */ }
  // a little bell for every heart that floats up
  try { const baseHearts = burstHearts; burstHearts = function (x, y, n) { baseHearts(x, y, n); Snd.heartPop(); }; } catch (e) { /* */ }
  // a whoosh when jumping (the landing thump is already in the game)
  try { const baseHop = hop; hop = function* () { if (Math.random() < 0.8) setTimeout(() => Snd.whoosh(), 200); yield* baseHop.apply(this, arguments); }; } catch (e) { /* */ }
  // a soft tap for every button in the dock
  document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#panel button, #menu button, .xbox button, #adopt button')) Snd.tap(); }, true);
  document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#adBtn')) setTimeout(() => Snd.meow('happy', 0.8), 300); }, true);

  /* ---------- what the cat is doing, heard ---------- */
  let lastLabel = '', lastPose = '', labelAt = 0, nextSleepT = 0, nextPetT = 0, nextEatT = 0, nextAmb = 0, lastPresent = null, patT = 0, breathOut = false, lastHidden = 0;
  setInterval(() => {
    if (!ctx || ctx.state !== 'running' || !Snd.on || typeof cat === 'undefined' || !cat.visible) return;
    if (window.__bathOpen) return;
    const now = performance.now(), label = cat.label || '', pose = cat.poseName || '';
    if (label !== lastLabel) {
      labelAt = now;
      if (label === 'pet') setTimeout(() => { if (cat.label === 'pet') Snd.meow(Math.random() < 0.5 ? 'trill' : 'happy', 0.55); }, 350);
      if (label === 'eat') nextEatT = now + 900;
      if (label === 'churu') setTimeout(() => Snd.meow('happy', 0.6), 300);
      if (label === 'toilet' || label === 'poop') nextAmb = Math.max(nextAmb, now + 4000);
      if (label === 'greet' || label === 'callUser') setTimeout(() => Snd.meow('meow', 0.6), 200);
      lastLabel = label;
    }
    if (pose !== lastPose) {
      if (pose === 'poop') { Snd.strain(); setTimeout(() => { if (Math.random() < 0.25) Snd.toot(); }, 1200); }
      lastPose = pose;
    }
    // petting: purr is the game's; add a happy chirp now and then
    if (label === 'pet' && now > nextPetT) { nextPetT = now + R(4500, 8000); if (now - labelAt > 2000) Snd.meow(Math.random() < 0.6 ? 'trill' : 'mew', 0.35); }
    // eating: "nom nom" between the crunches
    if (label === 'eat' && now > nextEatT) { nextEatT = now + R(1800, 3200); Snd.nom(); }
    // sleeping: soft breathing, sometimes a tiny snore
    if (cat.asleep && now > nextSleepT) { breathOut = !breathOut; nextSleepT = now + (breathOut ? 1300 : 1700); if (Math.random() < 0.12) Snd.snore(); else Snd.breath(breathOut); }
    // running: little paws
    if (cat.moving && cat.speed > 45 && cat.z === 0 && now > patT) { patT = now + Math.max(70, 9000 / cat.speed); Snd.patter(); }
    // a present arrives
    if (Room.present && Room.present !== lastPresent) Snd.present();
    lastPresent = Room.present;
    // the wand swishes when moved fast
    try { if (Interact.mode === 'wand' && Math.hypot(Desk.cursor.vx || 0, Desk.cursor.vy || 0) > 250 && Math.random() < 0.25) Snd.swish(); } catch (e) { /* */ }
    // brushing
    try { if (Interact.mode === 'brush' && label === 'pet' && Math.random() < 0.08) Snd.rub(); } catch (e) { /* */ }
    // ambience outside the window: birds on fine mornings, crickets on summer/autumn nights, rain
    if (now > nextAmb) {
      nextAmb = now + R(9000, 22000);
      try {
        const h = window.__room ? window.__room.hourNow() : new Date().getHours();
        const w = window.__extrasDev ? window.__extrasDev.weatherNow() : 'clear';
        const m = new Date().getMonth();
        if ((w === 'clear' || w === 'petal') && h >= 6 && h < 11) Snd.bird();
        else if ((h >= 21 || h < 4) && m >= 5 && m <= 9 && w !== 'rain') Snd.cricket();
      } catch (e) { /* */ }
    }
  }, 100);
  // rain is a quiet loop while it rains outside
  let rain = null;
  setInterval(() => {
    let raining = false;
    try { raining = !!(window.__extrasDev && window.__extrasDev.weatherNow() === 'rain') && document.visibilityState === 'visible' && !window.__bathOpen; } catch (e) { raining = false; }
    if (raining && ok() && !rain) {
      const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = noiseBuf; s.loop = true; f.type = 'lowpass'; f.frequency.value = 1400;
      g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(vol(0.035), ctx.currentTime + 2);
      s.connect(f); f.connect(g); g.connect(master); s.start(); rain = { s, g };
    } else if ((!raining || !Snd.on) && rain) {
      const r = rain; rain = null;
      try { r.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.5); r.s.stop(ctx.currentTime + 3); } catch (e) { /* */ }
    }
  }, 2000);
  // coming back after a while: the cat says hello
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') lastHidden = Date.now();
    else if (lastHidden && Date.now() - lastHidden > 10 * 60000) setTimeout(() => { try { if (cat.visible && !cat.asleep) Snd.meow('trill', 0.7); } catch (e) { /* */ } }, 1200);
  });
})();
