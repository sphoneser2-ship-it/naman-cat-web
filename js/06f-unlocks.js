/* ============ collecting: new things are brought by the cat as presents ============ */
const Unlocks = { have: new Set(), fresh: new Set(), catalog: [], byId: {} };
const Present = { cd: 3, nextAt: store.get('presentAt', 0) };

function buildCatalog() {
  const add = (id, kind, name, old) => { const it = { id, kind, name, old: !!old }; Unlocks.catalog.push(it); Unlocks.byId[id] = it; };
  for (const k in COLLARS) add('collar:' + k, 'collar', COLLARS[k].n, !COLLARS[k].nw);
  for (const k in HATS) add('hat:' + k, 'hat', HATS[k].n, !HATS[k].nw);
  for (const k in TOYS) if (!TOYS[k].base) add('toy:' + k, 'toy', TOYS[k].n, false);
  for (const k in FURN) add('furn:' + k, 'furn', FURN[k].n, false);
  for (const g in SKINS) for (const k in SKINS[g]) if (k !== 'default') add('skin:' + g + ':' + k, 'skin-' + g, SKINS[g][k].n, false);
  const saved = store.get('unlocks', null);
  if (saved) Unlocks.have = new Set(saved);
  else {
    // someone who already had the first set of outfits keeps them; a brand-new cat starts with almost nothing
    const hadCat = !!store.get('cat', null);
    for (const it of Unlocks.catalog) if (hadCat && it.old) Unlocks.have.add(it.id);
    if (!hadCat) { Unlocks.have.add('collar:red'); Unlocks.have.add('hat:bow'); }
    saveUnlocks();
  }
  // the skins and pieces someone already uses stay available
  for (const g in Skin) if (Skin[g] !== 'default' && !Unlocks.have.has('skin:' + g + ':' + Skin[g])) Skin[g] = 'default';
  Unlocks.fresh = new Set(store.get('fresh', []));
}
const saveUnlocks = () => { store.set('unlocks', [...Unlocks.have]); store.set('fresh', [...Unlocks.fresh]); };
const owns = id => Unlocks.have.has(id);
const ownsSkin = (g, k) => k === 'default' || owns('skin:' + g + ':' + k);
const ownsToy = k => !!TOYS[k] && (TOYS[k].base || owns('toy:' + k));
const ownsFurn = k => owns('furn:' + k);
const lockedItems = () => Unlocks.catalog.filter(it => !Unlocks.have.has(it.id));
function unlockItem(id) {
  Unlocks.have.add(id); Unlocks.fresh.add(id); saveUnlocks();
  return Unlocks.byId[id];
}
function seen(id) { if (Unlocks.fresh.delete(id)) saveUnlocks(); }
const KIND_LABEL = { collar: '꾸미기 · 목걸이', hat: '꾸미기 · 모자', toy: '장난감', furn: '가구', 'skin-bowl': '스킨 · 밥그릇', 'skin-water': '스킨 · 물그릇', 'skin-litter': '스킨 · 화장실', 'skin-bed': '스킨 · 침대' };

/* ---------- banner ---------- */
let bannerT = null;
function showBanner(title, text) {
  const el = document.getElementById('banner');
  if (!el) return;
  document.getElementById('bnTitle').textContent = title;
  document.getElementById('bnText').textContent = text;
  el.hidden = false; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  clearTimeout(bannerT); bannerT = setTimeout(() => { el.classList.remove('on'); setTimeout(() => { el.hidden = true; }, 400); }, 6500);
}

/* ---------- right-click on a bowl / the litter box / the bed: pick a skin ---------- */
const SKIN_PROP = { bowl: 'bowl', water: 'water', box: 'litter', cushion: 'bed' };
const SKIN_TITLE = { bowl: '밥그릇 스킨', water: '물그릇 스킨', litter: '화장실 스킨', bed: '침대 스킨' };
let skinMenuT = 0;
function closeSkinMenu() { const el = document.getElementById('skinMenu'); if (el) el.hidden = true; }
function openSkinMenu() {
  if (!isHome() || Adopt.open) return false;
  const k = propAt(Desk.cursor.x, Desk.cursor.y), g = k && SKIN_PROP[k];
  if (!g) return false;
  const el = document.getElementById('skinMenu'), chips = document.getElementById('smChips'), hint = document.getElementById('smHint');
  document.getElementById('smTitle').textContent = SKIN_TITLE[g];
  chips.innerHTML = '';
  const owned = Object.keys(SKINS[g]).filter(s => ownsSkin(g, s));
  for (const s of owned) {
    const id = 'skin:' + g + ':' + s, b = document.createElement('button');
    b.type = 'button'; b.textContent = (Unlocks.fresh.has(id) ? '★ ' : '') + SKINS[g][s].n; b.setAttribute('aria-pressed', String(Skin[g] === s));
    b.addEventListener('click', () => { seen(id); setSkin(g, s); Snd.pop(); toast(SKINS[g][s].n + '(으)로 바꿨어요'); closeSkinMenu(); if (window.refreshSheets) window.refreshSheets(); });
    chips.appendChild(b);
  }
  hint.hidden = owned.length > 1;
  hint.textContent = '다른 스킨이 아직 없어요. 고양이가 선물로 가져와요.';
  const x = clamp(Desk.cursor.x * S_PX - 20, 6, window.innerWidth - 262), y = clamp(Desk.cursor.y * S_PX - 20, 6, window.innerHeight - 200);
  el.style.left = x + 'px'; el.style.top = y + 'px'; el.hidden = false; skinMenuT = 12;
  return true;
}
function skinMenuUpdate(dt) {
  const el = document.getElementById('skinMenu');
  if (!el || el.hidden) return;
  skinMenuT -= dt;
  if (!el.matches(':hover')) skinMenuT -= dt * 2;       // closes soon after the mouse leaves it
  if (skinMenuT <= 0) closeSkinMenu();
}
document.addEventListener('pointerdown', e => { const el = document.getElementById('skinMenu'); if (el && !el.hidden && !(e.target.closest && e.target.closest('#skinMenu'))) closeSkinMenu(); }, true);

/* ---------- the present ---------- */
function mouthPoint() {
  const R = cat.R || cat.p, ns = Math.round(R.yaw * 5), fy = Math.round(clamp(R.pitch, -1, 1) * 2.5);
  return { x: cat.headAbs.x + cat.dir * (ns + 9) / SS, y: cat.headAbs.y + (6 - fy) / SS };
}
// where a toy held in the mouth goes: just in front of the mouth centre, at mouth height (world px; "up" is above the cat's ground line)
function mouthGrip() {
  const R = cat.R || cat.p, ns = Math.round(R.yaw * 5), fy = Math.round(clamp(R.pitch, -1, 1) * 2.5);
  return { x: cat.x + cat.dir * (R.hdx + ns + 4) / SS, up: cat.z + R.hdy / SS - (6 - fy) / SS };
}
function pickPresent() {
  const locked = lockedItems();
  if (!locked.length) return null;
  const groups = { outfit: locked.filter(i => i.kind === 'collar' || i.kind === 'hat'), toy: locked.filter(i => i.kind === 'toy'), furn: locked.filter(i => i.kind === 'furn'), skin: locked.filter(i => i.kind.indexOf('skin') === 0) };
  const w = [{ k: 'outfit', w: groups.outfit.length ? 3 : 0 }, { k: 'toy', w: groups.toy.length ? 2 : 0 }, { k: 'furn', w: groups.furn.length ? 2.2 : 0 }, { k: 'skin', w: groups.skin.length ? 2.5 : 0 }];
  return pick(groups[wchoose(w)]).id;
}
function scheduleNextPresent(first) {
  Present.nextAt = Date.now() + (first ? rnd(6, 12) : rnd(22, 55)) * 60000;
  store.set('presentAt', Present.nextAt);
}
function presentUpdate(dt) {
  Present.cd -= dt;
  if (Present.cd > 0) return;
  Present.cd = 3;
  if (!Present.nextAt) { scheduleNextPresent(true); return; }
  if (Date.now() < Present.nextAt) return;
  if (!cat.visible || cat.protect || cat.busy || cat.asleep || Adopt.open || !isHome() || isQuiet() || isDeepNight()) return;
  if (cat.needs.love < 35 || cat.weak > 0.3 || cat.needs.bowel > 85 || Room.present || Room.carry || !lockedItems().length) return;
  if (!['', 'idleSit', 'idleStand', 'wander', 'loaf', 'groom', 'follow', 'rub', 'pester'].includes(cat.label)) return;
  interrupt(bBringPresent, 'present');
}
function* bBringPresent() {
  const id = pickPresent();
  if (!id) return;
  cat.asleep = false;
  S('{n}가 갑자기 어디론가 달려가요');
  face('open'); setPose('stand'); emote('alert', 1);
  const edge = chance(0.5) ? 'left' : 'right';
  try {
    yield* walkTo(edge === 'right' ? W - 10 : 10, clamp(cat.gy, GY_MIN, GY_MAX), { speed: SPD.run, timeout: 40, noVigor: true });
    cat.dir = edge === 'right' ? 1 : -1; setPose('run'); face('wide', 'closed', 'fwd');
    yield* walkXOnly(edge === 'right' ? W + 40 : -40, SPD.sprint);
    yield* wait(rnd(5, 9));
    cat.x = edge === 'right' ? W + 40 : -40; cat.dir = edge === 'right' ? -1 : 1; cat.gy = clamp(cat.gy + rnd(-20, 20), GY_MIN, GY_MAX);
    Room.carry = { id };
    S('{n}가 무언가를 물고 돌아와요!');
    face('shine', 'closed', 'fwd'); setPose('stand', { hdy: 28 }, true);
    yield* walkXOnly(edge === 'right' ? W - 18 : 18, SPD.run);
    const tx = clamp(Desk.cursor.x + (chance(0.5) ? -30 : 30), 20, W - 20), ty = clamp(Desk.cursor.y + 16, GY_MIN, GY_MAX);
    for (let g = 0; g < 700; g++) {
      if (Math.abs(tx - cat.x) < 4 && Math.abs(ty - cat.gy) < 5) break;
      yield* walkTo(tx, ty, { speed: SPD.trot, timeout: 0.2, arrive: false, tol: 3, quick: true, noVigor: true });
    }
    Room.present = { x: cat.x + cat.dir * 11, gy: cat.gy + 0.5, id, t: 0 };
    Room.carry = null;
  } finally { Room.carry = null; }
  S('{n}가 선물을 내려놓았어요!');
  setPose('sit', { yaw: 0, hdx: 3 }); lookViewer(1); face('shine'); sayMeow('chirp', 0.9); emote('heart', 1.6);
  scheduleNextPresent(false);
  yield* wait(rnd(3, 4.5));
  if (Room.present) {
    setPose('crouch'); face('wide'); yield* wait(0.5);
    setPose('swat'); Snd.swat(); yield* wait(0.2);
    openPresent();
  }
  yield* wait(1.2); markContent(); lookFree(); setPose('sit'); face('shine');
  yield* wait(0.8);
}
BEH.present = bBringPresent;

function presentHit(x, y) {
  const P = Room.present;
  return !!P && Math.abs(x - P.x) < 10 && y > P.gy - 14 && y < P.gy + 3;
}
function openPresent() {
  const P = Room.present;
  if (!P) return;
  Room.present = null;
  for (let i = 0; i < 12; i++) spawn('spark', P.x + rnd(-8, 8), P.gy - rnd(6, 16), { vy: -rnd(8, 22), vx: rnd(-10, 10), life: 0.9 });
  spawn('poof', P.x, P.gy - 5, { life: 0.6, rot: rnd(3) });
  burstHearts(P.x, P.gy - 12, 3);
  Snd.sparkle(); later(0.15, () => Snd.sparkle());
  const it = unlockItem(P.id);
  if (!it) return;
  showBanner('선물이 도착했어요!', '[' + KIND_LABEL[it.kind] + '] ' + it.name);
  diaryNote('present');
  if (it.kind === 'furn') { const k = it.id.slice(5); placeNewFurniture(k); }
  if (typeof refreshSheets === 'function') refreshSheets();
}
function placeNewFurniture(k) {
  const F = Room.furn[k];
  setFurnOut(k, true);
  layoutFurn();
  // somewhere free of the other pieces
  let tries = 0, ok = false;
  while (!ok && tries++ < 12) {
    ok = FURN_KEYS.every(o => o === k || !furnOf(o) || Math.abs(Room.furn[o].x - F.x) > 50);
    if (!ok) { F.dx -= 60; layoutFurn(); if (F.x <= 40) { F.dx = FURN[k].def[0]; F.dy += 14; layoutFurn(); } }
  }
  saveFurn();
}
