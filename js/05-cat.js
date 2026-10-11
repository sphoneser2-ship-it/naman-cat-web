/* ============ the cat: poses, animation engine, locomotion ============ */
const BASE = {
  hx: -11, hy: 14, hr: 9, cx: 7, cy: 14, cr: 9, arch: 0,
  hdx: 17, hdy: 25, pitch: 0, yaw: 0.6,
  tAng: 140, tCurl: -9, tWave: 8, tSpd: 2.2, trx: -8, try: 4,
  fNx: 10, fNy: 0, fFx: 3, fFy: 0, hNx: -8, hNy: 0, hFx: -15, hFy: 0, thigh: 7,
  tailFront: 0, bellyUp: 0, puff: 0, fl: 0, hl: 0
};
const mk = o => Object.assign({}, BASE, o);
const POSES = {
  stand: mk({}),
  sit: mk({ hx: -10, hy: 11, hr: 10, cx: 3, cy: 24, cr: 8, hdx: 7, hdy: 40, yaw: 0.4, tAng: 195, tCurl: -9, tWave: 6, trx: -9, try: -2, fNx: 8, fFx: 1, hNx: 6, hFx: -3, thigh: 9 }),
  loaf: mk({ hx: -10, hy: 11, hr: 11, cx: 6, cy: 11, cr: 11, hdx: 14, hdy: 25, yaw: 0.6, tAng: 188, tCurl: -9, tWave: 3, trx: -9, try: -6, fNx: 14, fNy: 2, fFx: 9, fFy: 2, hNx: -4, hNy: 2, hFx: -8, hFy: 2, thigh: 8 }),
  sphinx: mk({ hx: -11, hy: 10, hr: 10, cx: 6, cy: 13, cr: 9, hdx: 20, hdy: 28, yaw: 0.6, tAng: 190, tCurl: -10, tWave: 4, trx: -9, try: -3, fNx: 27, fFx: 21, hNx: -6, hFx: -10, thigh: 7 }),
  curl: mk({ hx: -10, hy: 11, hr: 11, cx: 6, cy: 11, cr: 10, hdx: 12, hdy: 13, pitch: -0.8, yaw: 0.5, tAng: 4, tCurl: 4, tWave: 2, tSpd: 1.4, trx: -6, try: -6, fNx: 14, fFx: 9, hNx: -2, hFx: -6, thigh: 8, tailFront: 1 }),
  lieSide: mk({ hx: -12, hy: 8, hr: 8, cx: 9, cy: 8, cr: 8, hdx: 24, hdy: 13, pitch: -0.2, yaw: 0.7, tAng: 185, tCurl: -6, tWave: 4, trx: -9, try: -2, fNx: 29, fFx: 22, hNx: 0, hFx: -6, thigh: 6.5 }),
  bellyUp: mk({ hx: -11, hy: 10, hr: 9, cx: 8, cy: 10, cr: 9, hdx: 22, hdy: 12, pitch: -0.3, yaw: 0.2, tAng: 190, tCurl: -6, tWave: 5, trx: -9, try: -2, fNx: 16, fNy: 30, fFx: 9, fFy: 32, hNx: -8, hNy: 28, hFx: -15, hFy: 30, thigh: 7, bellyUp: 1 }),
  buttUp: mk({ hx: -13, hy: 25, hr: 9, cx: 9, cy: 13, cr: 8, hdx: 24, hdy: 17, pitch: -0.3, yaw: 0.4, tAng: 92, tCurl: -3, tWave: 7, tSpd: 9, trx: -9, try: 5, fNx: 25, fFx: 18, hNx: -12, hFx: -18, thigh: 8 }),
  bow: mk({ hx: -17, hy: 26, hr: 9, cx: 11, cy: 12, cr: 8, hdx: 27, hdy: 15, pitch: -0.5, yaw: 0.6, tAng: 95, tCurl: -4, trx: -9, try: 4, fNx: 32, fFx: 26, hNx: -16, hFx: -22, thigh: 7 }),
  crouch: mk({ hx: -15, hy: 14, hr: 9, cx: 8, cy: 12, cr: 8, hdx: 21, hdy: 18, pitch: -0.3, yaw: 0.8, tAng: 185, tCurl: 3, tWave: 6, tSpd: 4, trx: -9, try: 0, fNx: 19, fFx: 13, hNx: -13, hFx: -19, thigh: 8 }),
  pounce: mk({ hx: -16, hy: 22, hr: 8, cx: 12, cy: 26, cr: 8, hdx: 28, hdy: 32, pitch: -0.2, yaw: 0.8, tAng: 175, tCurl: -3, trx: -9, try: 0, fNx: 36, fNy: 22, fFx: 31, fFy: 26, hNx: -28, hNy: 12, hFx: -23, hFy: 8, thigh: 7 }),
  scratch: mk({ fl: 1, hx: -8, hy: 14, hr: 9, cx: 3, cy: 30, cr: 8, hdx: 10, hdy: 43, pitch: 0.3, yaw: 0.7, tAng: 200, tCurl: -5, trx: -9, try: 0, fNx: 17, fNy: 46, fFx: 11, fFy: 50, hNx: -4, hFx: -12, thigh: 9 }),
  eat: mk({ hx: -12, hy: 22, hr: 9, cx: 8, cy: 19, cr: 9, hdx: 26, hdy: 16, pitch: -1, yaw: 0.7, tAng: 135, tCurl: -6, fNx: 16, fFx: 8, hNx: -12, hFx: -20 }),
  drink: mk({ hx: -12, hy: 21, hr: 9, cx: 8, cy: 18, cr: 9, hdx: 27, hdy: 13, pitch: -1, yaw: 0.7, tAng: 140, tCurl: -6, fNx: 16, fFx: 8, hNx: -12, hFx: -20 }),
  sniff: mk({ hx: -11, hy: 20, hr: 9, cx: 7, cy: 18, cr: 9, hdx: 26, hdy: 21, pitch: -0.7, yaw: 0.7, tAng: 135, tCurl: -7, fNx: 13, fFx: 6, hNx: -10, hFx: -17 }),
  poop: mk({ hx: -14, hy: 11, hr: 10, cx: 8, cy: 20, cr: 8, hdx: 21, hdy: 29, pitch: -0.2, yaw: 0.5, tAng: 100, tCurl: -2, tWave: 2, trx: -10, try: 4, fNx: 12, fFx: 5, hNx: -12, hFx: -19, thigh: 9 }),
  groomPaw: mk({ fl: 1, hx: -10, hy: 11, hr: 10, cx: 3, cy: 24, cr: 8, hdx: 9, hdy: 40, pitch: -0.1, yaw: 0.2, tAng: 195, tCurl: -9, tWave: 3, trx: -9, try: -2, fNx: 18, fNy: 33, fFx: 1, hNx: 6, hFx: -3, thigh: 9 }),
  groomLeg: mk({ hl: 1, hx: -10, hy: 11, hr: 10, cx: 3, cy: 22, cr: 8, hdx: 1, hdy: 30, pitch: -0.7, yaw: 0.5, tAng: 195, tCurl: -9, tWave: 3, trx: -9, try: -2, fNx: 8, fFx: 1, hNx: 11, hNy: 30, hFx: -3, thigh: 9 }),
  groomChest: mk({ hx: -10, hy: 11, hr: 10, cx: 3, cy: 24, cr: 8, hdx: 10, hdy: 32, pitch: -0.9, yaw: 0.4, tAng: 195, tCurl: -9, tWave: 3, trx: -9, try: -2, fNx: 8, fFx: 1, hNx: 6, hFx: -3, thigh: 9 }),
  lookUp: mk({ hx: -10, hy: 11, hr: 10, cx: 3, cy: 24, cr: 8, hdx: 9, hdy: 41, pitch: 1, yaw: 0.6, tAng: 195, tCurl: -9, trx: -9, try: -2, fNx: 8, fFx: 1, hNx: 6, hFx: -3, thigh: 9 }),
  run: mk({ hx: -11, hy: 16, hr: 9, cx: 7, cy: 17, cr: 9, hdx: 20, hdy: 27, yaw: 0.8, tAng: 160, tCurl: -4, tWave: 3, tSpd: 6, trx: -8, try: 3, fNx: 14, fFx: 8, hNx: -7, hFx: -13 }),
  spook: mk({ hx: -11, hy: 26, hr: 9, cx: 7, cy: 26, cr: 9, arch: 5, hdx: 19, hdy: 31, pitch: -0.3, yaw: 0.4, tAng: 90, tCurl: -2, tWave: 3, tSpd: 9, fNx: 8, fFx: 1, hNx: -10, hFx: -16, puff: 1 }),
  carried: mk({ hx: -6, hy: 21, hr: 8, cx: 2, cy: 37, cr: 8, hdx: 6, hdy: 53, pitch: 0.2, yaw: 0.25, tAng: -50, tCurl: 22, tWave: 3, tSpd: 1.5, trx: -4, try: -2, fNx: 9, fNy: 29, fFx: 4, fFy: 27, hNx: 6, hNy: 14, hFx: 0, hFy: 12, thigh: 6 }),
  swat: mk({ fl: 1, fNx: 31, fNy: 20, hdx: 19, hdy: 26, yaw: 0.8, tAng: 175, tCurl: 2, tWave: 12, tSpd: 7 })
};
const POSE_KEYS = Object.keys(BASE).filter(k => !['tailFront', 'bellyUp', 'puff', 'fl', 'hl'].includes(k));
const RATE = {};
POSE_KEYS.forEach(k => { RATE[k] = 10; });
['tAng', 'tCurl'].forEach(k => { RATE[k] = 6; });
['tWave', 'tSpd'].forEach(k => { RATE[k] = 5; });
['fNx', 'fNy', 'fFx', 'fFy', 'hNx', 'hNy', 'hFx', 'hFy'].forEach(k => { RATE[k] = 15; });
['hdx', 'hdy'].forEach(k => { RATE[k] = 10; });
['yaw', 'pitch'].forEach(k => { RATE[k] = 11; });

const cat = {
  name: store.get('name', '보리'), coat: null, K: null, pawDirty: 0, pawT: 0, onIcon: false, plat: null, forced: null,
  x: 100, gy: 99, z: 0, dir: 1, surface: 'floor', sortOverride: null,
  speed: 0, moving: false, gaitPhase: 0, turn: 0,
  p: Object.assign({}, POSES.stand), tgt: POSES.stand, poseName: 'stand', poseKey: 'stand',
  add: {},
  eyes: 'open', mouth: 'closed', earN: 'normal', earF: 'normal',
  blinking: false, blinkLeft: 0, blinkT: 2, slowBlink: false,
  twN: 0, twF: 0, twT: 4, tailFlick: 0, flickT: 3, whisk: 0, whiskT: 5, tilt: 0, blush: 0,
  wiggle: 0,
  look: { w: 0, yaw: 0, pitch: 0, gw: 0, gyaw: 0, gpitch: 0 },
  lookFn: null, autoLook: true, lookT: 1,
  needs: { sat: 56, love: 62, fun: 64, energy: 82, bowel: 62 },
  traits: { curious: 0.6, play: 0.5, lazy: 0.5, social: 0.6, shy: 0.4, mischief: 0.5 },
  weak: 0, bored: 0, content: false, contentUntil: 0, vigor: 1, pesterCooldown: 0, surpriseT: 40, affinity: 0.78, petCooldown: 0, napCooldown: 0, toyCooldown: 0, zoomCooldown: 40, hairCount: 0, lastAte: -999,
  gen: null, label: '', protect: false, busy: false, asleep: false, pend: null,
  recent: [], status: '', purr: 0, timers: [],
  visible: false, R: null, F: {}, headAbs: { x: 100, y: 80 },
  seed: 0, born: Date.now() - 14 * 86400000, kb: 1, kh: 1, baseTraits: null, outfit: { collar: '', hat: '' }, quiet: false
};
function setCoat(coat) {
  cat.coat = coat;
  cat.K = packCoat(coat);
}

/* ---------- small helpers used by every behaviour ---------- */
const POSKEYS = new Set(['hx','hy','hr','cx','cy','cr','arch','hdx','hdy','trx','try','fNx','fNy','fFx','fFy','hNx','hNy','hFx','hFy','thigh']);
function setPose(name, extra, abs) {
  if (extra && !abs) { const e2 = {}; for (const k in extra) e2[k] = POSKEYS.has(k) ? extra[k] * SS : extra[k]; extra = e2; }
  const key = name + (extra ? JSON.stringify(extra) : '');
  if (cat.poseKey === key) return;
  cat.poseKey = key; cat.poseName = name;
  cat.tgt = Object.assign({}, POSES[name], extra || {});
}
function S(t) { cat.status = t.replace('{n}', cat.name); }
function face(eyes, mouth, en, ef) {
  cat.eyes = eyes || 'open'; cat.mouth = mouth || 'closed';
  cat.earN = en || 'normal'; cat.earF = ef || en || 'normal';
}
function* wait(t, fn) {
  let e = 0;
  while (e < t) {
    e += DT;
    if (fn && fn(e, t) === false) return false;
    yield;
  }
  return true;
}
function later(sec, fn) { cat.timers.push({ t: sec, fn }); }

function aimHead(wx, wy) {
  const hx = cat.headAbs.x, hy = cat.headAbs.y;
  const rel = (wx - hx) * cat.dir;
  cat.look.gyaw = clamp(rel / 26, -0.9, 0.95);
  cat.look.gpitch = clamp((hy - wy) / 20, -0.8, 1);
}
function lookAt(fn, w = 1) { cat.lookFn = fn; cat.look.gw = w; cat.autoLook = false; }
function lookAtPt(x, y, w = 1) { lookAt(() => ({ x, y }), w); }
function lookViewer(w = 1) { cat.lookFn = null; cat.look.gyaw = 0; cat.look.gpitch = 0.15; cat.look.gw = w; cat.autoLook = false; }
function lookFree() { cat.lookFn = null; cat.look.gw = 0; cat.autoLook = true; }
const headPos = () => cat.headAbs;

function gaitStride() { return clamp(2.6 + cat.speed * 0.05, 2.6, 7.5); }

function applyGait(R) {
  const sp = cat.speed;
  if (sp < 1.2 || cat.surface === 'box') return;
  const gb = clamp(sp / 8, 0, 1);
  const style = sp < 26 ? 'walk' : sp < 52 ? 'trot' : 'bound';
  const Sd = gaitStride() * gb * SS * (style === 'bound' ? 0.8 : 1), L = clamp(1.6 + sp * 0.04, 1.6, 4) * gb * SS * (style === 'bound' ? 0.55 : 1);
  const ph = cat.gaitPhase;
  const cfg = {
    walk: { fN: 0.25, hN: 0, fF: 0.75, hF: 0.5, duty: 0.65 },
    trot: { fN: 0, hF: 0, fF: 0.5, hN: 0.5, duty: 0.5 },
    bound: { fN: 0, fF: 0.06, hN: 0.5, hF: 0.56, duty: 0.4 }
  }[style];
  for (const k of ['fN', 'fF', 'hN', 'hF']) {
    const s = (((ph + cfg[k]) % 1) + 1) % 1;
    let x, y;
    if (s < cfg.duty) { const u = s / cfg.duty; x = Sd * (1 - 2 * u); y = 0; }
    else { const u = (s - cfg.duty) / (1 - cfg.duty); x = Sd * (-1 + 2 * u); y = L * Math.sin(Math.PI * u); }
    R[k + 'x'] += x; R[k + 'y'] += y;
  }
  const a = ph * Math.PI * 2;
  if (style === 'walk') { const b = Math.abs(Math.sin(a * 2)) * 0.7 * gb * SS; R.cy += b; R.hy += b; R.hdy += b * 0.5; }
  else if (style === 'trot') { const b = Math.abs(Math.sin(a * 2)) * 1.0 * gb * SS; R.cy += b; R.hy += b; R.hdy += b * 0.4; }
  else {
    R.arch += Math.sin(a) * 0.9 * gb * SS;
    R.cy += Math.sin(a) * 0.8 * gb * SS; R.hy -= Math.sin(a) * 0.8 * gb * SS;
    R.hdy += Math.sin(a) * 0.8 * gb * SS;
  }
  R.tSpd = Math.max(R.tSpd, 3 + sp * 0.03);
}

function buildRender(t) {
  const P = cat.p, R = Object.assign({}, P), T = cat.tgt;
  const F = { tailFront: T.tailFront ? 1 : 0, bellyUp: (T.bellyUp && P.hy < 9 * SS) ? 1 : 0, puff: T.puff ? 1 : 0, fl: T.fl ? 1 : 0, hl: T.hl ? 1 : 0 };
  const br = Math.sin(t * (cat.asleep ? 1.7 : 2.5)) * (cat.asleep ? 0.75 : 0.5) * SS;
  R.cy += br; R.hdy += br * 0.8; R.hy += br * 0.25;
  applyGait(R);
  for (const k in cat.add) R[k] = (R[k] || 0) + cat.add[k] * (POSKEYS.has(k) ? SS : 1);
  if (cat.wiggle > 0) {
    const w = Math.sin(t * 40) * 1.5 * cat.wiggle * SS;
    R.hx += w; R.hdx -= w * 0.3; R.trx += w; R.tWave += 14 * cat.wiggle; R.tSpd = 8;
  }
  if (cat.turn > 0) {
    const k = cat.turn * 0.5;
    for (const key of ['hx', 'cx', 'hdx', 'fNx', 'fFx', 'hNx', 'hFx', 'trx']) R[key] *= (1 - k);
    R.yaw = lerp(R.yaw, 0, cat.turn);
  }
  const L = cat.look;
  if (L.w > 0.01) {
    R.yaw = lerp(R.yaw, L.yaw, L.w);
    R.pitch += L.pitch * L.w * 0.8;
    R.hdy += Math.max(0, L.pitch) * L.w * 0.5 * SS;
  }
  R.yaw = clamp(R.yaw, -0.9, 0.95);
  R.pitch = clamp(R.pitch, -1, 1);
  const wk = cat.weak;
  if (wk > 0.02 && !cat.asleep && cat.poseName !== 'carried') {          // hunger: slumped head, drooping tail, tired eyes
    R.hdy -= 5 * SS * wk; R.cy -= 1.5 * SS * wk; R.tAng -= 45 * wk; R.tWave *= 1 - 0.7 * wk; R.tSpd *= 1 - 0.5 * wk;
  }

  let eyes = cat.eyes;
  if (wk > 0.45 && !cat.asleep && eyes === 'open') eyes = 'half';
  if (cat.blinking && (eyes === 'open' || eyes === 'wide' || eyes === 'half' || eyes === 'shine' || eyes === 'annoyed')) eyes = 'blink';
  const St = {
    eyes, mouth: cat.mouth,
    earN: cat.twN > 0 ? 'back' : (wk > 0.7 && cat.earN === 'normal' ? 'back' : cat.earN), earF: cat.twF > 0 ? 'flat' : (wk > 0.7 && cat.earF === 'normal' ? 'back' : cat.earF),
    tailFlick: cat.tailFlick, whisk: cat.whisk > 0 ? 1 : 0, tilt: cat.tilt, blush: cat.blush > 0 ? 1 : 0, tm: t
  };
  updateGrowth();
  if (cat.kb < 0.999) for (const k of POSKEYS) if (R[k] !== undefined) R[k] *= cat.kb;
  cat.headAbs = { x: cat.x + cat.dir * R.hdx / SS, y: cat.gy - cat.z - R.hdy / SS };
  cat.R = R; cat.F = F;
  return { R, F, St };
}

function drawCat(ctx, t) {
  const { R, F, St } = buildRender(t);
  renderCat(R, F, St, cat.K);
  const sx = Math.round(cat.x), sy = Math.round(cat.gy);
  // soft shadow
  const sh = clamp(1 - cat.z / 30, 0.35, 1);
  const hw = Math.round(10 * cat.kb * sh * (cat.poseName === 'curl' ? 0.9 : 1));
  ctx.fillStyle = 'rgba(30,20,50,0.22)';
  for (let dy = -1; dy <= 1; dy++) {
    const w = dy === 0 ? hw : hw - 2;
    ctx.fillRect(sx - w, sy + dy, w * 2, 1);
  }
  ctx.save();
  ctx.translate(Math.round(cat.x * SS) / SS, Math.round((cat.gy - cat.z) * SS) / SS);
  if (smOk) {
    ctx.scale(cat.dir / (SS * SMK), 1 / (SS * SMK));
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(smCanvas, -OX * SMK, -OY * SMK);
  } else {
    ctx.scale(cat.dir / SS, 1 / SS);
    ctx.drawImage(sCanvas, -OX, -OY);
  }
  ctx.restore();
}

/* ---------- per-frame engine ---------- */
function needsUpdate(dt) {
  const n = cat.needs, a = cat.asleep;
  n.sat = Math.max(0, n.sat - 0.0043 * dt * (a ? 0.5 : 1));     // full -> empty in about 6.5 hours awake (3-4 times a day)
  n.love = Math.max(0, n.love - 0.05 * dt * (a ? 0.3 : 1));
  n.fun = Math.max(0, n.fun - 0.022 * dt * (a ? 0.2 : 1));      // full -> bored in about 45 min
  if (Room.clean < 60) n.love = Math.max(0, n.love - 0.05 * dt);
  n.energy = a ? Math.min(100, n.energy + 2.4 * dt) : Math.max(0, n.energy - (0.1 + cat.speed * 0.003) * dt);
  n.bowel = Math.min(140, n.bowel + 0.06 * dt);
  const tr = cat.traits;
  for (const k in tr) tr[k] = clamp(tr[k] + rnd(-0.02, 0.02) * dt + (((cat.baseTraits && cat.baseTraits[k] !== undefined) ? cat.baseTraits[k] : 0.5) - tr[k]) * 0.004 * dt, 0.08, 0.95);
  cat.petCooldown = Math.max(0, cat.petCooldown - dt);
  cat.napCooldown = Math.max(0, cat.napCooldown - dt);
  cat.toyCooldown = Math.max(0, cat.toyCooldown - dt);
  cat.zoomCooldown = Math.max(0, cat.zoomCooldown - dt);
  cat.pesterCooldown = Math.max(0, cat.pesterCooldown - dt);
  cat.hungerUrge = Math.max(0, (cat.hungerUrge || 0) - dt);
  // moods that colour everything the cat does
  cat.weak = clamp((32 - n.sat) / 32, 0, 1);
  cat.bored = clamp((38 - n.fun) / 38, 0, 1);
  cat.content = NOW < cat.contentUntil;
  cat.vigor = clamp(1 - 0.5 * cat.weak - (n.energy < 15 ? 0.2 : 0), 0.4, 1) * (1 + 0.22 * (1 - growthT()));      // kittens scamper a little faster
  if (cat.weak > 0.5 && !cat.asleep && chance(dt * 0.02)) Snd.meow('low', 0.5);
}

function pickLookTarget() {
  const opts = [];
  opts.push({ k: 'ptr', w: 2 + cat.traits.curious * 3 });
  if (birdPresent()) opts.push({ k: 'bird', w: 5 });
  if (Room.fly) opts.push({ k: 'fly', w: 6 });
  if (Room.bowl.food > 3) opts.push({ k: 'bowl', w: 1 });
  if (Room.messes.length) opts.push({ k: 'mess', w: 0.8 });
  opts.push({ k: 'viewer', w: 1.4 + cat.needs.love / 80 }, { k: 'ahead', w: 2 }, { k: 'back', w: 0.5 }, { k: 'none', w: 2 });
  const k = wchoose(opts);
  switch (k) {
    case 'ptr': return { fn: () => ({ x: Desk.cursor.x, y: Desk.cursor.y }), w: 0.9 };
    case 'bird': return { fn: () => birdWorld(), w: 1 };
    case 'fly': return { fn: () => (Room.fly ? { x: Room.fly.x, y: Room.fly.y } : null), w: 1 };
    case 'bowl': return { fn: () => ({ x: Room.bowl.x, y: Room.bowl.gy - 4 }), w: 0.8 };
    case 'mess': { const m = pick(Room.messes); return { fn: () => ({ x: m.x, y: m.gy }), w: 0.8 }; }
    case 'window': return { fn: () => ({ x: Room.ox + 143, y: Room.oy + 22 }), w: 0.9 };
    case 'viewer': return { fn: null, viewer: true, w: 1 };
    case 'ahead': { const px = cat.x + cat.dir * rnd(25, 60), py = cat.gy - rnd(0, 10); return { fn: () => ({ x: px, y: py }), w: 0.7 }; }
    case 'back': { const px = cat.x - cat.dir * rnd(25, 60), py = cat.gy - rnd(0, 10); return { fn: () => ({ x: px, y: py }), w: 0.7 }; }
    default: return { fn: null, w: 0 };
  }
}

function ambientUpdate(dt) {
  // blink
  cat.blinkT -= dt;
  if (cat.blinking) {
    cat.blinkLeft -= dt;
    if (cat.blinkLeft <= 0) cat.blinking = false;
  } else if (cat.blinkT <= 0 && !cat.asleep) {
    cat.blinking = true;
    cat.blinkLeft = cat.slowBlink ? 0.45 : rnd(0.09, 0.16);
    cat.blinkT = chance(0.18) ? 0.2 : rnd(2, 6.5);
  }
  // ear twitch
  cat.twN = Math.max(0, cat.twN - dt); cat.twF = Math.max(0, cat.twF - dt);
  cat.twT -= dt;
  if (cat.twT <= 0) {
    cat.twT = rnd(3, 11);
    if (chance(0.55)) cat.twN = 0.14; else cat.twF = 0.14;
    if (chance(0.25)) { cat.twN = 0.14; cat.twF = 0.1; }
  }
  // tail flick
  cat.flickT -= dt;
  cat.tailFlick *= Math.exp(-dt * 5);
  if (cat.flickT <= 0) { cat.flickT = rnd(2.5, 9) * (1 - 0.6 * cat.bored); cat.tailFlick = rnd(25, 50) * (chance(0.5) ? 1 : -1); }
  // whiskers
  cat.whiskT -= dt; cat.whisk = Math.max(0, cat.whisk - dt);
  if (cat.whiskT <= 0) { cat.whiskT = rnd(3, 9); cat.whisk = 0.18; }
  // look
  const L = cat.look;
  if (cat.autoLook && !cat.asleep) {
    cat.lookT -= dt;
    if (cat.lookT <= 0) {
      const tgt = pickLookTarget();
      cat.lookFn = tgt.fn; cat.lookViewer = !!tgt.viewer; L.gw = tgt.w;
      cat.lookT = rnd(1.4, 4.5);
    }
    if (cat.lookViewer) { L.gyaw = 0; L.gpitch = 0.15; }
  } else if (cat.asleep) L.gw = 0;
  if (cat.lookFn) {
    const p = cat.lookFn();
    if (p) aimHead(p.x, p.y); else L.gw = 0;
  }
  L.w += (L.gw - L.w) * smooth(7, dt);
  L.yaw += (L.gyaw - L.yaw) * smooth(10, dt);
  L.pitch += (L.gpitch - L.pitch) * smooth(10, dt);
  // purr
  Snd.setPurr(cat.purr);
}

function stepPose(dt) {
  const T = cat.tgt, P = cat.p;
  for (const k of POSE_KEYS) P[k] += (T[k] - P[k]) * smooth(RATE[k], dt);
}

function catUpdate(dt) {
  DT = dt;
  for (let i = cat.timers.length - 1; i >= 0; i--) {
    const tm = cat.timers[i];
    tm.t -= dt;
    if (tm.t <= 0) { cat.timers.splice(i, 1); tm.fn(); }
  }
  needsUpdate(dt);
  ambientUpdate(dt);
  if (cat.pend && !cat.busy) { const p = cat.pend; cat.pend = null; startBehavior(p.fn, p.label); }
  cat.moving = false;
  if (cat.gen) {
    let r;
    try { r = cat.gen.next(); } catch (e) { console.error(e); r = { done: true }; cat.busy = false; cat.z = 0; }
    if (r.done) { cat.gen = null; cat.label = ''; }
  } else if (!cat.busy) chooseNext();
  if (!cat.moving) cat.speed = approach(cat.speed, 0, dt * 110);
  trackSurface(dt);
  cat.onIcon = cat.surface === 'floor' && !!iconAt(cat.x, cat.gy - 7, 3);
  pawPrints(dt);
  if (cat.speed > 1) {
    const sp = cat.speed, duty = sp < 26 ? 0.65 : sp < 52 ? 0.5 : 0.4;
    cat.gaitPhase = (cat.gaitPhase + dt * duty * sp / (2 * gaitStride())) % 1000;
  }
  stepPose(dt);
}

/* ---------- behaviour plumbing ---------- */
function startBehavior(fn, label) {
  if (cat.gen) { try { cat.gen.return(); } catch (e) { console.error(e); } }
  cat.add = {}; cat.wiggle = 0; cat.tilt = 0; cat.blush = 0; cat.purr = 0; cat.slowBlink = false;
  cat.protect = false; cat.asleep = false; cat.turn = 0; cat.z = 0;
  lookFree(); cat.lookViewer = false;
  face();
  cat.label = label;
  cat.gen = wrapBehavior(fn);
  cat.recent.push(label); if (cat.recent.length > 6) cat.recent.shift();
  if (typeof diaryStart === 'function') diaryStart(label);
}
function* wrapBehavior(fn) {
  if (cat.surface !== 'floor' && !(fn.keepSurface && (cat.surface === 'sill' || cat.surface === 'furn'))) yield* leaveSurface();
  yield* fn();
}
function interrupt(fn, label) {
  if (cat.busy) { cat.pend = { fn, label }; return false; }
  startBehavior(fn, label);
  return true;
}

/* ---------- locomotion ---------- */
const SPD = { creep: 9, stroll: 13, walk: 19, trot: 36, run: 62, sprint: 88 };

function* turnTo(d, quick) {
  if (cat.dir === d) return;
  const T = quick ? 0.14 : 0.3;
  let t = 0, flipped = false;
  while (t < T) {
    t += DT;
    const u = t / T;
    cat.turn = Math.sin(Math.PI * Math.min(1, u));
    if (u >= 0.5 && !flipped) { cat.dir = d; flipped = true; }
    cat.speed = approach(cat.speed, quick ? cat.speed * 0.5 : 0, DT * 120);
    if (quick) cat.moving = true;
    yield;
  }
  cat.dir = d; cat.turn = 0;
}

// poses a cat cannot walk in: it has to stand up first (no butt-scooting)
const SEATED = new Set(['sit', 'loaf', 'sphinx', 'curl', 'lieSide', 'bellyUp', 'groomPaw', 'groomLeg', 'groomChest', 'lookUp']);
function* standUpIfSeated() {
  if (SEATED.has(cat.poseName)) { setPose('stand'); cat.add = {}; yield* wait(0.28); }
}
function* walkTo(tx, ty, o = {}) {
  yield* standUpIfSeated();
  const sp = (o.speed || SPD.walk) * (o.noVigor ? 1 : cat.vigor), tol = o.tol || 2, tmax = o.timeout || 30;
  tx = clamp(tx, 8, W - 8); ty = resolveWall(tx, clamp(ty, GY_MIN, GY_MAX), cat.gy);
  let el = 0;
  while (el < tmax) {
    el += DT;
    const dx = tx - cat.x, dy = ty - cat.gy;
    if (Math.abs(dx) < tol && Math.abs(dy) < tol * 1.5) { if (el <= DT * 1.5) yield; return true; }
    if (Math.abs(dx) > 5 && sgn(dx) !== cat.dir) { yield* turnTo(sgn(dx), o.quick || sp > 50); continue; }
    const dist = Math.hypot(dx, dy * 1.5);
    const slow = o.arrive === false ? 1 : clamp(dist / 16, 0.3, 1);
    cat.moving = true;
    cat.speed = approach(cat.speed, sp * slow, DT * (60 + sp * 2.5));
    const h = Math.hypot(dx, dy) || 1;
    const step = Math.min(cat.speed * DT, h);
    cat.x += dx / h * step; cat.gy += dy / h * step * 0.7;
    const pg = cat.gy;
    cat.x = clamp(cat.x, 8, W - 8); cat.gy = resolveWall(cat.x, clamp(cat.gy, GY_MIN, GY_MAX), pg);
    yield;
  }
  return false;
}

function* hop(tx, tgy, h, T = 0.5, o = {}) {
  cat.busy = true;
  try {
    const prevEyes = cat.eyes;
    if (Math.abs(tx - cat.x) > 3 && sgn(tx - cat.x) !== cat.dir) cat.dir = sgn(tx - cat.x);
    setPose('crouch'); cat.eyes = 'wide';
    if (o.pre !== 0) yield* wait(o.pre === undefined ? 0.22 : o.pre);
    const x0 = cat.x, g0 = cat.gy;
    let t = 0, landing = false;
    setPose(o.air || 'pounce');
    while (t < T) {
      t += DT;
      const u = Math.min(1, t / T);
      cat.x = lerp(x0, tx, u); cat.gy = lerp(g0, tgy, u);
      cat.z = 4 * h * u * (1 - u);
      if (u > 0.55 && !landing) { landing = true; setPose('stand', { fNy: 3, fFy: 3, fNx: 16, fFx: 12, hdy: 24 }, true); }
      yield;
    }
    cat.z = 0; cat.x = tx; cat.gy = tgy;
    burstDust(cat.x, cat.gy + 1, 5, cat.dir);
    Snd.thump();
    setPose('crouch');
    cat.eyes = prevEyes;
    yield* wait(o.post === undefined ? 0.14 : o.post);
  } finally {
    cat.busy = false; cat.z = 0;
  }
}

function* leaveSurface() {
  if (cat.surface === 'sill') {
    const tx = clamp(cat.x + rnd(-14, 14), Room.ox + 30, W - 22);
    yield* hop(tx, Room.oy + rnd(78, 86), 8, 0.62);
  } else if (cat.surface === 'box') {
    cat.sortOverride = null;
    yield* hop(Room.box.x + rnd(-8, 8), Room.box.by + 7, 6, 0.5);
  } else if (cat.surface === 'furn') {
    yield* leaveFurn();
  } else if (cat.surface === 'platform') {
    cat.plat = null;
    yield* hop(clamp(cat.x + rnd(-8, 8), 10, W - 10), clamp(cat.gy + rnd(10, 16), GY_MIN, GY_MAX), 5, 0.45);
  }
  cat.surface = 'floor'; cat.sortOverride = null; cat.plat = null;
}

/* ---------- surfaces & paw prints ---------- */
function trackSurface(dt) {
  if (cat.surface !== 'platform') return;
  const p = platformById(cat.plat);
  if (!p) {
    cat.surface = 'floor'; cat.plat = null;
    interrupt(bFall, 'fall');
    return;
  }
  cat.gy = approach(cat.gy, p.y, 80 * dt);
  cat.x = clamp(cat.x, p.x0, p.x1);
}
function pawPrints(dt) {
  if (cat.pawDirty <= 0 || cat.speed < 5 || cat.surface !== 'floor' || cat.z > 0) return;
  cat.pawDirty -= dt; cat.pawT -= dt * cat.speed;
  if (cat.pawT <= 0) {
    cat.pawT = 9;
    spawn('paw', cat.x + cat.dir * rnd(-2, 7), cat.gy - 1 + (chance(0.5) ? -2 : 1), { life: 6 });
  }
}
