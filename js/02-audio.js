/* ============ tiny synth: meows, purr, munch ============ */
const Snd = (() => {
  let ctx = null, master = null, on = store.get('sound', true), purr = null, noiseBuf = null, quiet = false;

  function init() {
    if (ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
      const len = ctx.sampleRate * 1;
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { ctx = null; }
  }
  function wake() {
    init();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }
  const ok = () => ctx && on && ctx.state === 'running';

  function env(g, t0, a, d, peak) {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
  }
  function noise(dur, freq, q, vol, type = 'bandpass', delay = 0, sweep = 0) {
    if (!ok()) return;
    const t = ctx.currentTime + delay;
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (sweep) f.frequency.linearRampToValueAtTime(freq + sweep, t + dur);
    f.Q.value = q;
    const g = ctx.createGain();
    env(g, t, Math.min(0.01, dur / 3), dur, vol);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t, Math.random() * 0.5);
    s.stop(t + dur + 0.05);
  }
  function tone(freq, dur, vol, type = 'sine', delay = 0, slideTo = 0) {
    if (!ok()) return;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    const g = ctx.createGain();
    env(g, t, Math.min(0.012, dur / 3), dur, vol);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  const MEOWS = {
    mew:  { d: 0.34, f: 780, r: 1.2 },
    meow: { d: 0.62, f: 560, r: 1.28 },
    long: { d: 1.05, f: 470, r: 1.16 },
    chirp: { d: 0.16, f: 900, r: 1.35 },
    low:  { d: 0.5, f: 330, r: 1.1 }
  };
  function meow(kind = 'meow', vol = 1) {
    if (!ok()) return;
    if (quiet) vol *= 0.25;
    const p = MEOWS[kind] || MEOWS.meow;
    const t = ctx.currentTime;
    const dur = p.d * (0.9 + Math.random() * 0.22);
    const f0 = p.f * (0.92 + Math.random() * 0.18);
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f0 * 0.82, t);
    o.frequency.linearRampToValueAtTime(f0 * p.r, t + dur * 0.32);
    o.frequency.linearRampToValueAtTime(f0 * 0.7, t + dur);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.Q.value = 3.2;
    bp.frequency.setValueAtTime(720, t);
    bp.frequency.linearRampToValueAtTime(1750, t + dur * 0.36);
    bp.frequency.linearRampToValueAtTime(820, t + dur);
    const g = ctx.createGain();
    env(g, t, dur * 0.16, dur * 0.84, 0.3 * vol);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 5.5 + Math.random() * 3;
    const lg = ctx.createGain();
    lg.gain.value = f0 * 0.018;
    lfo.connect(lg); lg.connect(o.frequency);
    o.connect(bp); bp.connect(g); g.connect(master);
    o.start(t); lfo.start(t);
    o.stop(t + dur + 0.06); lfo.stop(t + dur + 0.06);
  }

  function startPurr() {
    if (purr || !ctx) return;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf; src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'bandpass'; lp.frequency.value = 110; lp.Q.value = 0.9;
    const am = ctx.createGain();
    am.gain.value = 0.5;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 24;
    const lg = ctx.createGain();
    lg.gain.value = 0.5;
    lfo.connect(lg); lg.connect(am.gain);
    const out = ctx.createGain();
    out.gain.value = 0;
    src.connect(lp); lp.connect(am); am.connect(out); out.connect(master);
    src.start(); lfo.start();
    purr = { out, lfo };
  }
  function setPurr(level) {
    if (!ctx) return;
    if (!on || ctx.state !== 'running') level = 0;
    if (level > 0.01 && !purr) startPurr();
    if (purr) {
      purr.out.gain.setTargetAtTime(level * 0.9, ctx.currentTime, 0.18);
      purr.lfo.frequency.setTargetAtTime(22 + level * 5, ctx.currentTime, 0.4);
    }
  }

  return {
    wake,
    get on() { return on; },
    set quiet(v) { quiet = !!v; },
    setOn(v) { on = v; store.set('sound', v); if (!v) setPurr(0); },
    meow, setPurr,
    munch() { noise(0.05, 2400 + Math.random() * 600, 2.5, 0.35); noise(0.04, 1800, 2, 0.2, 'bandpass', 0.06); },
    lap() { noise(0.06, 3200, 3, 0.16, 'bandpass', 0, -1200); },
    lick() { noise(0.09, 4200, 2, 0.1, 'highpass'); },
    plop() { tone(220, 0.16, 0.3, 'sine', 0, 70); noise(0.06, 500, 1, 0.12, 'lowpass'); },
    scoop() { noise(0.12, 900, 1.2, 0.3, 'bandpass', 0, 1800); noise(0.1, 2600, 2, 0.15, 'bandpass', 0.13); },
    scratch() { noise(0.1, 2800, 1.4, 0.22, 'bandpass', 0, -900); },
    sand() { noise(0.12, 1800, 0.8, 0.2, 'highpass'); },
    kibble() { for (let i = 0; i < 7; i++) noise(0.04, 2200 + Math.random() * 1500, 4, 0.16, 'bandpass', i * 0.045 + Math.random() * 0.03); },
    thump() { tone(120, 0.12, 0.28, 'sine', 0, 55); },
    hiss() { noise(0.45, 5200, 0.6, 0.3, 'highpass'); },
    chatter() { for (let i = 0; i < 5; i++) tone(2400 + Math.random() * 500, 0.04, 0.07, 'square', i * 0.07); },
    chirp() { const b = 2600 + Math.random() * 600; tone(b, 0.07, 0.07, 'sine', 0, b * 1.3); tone(b * 1.1, 0.08, 0.06, 'sine', 0.1, b * 1.4); },
    hack() { noise(0.28, 260, 1.5, 0.35, 'lowpass', 0, 120); },
    pop() { tone(520, 0.08, 0.12, 'sine', 0, 880); },
    sparkle() { tone(1200, 0.1, 0.07, 'triangle'); tone(1700, 0.12, 0.06, 'triangle', 0.07); },
    sneeze() { noise(0.2, 3600, 0.8, 0.25, 'highpass'); },
    swat() { noise(0.1, 1500, 1, 0.22, 'bandpass', 0, 1500); },
    jingle() { tone(2600, 0.12, 0.12, 'triangle'); tone(3300, 0.1, 0.1, 'triangle', 0.06); tone(2900, 0.1, 0.08, 'triangle', 0.12); },
    crinkle() { for (let i = 0; i < 4; i++) noise(0.04, 3000 + Math.random() * 2500, 1.5, 0.18, 'highpass', i * 0.04); },
    squeak() { tone(900, 0.14, 0.18, 'square', 0, 1500); },
    tick() { tone(1800, 0.03, 0.12, 'sine'); },
    thud() { tone(140, 0.1, 0.2, 'sine', 0, 60); },
    boing() { tone(300, 0.18, 0.18, 'sine', 0, 700); }
  };
})();
