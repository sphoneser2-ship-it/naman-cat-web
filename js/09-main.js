/* ============ app shell: layout, dock, adoption, click-through, main loop ============ */

/* ---- host bridge (Electron preload, or a tiny mock when opened in a plain browser) ---- */
function mockHost() {
  const listeners = { cursor: [], desk: [] };
  window.addEventListener('mousemove', e => listeners.cursor.forEach(f => f({ x: e.clientX, y: e.clientY })));
  setTimeout(() => {
    const icons = [];
    for (let c = 0; c < 4; c++) for (let r = 0; r < 6; r++) icons.push([13 + c * 75, 2 + r * 98]);
    listeners.desk.forEach(f => f({
      icons, sx: 75, sy: 98,
      wins: [{ id: 11, x: Math.round(innerWidth * 0.34), y: Math.round(innerHeight * 0.18), w: Math.round(innerWidth * 0.34), h: Math.round(innerHeight * 0.5), max: 0, fg: 1, t: 'Mock window' }]
    }));
  }, 300);
  return {
    mock: true,
    display: { w: innerWidth, h: innerHeight, workBottom: innerHeight - 40, scale: 1 },
    onCursor: f => listeners.cursor.push(f), onDesk: f => listeners.desk.push(f), onCommand: () => {},
    hideFs: { get: () => store.get('hideFs', true) !== false, set: on => { store.set('hideFs', !!on); return !!on; } },
    behind: { get: () => !!store.get('behind', false), set: on => { store.set('behind', !!on); return !!on; } },
    autostart: { get: () => ({ on: !!store.get('autostart', false), ok: true }), set: on => { store.set('autostart', !!on); return { on: !!on, ok: true }; } },
    setCapture() {}, setFocusable() {}, quit() { toast('(미리보기에서는 종료되지 않아요)'); }
  };
}
const Host = Object.assign({}, window.catdesk || mockHost());
if (/[?&]test=1/.test(location.search)) document.documentElement.style.background = "linear-gradient(160deg,#6f8fb5,#9bb7c9)";

let refreshMenuFn = null;
const Prefs = Object.assign({ scale: 0, passOnly: false }, store.get('prefs', {}));
const savePrefs = () => store.set('prefs', Prefs);

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
let DPR = window.devicePixelRatio || 1;

/* ---- layout ---- */
function pickScale() { return Prefs.scale || 2; }
function applyLayout() {
  if (Host.mock) Host.display = { w: innerWidth, h: innerHeight, workBottom: innerHeight - 40, scale: 1 };
  DPR = window.devicePixelRatio || 1;
  const cssW = window.innerWidth, cssH = window.innerHeight;
  S_PX = pickScale();
  canvas.width = Math.round(cssW * DPR); canvas.height = Math.round(cssH * DPR);
  canvas.style.width = cssW + 'px'; canvas.style.height = cssH + 'px';
  layoutWorld(cssW, cssH, Host.display.workBottom);
  placeDock();
  document.getElementById('bubbles').style.cssText = `position:fixed;left:0;top:0;width:${cssW}px;height:${cssH}px;`;
}

/* ---- toast ---- */
let toastT = null;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('on');
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove('on'), 1800);
}

/* ---- dock icons ---- */
function mkIconHi(fn) {
  const cv = document.createElement('canvas'); cv.width = 28; cv.height = 28;
  fn(cv.getContext('2d'));
  return cv;
}
const ellsO = (g, fill, list) => { for (const [x, y, rx, ry] of list) aEll(g, PO, x, y, rx + 1, ry + 1); for (const [x, y, rx, ry] of list) aEll(g, fill, x, y, rx, ry); };
const ICON = {
  paw: mkIconHi(g => {
    ellsO(g, '#ffd36e', [[14, 19, 8, 6], [5, 12, 3, 4], [10, 6, 3, 5], [18, 6, 3, 5], [23, 12, 3, 4]]);
    aEll(g, '#fff0b0', 11, 17, 3, 2); A(g, '#e0a93a', 8, 22, 12, 1);
  }),
  kibble: mkIconHi(g => {
    for (let y = 14; y <= 24; y++) { const w = Math.round(11 - (y - 14) * 0.5); A(g, PO, 14 - w - 1, y, 1, 1); A(g, PO, 14 + w, y, 1, 1); A(g, '#ff8fb1', 14 - w, y, w * 2, 1); A(g, '#ffc2d6', 14 - w, y, 3, 1); A(g, '#e0678f', 14 + w - 4, y, 4, 1); }
    A(g, PO, 8, 25, 12, 1); aEllO(g, '#ffd7e4', 14, 14, 11, 3); aEll(g, '#6b3b24', 14, 14, 9, 2);
    for (const [x, y] of [[8, 11], [12, 10], [16, 11], [20, 12], [10, 8], [14, 7], [18, 8], [12, 5]]) { A(g, '#5a3014', x - 1, y - 1, 5, 4); A(g, '#a8632e', x, y, 3, 2); A(g, '#d9984f', x, y, 2, 1); }
  }),
  churu: mkIconHi(g => {
    aLine(g, PO, 6, 22, 21, 7, 9); aLine(g, '#ff8fb1', 6, 22, 21, 7, 7); aLine(g, '#ffc2d6', 8, 20, 18, 10, 1);
    aLine(g, '#ffd36e', 17, 11, 22, 6, 7); aLine(g, PO, 15, 13, 17, 11, 2); aLine(g, '#ffb347', 11, 17, 14, 14, 7);
    aEllO(g, '#ffb347', 4, 24, 3, 2); A(g, '#ffe0a0', 3, 23, 2, 1);
  }),
  wand: mkIconHi(g => {
    aLine(g, PO, 3, 25, 14, 14, 6); aLine(g, '#b07a48', 3, 25, 14, 14, 4); aLine(g, '#d4a06a', 4, 24, 13, 15, 1);
    aLine(g, '#ffffff', 14, 14, 20, 17, 1); aLine(g, '#ffffff', 20, 17, 21, 19, 1);
    ellsO(g, '#7be0c3', [[20, 22, 3, 5]]); ellsO(g, '#ff8fb1', [[24, 20, 2, 4]]); A(g, '#ffd36e', 20, 19, 1, 8); A(g, '#c8fbe9', 19, 20, 1, 3);
  }),
  laser: mkIconHi(g => {
    aEll(g, 'rgba(255,60,70,0.25)', 14, 14, 12, 12); aEll(g, 'rgba(255,60,70,0.4)', 14, 14, 8, 8);
    aEllO(g, '#ff2a3a', 14, 14, 4, 4); aEll(g, '#ff7a84', 13, 13, 2, 2); A(g, '#ffffff', 12, 12, 2, 2);
    for (const [x, y, w, h] of [[13, 1, 2, 4], [13, 23, 2, 4], [1, 13, 4, 2], [23, 13, 4, 2]]) A(g, '#ff6a77', x, y, w, h);
  }),
  ball: mkIconHi(g => {
    aEllO(g, '#ff7aa6', 14, 14, 11, 11); aEll(g, '#ffa6c4', 12, 11, 8, 8);
    g.fillStyle = '#d95a82';
    for (let s = 0; s < 3; s++) { const ang = 0.4 + s * 1.05; for (let u = -1; u <= 1.001; u += 0.05) { const px = 10 * u, py = 4 * Math.sin(u * Math.PI); g.fillRect(Math.round(14 + px * Math.cos(ang) - py * Math.sin(ang)), Math.round(14 + px * Math.sin(ang) + py * Math.cos(ang)), 1, 1); } }
    A(g, '#ffe4ee', 8, 7, 4, 3); aLine(g, '#ff7aa6', 22, 22, 26, 25, 2);
  }),
  mouse: mkIconHi(g => {
    aLine(g, PO, 19, 20, 26, 12, 4); aLine(g, '#e0a9bd', 19, 20, 26, 12, 2);
    aEllO(g, '#b9b2c8', 13, 18, 10, 6); aEll(g, '#d6d0e4', 11, 15, 6, 3);
    aEllO(g, '#b9b2c8', 8, 10, 4, 4); aEll(g, '#ffa6c4', 8, 10, 2, 2);
    aEllO(g, '#b9b2c8', 16, 10, 4, 4); aEll(g, '#ffa6c4', 16, 10, 2, 2);
    A(g, PO, 6, 17, 2, 2); A(g, '#ff7aa6', 2, 20, 3, 3); A(g, '#ffffff', 11, 14, 3, 1);
  }),
  brush: mkIconHi(g => {
    aLine(g, PO, 4, 24, 13, 15, 6); aLine(g, '#c58a56', 4, 24, 13, 15, 4); aLine(g, '#e4b57c', 5, 23, 12, 16, 1);
    boxO(g, 12, 4, 12, 12, '#7be0c3'); A(g, '#b8f4e3', 13, 5, 10, 2);
    for (let i = 0; i < 4; i++) { A(g, '#ffffff', 14 + i * 3, 9, 1, 5); A(g, '#e8fff8', 15 + i * 3, 10, 1, 4); }
  }),
  nip: mkIconHi(g => {
    aLine(g, PO, 14, 25, 14, 10, 4); aLine(g, '#4f9f56', 14, 25, 14, 10, 2);
    aEllO(g, '#6fcf6f', 8, 14, 4, 6); aEllO(g, '#6fcf6f', 20, 14, 4, 6); aEllO(g, '#86df7f', 14, 8, 4, 6);
    A(g, '#4f9f56', 8, 11, 1, 7); A(g, '#4f9f56', 20, 11, 1, 7); A(g, '#4f9f56', 14, 4, 1, 7);
    A(g, '#fff6a8', 4, 5, 2, 2); A(g, '#fff6a8', 24, 6, 2, 2); A(g, '#fff6a8', 22, 22, 2, 2);
  }),
  style: mkIconHi(g => {
    for (let y = 0; y < 17; y++) { const w = Math.round(1 + y * 0.55); A(g, PO, 14 - w - 1, 8 + y, w * 2 + 3, 1); }
    for (let y = 0; y < 17; y++) { const w = Math.round(1 + y * 0.55); A(g, y % 5 < 2 ? '#ffe36a' : '#ff6fa4', 14 - w, 8 + y, w * 2 + 1, 1); }
    aEllO(g, '#ffffff', 14, 6, 3, 3); A(g, PO, 4, 25, 20, 1); A(g, '#ff8fb1', 5, 24, 18, 1);
  }),
  diary: mkIconHi(g => {
    boxO(g, 5, 3, 18, 22, '#8b6fe0'); A(g, '#b5a1ff', 6, 4, 16, 2); A(g, '#6a52b8', 6, 22, 16, 2);
    A(g, '#ffffff', 9, 8, 11, 12); A(g, '#d9d2f3', 9, 20, 11, 1);
    for (let i = 0; i < 4; i++) A(g, '#a79fd0', 10, 10 + i * 3, 9, 1);
    aEll(g, '#ff8fb1', 14, 14, 2, 2);
  }),
  furn: mkIconHi(g => {
    for (let y = 0; y < 18; y++) { const w = Math.round(1 + y * 0.7); A(g, PO, 14 - w - 1, 6 + y, w * 2 + 3, 1); }
    for (let y = 0; y < 18; y++) { const w = Math.round(1 + y * 0.7); A(g, y % 6 < 3 ? '#8fc7ff' : '#c6e4ff', 14 - w, 6 + y, w * 2 + 1, 1); }
    A(g, '#2f3a78', 11, 17, 6, 7); aEll(g, '#2f3a78', 14, 17, 3, 3); A(g, PO, 3, 24, 22, 1);
  }),
  gear: mkIconHi(g => {
    for (let i = 0; i < 8; i++) { const t = i * Math.PI / 4, x = Math.round(14 + Math.cos(t) * 10), y = Math.round(14 + Math.sin(t) * 10); aEll(g, PO, x, y, 3.5, 3.5); }
    for (let i = 0; i < 8; i++) { const t = i * Math.PI / 4, x = Math.round(14 + Math.cos(t) * 10), y = Math.round(14 + Math.sin(t) * 10); aEll(g, '#c9c1e8', x, y, 2.5, 2.5); }
    aEllO(g, '#c9c1e8', 14, 14, 8, 8); aEll(g, '#e6e0f8', 12, 12, 4, 4); aEllO(g, '#2a2548', 14, 14, 3, 3);
  })
};
function paintIcons() {
  document.querySelectorAll('[data-icon]').forEach(el => {
    const c = ICON[el.dataset.icon];
    if (!c) return;
    el.style.backgroundImage = `url(${c.toDataURL()})`;
  });
}

/* ---- dock logic ---- */
const dockEl = document.getElementById('dock');
let dockDrag = null;
function dockPos() {
  if (Prefs.dock) return Prefs.dock;
  return { x: window.innerWidth - 62, y: Math.round((Room.oy + 62) * S_PX) - 56 };
}
function placeDock() {
  const cssW = window.innerWidth, cssH = window.innerHeight;
  const p = dockPos();
  const x = clamp(p.x, 4, cssW - 44), y = clamp(p.y, 4, cssH - 44);
  if (Prefs.dock) { Prefs.dock.x = x; Prefs.dock.y = y; }
  dockEl.style.left = x + 'px'; dockEl.style.top = y + 'px';
  const roomAbove = y - 8, roomBelow = cssH - y - 52, want = 560;
  const up = roomAbove >= want || (roomBelow < want && roomAbove > roomBelow);
  dockEl.classList.toggle('up', up);
  dockEl.style.setProperty('--ph', Math.max(220, Math.min(want, (up ? roomAbove : roomBelow) - 6)) + 'px');
  dockEl.classList.toggle('alignR', x + 320 > cssW);
}
let dockOpenT = 0;
function openDock(open) {
  dockEl.classList.toggle('collapsed', !open);
  if (open) dockOpenT = 9;
}
const BAR_SEG = 10;
function setBar(id, v) {
  const el = document.getElementById(id);
  const n = Math.round(clamp(v, 0, 100) / 100 * BAR_SEG);
  if (el._n === n) return;
  el._n = n;
  el.innerHTML = '';
  for (let i = 0; i < BAR_SEG; i++) { const s = document.createElement('i'); if (i < n) s.className = 'on'; el.appendChild(s); }
  el.dataset.low = n <= 2 ? '1' : '0';
}
let hudT = 0;
function updateHud(dt) {
  hudT -= dt;
  dockOpenT -= dt;
  const hovering = dockEl.matches(':hover') || Interact.menuOpen;
  if (hovering) dockOpenT = Math.max(dockOpenT, 6);
  if (!dockEl.classList.contains('collapsed') && dockOpenT <= 0) openDock(false);
  if (hudT > 0) return;
  hudT = 0.25;
  const n = cat.needs;
  setBar('mSat', n.sat); setBar('mLove', n.love); setBar('mFun', n.fun); setBar('mClean', Room.clean);
  document.getElementById('dName').textContent = cat.name;
  document.getElementById('dAge').textContent = ageLabel() + ' · ' + personalityText(cat.baseTraits);
  document.getElementById('dClock').textContent = timeLabel();
  const mood = cat.weak > 0.35 ? '배고파서 힘이 없어요' : cat.bored > 0.4 ? '심심해서 근질근질해요' : cat.content ? '만족스러워요' : '';
  const md = document.getElementById('dMood'); md.textContent = mood; md.hidden = !mood;
  document.getElementById('dStatus').textContent = cat.status || '';
  const need = (n.sat < 30 && Room.bowl.food < 3) || Room.messes.length > 0 || n.love < 22;
  const tab = document.getElementById('dockTab');
  tab.classList.toggle('alert', need);
  const badge = document.getElementById('tabBadge');
  badge.textContent = Room.messes.length ? String(Room.messes.length) : '';
  badge.hidden = !Room.messes.length;
  for (const b of document.querySelectorAll('[data-mode]')) b.setAttribute('aria-pressed', String(Interact.mode === b.dataset.mode));
  document.getElementById('bToys').setAttribute('aria-pressed', String(!!Room.ball));
}
function bindDock() {
  paintIcons();
  const tab = document.getElementById('dockTab');
  tab.addEventListener('pointerdown', e => {
    Snd.wake();
    dockDrag = { sx: e.clientX, sy: e.clientY, x0: dockPos().x, y0: dockPos().y, moved: false };
    tab.setPointerCapture(e.pointerId);
  });
  tab.addEventListener('pointermove', e => {
    if (!dockDrag) return;
    if (!dockDrag.moved && Math.hypot(e.clientX - dockDrag.sx, e.clientY - dockDrag.sy) > 5) dockDrag.moved = true;
    if (dockDrag.moved) { Prefs.dock = { x: dockDrag.x0 + e.clientX - dockDrag.sx, y: dockDrag.y0 + e.clientY - dockDrag.sy }; placeDock(); }
  });
  tab.addEventListener('pointerup', () => {
    const d = dockDrag; dockDrag = null;
    if (!d) return;
    if (d.moved) savePrefs(); else openDock(dockEl.classList.contains('collapsed'));
  });
  tab.addEventListener('pointercancel', () => { dockDrag = null; });
  tab.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDock(dockEl.classList.contains('collapsed')); } });
  document.getElementById('bKibble').addEventListener('click', () => { Snd.wake(); pourKibble(); });
  document.getElementById('bChuru').addEventListener('click', () => { Snd.wake(); giveChuru(); });
  document.getElementById('bWand').addEventListener('click', () => { Snd.wake(); setMode('wand'); });
  document.getElementById('bLaser').addEventListener('click', () => { Snd.wake(); setMode('laser'); });
  document.getElementById('bToys').addEventListener('click', () => { Snd.wake(); showSheet('toys'); });
  document.getElementById('bBrush').addEventListener('click', () => { Snd.wake(); setMode('brush'); });
  document.getElementById('bNip').addEventListener('click', () => { Snd.wake(); placeNip(); });
  const showSheet = which => {
    const sheet = document.getElementById('sheet');
    const cur = sheet.dataset.view;
    const next = cur === which && !sheet.hidden ? '' : which;
    sheet.dataset.view = next; sheet.hidden = !next;
    document.getElementById('styleView').hidden = next !== 'style';
    document.getElementById('diaryView').hidden = next !== 'diary';
    document.getElementById('toysView').hidden = next !== 'toys';
    document.getElementById('furnView').hidden = next !== 'furn';
    document.getElementById('bStyle').setAttribute('aria-pressed', String(next === 'style'));
    document.getElementById('bDiary').setAttribute('aria-pressed', String(next === 'diary'));
    document.getElementById('bFurn').setAttribute('aria-pressed', String(next === 'furn'));
    if (next === 'style') paintStyleChips();
    if (next === 'toys') paintToyChips();
    if (next === 'furn') paintFurnChips();
    if (next === 'diary') { Diary.view = 0; paintDiary(); }
    dockOpenT = 9;
  };
  document.getElementById('bStyle').addEventListener('click', () => showSheet('style'));
  document.getElementById('bFurn').addEventListener('click', () => showSheet('furn'));
  document.getElementById('bDiary').addEventListener('click', () => showSheet('diary'));
  document.getElementById('diaryPrev').addEventListener('click', () => { Diary.view++; paintDiary(); });
  document.getElementById('diaryNext').addEventListener('click', () => { Diary.view--; paintDiary(); });
  const chip = (host, label, pressed, fresh, fn) => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = (fresh ? '★ ' : '') + label;
    b.setAttribute('aria-pressed', String(!!pressed));
    b.addEventListener('click', fn);
    host.appendChild(b);
  };
  const countOf = pre => { const all = Unlocks.catalog.filter(i => i.id.indexOf(pre) === 0); return all.filter(i => Unlocks.have.has(i.id)).length + '/' + all.length; };
  function paintStyleChips() {
    const mk = (hostId, group, list) => {
      const host = document.getElementById(hostId); host.innerHTML = '';
      chip(host, '없음', !(cat.outfit[group]), false, () => { cat.outfit[group] = ''; store.set('cat', catRecord()); Snd.pop(); paintStyleChips(); });
      for (const k in list) {
        const id = group + ':' + k;
        if (!owns(id)) continue;
        chip(host, list[k].n, cat.outfit[group] === k, Unlocks.fresh.has(id), () => { seen(id); cat.outfit[group] = k; store.set('cat', catRecord()); Snd.pop(); emote('heart', 1.2); paintStyleChips(); });
      }
    };
    mk('collarChips', 'collar', COLLARS); mk('hatChips', 'hat', HATS);
  }
  function paintToyChips() {
    const host = document.getElementById('toyChips'); host.innerHTML = '';
    document.getElementById('toyCount').textContent = '(' + (2 + countOf('toy:').split('/')[0] * 1) + '/' + (2 + countOf('toy:').split('/')[1] * 1) + ')';
    for (const k in TOYS) {
      if (!ownsToy(k)) continue;
      const id = 'toy:' + k;
      chip(host, TOYS[k].n, Room.ball && Room.ball.kind === k, Unlocks.fresh.has(id), () => {
        Snd.wake(); seen(id);
        if (Room.ball && Room.ball.kind === k) putBallAway(); else spawnBall(k);
        paintToyChips();
      });
    }
  }
  function paintFurnChips() {
    const host = document.getElementById('furnChips'); host.innerHTML = '';
    document.getElementById('furnCount').textContent = '(' + countOf('furn:') + ')';
    let any = false;
    for (const k of FURN_KEYS) {
      if (!ownsFurn(k)) continue;
      any = true;
      const id = 'furn:' + k;
      chip(host, FURN[k].n, Room.furn[k].out, Unlocks.fresh.has(id), () => { seen(id); setFurnOut(k, !Room.furn[k].out); Snd.pop(); toast(Room.furn[k].out ? FURN[k].n + '을(를) 꺼냈어요' : FURN[k].n + '을(를) 치웠어요'); paintFurnChips(); });
    }
    if (!any) { const p = document.createElement('span'); p.className = 'hint'; p.textContent = '아직 가구가 없어요'; host.appendChild(p); }
    const skinRow = (hostId, g) => {
      const h = document.getElementById(hostId); h.innerHTML = '';
      for (const k in SKINS[g]) {
        if (!ownsSkin(g, k)) continue;
        const id = 'skin:' + g + ':' + k;
        chip(h, SKINS[g][k].n, Skin[g] === k, Unlocks.fresh.has(id), () => { seen(id); setSkin(g, k); Snd.pop(); paintFurnChips(); });
      }
    };
    { const bh = document.getElementById('baseChips'); bh.innerHTML = ''; chip(bh, '스크래처', postOn(), false, () => { setPostOut(!postOn()); Snd.pop(); toast(postOn() ? '스크래처를 꺼냈어요' : '스크래처를 치웠어요'); paintFurnChips(); }); chip(bh, '침대', bedOn(), false, () => { setBedOut(!bedOn()); Snd.pop(); toast(bedOn() ? '침대를 꺼냈어요' : '침대를 치웠어요'); paintFurnChips(); }); }
    skinRow('skinBowl', 'bowl'); skinRow('skinWater', 'water'); skinRow('skinLitter', 'litter'); skinRow('skinBed', 'bed');
  }
  window.refreshSheets = () => {
    const sh = document.getElementById('sheet'); if (sh.hidden) return;
    if (sh.dataset.view === 'style') paintStyleChips(); else if (sh.dataset.view === 'toys') paintToyChips(); else if (sh.dataset.view === 'furn') paintFurnChips();
  };
  const menu = document.getElementById('menu');
  const setMenu = v => { Interact.menuOpen = v; menu.hidden = !v; dockOpenT = 9; };
  document.getElementById('bGear').addEventListener('click', () => { refreshMenu(); setMenu(menu.hidden); });
  document.getElementById('mAuto').addEventListener('click', () => {
    if (!Host.autostart) { toast('이 환경에서는 설정할 수 없어요'); return; }
    const cur = Host.autostart.get();
    if (!cur.ok) { toast('설치된 프로그램(.exe)에서만 설정할 수 있어요'); return; }
    const r = Host.autostart.set(!cur.on);
    refreshMenu();
    toast(r.on ? '컴퓨터를 켜면 고양이도 같이 나와요' : '자동 실행을 껐어요');
  });
  document.getElementById('mFs').addEventListener('click', () => {
    if (!Host.hideFs) return;
    const r = Host.hideFs.set(!Host.hideFs.get());
    refreshMenu();
    toast(r ? '게임·영상이 전체 화면이면 고양이가 숨어요' : '전체 화면 프로그램이 있어도 고양이가 계속 보여요');
  });
  document.getElementById('mQuiet').addEventListener('click', () => {
    Prefs.quiet = !Prefs.quiet; savePrefs(); Snd.quiet = Prefs.quiet; refreshMenu();
    toast(Prefs.quiet ? '고양이가 조용히 쉬어요 (우다다·울음 없음)' : '고양이가 다시 자유롭게 움직여요');
  });
  document.getElementById('mRoam').addEventListener('click', () => {
    Prefs.roam = Prefs.roam === false; savePrefs(); refreshMenu();
    toast(Prefs.roam !== false ? '고양이가 가끔 옆 모니터에 놀러 가요' : '고양이가 이 모니터에만 있어요');
  });
  document.getElementById('mBehind').addEventListener('click', () => {
    if (!Host.behind) return;
    const r = Host.behind.set(!Host.behind.get());
    refreshMenu();
    toast(r ? '고양이가 창 뒤로 숨었어요 (바탕화면에서만 보여요)' : '고양이가 다시 창 앞으로 나왔어요');
  });
  const refreshMenu = () => {
    if (Host.hideFs) { const f = document.getElementById('mFs'), on = Host.hideFs.get(); f.textContent = '전체 화면에서 숨기기: ' + (on ? '켜짐' : '꺼짐'); f.setAttribute('aria-pressed', String(on)); }
    if (Host.behind) { const b = document.getElementById('mBehind'), on = Host.behind.get(); b.textContent = '창 뒤로 숨기기: ' + (on ? '켜짐' : '꺼짐'); b.setAttribute('aria-pressed', String(on)); }
    document.getElementById('mSound').textContent = Snd.on ? '소리 켜짐' : '소리 꺼짐';
    { const r = document.getElementById('mRoam'); r.textContent = '다른 모니터 가보기: ' + (Prefs.roam !== false ? '켜짐' : '꺼짐'); r.setAttribute('aria-pressed', String(Prefs.roam !== false)); r.hidden = !(Host.display && Host.display.edges); }
    { const q = document.getElementById('mQuiet'); q.textContent = '조용히 있기: ' + (Prefs.quiet ? '켜짐' : '꺼짐'); q.setAttribute('aria-pressed', String(!!Prefs.quiet)); }
    document.getElementById('mSize').textContent = '고양이 크기 ' + ({ 2: '기본', 4: '크게', 6: '아주 크게' }[pickScale()] || '기본');
    document.getElementById('mPass').textContent = Prefs.passOnly ? '클릭 통과 전용: 켜짐' : '클릭 통과 전용: 꺼짐';
    document.getElementById('mPass').setAttribute('aria-pressed', String(Prefs.passOnly));
    const au = Host.autostart ? Host.autostart.get() : { on: false, ok: false };
    document.getElementById('mAuto').textContent = '자동 실행: ' + (au.on ? '켜짐' : '꺼짐');
    document.getElementById('mAuto').setAttribute('aria-pressed', String(!!au.on));
  };
  refreshMenuFn = refreshMenu;
  refreshMenu();
  document.getElementById('mSound').addEventListener('click', () => { Snd.wake(); Snd.setOn(!Snd.on); refreshMenu(); });
  document.getElementById('mSize').addEventListener('click', () => {
    const order = [2, 4, 6], i = order.indexOf(pickScale());
    Prefs.scale = order[(i + 1) % order.length]; savePrefs();
    const old = { x: cat.x * S_PX, y: cat.gy * S_PX };
    applyLayout();
    cat.x = clamp(old.x / S_PX, 8, W - 8); cat.gy = clamp(old.y / S_PX, GY_MIN, GY_MAX);
    refreshMenu();
  });
  document.getElementById('mPass').addEventListener('click', () => { Prefs.passOnly = !Prefs.passOnly; savePrefs(); refreshMenu(); toast(Prefs.passOnly ? '이제 고양이 쪽 클릭도 모두 통과해요' : '똥·그릇·털실공 클릭이 다시 켜졌어요'); });
  document.getElementById('mNew').addEventListener('click', () => { setMenu(false); openAdopt(); });
  document.getElementById('mQuit').addEventListener('click', () => Host.quit());
}

/* ---- adoption ---- */
const Adopt = { open: false, seed: 0, stage: 'intro', token: 0 };
const NAMES = ['보리', '두부', '치즈', '모찌', '콩이', '나비', '감자', '호두', '우유', '라떼', '쿠키', '마루', '별이', '솜이', '탄이', '몽이', '다래', '미오'];
const BOX_SPR = mkOutlined(26, 20, [
  [1, 6, 24, 14, '#d9a066'], [0, 3, 12, 5, '#e4b57c'], [14, 3, 12, 5, '#c98f58'], [11, 3, 4, 17, '#f0d9a8'],
  [4, 11, 3, 1, '#a97440'], [19, 14, 3, 1, '#a97440'], [8, 13, 10, 5, '#f7e8c4'], [12, 14, 2, 3, '#7a5236'], [12, 18, 2, 1, '#7a5236']
], OUTC);
let BOX_BIG = null;
function drawAdoptPreview(withCat) {
  // the picture is drawn at the real screen resolution, from the smoothed sprites (same look as the cat on the desktop)
  const ac = document.getElementById('adCanvas'), g = ac.getContext('2d');
  const k = ac.width / 130;                       // canvas pixels per art pixel
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.clearRect(0, 0, ac.width, ac.height);
  g.fillStyle = '#2e2750'; g.fillRect(0, Math.round(86 * k), ac.width, ac.height - Math.round(86 * k));   // floor; cat and box both stand with their feet at y = 92
  if (!withCat) {
    // the gift box, centred and standing on the floor line
    if (!BOX_BIG) BOX_BIG = smoothCanvas(BOX_SPR);
    const bw = BOX_SPR.width * 3 * k, bh = BOX_SPR.height * 3 * k;
    g.drawImage(BOX_BIG, Math.round((ac.width - bw) / 2), Math.round(93 * k - bh), bw, bh);
    return;
  }
  const R = Object.assign({}, POSES.sit, { hdx: 6, yaw: 0.15 });
  updateGrowth(); if (cat.kb < 0.999) for (const key of POSKEYS) if (R[key] !== undefined) R[key] *= cat.kb;
  renderCat(R, { tailFront: 0, bellyUp: 0, puff: 0 }, { eyes: 'open', mouth: 'closed', earN: 'normal', earF: 'normal', tailFlick: 0, whisk: 0, tilt: 0, blush: 1, tm: 0.4 }, cat.K);
  if (smOk) g.drawImage(smCanvas, 20 * SMK, 36 * SMK, 130 * SMK, 100 * SMK, 0, 0, ac.width, ac.height);
  else { g.imageSmoothingEnabled = false; g.drawImage(sCanvas, 20, 36, 130, 100, 0, 0, ac.width, ac.height); }
}
function openAdopt() {
  Adopt.open = true; Adopt.stage = 'intro';
  const el = document.getElementById('adopt');
  el.hidden = false;
  document.getElementById('adText').innerHTML = '상자 속에서 뭔가 꿈틀거려요.<br>어떤 아이가 올까요?';
  document.getElementById('adName').hidden = true;
  const btn = document.getElementById('adBtn');
  btn.textContent = '입양하기'; btn.disabled = false;
  document.getElementById('adAgain').hidden = true;
  document.getElementById('adCanvas').classList.remove('shake');
  // someone who already has a cat can change their mind (the very first adoption has nothing to go back to)
  const sv = store.get('cat', null);
  document.getElementById('adCancel').hidden = !(sv && sv.seed !== undefined);
  cat.visible = false;
  dockEl.hidden = true;
  const ac = document.getElementById('adCanvas');
  const cssW = Math.round(130 * S_PX / SS), cssH = Math.round(100 * S_PX / SS);
  ac.style.width = cssW + 'px'; ac.style.height = cssH + 'px';   // the same size the cat has on the desktop
  ac.width = Math.max(130, Math.round(cssW * (window.devicePixelRatio || 1))); ac.height = Math.round(ac.width * 100 / 130);   // drawn at real screen resolution
  Host.setFocusable(true);
  drawAdoptPreview(false);
}
// back out of the adoption: the cat that was there before comes back exactly as it was
function adoptCancel() {
  if (!Adopt.open) return;
  const sv = store.get('cat', null);
  if (!(sv && sv.seed !== undefined)) return;
  Adopt.token++;                                  // a roll that is still shaking must not land afterwards
  cat.name = sv.name || cat.name; cat.seed = sv.seed; cat.cv = sv.cv || 1; cat.born = sv.born || cat.born; cat.outfit = sv.outfit || { collar: '', hat: '' };
  setCoat(genCoat(sv.seed, cat.cv));
  document.getElementById('adCanvas').classList.remove('shake');
  document.getElementById('adopt').hidden = true;
  Adopt.open = false;
  dockEl.hidden = false;
  Host.setFocusable(false);
  cat.visible = true;
  Snd.pop();
  toast('입양을 취소했어요');
}
function adoptRoll() {
  Snd.wake();
  const btn = document.getElementById('adBtn'), again = document.getElementById('adAgain');
  btn.disabled = true; again.disabled = true;
  document.getElementById('adName').hidden = true;
  drawAdoptPreview(false);
  const ac = document.getElementById('adCanvas');
  ac.classList.add('shake');
  document.getElementById('adText').textContent = '두근두근…';
  for (let i = 0; i < 5; i++) setTimeout(() => Snd.pop(), i * 260);
  const myToken = ++Adopt.token;
  setTimeout(() => {
    if (myToken !== Adopt.token || !Adopt.open) return;       // cancelled meanwhile
    ac.classList.remove('shake');
    Adopt.seed = (Math.random() * 4294967296) >>> 0;
    const coat = genCoat(Adopt.seed, 2);
    cat.born = Date.now(); cat.outfit = { collar: '', hat: '' };       // every new cat arrives as a kitten
    setCoat(coat);
    drawAdoptPreview(true);
    Snd.meow('mew', 0.9); Snd.sparkle();
    document.getElementById('adText').innerHTML = `<b>${coat.label}</b> 아기 고양이가 왔어요!<br><span>${coat.extra.join(' · ')}<br>성격: ${personalityText(personalityFor(Adopt.seed))}</span>`;
    document.getElementById('adName').hidden = false;
    const inp = document.getElementById('nameInput');
    inp.value = pick(NAMES);
    btn.textContent = '집으로 데려가기'; btn.disabled = false;
    again.hidden = false; again.disabled = false;
    Adopt.stage = 'reveal';
    inp.focus(); inp.select();
  }, 1500);
}
function adoptConfirm() {
  const name = (document.getElementById('nameInput').value || '').trim().slice(0, 8) || pick(NAMES);
  cat.name = name;
  store.del('state');                       // a new cat starts with fresh needs
  cat.seed = Adopt.seed; cat.cv = 2; cat.born = Date.now(); cat.outfit = { collar: '', hat: '' };
  store.set('cat', catRecord());   // (the old cat stays saved until this moment)
  document.getElementById('adopt').hidden = true;
  Adopt.open = false;
  dockEl.hidden = false;
  setTimeout(() => { if (Host.autostart && Host.autostart.get().ok && !Host.autostart.get().on) toast('컴퓨터를 켤 때 같이 나오게 하려면 톱니바퀴에서 자동 실행을 켜세요'); }, 6000);
  Host.setFocusable(false);
  spawnCat(true);
}
function bindAdopt() {
  document.getElementById('adBtn').addEventListener('click', () => { if (Adopt.stage === 'intro') adoptRoll(); else adoptConfirm(); });
  document.getElementById('adAgain').addEventListener('click', () => adoptRoll());
  document.getElementById('adCancel').addEventListener('click', () => adoptCancel());
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && Adopt.open) adoptCancel(); });
  document.getElementById('nameInput').addEventListener('keydown', e => { if (e.key === 'Enter') adoptConfirm(); });
}

/* ---- arrival & start ---- */
function* bArrive() {
  S('{n}가 상자 안에서 빼꼼 쳐다봐요');
  setPose('sit', { yaw: 0, hdx: 3 }); face('wide'); lookViewer(1);
  yield* wait(1.0);
  emote('heart', 1.6); sayMeow('mew'); face('shine');
  yield* wait(1.4);
  lookFree();
  yield* leaveSurface();
  setPose('sit'); face('open'); yield* wait(0.6);
  yield* stretchSeq();
}
BEH.arrive = bArrive;

function spawnCat(arrive) {
  cat.visible = true;
  cat.gen = null; cat.label = ''; cat.add = {}; cat.pend = null;
  cat.baseTraits = personalityFor(cat.seed);
  cat.traits = Object.assign({}, cat.baseTraits);          // the character comes from the seed and stays
  const st = store.get('state', null);
  if (st) {
    Object.assign(cat.needs, st.needs || {});
    if (st.affinity) cat.affinity = st.affinity;
    cat.needs.sat = Math.max(cat.needs.sat, 25); cat.needs.love = Math.max(cat.needs.love, 20);
  } else { cat.needs = { sat: 56, love: 62, fun: 64, energy: 82, bowel: 62 }; }
  if (arrive) {
    cat.x = Room.box.x; cat.gy = Room.box.by - 3; cat.surface = 'box'; cat.sortOverride = Room.box.by; cat.dir = -1;
    setPose('sit', { yaw: 0, hdx: 3 }); cat.forced = 'arrive';
  } else {
    cat.x = clamp(Room.cushion.x - rnd(30, 120), 20, W - 20); cat.gy = Room.oy + rnd(86, 108); cat.surface = 'floor'; cat.sortOverride = null;
    setPose('stand');
  }
  cat.p = Object.assign({}, cat.tgt);
}
const catRecord = () => ({ seed: cat.seed, cv: cat.cv || 1, name: cat.name, born: cat.born, outfit: cat.outfit });   // cv: coat version (a cat keeps the look it was born with)
function saveState() {
  store.set('state', { needs: cat.needs, traits: cat.traits, affinity: cat.affinity });
}

/* ---- click-through: the window only captures the mouse where something is clickable ---- */
let capturing = false, lastHoverStyle = '';
function wantCapture() {
  if (Adopt.open) return true;
  if (Interact.draggingBall || Interact.drag || dockDrag) return true;
  if (Inp.downAt && performance.now() - Inp.downAt < 4000) return true;     // never let go of the window while a mouse button is held (the release must reach us too)
  const C = Desk.cursor;
  const el = document.elementFromPoint(C.x * S_PX, C.y * S_PX);
  if (el && el.closest && el.closest('[data-hit]') && !el.closest('[hidden]')) return true;
  if (Prefs.passOnly) return false;
  if (Desk.lbtn && cat.visible && Math.hypot(C.x - cat.x, C.y - (cat.gy - 8)) < 34) return true;     // a file may be dragged onto the cat
  return Interact.hover === 'gift' || Interact.hover === 'mess' || Interact.hover === 'ball' || Interact.hover === 'churu' || Interact.hover === 'prop' || Interact.hover === 'cat';
}
function captureTick() {
  const want = wantCapture();
  if (want !== capturing) { capturing = want; Host.setCapture(want); }
  if (!Interact.drag) {
    const style = Interact.hover === 'mess' ? 'pointer' : Interact.hover ? 'grab' : '';
    if (style !== lastHoverStyle) { lastHoverStyle = style; document.body.style.cursor = style; }
  }
}

/* ---- main loop ---- */
let lastTs = 0, saveT = 0, started = false;
// the heartbeat only counts while frames are really being drawn, so a page that has stopped animating (frozen) gets restarted by the main process
let lastFrameAt = performance.now();
const Inp = { mv: 0, dn: 0, downAt: 0 };
window.Inp = Inp;
window.addEventListener('pointermove', () => { Inp.mv++; }, true);
window.addEventListener('pointerdown', () => { Inp.dn++; Inp.downAt = performance.now(); if (Host.ptrDown) Host.ptrDown(); }, true);
for (const t of ['pointerup', 'pointercancel']) window.addEventListener(t, () => { Inp.downAt = 0; }, true);
setInterval(() => {
  if (Host.heartbeat && performance.now() - lastFrameAt < 3000) Host.heartbeat({ cx: Desk.cursor.x * S_PX, cy: Desk.cursor.y * S_PX, iw: window.innerWidth, ih: window.innerHeight, dpr: window.devicePixelRatio, cap: capturing, adopt: !!Adopt.open, mv: Inp.mv, dn: Inp.dn, foc: document.hasFocus(), vis: document.visibilityState });
}, 400);
function frame(ts) {
  const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
  lastTs = ts; NOW += dt; lastFrameAt = performance.now();
  if (started) {
    updateRoom(dt);
    updateTools(dt); updateFurn(dt);
    reactionsUpdate(dt); updateGift(dt); presentUpdate(dt); skinMenuUpdate(dt);
    interactUpdate(dt);
    if (cat.visible) { catUpdate(dt); urgentCheck(); surpriseCheck(dt); diaryTick(dt); }
    updateHud(dt);
    captureTick();
    saveT -= dt;
    if (saveT <= 0) { saveT = 15; saveState(); }
  }
  ctx.setTransform(S_PX * DPR, 0, 0, S_PX * DPR, 0, 0);
  ctx.imageSmoothingEnabled = false;
  drawWorld(ctx, W, H);
  requestAnimationFrame(frame);
}

function boot() {
  const dm = /[?&]day=([0-9.]+)/.exec(location.search); if (dm) Room.devDay = parseFloat(dm[1]);
  bubblesEl = document.getElementById('bubbles');
  applyLayout();
  Snd.quiet = !!Prefs.quiet;
  buildCatalog();
  bindDock(); bindAdopt();
  document.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('dragenter', e => { e.preventDefault(); Desk.fileDrag = NOW; });
  window.addEventListener('dragover', e => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; Desk.fileDrag = NOW; });
  window.addEventListener('dragleave', () => { Desk.fileDrag = 0; });
  window.addEventListener('drop', onFileDrop);
  window.addEventListener('contextmenu', e => { e.preventDefault(); if (Host.mock) { const q = logicalFromEvent(e); Desk.cursor.x = q.x; Desk.cursor.y = q.y; if (!openSkinMenu()) dismissToys(); } });
  window.addEventListener('resize', () => { applyLayout(); });
  Host.onCursor(p => { Desk.cursor.x = p.x / S_PX; Desk.cursor.y = p.y / S_PX; });
  Host.onDesk(d => setDeskData(d));
  if (Host.onDisplay) Host.onDisplay(disp => {
    Host.display = disp; applyLayout();
    dockEl.hidden = !isHome() || Adopt.open;
    if (!isHome()) { Desk.wins = []; Desk.icons = []; Desk.vis = []; }
    onDisplayChange(disp);
  });
  if (Host.onCommand) Host.onCommand(cmd => {
    if (cmd === 'new-cat') openAdopt();
    if (cmd === 'sound') { Snd.setOn(!Snd.on); }
    if (cmd === 'call-home' && !isHome() && cat.visible) interrupt(bGoHome, 'goHome');
    if (cmd === 'pass') { Prefs.passOnly = !Prefs.passOnly; savePrefs(); }
    if (cmd === 'rclick') { if (!openSkinMenu()) dismissToys(); }
    if (cmd === 'lclick') { Desk.lbtn = true; dismissPlayToys(); }
    if (cmd === 'lup') Desk.lbtn = false;
    if (cmd === 'refresh' && refreshMenuFn) refreshMenuFn();
  });
  const saved = store.get('cat', null);
  if (saved && saved.seed !== undefined) {
    cat.name = saved.name || '보리';
    cat.seed = saved.seed; cat.born = saved.born || (Date.now() - 14 * 86400000); cat.outfit = saved.outfit || { collar: '', hat: '' };
    if (!saved.born) { store.set('cat', catRecord()); }
    cat.cv = saved.cv || 1;
    setCoat(genCoat(saved.seed, cat.cv));
    spawnCat(false);
  } else openAdopt();
  started = true;
  window.addEventListener('beforeunload', saveState);
  requestAnimationFrame(frame);
}
window.__cd = { cat, Room, Desk, Interact, Toy, S: () => S_PX, genCoat, setCoat, spawnCat, openAdopt, BEH, startBehavior, interrupt, chooseNext };
boot();
