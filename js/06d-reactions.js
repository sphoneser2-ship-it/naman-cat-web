/* ============ reacting to the desktop: the user coming back, idle stares, new windows, files dropped on the cat ============ */
const React = { seen: new Set(), first: true, idleMax: 0, greetDay: '', noticeCd: 0, glanceCd: 0, lastGift: 0 };
const userIdle = () => (Desk.sysIdle !== undefined ? Desk.sysIdle : Desk.cursor.idle);

/* ---------- new windows (a messenger popup in the corner, an app opening ...) ---------- */
function onDeskWindows(wins) {
  // wins: raw rects in css px
  const ids = new Set(wins.map(w => w.id));
  if (!React.first) {
    for (const w of wins) {
      if (React.seen.has(w.id)) continue;
      const small = w.w <= 560 && w.h <= 380;
      const corner = w.x + w.w > window.innerWidth * 0.55 && w.y + w.h > window.innerHeight * 0.45;
      if (small && corner && React.noticeCd <= 0) { React.noticeCd = 25; noticePopup(w); }
      else if (React.glanceCd <= 0 && chance(0.4)) { React.glanceCd = 20; glanceAt((w.x + w.w / 2) / S_PX, (w.y + w.h / 2) / S_PX); }
    }
  }
  React.seen = ids; React.first = false;
}
function noticePopup(w) {
  if (!cat.visible || cat.protect || cat.label === 'pet' || cat.label === 'carried' || cat.label === 'churu') return;
  Room.popup = { x: (w.x + w.w / 2) / S_PX, y: (w.y + w.h / 2) / S_PX, t: NOW };
  interrupt(bNotice, 'notice');
}
function glanceAt(x, y) {
  if (!cat.visible || cat.asleep || cat.protect) return;
  if (!['idleSit', 'idleStand', 'loaf', 'wander', 'groom', 'sit'].includes(cat.label)) return;
  interrupt(function* () {
    lookAtPt(x, y, 1); cat.earN = 'fwd'; cat.earF = 'fwd';
    yield* wait(rnd(1.4, 2.4));
    lookFree(); cat.earN = 'normal'; cat.earF = 'normal';
  }, 'glance');
}
function* bNotice() {
  const P = Room.popup || { x: Desk.cursor.x, y: Desk.cursor.y };
  cat.asleep = false;
  S('{n}가 어디선가 나타난 창에 깜짝 놀랐어요!');
  setPose('stand'); face('wide', 'closed', 'fwd'); lookAtPt(P.x, P.y, 1); emote('alert', 1.4);
  yield* wait(0.5);
  if (chance(0.6)) {
    S('{n}가 무슨 일인지 구경하러 가요');
    yield* walkTo(clamp(P.x - 40, 14, W - 14), clamp(P.y + 24, GY_MIN, GY_MAX), { speed: SPD.trot, timeout: 8 });
    setPose('sit'); face('open', 'closed', 'fwd'); lookAtPt(P.x, P.y, 1);
    yield* wait(rnd(3, 6), e => { if (chance(DT * 0.8)) { cat.twN = 0.14; } });
  } else yield* wait(rnd(1.8, 3));
  lookFree(); face('half'); yield* wait(0.4);
}
BEH.notice = bNotice;

/* ---------- the user is back / has been idle ---------- */
function* bGreet() {
  cat.asleep = false;
  const h = hourNow(), today = dayKey();
  const morning = h >= 5 && h < 11 && React.greetDay !== today;
  if (morning) React.greetDay = today;
  S(morning ? '{n}가 아침 인사를 하러 와요' : '{n}가 돌아온 걸 알고 마중을 나와요');
  face('shine', 'closed', 'fwd'); emote('heart', 1.4); sayMeow('chirp', 0.7);
  yield* walkTo(clamp(Desk.cursor.x + (chance(0.5) ? -30 : 30), 14, W - 14), clamp(Desk.cursor.y + 18, GY_MIN, GY_MAX), { speed: SPD.run, timeout: 10, noVigor: true });
  setPose('sit', { yaw: 0, hdx: 3 }); lookViewer(1); face('shine');
  yield* wait(0.5);
  sayMeow(morning ? 'long' : 'mew', 0.8); cat.mouth = 'open1'; yield* wait(0.4); cat.mouth = 'closed';
  yield* slowBlinkAtViewer();
  if (morning) { yield* stretchSeq(); }
  cat.needs.love = Math.min(100, cat.needs.love + 5);
  markContent();
  lookFree();
}
BEH.greet = bGreet;

function* bWatchOver() {
  S('{n}가 뭐 하나 궁금해서 지켜봐요');
  yield* walkTo(clamp(Desk.cursor.x + (chance(0.5) ? -34 : 34), 14, W - 14), clamp(Desk.cursor.y + 16, GY_MIN, GY_MAX), { speed: SPD.walk, timeout: 14 });
  setPose('sit', { yaw: 0, hdx: 3 }); lookViewer(1); face('open', 'closed', 'fwd');
  let el = 0, nx = rnd(2, 4);
  while (el < rnd(14, 30) && userIdle() > 20) {
    el += DT;
    if (el > nx) {
      nx = el + rnd(3, 6);
      const a = wchoose([{ k: 'blink', w: 3 }, { k: 'tilt', w: 2 }, { k: 'ask', w: 2 }, { k: 'mew', w: 1 }]);
      if (a === 'blink') yield* slowBlinkAtViewer();
      else if (a === 'tilt') yield* headTilt();
      else if (a === 'ask') { emote('ask', 1.6); face('shine'); }
      else { sayMeow('mew', 0.5); cat.mouth = 'open1'; yield* wait(0.4); cat.mouth = 'closed'; }
    }
    yield;
  }
  lookFree();
  if (userIdle() < 5) { emote('heart', 1.2); face('shine'); yield* wait(0.6); }
}
BEH.watchOver = bWatchOver;

function applyReactionWeights(w) {
  w.gift = Room.gift && !Room.gift.done ? 40 : 0;                      // an unopened present is hard to ignore
  const idle = userIdle();
  w.watchOver = idle > 120 && idle < 900 && !isDeepNight() && !isQuiet() ? 0.5 + cat.needs.love / 100 : 0;
}
function reactionsUpdate(dt) {
  React.noticeCd = Math.max(0, React.noticeCd - dt);
  React.glanceCd = Math.max(0, React.glanceCd - dt);
  const idle = userIdle();
  React.idleMax = Math.max(React.idleMax, idle);
  if (idle < 3 && React.idleMax > 600) {
    React.idleMax = 0;
    if (cat.visible && !cat.protect && !isQuiet() && cat.label !== 'pet' && cat.label !== 'carried') interrupt(bGreet, 'greet');
  } else if (idle < 3 && React.idleMax <= 600) React.idleMax = 0;
}

/* ---------- files dropped on the cat become presents ---------- */
const GIFT_KINDS = {
  paper: ['txt', 'doc', 'docx', 'hwp', 'hwpx', 'pdf', 'xls', 'xlsx', 'ppt', 'pptx', 'md', 'csv', 'rtf'],
  photo: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'heic', 'psd'],
  media: ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'mp4', 'mkv', 'avi', 'mov', 'wmv'],
  danger: ['exe', 'msi', 'bat', 'cmd', 'scr', 'dll', 'ps1', 'vbs', 'jar'],
  box: ['zip', 'rar', '7z', 'tar', 'gz', 'iso']
};
function giftKind(name, isDir) {
  if (isDir) return 'box';
  const m = /\.([A-Za-z0-9]+)$/.exec(name || '');
  const ext = m ? m[1].toLowerCase() : '';
  for (const k in GIFT_KINDS) if (GIFT_KINDS[k].includes(ext)) return k;
  return 'misc';
}
function onFileDrop(e) {
  e.preventDefault();
  Desk.fileDrag = 0;
  const dt = e.dataTransfer;
  if (!dt || !dt.files || !dt.files.length) return;
  const name = dt.files[0].name || '선물';
  let isDir = false;
  try { const it = dt.items && dt.items[0]; const en = it && it.webkitGetAsEntry && it.webkitGetAsEntry(); isDir = !!(en && en.isDirectory); } catch (err) { isDir = false; }
  const kind = giftKind(name, isDir);
  const q = logicalFromEvent(e);
  Room.gift = { x: clamp(q.x, 16, W - 16), gy: clamp(q.y + 10, GY_MIN + 6, GY_MAX), kind, name, t: 0, vx: 0, vgy: 0, sat: false, fade: 0 };
  Snd.pop(); Snd.sparkle();
  toast('「' + (name.length > 14 ? name.slice(0, 13) + '…' : name) + '」을(를) 선물했어요');
  Interact.petRetry = Math.max(Interact.petRetry, 12);        // the cursor is still on the cat: do not start petting over the present
  if (cat.visible && !cat.protect && cat.label !== 'carried') { cat.pend = null; interrupt(bGift, 'gift'); }
}
function giftHit(x, y) {
  const g = Room.gift;
  return !!g && Math.abs(x - g.x) < 10 && y > g.gy - 14 && y < g.gy + 3;
}
function updateGift(dt) {
  const g = Room.gift;
  if (!g) return;
  g.t += dt;
  g.x += g.vx * dt; g.gy += g.vgy * dt;
  g.vx *= Math.exp(-3 * dt); g.vgy *= Math.exp(-3 * dt);
  g.x = clamp(g.x, 12, W - 12); g.gy = clamp(g.gy, GY_MIN + 4, GY_MAX);
  if (g.t > 180 && cat.label !== 'gift') { g.fade += dt; if (g.fade > 1.2) removeGift(); }
}
function removeGift(poof = true) {
  const g = Room.gift; if (!g) return;
  if (poof) spawn('poof', g.x, g.gy - 5, { life: 0.55, rot: rnd(3) });
  Room.gift = null;
}
function* bGift() {
  const g = Room.gift;
  if (!g) return;
  try { yield* giftBody(g); } finally { if (Room.gift === g) g.done = true; }
}
function* giftBody(g) {
  cat.asleep = false;
  S('{n}가 처음 보는 선물을 발견했어요!');
  face('wide', 'closed', 'fwd'); lookAt(() => (Room.gift ? { x: Room.gift.x, y: Room.gift.gy - 4 } : null), 1); emote('alert', 1.2);
  yield* wait(0.35);
  yield* walkTo(g.x - 14 * (cat.x < g.x ? 1 : -1), g.gy, { speed: SPD.trot, timeout: 10, tol: 2 });
  if (!Room.gift) return;
  yield* turnTo(sgn(g.x - cat.x), true);
  setPose('sniff'); face('wide');
  yield* wait(rnd(1.2, 2), e => { cat.add.hdy = Math.sin(e * 8) * 0.7; });
  cat.add = {};
  const k = g.kind;
  if (k === 'danger') {
    S('{n}가 수상한 냄새에 하악질을 해요!');
    setPose('spook'); face('strain', 'open1', 'flat'); Snd.hiss(); emote('alert', 1.2); cat.tailFlick = 60;
    yield* wait(0.7);
    S('{n}가 선물을 멀리 걷어차 버려요');
    setPose('swat'); Snd.swat(); yield* wait(0.12);
    if (Room.gift) { Room.gift.vx = cat.dir * 150; Room.gift.vgy = rnd(-20, 20); }
    yield* wait(0.4);
    setPose('stand'); face('half', 'frown'); yield* wait(0.6);
    yield* headShake();
    removeGift(); return;
  }
  if (k === 'paper' || k === 'photo') {
    S('{n}가 ' + (k === 'paper' ? '종이' : '사진') + ' 위에 올라가 앉아요');
    yield* walkTo(g.x, g.gy + 0.6, { speed: SPD.creep * 1.5, tol: 1.5, timeout: 4 });
    setPose('crouch'); face('half'); yield* wait(0.3);
    setPose('loaf'); face('half'); cat.purr = 0.25; cat.blush = 1; Room.gift && (Room.gift.sat = true);
    yield* knead();
    setPose('loaf'); face('half'); cat.purr = 0.3; cat.blush = 1;
    S('{n}가 선물 위에서 식빵을 구워요');
    const dur = rnd(18, 36); let el = 0, nx = rnd(3, 6);
    while (el < dur) { el += DT; if (el > nx) { nx = el + rnd(3, 7); const a = wchoose([{ k: 'doze', w: 2 }, { k: 'sblink', w: 1.5 }, { k: 'yawn', w: 1 }]); if (a === 'sblink') yield* slowBlinkAtViewer(); else if (a === 'yawn') yield* yawn(); else { cat.eyes = 'sleep'; yield* wait(rnd(2, 4)); cat.eyes = 'half'; } } yield; }
    cat.purr = 0; cat.blush = 0; markContent();
    if (Room.gift) Room.gift.sat = false;
    setPose('stand'); face('half'); yield* wait(0.4);
    return;
  }
  if (k === 'box') {
    S('{n}가 상자를 보고 눈이 반짝여요!');
    face('shine'); emote('heart', 1.2);
    yield* walkTo(g.x, g.gy + 0.6, { speed: SPD.walk, tol: 1.5, timeout: 4 });
    yield* hop(g.x, g.gy + 0.6, 7, 0.4);
    setPose('sit', { yaw: 0, hdx: 3 }); face('shine'); lookViewer(1); cat.purr = 0.5; Room.gift && (Room.gift.sat = true);
    S('{n}가 상자 안에 쏙 들어앉았어요');
    yield* wait(rnd(14, 26), e => { cat.add.hdy = Math.sin(e * 1.4) * 0.5; });
    cat.purr = 0; if (Room.gift) Room.gift.sat = false;
    markContent(); yield* leaveSurface();
    return;
  }
  if (k === 'media') {
    S('{n}가 소리가 나는 것 같다며 귀를 쫑긋해요');
    setPose('sit'); face('shine', 'closed', 'fwd'); cat.purr = 0.35;
    yield* wait(rnd(10, 16), e => {
      cat.add.hdy = Math.sin(e * 5) * 0.8; cat.add.pitch = Math.sin(e * 5) * 0.12;
      if (chance(DT * 0.9)) spawn('note', cat.headAbs.x + rnd(-8, 8), cat.headAbs.y - 10, { vy: -rnd(8, 14), life: 1.5, ph: rnd(6) });
    });
    cat.add = {}; cat.purr = 0; face('half'); markContent();
    return;
  }
  // anything else: a new toy
  S('{n}가 선물을 장난감처럼 톡톡 굴려요');
  for (let i = 0; i < rint(3, 5); i++) {
    if (!Room.gift) break;
    const G = Room.gift;
    const dx = G.x - cat.x;
    if (Math.abs(dx) > 18) { yield* walkTo(G.x - sgn(dx) * 11, G.gy, { speed: SPD.trot, timeout: 2, tol: 2 }); }
    if (sgn(G.x - cat.x) !== cat.dir) yield* turnTo(sgn(G.x - cat.x), true);
    setPose('stand'); yield* wait(0.1); setPose('swat'); Snd.swat(); yield* wait(0.1);
    if (Room.gift) { Room.gift.vx = cat.dir * rnd(50, 90); Room.gift.vgy = rnd(-30, 30); }
    cat.needs.fun = Math.min(100, cat.needs.fun + 3);
    yield* wait(0.5); setPose('crouch'); cat.wiggle = 0.6; yield* wait(0.5); cat.wiggle = 0;
  }
  setPose('sit'); face('half'); markContent(); yield* lickNose();
}
BEH.gift = bGift;
