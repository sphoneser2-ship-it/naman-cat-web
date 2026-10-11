/* ============ the cat's own life: personality, growing up, time of day, quiet mode ============ */

/* ---------- personality: every cat gets its own random character from its seed ---------- */
const TRAIT_LABEL = { curious: '호기심 많은', play: '장난꾸러기', lazy: '느긋한', social: '애교 많은', shy: '겁 많은', mischief: '말썽쟁이' };
const TRAIT_KEYS = Object.keys(TRAIT_LABEL);
function personalityFor(seed) {
  const r = mulberry32(((seed >>> 0) ^ 0x5bd1e995) >>> 0);
  r(); r(); r();
  const u = () => 0.12 + r() * 0.78;
  const lazy = u();
  return {
    curious: u(),
    play: clamp(0.92 - lazy * 0.55 + (r() - 0.5) * 0.35, 0.12, 0.92),
    lazy, social: u(), shy: u(), mischief: u()
  };
}
function personalityText(b) {
  if (!b) return '';
  const sorted = TRAIT_KEYS.map(k => [k, b[k]]).sort((a, c) => c[1] - a[1]);
  const a = sorted[0], c = sorted[1];
  // the weakest trait can be a trait of its own ("겁이 없는" ...)
  const low = sorted[sorted.length - 1];
  const bits = [TRAIT_LABEL[a[0]], TRAIT_LABEL[c[0]]];
  if (low[0] === 'shy' && low[1] < 0.28) bits[1] = '겁 없는';
  if (low[0] === 'lazy' && low[1] < 0.28) bits[1] = '에너자이저';
  return bits.join(' · ');
}
// how lively this cat is overall (0.75 = couch cat ... 1.25 = bouncy)
function activity() {
  const t = cat.traits;
  return 0.75 + 0.5 * clamp((t.play - t.lazy + 1) / 2, 0, 1);
}

/* ---------- growing up ---------- */
const ageDays = () => Math.max(0, (Date.now() - cat.born) / 86400000);
const growthT = () => clamp(ageDays() / 9, 0, 1);
function updateGrowth() {
  const g = growthT();
  cat.kb = 0.72 + 0.28 * g;           // body size
  cat.kh = 0.84 + 0.16 * g;           // head size (a kitten's head is big for its body)
  if (cat.K) { cat.K.kb = cat.kb; cat.K.kh = cat.kh; cat.K.outfit = cat.outfit; }
}
function ageLabel() {
  const d = ageDays();
  if (d < 1) return '아기 · 오늘 왔어요';
  if (d < 3) return '아기 고양이 · 생후 ' + Math.floor(d) + '일';
  if (d < 9) return '청소년 · 생후 ' + Math.floor(d) + '일';
  if (d < 60) return '생후 ' + Math.floor(d) + '일';
  return '생후 ' + Math.floor(d / 30) + '개월';
}

/* ---------- time of day (real clock) ---------- */
function hourNow() { const d = new Date(); return d.getHours() + d.getMinutes() / 60; }
const isDeepNight = () => { const h = hourNow(); return h < 6 || h >= 23.5; };
function lifeSleepScale() {
  let s = isDeepNight() ? 2.2 : 1;
  if (ageDays() < 3) s *= 0.8;
  return s;
}
function isQuiet() { return !!(typeof Prefs !== 'undefined' && Prefs.quiet); }

/* ---------- everything above reshapes what the cat decides to do ---------- */
function applyLifeWeights(w) {
  const tr = cat.traits, h = hourNow(), d = ageDays(), n = cat.needs;
  applyMotionWeights(w);
  applyReactionWeights(w);
  applyMonitorWeights(w);
  applyFurnWeights(w);
  const act = activity();
  for (const k of ['wander', 'zoom', 'tailChase', 'hunt', 'follow', 'punchIcon', 'knock', 'airHunt', 'scratch', 'perch', 'ball']) if (w[k]) w[k] *= act;
  for (const k of ['loaf', 'idleSit', 'nap', 'sunbathe']) if (w[k]) w[k] /= act;

  if (d < 3) {                                       // baby: bursts of play between naps
    cat.zoomCooldown = Math.min(cat.zoomCooldown, 70);
    w.zoom = (w.zoom || 0) * 2.8; w.tailChase = (w.tailChase || 0) * 2; w.wander *= 1.3; w.ball = (w.ball || 0) * 1.4; w.nap *= 1.5; w.airHunt *= 1.5;
  } else if (d < 9) {
    w.zoom = (w.zoom || 0) * 1.7; w.tailChase = (w.tailChase || 0) * 1.4; w.wander *= 1.15;
  } else if (d > 120) {                              // old and wise
    w.loaf *= 1.3; w.zoom = (w.zoom || 0) * 0.5; w.nap *= 1.2; w.tailChase = 0;
  }

  if (h < 6 || h >= 23.5) {                          // night: the cat sleeps
    w.nap = ((w.nap || 0) + 2.5) * (n.energy > 92 ? 0.25 : 1);
    w.loaf *= 2; w.zoom = (w.zoom || 0) * 0.5; w.wander *= 0.5; w.idleStand *= 0.4; w.follow = (w.follow || 0) * 0.5;
  } else if (h < 8.5) {                              // morning stretch, empty tummy
    w.stretch *= 3; w.eat = (w.eat || 0) * 1.3; w.checkBowl *= 1.5;
  } else if (h >= 12 && h < 15) {                    // after lunch: warm spot, siesta
    w.sunbathe = (w.sunbathe || 0) * 2.5; w.loaf *= 1.3; w.nap = (w.nap || 0) * 1.3;
  } else if (h >= 17.5 && h < 22) {                  // evening zoomies
    w.zoom = (w.zoom || 0) * 2; w.hunt = (w.hunt || 0) * 1.3; w.wander *= 1.2;
  }

  if (isHunt(Room.ball)) { w.mouse = w.ball || 0; w.ball = 0; }
  if (isQuiet()) {                                   // "do not disturb": calm and quiet
    for (const k of ['zoom', 'tailChase', 'yowl', 'pester', 'callUser', 'airHunt', 'punchIcon', 'hunt', 'knock', 'ghost', 'sneeze', 'peek', 'rub']) w[k] = 0;
    w.loaf *= 2.5; w.nap = (w.nap || 0) * 1.6; w.idleSit *= 1.5; w.groom *= 1.3;
  }
}
