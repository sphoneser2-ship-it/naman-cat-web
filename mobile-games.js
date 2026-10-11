'use strict';
/* ============ mini-games with the cat (phone only) ============
   청기백기 · 무한의 계단 · 야바위. Each one gets harder and faster, but every difficulty curve stops at a
   level a child can still play (see the CAP notes). The only reward is beating your own best score.
   Playing makes the cat a little grubby, so it may need a bath afterwards. */
(function () {
  const A = window.__lifeApi;
  if (!A || typeof cat === 'undefined') return;
  const KEY = 'naman.mobile.games.v1';
  const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  const R = (a, b) => a + Math.random() * (b - a);
  const sfx = (n, ...a) => { try { if (Snd[n]) Snd[n](...a); } catch (e) { /* */ } };
  let best = {};
  try { best = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { best = {}; }
  const saveBest = () => { try { localStorage.setItem(KEY, JSON.stringify(best)); } catch (e) { /* */ } };

  /* ---------- friends' ranking (web only): a Google Sheet behind an Apps Script web app (see rank/Code.gs) ---------- */
  const RANK_URL = window.NAMAN_RANK_URL || '';
  const rankOn = () => !!RANK_URL && !window.NamanAndroid && navigator.onLine !== false;
  let rankDev = '';
  try { rankDev = localStorage.getItem('naman.mobile.rankDev') || ''; if (!rankDev) { rankDev = Math.random().toString(36).slice(2, 10); localStorage.setItem('naman.mobile.rankDev', rankDev); } } catch (e) { rankDev = Math.random().toString(36).slice(2, 10); }
  const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  async function rankFetch(body) {
    const ctl = typeof AbortController === 'function' ? new AbortController() : null;
    const tm = setTimeout(() => ctl && ctl.abort(), 12000);
    try {
      const r = await fetch(RANK_URL, body ? { method: 'POST', body: JSON.stringify(body), signal: ctl && ctl.signal } : { signal: ctl && ctl.signal });
      return await r.json();
    } catch (e) { return { ok: false, error: '인터넷 연결을 확인해 주세요' }; }
    finally { clearTimeout(tm); }
  }
  const rr = (g, x, y, w, h, r) => { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const ell = (g, x, y, rx, ry, c) => { g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2); g.fillStyle = c; g.fill(); };

  /* ---------- overlay ---------- */
  const el = document.createElement('div');
  el.id = 'games'; el.hidden = true; el.setAttribute('data-hit', '');
  el.innerHTML = '<canvas class="gcv"></canvas>' +
    '<div class="gtop"><b class="gtitle"></b><span class="gscore"></span><span class="gbest"></span><span class="glives"></span></div>' +
    '<button class="gclose" type="button" aria-label="놀이 그만하기">✕</button><button class="gquit" type="button" hidden>그만하기</button>' +
    '<div class="gmenu"></div><div class="gover" hidden></div><div class="gctl"></div>';
  document.body.appendChild(el);
  const cv = el.querySelector('.gcv'), ctl = el.querySelector('.gctl'), menu = el.querySelector('.gmenu'), over = el.querySelector('.gover');
  const G = { open: false, game: null, raf: 0, last: 0, startAt: 0, played: 0 };

  function* bGameHold() {
    cat.busy = true;
    try { cat.z = 0; setPose('sit'); face('open'); while (window.__bathOpen && G.open) { cat.z = 0; yield; } }
    finally { cat.busy = false; cat.add = {}; }
    setPose('stand'); yield* shiver(); setPose('sit'); face('happy');
  }
  bGameHold.keepSurface = true;

  function drawCatAt(g, x, y, k, dpr) {
    g.save();
    g.setTransform(k * dpr, 0, 0, k * dpr, (x - cat.x * k) * dpr, (y - cat.gy * k) * dpr);
    g.imageSmoothingEnabled = false;
    try { drawCat(g, NOW); } catch (e) { /* */ }
    g.restore();
  }
  const size = () => ({ W: innerWidth, H: innerHeight, dpr: Math.min(3, window.devicePixelRatio || 1) });

  function openGames() {
    if (G.open || window.__bathOpen) return;
    if (!cat.visible) { toast(A.nameGa() + ' 지금 방에 없어요'); return; }
    if (cat.protect) { toast('지금은 볼일 중이에요. 조금 이따가 놀아요'); return; }
    openDock(false); Room.emote = null;
    G.open = true; window.__bathOpen = true; G.played = 0;
    startBehavior(bGameHold, 'game');
    el.hidden = false;
    showMenu();
    G.last = 0; G.raf = requestAnimationFrame(frame);
  }
  function closeGames() {
    if (!G.open) return;
    const g = G.game; if (g && !g.over && g.score > (best[g.id] || 0)) { best[g.id] = g.score; saveBest(); }
    finishPlay();
    G.open = false; window.__bathOpen = false; el.hidden = true; G.game = null;
    cancelAnimationFrame(G.raf);
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) { /* */ }
  }
  // playing is fun, and a bit messy
  function finishPlay() {
    const sec = Math.round(G.played);
    if (sec < 5) return;
    if (cat.needs) cat.needs.fun = clampN(cat.needs.fun + Math.min(30, sec / 4), 0, 100);
    const dirt = Math.min(18, 3 + sec / 12);
    A.st.hyg = clampN(A.st.hyg - dirt, 0, 100); A.save();
    try { window.dispatchEvent(new CustomEvent('naman:care', { detail: { kind: 'game', sec } })); } catch (e) { /* */ }
    setTimeout(() => toast(A.nameGa() + ' 신나게 놀아서 꼬질꼬질해졌어요. 목욕시켜 줄까요?'), 600);
    G.played = 0;
  }
  // stopping early still counts: the score so far becomes the result (and a new best is kept)
  function quitGame() { const g = G.game; if (g && !g.over) gameOver(g.score, '여기까지 할게요'); }
  el.querySelector('.gquit').addEventListener('click', quitGame);
  el.querySelector('.gclose').addEventListener('click', () => {
    const g = G.game;
    if (g && !g.over) quitGame();
    else if (g || menu.querySelector('.grank')) showMenu();
    else closeGames();
  });

  const GAMES = [
    { id: 'flags', name: '청기백기', icon: '🚩', desc: '말하는 대로 깃발을 올리고 내려요' },
    { id: 'stairs', name: '무한의 계단', icon: '🪜', desc: '방향 전환과 오르기 버튼으로 계단을 올라가요' },
    { id: 'cups', name: '야바위', icon: '🐟', desc: '간식이 숨은 컵을 찾아요' }
  ];
  function setTop(title, score, lives) {
    el.querySelector('.gtitle').textContent = title || '놀이';
    el.querySelector('.gscore').textContent = score === undefined ? '' : '점수 ' + score;
    el.querySelector('.gbest').textContent = G.game ? '최고 ' + (best[G.game.id] || 0) : '';
    el.querySelector('.glives').textContent = lives === undefined ? '' : '❤'.repeat(Math.max(0, lives)) + '♡'.repeat(Math.max(0, 3 - lives));
  }
  function showMenu() {
    G.game = null; over.hidden = true; ctl.innerHTML = ''; menu.hidden = false;
    setTop(A.catName() + '와 놀기');
    menu.innerHTML = GAMES.map(g => `<button type="button" class="gcard" data-g="${g.id}"><span class="gi">${g.icon}</span><span class="gn"><b>${g.name}</b><small>${g.desc}</small></span><span class="gb">최고<br><b>${best[g.id] || 0}</b></span></button>`).join('');
    for (const b of menu.querySelectorAll('.gcard')) b.onclick = () => startGame(b.dataset.g);
    if (rankOn()) {
      const rb = document.createElement('button'); rb.type = 'button'; rb.className = 'grankbtn'; rb.innerHTML = '🏆 친구들 순위 보기';
      rb.onclick = () => showRank('flags'); menu.appendChild(rb);
    }
  }
  let rankBoards = null, rankAt = 0;
  async function showRank(id, force) {
    G.game = null; over.hidden = true; ctl.innerHTML = ''; menu.hidden = false;
    setTop('친구들 순위');
    const tabs = GAMES.map(g => `<button type="button" class="grtab${g.id === id ? ' on' : ''}" data-g="${g.id}">${g.icon} ${g.name}</button>`).join('');
    const paint = body => {
      menu.innerHTML = `<div class="grank"><div class="grtabs">${tabs}</div><div class="grlist">${body}</div>
        <div class="grow"><button type="button" data-a="re">새로고침</button><button type="button" data-a="back">놀이 목록</button></div></div>`;
      for (const b of menu.querySelectorAll('.grtab')) b.onclick = () => showRank(b.dataset.g);
      menu.querySelector('[data-a=re]').onclick = () => showRank(id, true);
      menu.querySelector('[data-a=back]').onclick = () => showMenu();
    };
    if (!rankBoards || force || performance.now() - rankAt > 30000) {
      paint('<p class="grmsg">불러오는 중…</p>');
      const r = await rankFetch();
      if (!G.open || !menu.querySelector('.grank')) return;
      if (!r || !r.ok) { paint(`<p class="grmsg">${esc((r && r.error) || '순위를 불러오지 못했어요')}</p>`); return; }
      rankBoards = r.boards || {}; rankAt = performance.now();
    }
    const list = rankBoards[id] || [], me = rankDev.slice(0, 3), myName = A.catName();
    paint(list.length ? '<ol>' + list.map((x, i) => `<li class="${x.dev === me && x.name === myName ? 'me' : ''}"><span class="grn">${i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</span><b>${esc(x.name)}</b><span class="grs">${x.score}</span><small>${esc(x.at || '')}</small></li>`).join('') + '</ol>'
      : '<p class="grmsg">아직 아무도 없어요. 첫 기록의 주인공이 되어 보세요!</p>');
  }
  function startGame(id) {
    menu.hidden = true; over.hidden = true;
    G.game = { id };                        // so the top bar already shows this game's best score
    G.game = { flags: newFlags, stairs: newStairs, cups: newCups }[id]();
    G.game.id = id;
    setTop(GAMES.find(x => x.id === id).name, 0, G.game.lives);
    G.startAt = performance.now();
  }
  function gameOver(score, why) {
    const g = G.game; if (!g || g.over) return;
    g.over = true;
    const prev = best[g.id] || 0, record = score > prev;
    if (record) { best[g.id] = score; saveBest(); sfx('fanfare'); setTimeout(() => sfx('meow', 'happy', 0.7), 500); }
    else sfx('meow', 'mew', 0.5);
    setTimeout(() => {
      if (G.game !== g) return;
      ctl.innerHTML = '';
      over.hidden = false;
      over.innerHTML = `<div class="gobox"><p class="gwhy">${why || ''}</p><p class="gsc">${score}<small>점</small></p>
        <p class="grec">${record ? '🎉 새 최고 기록!' : '최고 기록 ' + prev + '점'}</p>
        ${record && rankOn() ? '<button type="button" class="gpost">🏆 친구들 순위에 올리기</button>' : ''}
        <div class="grow"><button type="button" data-a="again">다시 하기</button><button type="button" data-a="menu">놀이 목록</button></div></div>`;
      const pb = over.querySelector('.gpost');
      if (pb) pb.onclick = async () => {
        pb.disabled = true; pb.textContent = '올리는 중…';
        const r = await rankFetch({ game: g.id, name: A.catName(), score, sec: Math.round(g.sec || 0), dev: rankDev });
        if (r && r.ok) { rankBoards = null; pb.textContent = r.rank ? `🎉 친구들 중 ${r.rank}등!` : '올렸어요! (아직 20등 밖)'; pb.classList.add('done'); }
        else { pb.disabled = false; pb.textContent = '다시 올리기 · ' + ((r && r.error) || '실패'); }
      };
      over.querySelector('[data-a=again]').onclick = () => startGame(g.id);
      over.querySelector('[data-a=menu]').onclick = () => showMenu();
      setTop(GAMES.find(x => x.id === g.id).name, score);
    }, 700);
  }
  function btn(label, cls, fn) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'gbtn ' + (cls || ''); b.innerHTML = label;
    b.addEventListener('pointerdown', e => { e.preventDefault(); fn(); });
    ctl.appendChild(b); return b;
  }

  /* ================= 청기백기 =================
     CAP: the time per command never drops below 1.3 s (1.8 s for two moves), and the tricky
     "don't" / "A 말고 B" commands only appear from score 5 / 15 on. */
  function speak(text) {
    try {
      if (!window.speechSynthesis || !Snd.on) return;
      const vs = window.speechSynthesis.getVoices().filter(v => /^ko/i.test(v.lang));
      if (!vs.length) return;
      const u = new SpeechSynthesisUtterance(text); u.voice = vs[0]; u.lang = 'ko-KR'; u.rate = 1.15; u.pitch = 1.3;
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
    } catch (e) { /* no voice */ }
  }
  function newFlags() {
    const g = { kind: 'flags', score: 0, lives: 3, b: false, w: false, ab: 0, aw: 0, cmd: null, t: 0, gap: 0.8, flash: null, over: false };
    ctl.innerHTML = '';
    const row1 = document.createElement('div'); row1.className = 'grow2';
    ctl.appendChild(row1);
    const mk = (label, cls, f, up) => { const b = btn(label, cls, () => press(g, f, up)); row1.appendChild(b); };
    mk('청기<br>올려 ▲', 'blue', 'b', true); mk('백기<br>올려 ▲', 'white', 'w', true);
    mk('청기<br>내려 ▼', 'blue', 'b', false); mk('백기<br>내려 ▼', 'white', 'w', false);
    setTop('청기백기', 0, 3);
    return g;
  }
  const FN = { b: '청기', w: '백기' };
  function nextCmd(g) {
    const s = g.score, cur = { b: g.b, w: g.w };
    const verb = (f, up) => FN[f] + (up ? ' 올려' : ' 내려');
    const flip = f => !cur[f];
    const f1 = Math.random() < 0.5 ? 'b' : 'w', f2 = f1 === 'b' ? 'w' : 'b';
    const r = Math.random();
    let cmd;
    if (s >= 15 && r < 0.25) {          // "A 말고 B": only B moves
      const up1 = flip(f1), up2 = flip(f2);
      cmd = { text: FN[f1] + (up1 ? ' 올리지 말고 ' : ' 내리지 말고 ') + verb(f2, up2), target: { [f1]: cur[f1], [f2]: up2 }, wait: false, moves: 1 };
    } else if (s >= 8 && r < 0.5) {     // two moves at once
      const up1 = flip(f1), up2 = flip(f2);
      cmd = { text: FN[f1] + (up1 ? ' 올리고 ' : ' 내리고 ') + verb(f2, up2), target: { [f1]: up1, [f2]: up2 }, wait: false, moves: 2 };
    } else if (s >= 5 && r < 0.72) {    // "don't"
      const up = flip(f1);
      cmd = { text: FN[f1] + (up ? ' 올리지 마' : ' 내리지 마'), target: { b: cur.b, w: cur.w }, wait: true, moves: 0 };
    } else {
      const up = flip(f1);
      cmd = { text: verb(f1, up), target: { [f1]: up, [f2]: cur[f2] }, wait: false, moves: 1 };
    }
    cmd.limit = Math.max(cmd.moves === 2 ? 1.8 : 1.3, (cmd.moves === 2 ? 3.6 : 3.0) - s * 0.06);
    if (cmd.wait) cmd.limit = Math.max(1.4, 2.4 - s * 0.03);
    cmd.left = cmd.limit;
    g.cmd = cmd; speak(cmd.text);
    face('open');
  }
  function press(g, f, up) {
    if (!g.cmd || g.over || g.gap > 0) return;
    if (g[f] === up) return;                     // already that way: nothing changes
    g[f] = up; sfx('swish');
    const c = g.cmd;
    if (g[f] !== c.target[f]) return judge(g, false, c.wait ? '움직이면 안 돼요!' : '반대예요!');
    if (g.b === c.target.b && g.w === c.target.w && !c.wait) judge(g, true);
  }
  function judge(g, ok, why) {
    const c = g.cmd; g.cmd = null;
    if (ok) { g.score++; sfx('pop'); face('happy'); g.flash = { ok: true, t: 0.5, text: '딩동댕!' }; g.gap = 0.45; }
    else {
      g.lives--; sfx('thud'); face('annoyed', 'closed', 'flat'); g.flash = { ok: false, t: 0.9, text: why || '땡!' }; g.gap = 0.9;
      g.b = c.target.b; g.w = c.target.w;          // show how it should have been
    }
    setTop('청기백기', g.score, g.lives);
    if (g.lives <= 0) gameOver(g.score, '청기백기 끝!');
  }
  function stepFlags(g, dt) {
    g.ab += ((g.b ? 1 : 0) - g.ab) * Math.min(1, dt * 14);
    g.aw += ((g.w ? 1 : 0) - g.aw) * Math.min(1, dt * 14);
    if (g.flash) { g.flash.t -= dt; if (g.flash.t <= 0) g.flash = null; }
    if (g.over) return;
    if (g.gap > 0) { g.gap -= dt; if (g.gap <= 0) nextCmd(g); return; }
    if (g.cmd) { g.cmd.left -= dt; if (g.cmd.left <= 0) { const c = g.cmd; judge(g, c.wait || (g.b === c.target.b && g.w === c.target.w), '너무 늦었어요!'); } }
  }
  /* ================= 무한의 계단 =================
     CAP: the timer drains faster as you climb, but never faster than 4 steps a second can keep up with. */
  function newStairs() {
    const g = { kind: 'stairs', cols: [0], pos: 0, cam: 0, camX: 0, gauge: 100, started: false, score: 0, hop: 0, fall: 0, over: false, dir: 1, cameos: [] };
    for (let i = 0; i < 40; i++) addStair(g);
    ctl.innerHTML = '';
    const row = document.createElement('div'); row.className = 'grow2 two'; ctl.appendChild(row);
    // like the real game: left turns around (and steps), right climbs on in the same direction
    row.appendChild(btn('<span class="gsym">↺</span>방향 전환', 'big turn', () => turnClimb(g))); row.appendChild(btn('<span class="gsym">⬆</span>오르기', 'big', () => climb(g, g.dir)));
    setTop('무한의 계단', 0);
    cat.dir = 1; setPose('stand'); face('open');
    return g;
  }
  function addStair(g) {
    const n = g.cols.length, last = g.cols[n - 1];
    if (n === 1) { g.lastDir = 1; g.cols.push(last + 1); return; }
    if (Math.random() < 0.35) g.lastDir = -g.lastDir;
    g.cols.push(last + g.lastDir);
  }
  function turnClimb(g) { if (g.over) return; g.dir = -g.dir; g.turned = true; climb(g, g.dir); }
  function climb(g, d) {
    if (g.over) return;
    g.dir = d;
    const need = g.cols[g.pos + 1] - g.cols[g.pos];
    cat.dir = d;
    if (d !== need) { g.fall = 0.01; sfx('fall'); face('wide', 'open1', 'flat'); gameOver(g.score, '계단에서 떨어졌어요!'); return; }
    g.started = true; g.pos++; g.score = g.pos; g.hop = 1;
    g.gauge = Math.min(100, g.gauge + 10);
    while (g.cols.length < g.pos + 40) addStair(g);
    sfx(g.turned ? 'turnStep' : 'step', g.score); g.turned = false; if (g.score % 25 === 0) { sfx('sparkle'); face('happy'); }
    setTop('무한의 계단', g.score);
  }
  function stepStairs(g, dt) {
    g.cam += (g.pos - g.cam) * Math.min(1, dt * 12);
    g.camX += (g.cols[g.pos] - g.camX) * Math.min(1, dt * 12);
    g.hop = Math.max(0, g.hop - dt * 7);
    if (g.fall) g.fall += dt;
    if (!g.started || g.over) return;
    const drain = Math.min(14 + g.score * 0.22, 40);          // 40/s with +10 per step = 4 steps a second at the very most
    g.gauge -= drain * dt;
    if (g.gauge <= 0) { g.gauge = 0; sfx('thud'); gameOver(g.score, '시간이 다 됐어요!'); }
  }
  /* ================= 야바위 =================
     CAP: at most 12 swaps per round and never faster than 0.3 s per swap. */
  function newCups() {
    const g = { kind: 'cups', score: 0, lives: 3, slots: [0, 1, 2], treat: Math.floor(Math.random() * 3), phase: 'show', t: 0, swaps: [], cur: null, lift: [0, 0, 0], pick: -1, over: false, msg: '' };
    ctl.innerHTML = '';
    setTop('야바위', 0, 3);
    startRound(g);
    return g;
  }
  function startRound(g) {
    g.phase = 'show'; g.t = 1.3; g.pick = -1; g.msg = '간식을 잘 보세요!';
    g.lift = [0, 0, 0]; g.lift[g.treat] = 1;
    const n = Math.min(4 + g.score, 12);
    g.dur = Math.max(0.3, 0.55 - g.score * 0.025);
    g.swaps = [];
    for (let i = 0; i < n; i++) { const a = Math.floor(Math.random() * 3); let b = Math.floor(Math.random() * 2); if (b >= a) b++; g.swaps.push([a, b]); }
  }
  function stepCups(g, dt) {
    for (let i = 0; i < 3; i++) { const want = (g.phase === 'show' && i === g.treat) || (g.phase === 'reveal' && (i === g.pick || i === g.treat)) ? 1 : 0; g.lift[i] += (want - g.lift[i]) * Math.min(1, dt * 10); }
    if (g.over) return;
    g.t -= dt;
    if (g.phase === 'show' && g.t <= 0) { g.phase = 'shuffle'; g.msg = '섞는 중…'; g.cur = null; }
    if (g.phase === 'shuffle') {
      if (!g.cur || g.cur.u >= 1) {
        if (g.cur) { const [a, b] = g.cur.pair; const t2 = g.slots[a]; g.slots[a] = g.slots[b]; g.slots[b] = t2; }
        const nx = g.swaps.shift();
        if (!nx) { g.phase = 'pick'; g.cur = null; g.msg = '간식은 어디에 있을까요?'; return; }
        g.cur = { pair: nx, u: 0 }; sfx('swish');
      } else g.cur.u = Math.min(1, g.cur.u + dt / g.dur);
    }
    if (g.phase === 'reveal' && g.t <= 0) {
      if (g.lives <= 0) { gameOver(g.score, '야바위 끝!'); return; }
      startRound(g);
    }
  }
  function cupPos(g, cupId, S) {
    const { W, H } = S, gap = Math.min(W * 0.3, 130), base = H * 0.62;
    let slot = g.slots.indexOf(cupId), x = W / 2 + (slot - 1) * gap, y = base;
    if (g.cur) {
      const [a, b] = g.cur.pair, e = 0.5 - Math.cos(g.cur.u * Math.PI) / 2;
      if (slot === a || slot === b) {
        const other = slot === a ? b : a, x2 = W / 2 + (other - 1) * gap;
        x = x + (x2 - x) * e; y = base + Math.sin(e * Math.PI) * (slot === a ? -28 : 22);
      }
    }
    return { x, y };
  }
  function tapCups(g, px, py, S) {
    if (g.phase !== 'pick' || g.over) return;
    let hit = -1;
    for (let id = 0; id < 3; id++) { const p = cupPos(g, id, S); if (Math.abs(px - p.x) < 52 && py > p.y - 120 && py < p.y + 20) hit = id; }
    if (hit < 0) return;
    g.pick = hit; g.phase = 'reveal'; g.t = 1.4;
    if (hit === g.treat) { g.score++; g.msg = '찾았다! 냠냠'; sfx('chime'); face('happy'); setTimeout(() => sfx('meow', 'happy', 0.6), 200); }
    else { g.lives--; g.msg = '앗, 여기 있었네요'; sfx('thud'); face('half'); }
    setTop('야바위', g.score, g.lives);
  }
  /* ---------- shared drawing ---------- */
  const bgCache = {};
  function cachedBg(name, S, fn) {
    const key = name + S.W + 'x' + S.H + '@' + S.dpr;
    if (!bgCache[key]) {
      for (const k in bgCache) if (k.indexOf(name) === 0) delete bgCache[k];
      const c = document.createElement('canvas'); c.width = Math.round(S.W * S.dpr); c.height = Math.round(S.H * S.dpr);
      const g = c.getContext('2d'); g.setTransform(S.dpr, 0, 0, S.dpr, 0, 0); fn(g, S.W, S.H); bgCache[key] = c;
    }
    return bgCache[key];
  }
  function blitBg(ctx, img) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(img, 0, 0); ctx.restore(); }
  const lg = (g, x0, y0, x1, y1, st) => { const q = g.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, c]) => q.addColorStop(o, c)); return q; };
  function cloud(g, x, y, s, a) { g.fillStyle = `rgba(255,255,255,${a})`; for (const [dx, dy, r] of [[-22, 4, 14], [-6, -6, 19], [14, -2, 16], [28, 6, 11], [2, 8, 15]]) { g.beginPath(); g.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); g.fill(); } }
  function bubble(g, x, y, w, h, tail) {
    g.save(); g.shadowColor = 'rgba(40,40,80,0.18)'; g.shadowBlur = 12; g.shadowOffsetY = 4;
    g.fillStyle = '#ffffff'; rr(g, x, y, w, h, 20); g.fill();
    g.beginPath(); g.moveTo(tail - 14, y + h - 1); g.quadraticCurveTo(tail, y + h + 6, tail + 2, y + h + 20); g.quadraticCurveTo(tail + 6, y + h + 4, tail + 16, y + h - 1); g.fill();
    g.restore();
    g.strokeStyle = '#d9e2f1'; g.lineWidth = 2; rr(g, x + 1, y + 1, w - 2, h - 2, 19); g.stroke();
  }

  /* ---------- 청기백기: a sunny school field ---------- */
  function flagsBg(g, W, H) {
    g.fillStyle = lg(g, 0, 0, 0, H * 0.62, [[0, '#7cc8ff'], [1, '#dff3ff']]); g.fillRect(0, 0, W, H);
    const sun = g.createRadialGradient(W * 0.82, H * 0.1, 6, W * 0.82, H * 0.1, 90); sun.addColorStop(0, 'rgba(255,248,210,1)'); sun.addColorStop(0.25, 'rgba(255,240,170,0.9)'); sun.addColorStop(1, 'rgba(255,240,170,0)');
    g.fillStyle = sun; g.fillRect(0, 0, W, H * 0.4);
    // far hills and trees
    g.fillStyle = '#a9dc8c'; g.beginPath(); g.moveTo(0, H * 0.56); for (let x = 0; x <= W; x += 20) g.lineTo(x, H * 0.52 - Math.sin(x / 70) * 14 - Math.sin(x / 31) * 5); g.lineTo(W, H); g.lineTo(0, H); g.fill();
    for (let i = 0; i < 7; i++) { const x = (i * 71 + 20) % W, y = H * 0.53 - Math.sin(x / 70) * 14; g.fillStyle = '#7fbf6a'; g.beginPath(); g.arc(x, y - 14, 14, 0, Math.PI * 2); g.arc(x + 10, y - 8, 11, 0, Math.PI * 2); g.fill(); g.fillStyle = '#8a6a4c'; g.fillRect(x + 3, y - 4, 4, 8); }
    // school fence
    const fy = H * 0.58;
    g.fillStyle = '#ffffff'; for (let x = 6; x < W; x += 22) { rr(g, x, fy - 30, 10, 34, 3); g.fill(); g.beginPath(); g.moveTo(x, fy - 30); g.lineTo(x + 5, fy - 37); g.lineTo(x + 10, fy - 30); g.fill(); }
    g.fillRect(0, fy - 22, W, 5); g.fillRect(0, fy - 8, W, 5);
    // field
    g.fillStyle = lg(g, 0, fy, 0, H, [[0, '#8fd16f'], [1, '#6db354']]); g.fillRect(0, fy, W, H - fy);
    g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 3; g.beginPath(); g.ellipse(W / 2, H * 0.78, W * 0.6, H * 0.12, 0, 0, Math.PI * 2); g.stroke();
    for (let i = 0; i < 90; i++) { const x = (i * 53) % W, y = fy + 8 + (i * 97) % (H - fy - 8); g.strokeStyle = 'rgba(60,120,50,0.35)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 2, y - 6); g.moveTo(x + 2, y); g.lineTo(x + 4, y - 5); g.stroke(); }
    for (let i = 0; i < 22; i++) { const x = (i * 89 + 13) % W, y = fy + 14 + (i * 61) % (H * 0.3); ell(g, x, y, 3, 3, ['#ffffff', '#ffe36a', '#ffb3c7'][i % 3]); ell(g, x, y, 1.2, 1.2, '#ffcf3a'); }
  }
  function drawFlag(ctx, hx, hy, side, a, t, col, shade, light, k) {
    const ang = (1 - a) * Math.PI * 0.85, L = 40 + k * 14;
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(side * ang);
    // pole with a gold knob
    ctx.fillStyle = lg(ctx, -4, 0, 4, 0, [[0, '#a8794c'], [0.5, '#e4bb86'], [1, '#93673f']]); rr(ctx, -3.5, -L - 4, 7, L + 18, 3.5); ctx.fill();
    ell(ctx, 0, -L - 8, 7, 7, '#f6c43a'); ell(ctx, -2, -L - 10, 2.5, 2.5, '#fff1b0');
    // waving cloth
    const w1 = Math.sin(t * 7 + side) * 7, w2 = Math.sin(t * 7 + side + 1.4) * 7, fw = L * 0.82, fh = L * 0.55, top = -L + 2;
    ctx.beginPath(); ctx.moveTo(0, top);
    ctx.bezierCurveTo(side * fw * 0.35, top - 6 + w1, side * fw * 0.7, top + 6 + w2, side * fw, top + w2 * 0.6);
    ctx.lineTo(side * fw, top + fh + w2 * 0.6);
    ctx.bezierCurveTo(side * fw * 0.7, top + fh + 6 + w2, side * fw * 0.35, top + fh - 6 + w1, 0, top + fh);
    ctx.closePath();
    ctx.fillStyle = lg(ctx, 0, top, side * fw, top + fh, [[0, shade], [0.45, col], [0.7, light], [1, col]]); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.globalAlpha = 0.25; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(side * fw * 0.45, top + fh * 0.35 + w1 * 0.4, fw * 0.18, fh * 0.12, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    ctx.restore();
    // paw holding the pole
    ell(ctx, hx, hy, 8, 7, '#ffffff'); ctx.strokeStyle = '#4a3158'; ctx.lineWidth = 2; ctx.stroke();
    for (const d of [-3.5, 0, 3.5]) ell(ctx, hx + d, hy + 4, 1.4, 1, '#ffb3c7');
  }
  function drawFlags(g, ctx, S, t) {
    const { W, H, dpr } = S;
    blitBg(ctx, cachedBg('flags', S, flagsBg));
    for (let i = 0; i < 4; i++) cloud(ctx, (i * 150 + t * 10) % (W + 200) - 100, 60 + i * 26, 0.9 + (i % 2) * 0.3, 0.9);
    const cx = W / 2, feet = H * 0.62, k = clampN(Math.round(W / 70), 4, 7);
    ctx.fillStyle = 'rgba(30,70,30,0.18)'; ctx.beginPath(); ctx.ellipse(cx, feet + 4, 78, 13, 0, 0, Math.PI * 2); ctx.fill();
    drawCatAt(ctx, cx, feet, k, dpr);
    drawFlag(ctx, cx - k * 13, feet - k * 9, -1, g.ab, t, '#3f7fe8', '#2456b4', '#7fb0ff', k);
    drawFlag(ctx, cx + k * 13, feet - k * 9, 1, g.aw, t, '#ffffff', '#c9d2dc', '#ffffff', k);
    const bw = Math.min(W - 36, 340), bx = cx - bw / 2, by = H * 0.12;
    bubble(ctx, bx, by, bw, 82, cx);
    const text = g.flash ? g.flash.text : g.cmd ? g.cmd.text : (g.score === 0 && !g.over ? '준비~' : '');
    ctx.textAlign = 'center'; ctx.font = `900 ${text.length > 12 ? 22 : 29}px system-ui, sans-serif`;
    ctx.fillStyle = g.flash ? (g.flash.ok ? '#2f9e5a' : '#e24a5a') : '#2f3a5a';
    if (g.cmd && !g.flash) {                    // colour the flag names
      const parts = text.split(/(청기|백기)/), widths = parts.map(p => ctx.measureText(p).width), total = widths.reduce((a, b) => a + b, 0);
      let x = cx - total / 2; ctx.textAlign = 'left';
      parts.forEach((p, i) => { ctx.fillStyle = p === '청기' ? '#2f6fe0' : p === '백기' ? '#8a96a8' : '#2f3a5a'; ctx.fillText(p, x, by + 48); x += widths[i]; });
      ctx.textAlign = 'center';
    } else ctx.fillText(text, cx, by + 48);
    if (g.cmd) { const u = clampN(g.cmd.left / g.cmd.limit, 0, 1); ctx.fillStyle = '#eef2f8'; rr(ctx, bx + 22, by + 62, bw - 44, 8, 4); ctx.fill(); ctx.fillStyle = lg(ctx, bx, 0, bx + bw, 0, [[0, u > 0.35 ? '#6fd28a' : '#ff9a6a'], [1, u > 0.35 ? '#3fb36a' : '#e24a5a']]); rr(ctx, bx + 22, by + 62, (bw - 44) * u, 8, 4); ctx.fill(); }
    if (g.flash) { ctx.globalAlpha = clampN(g.flash.t * 2, 0, 1); ctx.font = '900 54px system-ui, sans-serif'; ctx.fillStyle = g.flash.ok ? '#3fb36a' : '#e24a5a'; ctx.fillText(g.flash.ok ? '⭕' : '❌', cx, feet - k * 30); ctx.globalAlpha = 1; }
  }

  /* ---------- 무한의 계단: a long trip upward ----------
     Each zone lasts hundreds of steps and blends into the next: town → sky → above the clouds → sunset →
     night → aurora → space → galaxy → heaven, and past heaven a dream sky whose colours keep turning.
     Things drift by (birds, planes, parachutes, rockets, astronauts, angels...) so the climb never feels empty. */
  const ZONES = [
    { at: 0,    name: '동네',      sky: ['#8fd3ff', '#eaf7ff'], stair: ['#ffe3a3', '#f2b45a', '#fff3cf'], cams: ['bird', 'butterfly', 'kite'] },
    { at: 150,  name: '높은 하늘', sky: ['#5fb8ff', '#d4efff'], stair: ['#d8f0ff', '#8fc7ef', '#ffffff'], cams: ['bird', 'plane', 'parachute', 'kite', 'heli'] },
    { at: 350,  name: '구름 위',   sky: ['#4aa8f5', '#f2f9ff'], stair: ['#ffffff', '#c9d9ea', '#ffffff'], cams: ['balloon', 'plane', 'parachute', 'bird'] },
    { at: 600,  name: '노을 하늘', sky: ['#ff8a6e', '#ffd9a0'], stair: ['#ffd1b0', '#f28c62', '#fff0e2'], cams: ['plane', 'balloon', 'bird'] },
    { at: 900,  name: '밤하늘',    sky: ['#1f2a62', '#4a4e8f'], stair: ['#c6d0ff', '#7d89d9', '#eef1ff'], cams: ['shooting', 'owl', 'plane'] },
    { at: 1300, name: '오로라',    sky: ['#0d2140', '#1f4f6a'], stair: ['#b9fff0', '#46c7b0', '#e8fffa'], cams: ['shooting', 'satellite'] },
    { at: 1800, name: '우주',      sky: ['#0b0820', '#22174a'], stair: ['#dfe6f5', '#8f9bb8', '#ffffff'], cams: ['rocket', 'astronaut', 'ufo', 'satellite', 'comet'] },
    { at: 2600, name: '은하',      sky: ['#1a0838', '#4a1f6e'], stair: ['#e8cfff', '#a46ee8', '#fbf2ff'], cams: ['whale', 'comet', 'ufo', 'astronaut'] },
    { at: 3500, name: '천국',      sky: ['#ffe9b8', '#fffaf0'], stair: ['#ffffff', '#f2d57a', '#fffbe6'], cams: ['angel', 'harp', 'dove', 'rainbowcat'] },
    { at: 5000, name: '꿈나라',    sky: ['#ffc6e6', '#d6f0ff'], stair: ['#fff0b8', '#ff9ccf', '#ffffff'], cams: ['candy', 'paperplane', 'angel', 'whale', 'balloon'] }
  ];
  const zoneOf = s => { let i = 0; while (i + 1 < ZONES.length && s >= ZONES[i + 1].at) i++; return i; };
  const hx = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mixC = (a, b, t2) => { const A = hx(a), B = hx(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t2)).join(',')})`; };
  const hueShift = (rgbStr, deg) => {        // turn a colour round the wheel (used for the endless dream sky)
    const m = rgbStr.match(/\d+/g).map(Number); let [r, g2, b] = m.map(v => v / 255);
    const mx = Math.max(r, g2, b), mn = Math.min(r, g2, b), l = (mx + mn) / 2; let h = 0, s2 = 0;
    if (mx !== mn) { const d = mx - mn; s2 = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g2 - b) / d + (g2 < b ? 6 : 0) : mx === g2 ? (b - r) / d + 2 : (r - g2) / d + 4; h *= 60; }
    h = (h + deg) % 360; const c = (1 - Math.abs(2 * l - 1)) * s2, x = c * (1 - Math.abs((h / 60) % 2 - 1)), mm = l - c / 2;
    const [rr2, gg, bb] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return `rgb(${Math.round((rr2 + mm) * 255)},${Math.round((gg + mm) * 255)},${Math.round((bb + mm) * 255)})`;
  };
  // sky / stair colours at any height, blending over 60 steps between zones
  function look(score) {
    const zi = zoneOf(score), Z = ZONES[zi], N = ZONES[zi + 1];
    let u = 0; if (N) { const span = 60; u = clampN((score - (N.at - span)) / span, 0, 1); }
    const pick = (k, j) => N ? mixC(Z[k][j], N[k][j], u) : mixC(Z[k][j], Z[k][j], 0);
    let sky = [pick('sky', 0), pick('sky', 1)], stair = [pick('stair', 0), pick('stair', 1), pick('stair', 2)];
    if (zi === ZONES.length - 1) { const d = ((score - Z.at) / 4) % 360; sky = sky.map(c => hueShift(c, d)); stair = stair.map(c => hueShift(c, d)); }
    return { zi, sky, stair, dark: zi >= 4 && zi <= 7 };
  }
  // a stable pseudo-random number for a whole-number seed
  const hash = n => { let x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  /* things that drift by */
  function spawnCameo(g, S) {
    const Z = ZONES[zoneOf(g.score)], kind = Z.cams[Math.floor(Math.random() * Z.cams.length)];
    const left = Math.random() < 0.5, W = S.W, H = S.H;
    const c = { kind, t: 0, life: R(5, 8), dir: left ? 1 : -1, x: left ? -60 : W + 60, y: R(H * 0.18, H * 0.5), s: R(0.8, 1.2), seed: Math.random() * 10 };
    if (kind === 'parachute' || kind === 'dove') { c.x = R(W * 0.15, W * 0.85); c.y = -60; c.vx = R(-12, 12); c.vy = R(24, 34); }
    else if (kind === 'shooting' || kind === 'comet') { c.x = left ? R(-40, W * 0.3) : R(W * 0.7, W + 40); c.y = R(-20, H * 0.25); c.vx = c.dir * R(260, 360); c.vy = R(110, 170); c.life = kind === 'shooting' ? 1.4 : 4; }
    else if (kind === 'astronaut' || kind === 'harp' || kind === 'candy') { c.vx = c.dir * R(16, 26); c.vy = R(-6, 6); }
    else if (kind === 'rocket') { c.x = R(W * 0.1, W * 0.9); c.y = H + 60; c.vx = R(-20, 20); c.vy = -R(150, 210); c.life = 6; }
    else c.vx = c.dir * ({ plane: 120, heli: 70, bird: 60, balloon: 18, kite: 30, owl: 50, satellite: 35, ufo: 90, whale: 22, angel: 40, rainbowcat: 110, paperplane: 80, butterfly: 35 }[kind] || 50) * R(0.85, 1.15);
    if (c.vy === undefined) c.vy = 0;
    g.cameos.push(c);
  }
  function drawCameo(ctx, c, t) {
    const { x, y, s, dir } = c;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    const E = (px, py, rx, ry, col) => ell(ctx, px, py, rx, ry, col);
    switch (c.kind) {
      case 'bird': for (let i = 0; i < 3; i++) { const ox = -i * 26, oy = i * 10 * (i % 2 ? -1 : 1), f = Math.sin(t * 12 + i) * 6; ctx.strokeStyle = '#3a3f55'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(ox - 10, oy - f); ctx.quadraticCurveTo(ox - 4, oy - 4, ox, oy); ctx.quadraticCurveTo(ox + 4, oy - 4, ox + 10, oy - f); ctx.stroke(); } break;
      case 'butterfly': { const f = Math.abs(Math.sin(t * 10)); E(-6, -4, 7 * f + 1, 6, '#ff9cc4'); E(6, -4, 7 * f + 1, 6, '#ff9cc4'); E(-5, 4, 5 * f + 1, 4, '#ffd36e'); E(5, 4, 5 * f + 1, 4, '#ffd36e'); ctx.fillStyle = '#3a2f4a'; ctx.fillRect(-1, -8, 2, 16); break; }
      case 'kite': ctx.fillStyle = '#ff6f7d'; ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(16, 0); ctx.lineTo(0, 24); ctx.lineTo(-16, 0); ctx.fill(); ctx.fillStyle = '#ffd36e'; ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(16, 0); ctx.lineTo(0, 0); ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 24); for (let i = 1; i < 6; i++) ctx.lineTo(Math.sin(t * 4 + i) * 6, 24 + i * 9); ctx.stroke(); break;
      case 'plane': ctx.fillStyle = '#ffffff'; rr(ctx, -40, -8, 80, 16, 8); ctx.fill(); ctx.fillStyle = '#e94f5d'; ctx.fillRect(-40, -2, 80, 4); ctx.fillStyle = '#dfe6f0'; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-22, 22); ctx.lineTo(-10, 22); ctx.lineTo(10, 0); ctx.fill(); ctx.beginPath(); ctx.moveTo(-34, -6); ctx.lineTo(-44, -22); ctx.lineTo(-36, -22); ctx.lineTo(-26, -6); ctx.fill(); ctx.fillStyle = '#7fc4ff'; for (let i = 0; i < 5; i++) E(-16 + i * 9, -3, 2.5, 2.5, '#7fc4ff'); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-46, 0); ctx.lineTo(-120, 2); ctx.stroke(); break;
      case 'heli': E(0, 0, 22, 13, '#ffcf5c'); E(8, -3, 9, 7, '#bfe6ff'); ctx.fillStyle = '#ffcf5c'; ctx.fillRect(-46, -3, 28, 5); ctx.fillStyle = '#5a5f75'; const w = Math.abs(Math.sin(t * 30)) * 34 + 6; ctx.fillRect(-w, -18, w * 2, 3); ctx.fillRect(-1, -18, 2, 6); ctx.fillRect(-12, 13, 24, 2); break;
      case 'parachute': { const sw = Math.sin(t * 2 + c.seed) * 0.15; ctx.rotate(sw); ctx.fillStyle = '#ff7a8a'; ctx.beginPath(); ctx.arc(0, -30, 30, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(-10, -30); ctx.arc(0, -30, 10, Math.PI, 0); ctx.fill(); ctx.strokeStyle = '#6a6f85'; ctx.lineWidth = 1; for (const ex of [-28, -10, 10, 28]) { ctx.beginPath(); ctx.moveTo(ex, -30); ctx.lineTo(0, 6); ctx.stroke(); } E(0, 12, 6, 6, '#ffb35c'); ctx.fillStyle = '#4f8fe8'; rr(ctx, -6, 16, 12, 14, 4); ctx.fill(); break; }
      case 'balloon': { const bob = Math.sin(t * 1.5 + c.seed) * 4; ctx.translate(0, bob); const gb = ctx.createLinearGradient(-26, 0, 26, 0); gb.addColorStop(0, '#ff6f7d'); gb.addColorStop(0.5, '#ffd36e'); gb.addColorStop(1, '#5ec8d6'); ctx.fillStyle = gb; ctx.beginPath(); ctx.ellipse(0, -30, 26, 32, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#8a6a4c'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-14, -6); ctx.lineTo(-8, 14); ctx.moveTo(14, -6); ctx.lineTo(8, 14); ctx.stroke(); ctx.fillStyle = '#b07a48'; rr(ctx, -10, 14, 20, 12, 3); ctx.fill(); break; }
      case 'owl': E(0, 0, 14, 16, '#9a7a5a'); E(-5, -4, 5, 5, '#fff6d6'); E(5, -4, 5, 5, '#fff6d6'); E(-5, -4, 2, 2, '#2a2030'); E(5, -4, 2, 2, '#2a2030'); { const f = Math.sin(t * 10) * 10; ctx.fillStyle = '#7a5a3a'; ctx.beginPath(); ctx.ellipse(-16, 2, 6, 12, -0.6 + f / 30, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(16, 2, 6, 12, 0.6 - f / 30, 0, Math.PI * 2); ctx.fill(); } break;
      case 'shooting': case 'comet': { const L = c.kind === 'comet' ? 90 : 60; const gr = ctx.createLinearGradient(0, 0, -L, -L * 0.45); gr.addColorStop(0, 'rgba(255,255,230,1)'); gr.addColorStop(1, 'rgba(255,255,230,0)'); ctx.strokeStyle = gr; ctx.lineWidth = c.kind === 'comet' ? 6 : 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-L, -L * 0.45); ctx.stroke(); E(0, 0, c.kind === 'comet' ? 7 : 3, c.kind === 'comet' ? 7 : 3, c.kind === 'comet' ? '#bfe8ff' : '#ffffff'); break; }
      case 'satellite': ctx.rotate(Math.sin(t) * 0.2); ctx.fillStyle = '#4f7fd8'; ctx.fillRect(-38, -8, 24, 16); ctx.fillRect(14, -8, 24, 16); ctx.strokeStyle = '#2a4a8a'; ctx.lineWidth = 1; for (const sx2 of [-32, -26, -20, 20, 26, 32]) { ctx.beginPath(); ctx.moveTo(sx2, -8); ctx.lineTo(sx2, 8); ctx.stroke(); } ctx.fillStyle = '#d9dfe8'; rr(ctx, -12, -10, 24, 20, 4); ctx.fill(); ctx.fillStyle = '#f6c43a'; ctx.fillRect(-2, -18, 4, 8); E(0, -20, 5, 3, '#ffffff'); break;
      case 'rocket': ctx.scale(dir, 1); ctx.rotate(Math.atan2(c.vy, c.vx) + Math.PI / 2); { const fl = 12 + Math.random() * 8; ctx.fillStyle = '#ffb35c'; ctx.beginPath(); ctx.moveTo(-7, 22); ctx.lineTo(0, 22 + fl); ctx.lineTo(7, 22); ctx.fill(); } ctx.fillStyle = '#f4f6fa'; ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(14, -10, 11, 22); ctx.lineTo(-11, 22); ctx.quadraticCurveTo(-14, -10, 0, -30); ctx.fill(); ctx.fillStyle = '#e94f5d'; ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(8, -20, 9, -14); ctx.lineTo(-9, -14); ctx.quadraticCurveTo(-8, -20, 0, -30); ctx.fill(); ctx.beginPath(); ctx.moveTo(-11, 10); ctx.lineTo(-20, 26); ctx.lineTo(-10, 22); ctx.fill(); ctx.beginPath(); ctx.moveTo(11, 10); ctx.lineTo(20, 26); ctx.lineTo(10, 22); ctx.fill(); E(0, -2, 5, 5, '#7fc4ff'); break;
      case 'astronaut': ctx.rotate(Math.sin(t * 0.8 + c.seed) * 0.5); ctx.fillStyle = '#f4f6fa'; rr(ctx, -12, -6, 24, 26, 9); ctx.fill(); E(0, -14, 13, 12, '#f4f6fa'); E(1, -14, 9, 7, '#5a6fa8'); E(-2, -16, 3, 2, 'rgba(255,255,255,0.7)'); ctx.fillStyle = '#d9dfe8'; rr(ctx, -20, -4, 9, 16, 4); ctx.fill(); rr(ctx, 11, -4, 9, 16, 4); ctx.fill(); rr(ctx, -10, 18, 8, 12, 3); ctx.fill(); rr(ctx, 2, 18, 8, 12, 3); ctx.fill(); ctx.fillStyle = '#e94f5d'; ctx.fillRect(-5, 2, 10, 5); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-12, 8); ctx.bezierCurveTo(-40, 20, -50, -10, -80, 0); ctx.stroke(); break;
      case 'ufo': ctx.translate(0, Math.sin(t * 3) * 4); E(0, -8, 14, 12, 'rgba(160,240,220,0.85)'); E(0, 0, 34, 9, '#b9c2d6'); E(0, -2, 34, 5, '#dfe6f0'); for (let i = -2; i <= 2; i++) E(i * 12, 3, 2.5, 2.5, ['#ff6f7d', '#ffd36e', '#7fe0a0', '#7fc4ff', '#e0a0ff'][(i + 2 + Math.floor(t * 4)) % 5]); ctx.fillStyle = 'rgba(200,255,220,0.18)'; ctx.beginPath(); ctx.moveTo(-14, 6); ctx.lineTo(14, 6); ctx.lineTo(28, 70); ctx.lineTo(-28, 70); ctx.fill(); break;
      case 'whale': { const f = Math.sin(t * 2) * 6; const gw = ctx.createLinearGradient(0, -20, 0, 20); gw.addColorStop(0, '#7f8ff0'); gw.addColorStop(1, '#c7d0ff'); ctx.fillStyle = gw; ctx.beginPath(); ctx.ellipse(0, 0, 50, 22, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(-44, 0); ctx.lineTo(-70, -16 + f); ctx.lineTo(-66, 0); ctx.lineTo(-70, 16 + f); ctx.fill(); E(30, -4, 3, 3, '#2a2048'); ctx.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 4; i++) E(18 + i * 4, -26 - i * 7 - (t * 10 % 7), 2, 2, 'rgba(255,255,255,0.7)'); for (let i = 0; i < 5; i++) E(-20 + i * 12, 8, 2, 1.4, 'rgba(255,255,255,0.5)'); break; }
      case 'angel': case 'dove': {
        const f = Math.sin(t * 8 + c.seed) * 0.5;
        ctx.fillStyle = '#ffffff';
        ctx.save(); ctx.rotate(-0.4 - f); ctx.beginPath(); ctx.ellipse(-14, -6, 16, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        ctx.save(); ctx.rotate(0.4 + f); ctx.beginPath(); ctx.ellipse(14, -6, 16, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        if (c.kind === 'dove') { E(0, 0, 12, 8, '#ffffff'); E(10, -4, 6, 5, '#ffffff'); ctx.fillStyle = '#ffb35c'; ctx.beginPath(); ctx.moveTo(15, -4); ctx.lineTo(21, -3); ctx.lineTo(15, -1); ctx.fill(); E(11, -5, 1.2, 1.2, '#2a2030'); }
        else { E(0, 4, 11, 12, '#ffe9d6'); ctx.fillStyle = '#ffe9d6'; ctx.beginPath(); ctx.moveTo(-9, -2); ctx.lineTo(-11, -14); ctx.lineTo(-3, -6); ctx.fill(); ctx.beginPath(); ctx.moveTo(9, -2); ctx.lineTo(11, -14); ctx.lineTo(3, -6); ctx.fill(); E(-4, 3, 1.6, 1.6, '#2a2030'); E(4, 3, 1.6, 1.6, '#2a2030'); E(0, 7, 1.5, 1, '#ff9cb7'); ctx.strokeStyle = '#ffd84d'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(0, -18, 10, 3, 0, 0, Math.PI * 2); ctx.stroke(); }
        break;
      }
      case 'harp': ctx.strokeStyle = '#f2c84a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-10, 20); ctx.quadraticCurveTo(-18, -20, 10, -22); ctx.quadraticCurveTo(4, 0, 14, 20); ctx.closePath(); ctx.stroke(); ctx.lineWidth = 1; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-8 + i * 4, -14 + i); ctx.lineTo(-6 + i * 4, 18); ctx.stroke(); } ctx.fillStyle = '#ffffff'; ctx.font = '700 16px system-ui'; ctx.fillText('♪', 18, -10 - Math.sin(t * 3) * 6); ctx.fillText('♫', 26, 4 + Math.sin(t * 3) * 6); break;
      case 'rainbowcat': { const cols = ['#ff6f7d', '#ffb35c', '#ffe36a', '#7fe0a0', '#7fc4ff', '#b48cff']; cols.forEach((cc, i) => { ctx.fillStyle = cc; ctx.fillRect(-120, -15 + i * 5 + Math.sin(t * 8 + i) * 1.5, 100, 5); }); rr(ctx, -22, -18, 36, 30, 6); ctx.fillStyle = '#ffd0e0'; ctx.fill(); E(18, -4, 12, 11, '#9a9fb5'); ctx.fillStyle = '#9a9fb5'; ctx.beginPath(); ctx.moveTo(10, -12); ctx.lineTo(12, -22); ctx.lineTo(18, -14); ctx.fill(); ctx.beginPath(); ctx.moveTo(22, -14); ctx.lineTo(28, -22); ctx.lineTo(28, -10); ctx.fill(); E(14, -5, 1.8, 1.8, '#2a2030'); E(23, -5, 1.8, 1.8, '#2a2030'); break; }
      case 'candy': ctx.rotate(t * 1.5 + c.seed); E(0, 0, 12, 12, '#ff8fb1'); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 1.4); ctx.stroke(); ctx.fillStyle = '#ff8fb1'; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-22, -7); ctx.lineTo(-22, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(22, -7); ctx.lineTo(22, 7); ctx.fill(); break;
      case 'paperplane': ctx.rotate(Math.sin(t * 2) * 0.15); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(26, 0); ctx.lineTo(-20, -14); ctx.lineTo(-10, 0); ctx.lineTo(-20, 12); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#dfe6f0'; ctx.beginPath(); ctx.moveTo(26, 0); ctx.lineTo(-10, 0); ctx.lineTo(-20, 12); ctx.fill(); break;
      default:
    }
    ctx.restore();
  }

  /* fixed scenery tied to heights (passes by as you climb) */
  function drawScenery(g, ctx, S, t, L) {
    const { W, H } = S, SH = Math.min(78, W / 5.2) * 0.5, baseY = H * 0.62;
    // ground at the start
    const groundY = baseY + g.cam * SH * 0.35 + 30;
    if (groundY < H + 40) {
      ctx.fillStyle = 'rgba(150,180,215,0.75)'; for (let i = 0; i < 12; i++) { const h = 60 + (i * 37) % 80, x = i * W / 11 - 10; ctx.fillRect(x, groundY - h - 40, W / 13, h); }
      ctx.fillStyle = '#9ed58a'; ctx.beginPath(); ctx.moveTo(0, groundY - 30); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, groundY - 40 - Math.sin(x / 60) * 14); ctx.lineTo(W, H + 60); ctx.lineTo(0, H + 60); ctx.fill();
      for (let i = 0; i < 6; i++) { const x = i * W / 5 + 10, y = groundY - 44 - Math.sin(x / 60) * 14; ell(ctx, x, y - 16, 16, 16, '#6fbf5e'); ctx.fillStyle = '#8a6a4c'; ctx.fillRect(x - 3, y - 4, 6, 10); }
    }
    // height-anchored items: one every ~9 steps, with parallax
    const par = 0.55, first = Math.floor((g.cam - 25) / 9), last = Math.floor((g.cam + 30) / 9);
    for (let n = first; n <= last; n++) {
      if (n < 2) continue;
      const h = n * 9, zi = zoneOf(h), y = baseY - (h - g.cam) * SH * par, x = hash(n) * W;
      if (y < -80 || y > H + 80) continue;
      const r = hash(n + 0.5);
      if (zi <= 3 && !(zi === 0 && h < 40)) cloud(ctx, x, y, 0.7 + r * 0.6, zi === 2 ? 0.95 : 0.75);
      if (zi === 2 && r > 0.6) { ctx.fillStyle = 'rgba(255,255,255,0.95)'; rr(ctx, x - 60, y + 6, 120, 26, 13); ctx.fill(); }
      if (zi >= 4 && zi <= 7 && r > 0.55) { const big = zi >= 6; const col = ['#f2a654', '#9fd0f5', '#e8a0c8', '#c8b08a'][n % 4]; ell(ctx, x, y, big ? 16 + r * 18 : 6, big ? 16 + r * 18 : 6, zi >= 6 ? col : '#f3f1e4'); if (big && n % 3 === 0) { ctx.strokeStyle = 'rgba(255,230,190,0.8)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(x, y, 30 + r * 20, 6, -0.3, 0, Math.PI * 2); ctx.stroke(); } }
      if (zi === 7 && r < 0.3) { const ng = ctx.createRadialGradient(x, y, 2, x, y, 70); ng.addColorStop(0, 'rgba(255,170,230,0.35)'); ng.addColorStop(1, 'rgba(120,80,255,0)'); ctx.fillStyle = ng; ctx.fillRect(x - 70, y - 70, 140, 140); }
      if (zi === 8) { cloud(ctx, x, y, 0.9 + r * 0.5, 1); if (r > 0.7) { ctx.strokeStyle = '#f2d57a'; ctx.lineWidth = 3; for (let k = -1; k <= 1; k += 2) { ctx.beginPath(); ctx.moveTo(x + k * 22, y); ctx.lineTo(x + k * 22, y - 50); ctx.stroke(); } ctx.beginPath(); ctx.arc(x, y - 50, 22, Math.PI, 0); ctx.stroke(); for (let k = -16; k <= 16; k += 8) { ctx.beginPath(); ctx.moveTo(x + k, y); ctx.lineTo(x + k, y - 44); ctx.stroke(); } } }
      if (zi === 9) { if (r > 0.5) { const cols = ['#ff9cc4', '#ffd36e', '#a8f0c8', '#9fd0f5']; cols.forEach((cc, i) => { ctx.strokeStyle = cc; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y + 30, 50 - i * 6, Math.PI, 0); ctx.stroke(); }); } else { ell(ctx, x, y, 34, 10, '#c8f0b0'); ctx.fillStyle = '#c9a07a'; ctx.beginPath(); ctx.moveTo(x - 30, y + 2); ctx.lineTo(x, y + 30); ctx.lineTo(x + 30, y + 2); ctx.fill(); } }
    }
  }
  function drawStairs(g, ctx, S, t) {
    const { W, H, dpr } = S;
    const L = look(g.score);
    ctx.fillStyle = lg(ctx, 0, 0, 0, H, [[0, L.sky[0]], [1, L.sky[1]]]); ctx.fillRect(0, 0, W, H);
    // stars from night to galaxy, twinkling
    if (L.zi >= 4 && L.zi <= 7) for (let i = 0; i < 90; i++) { const x = (i * 97) % W, y = ((i * 61) % H + g.cam * 3) % H, tw = 0.5 + 0.5 * Math.sin(t * 3 + i); ctx.fillStyle = `rgba(255,255,240,${0.35 + tw * 0.55})`; const s2 = i % 9 ? 1.6 : 2.8; ctx.fillRect(x, y, s2, s2); }
    if (L.zi === 4) { ell(ctx, W * 0.78, H * 0.2, 22, 22, '#fff8d6'); ell(ctx, W * 0.78 + 8, H * 0.2 - 4, 19, 19, L.sky[0]); }
    if (L.zi === 5) for (let b = 0; b < 3; b++) { ctx.fillStyle = `rgba(${b === 1 ? '140,255,200' : '120,220,255'},${0.16 + 0.06 * Math.sin(t + b)})`; ctx.beginPath(); ctx.moveTo(0, H * (0.25 + b * 0.08)); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, H * (0.25 + b * 0.08) + Math.sin(x / 50 + t * 0.8 + b) * 22); ctx.lineTo(W, H * (0.25 + b * 0.08) + 70); for (let x = W; x >= 0; x -= 20) ctx.lineTo(x, H * (0.25 + b * 0.08) + 70 + Math.sin(x / 40 + t + b) * 14); ctx.fill(); }
    if (L.zi === 3) { const sg = ctx.createRadialGradient(W * 0.2, H * 0.45, 10, W * 0.2, H * 0.45, 120); sg.addColorStop(0, 'rgba(255,230,160,0.95)'); sg.addColorStop(1, 'rgba(255,200,120,0)'); ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H); }
    if (L.zi === 8) { const hg = ctx.createRadialGradient(W / 2, -40, 20, W / 2, -40, H * 0.7); hg.addColorStop(0, 'rgba(255,250,210,0.95)'); hg.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = hg; ctx.fillRect(0, 0, W, H); for (let i = 0; i < 6; i++) { ctx.fillStyle = 'rgba(255,255,230,0.12)'; ctx.beginPath(); ctx.moveTo(W / 2, -40); ctx.lineTo(i * W / 5 - 40, H); ctx.lineTo(i * W / 5 + 10, H); ctx.fill(); } }
    drawScenery(g, ctx, S, t, L);
    // drifting visitors
    g.nextCameo = (g.nextCameo === undefined ? 2 : g.nextCameo) - 1 / 60;
    if (g.nextCameo <= 0 && g.cameos.length < 3) { spawnCameo(g, S); g.nextCameo = R(2.5, 5.5); }
    g.cameos = g.cameos.filter(c => { c.t += 1 / 60; c.x += c.vx / 60; c.y += c.vy / 60; return c.t < c.life && c.x > -200 && c.x < W + 200 && c.y < H + 120 && c.y > -200; });
    for (const c of g.cameos) drawCameo(ctx, c, t);
    // stairs
    const SW = Math.min(78, W / 5.2), SH = SW * 0.5, D = SW * 0.32, baseY = H * 0.62, cx = W / 2;
    const sx = i => cx + (g.cols[i] - g.camX) * SW, sy = i => baseY - (i - g.cam) * SH;
    const from = Math.max(0, g.pos - 10), to = Math.min(g.cols.length, g.pos + 18);
    for (let i = to - 1; i >= from; i--) {
      const x = sx(i), y = sy(i); if (y < -60 || y > H + 60) continue;
      const th = look(i).stair, w = SW - 4;
      ctx.fillStyle = 'rgba(0,0,0,0.13)'; rr(ctx, x - w / 2 + 4, y + D + 6, w, SH * 0.55, 6); ctx.fill();
      ctx.fillStyle = th[1]; rr(ctx, x - w / 2, y + D * 0.55, w, D + SH * 0.25, 7); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(x - w / 2 + 5, y + D * 0.55 + D * 0.6, w - 10, 3);
      ctx.fillStyle = th[0]; rr(ctx, x - w / 2, y, w, D * 0.9, 7); ctx.fill();
      ctx.strokeStyle = th[2]; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - w / 2 + 8, y + 5); ctx.lineTo(x + w / 2 - 8, y + 5); ctx.stroke();
      if (L.dark) { ctx.fillStyle = 'rgba(255,255,255,0.18)'; rr(ctx, x - w / 2 - 2, y - 2, w + 4, D * 0.9 + 4, 8); ctx.fill(); }
      for (let k2 = -1; k2 <= 1; k2++) ell(ctx, x + k2 * w * 0.28, y + D * 0.45, 2.2, 1.6, 'rgba(255,255,255,0.6)');
      if (i % 50 === 0 && i > 0) { ctx.fillStyle = '#ffffff'; ctx.font = '900 12px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(String(i), x, y + D * 0.55 + D * 0.75); }
    }
    const k = clampN(Math.round(SW / 26), 2, 3);
    const fx = sx(g.pos), fy = sy(g.pos) + D * 0.45 - Math.sin(g.hop * Math.PI) * 12 + (g.fall ? g.fall * g.fall * 700 : 0);
    if (g.hop > 0) setPose('pounce'); else if (!g.fall) setPose('stand');
    drawCatAt(ctx, fx, fy, k, dpr);
    // a banner when a new zone is reached
    const zi = zoneOf(g.score);
    if (g.zone === undefined) g.zone = zi;
    if (zi !== g.zone) { g.zone = zi; g.banner = { text: ZONES[zi].name + ' 도착!', t: 2.4 }; sfx('fanfare'); }
    if (g.banner) {
      g.banner.t -= 1 / 60; const a = clampN(Math.min(g.banner.t, 2.4 - g.banner.t) * 3, 0, 1);
      ctx.globalAlpha = a; bubble(ctx, cx - 110, H * 0.2, 220, 50, cx); ctx.fillStyle = '#e8a33a'; ctx.font = '900 22px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('✨ ' + g.banner.text, cx, H * 0.2 + 33); ctx.globalAlpha = 1;
      if (g.banner.t <= 0) g.banner = null;
    }
    // timer with a little clock, and where you are
    const gw = Math.min(W - 80, 290), gx = cx - gw / 2 + 14, gy = H * 0.1;
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; rr(ctx, gx - 34, gy - 8, gw + 42, 30, 15); ctx.fill();
    ell(ctx, gx - 18, gy + 7, 11, 11, '#ffffff'); ctx.strokeStyle = '#e8a33a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(gx - 18, gy + 7, 10, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gx - 18, gy + 7); ctx.lineTo(gx - 18, gy + 1); ctx.moveTo(gx - 18, gy + 7); ctx.lineTo(gx - 13, gy + 9); ctx.stroke();
    ctx.fillStyle = '#eef0f5'; rr(ctx, gx, gy, gw, 14, 7); ctx.fill();
    ctx.fillStyle = lg(ctx, gx, 0, gx + gw, 0, g.gauge > 30 ? [[0, '#ffcf5c'], [1, '#ff8a5a']] : [[0, '#ff8a7a'], [1, '#e24a5a']]); rr(ctx, gx, gy, Math.max(0, gw * g.gauge / 100), 14, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; rr(ctx, cx - 50, gy + 28, 100, 22, 11); ctx.fill();
    ctx.fillStyle = '#5a4a7a'; ctx.font = '800 12px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('📍 ' + ZONES[zi].name, cx, gy + 43);
    if (!g.started && !g.over) { bubble(ctx, cx - 130, H * 0.2, 260, 46, cx); ctx.fillStyle = '#2f3a5a'; ctx.font = '800 17px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('왼쪽: 방향 전환 · 오른쪽: 오르기', cx, H * 0.2 + 29); }
  }

  /* ---------- 야바위: a little carnival stall ---------- */
  function cupsBg(g, W, H) {
    g.fillStyle = lg(g, 0, 0, 0, H, [[0, '#3a2a5e'], [1, '#6a4a7e']]); g.fillRect(0, 0, W, H);
    // striped tent roof with scalloped edge
    const roofH = H * 0.2;
    for (let x = 0, i = 0; x < W + 40; x += 40, i++) { g.fillStyle = i % 2 ? '#fff4e0' : '#e94f5d'; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 40, 0); g.lineTo(x + 40, roofH); g.lineTo(x, roofH); g.fill(); g.beginPath(); g.arc(x + 20, roofH, 20, 0, Math.PI); g.fill(); }
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, roofH + 18, W, 6);
    // string lights
    for (let x = 10; x < W; x += 30) { const y = roofH + 34 + Math.sin(x / 40) * 6; g.strokeStyle = '#2a1f3a'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - 30, roofH + 34 + Math.sin((x - 30) / 40) * 6); g.lineTo(x, y); g.stroke(); const glow = g.createRadialGradient(x, y + 6, 1, x, y + 6, 14); const c = ['255,214,110', '255,140,170', '140,210,255'][(x / 30 | 0) % 3]; glow.addColorStop(0, `rgba(${c},0.9)`); glow.addColorStop(1, `rgba(${c},0)`); g.fillStyle = glow; g.fillRect(x - 14, y - 8, 28, 28); ell(g, x, y + 6, 4, 5, `rgb(${c})`); }
    // back wall with prizes on shelves
    const wy = roofH + 60, wh = H * 0.5 - wy;
    g.fillStyle = '#ffe9c9'; g.fillRect(0, wy, W, wh);
    for (let x = 0; x < W; x += 24) { g.fillStyle = 'rgba(233,79,93,0.12)'; g.fillRect(x, wy, 12, wh); }
    g.fillStyle = '#b07a48'; g.fillRect(0, wy + wh * 0.45, W, 6);
    const prize = (x, y, c) => { ell(g, x, y - 12, 12, 12, c); ell(g, x - 8, y - 22, 4, 5, c); ell(g, x + 8, y - 22, 4, 5, c); ell(g, x - 4, y - 13, 1.8, 2, '#3a2a3a'); ell(g, x + 4, y - 13, 1.8, 2, '#3a2a3a'); ell(g, x, y + 2, 14, 8, c); };
    for (let i = 0; i < 6; i++) prize(30 + i * (W - 60) / 5, wy + wh * 0.45, ['#ffb3c7', '#9fd0f5', '#ffe27a', '#b8f0c8', '#e0c8ff', '#ffc89a'][i]);
    // table with a velvet cloth and gold fringe
    const top = H * 0.5;
    g.fillStyle = lg(g, 0, top, 0, top + H * 0.34, [[0, '#d39a62'], [1, '#a8723f']]); rr(g, -20, top, W + 40, H * 0.34, 18); g.fill();
    for (let y = top + 10; y < top + H * 0.32; y += 9) { g.strokeStyle = 'rgba(120,70,30,0.15)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(W * 0.3, y + 3, W * 0.6, y - 3, W, y + 1); g.stroke(); }
    const cx0 = W * 0.06, cw = W * 0.88, ch = H * 0.22, cy0 = top + 14;
    g.fillStyle = lg(g, 0, cy0, 0, cy0 + ch, [[0, '#d63a4e'], [1, '#a82236']]); rr(g, cx0, cy0, cw, ch, 16); g.fill();
    g.strokeStyle = '#f6c43a'; g.lineWidth = 3; rr(g, cx0 + 8, cy0 + 8, cw - 16, ch - 16, 10); g.stroke();
    for (let x = cx0 + 10; x < cx0 + cw - 8; x += 7) { g.strokeStyle = '#f6c43a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, cy0 + ch); g.lineTo(x + 1, cy0 + ch + 9); g.stroke(); }
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, top + H * 0.33, W, H);
  }
  function drawCup(ctx, x, y, up, hue) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x, y + 3, 44 - up * 0.15, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(x, y - up);
    const body = lg(ctx, -46, 0, 46, 0, [[0, hue[2]], [0.3, hue[0]], [0.55, hue[1]], [1, hue[2]]]);
    ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(-45, -4); ctx.lineTo(-31, -100); ctx.quadraticCurveTo(0, -108, 31, -100); ctx.lineTo(45, -4); ctx.closePath(); ctx.fill();
    // bottom of the cup (on top, as it is upside down)
    ctx.fillStyle = hue[2]; ctx.beginPath(); ctx.ellipse(0, -100, 31, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hue[1]; ctx.beginPath(); ctx.ellipse(0, -101, 24, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    // stars band
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(-41, -40, 82, 12);
    ctx.fillStyle = '#f6c43a';
    for (const sx2 of [-24, 0, 24]) { ctx.beginPath(); for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + j * Math.PI / 5, r = j % 2 ? 2.4 : 5.5; ctx.lineTo(sx2 + Math.cos(a) * r, -34 + Math.sin(a) * r); } ctx.closePath(); ctx.fill(); }
    // rim
    ctx.fillStyle = hue[2]; ctx.beginPath(); ctx.ellipse(0, -4, 45, 9, 0, 0, Math.PI); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, -5, 44, 8, 0, 0.1, Math.PI - 0.1); ctx.stroke();
    // shine
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.moveTo(-27, -92); ctx.lineTo(-18, -93); ctx.lineTo(-30, -12); ctx.lineTo(-39, -12); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function drawCups(g, ctx, S, t) {
    const { W, H, dpr } = S;
    blitBg(ctx, cachedBg('cups', S, cupsBg));
    const top = H * 0.5, k = clampN(Math.round(W / 80), 3, 6);
    face(g.phase === 'shuffle' ? 'wide' : g.phase === 'reveal' && g.pick === g.treat ? 'happy' : 'open');
    // the cat must not give the answer away: it looks at you, or at a cup chosen at random while shuffling,
    // and only looks at the treat once the cups are lifted
    try {
      if (g.phase === 'reveal') { const tp = cupPos(g, g.treat, S); lookAtPt(cat.x + (tp.x - W / 2) / k, cat.gy + 6, 0.6); }
      else if (g.phase === 'shuffle') {
        if (!g.peek || g.peek.until < t) g.peek = { id: Math.floor(Math.random() * 3), until: t + R(0.35, 0.8) };
        const pp = cupPos(g, g.peek.id, S); lookAtPt(cat.x + (pp.x - W / 2) / k, cat.gy + 6, 1);
      } else lookViewer(1);
    } catch (e) { /* */ }
    drawCatAt(ctx, W / 2, top + 8, k, dpr);
    ctx.fillStyle = lg(ctx, 0, top, 0, top + 16, [[0, '#d39a62'], [1, '#c58c56']]); ctx.fillRect(0, top, W, 14);
    const treatP = cupPos(g, g.treat, S);
    if (g.lift[g.treat] > 0.05) {
      const x = treatP.x, y = treatP.y;
      ctx.save(); ctx.translate(x, y - 10);
      ctx.fillStyle = lg(ctx, -18, -8, 18, 8, [[0, '#ffc271'], [1, '#e8892f']]);
      ctx.beginPath(); ctx.ellipse(-2, 0, 17, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(26, -10); ctx.lineTo(23, 0); ctx.lineTo(26, 10); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(160,80,20,0.5)'; ctx.lineWidth = 1.5; for (const d of [-6, 0, 6]) { ctx.beginPath(); ctx.arc(d, 0, 5, -1, 1); ctx.stroke(); }
      ell(ctx, -12, -2, 2.2, 2.2, '#4a3158'); ell(ctx, -12.6, -2.6, 0.8, 0.8, '#ffffff');
      ctx.restore();
      if (g.phase === 'reveal' && g.pick === g.treat) { ctx.fillStyle = '#fff1b0'; for (let i = 0; i < 6; i++) { const a = t * 2 + i, r = 30 + Math.sin(t * 5 + i) * 4; const sx2 = x + Math.cos(a) * r, sy2 = y - 18 + Math.sin(a) * r * 0.5; ctx.beginPath(); for (let j = 0; j < 8; j++) { const aa = j * Math.PI / 4, rr2 = j % 2 ? 1.5 : 4; ctx.lineTo(sx2 + Math.cos(aa) * rr2, sy2 + Math.sin(aa) * rr2); } ctx.fill(); } }
    }
    const HUES = [['#5ec8d6', '#bff0f5', '#26818f'], ['#ff8fb1', '#ffd3e1', '#c94f78'], ['#ffcf5c', '#fff0b8', '#c9921f']];
    const order = [0, 1, 2].map(id => ({ id, p: cupPos(g, id, S) })).sort((a, b) => a.p.y - b.p.y);
    for (const o of order) drawCup(ctx, o.p.x, o.p.y, g.lift[o.id] * 74, HUES[0]);   // all cups look the same, or the game would be too easy
    bubble(ctx, W / 2 - 140, H * 0.07 + 40, 280, 48, W / 2 - 40);
    ctx.fillStyle = '#5a3a5a'; ctx.font = '800 19px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(g.msg, W / 2, H * 0.07 + 71);
  }

  cv.addEventListener('pointerdown', e => {
    const g = G.game; if (!g) return;
    e.preventDefault();
    if (g.kind === 'cups') tapCups(g, e.clientX, e.clientY, size());
    else if (g.kind === 'stairs') { if (e.clientX < innerWidth / 2) turnClimb(g); else climb(g, g.dir); }
  });

  /* ---------- loop ---------- */
  function frame(ts) {
    if (!G.open) return;
    { const q = el.querySelector('.gquit'), on = !!(G.game && !G.game.over); if (q.hidden === on) q.hidden = !on; }
    const dt = Math.min(0.05, G.last ? (ts - G.last) / 1000 : 0.016); G.last = ts;
    const S = size();
    if (cv.width !== Math.round(S.W * S.dpr) || cv.height !== Math.round(S.H * S.dpr)) { cv.width = Math.round(S.W * S.dpr); cv.height = Math.round(S.H * S.dpr); }
    const ctx = cv.getContext('2d'); ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    const g = G.game, t = ts / 1000;
    if (g && !g.over) { G.played += dt; g.sec = (g.sec || 0) + dt; }
    if (!g) {
      const bg = ctx.createLinearGradient(0, 0, 0, S.H); bg.addColorStop(0, '#ffe9f1'); bg.addColorStop(1, '#e3f0ff');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, S.W, S.H);
      for (let i = 0; i < 14; i++) { const x = (i * 83) % S.W, y = (i * 137 + t * 18) % S.H; ctx.globalAlpha = 0.35; ctx.fillStyle = ['#ffb3c7', '#9fd0f5', '#ffe27a'][i % 3]; ctx.beginPath(); ctx.arc(x, S.H - y, 5 + (i % 4), 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1;
      face('happy'); drawCatAt(ctx, S.W / 2, S.H * 0.88, clampN(Math.round(S.W / 70), 4, 7), S.dpr);
    } else if (g.kind === 'flags') { stepFlags(g, dt); drawFlags(g, ctx, S, t); }
    else if (g.kind === 'stairs') { stepStairs(g, dt); drawStairs(g, ctx, S, t); }
    else if (g.kind === 'cups') { stepCups(g, dt); drawCups(g, ctx, S, t); }
    G.raf = requestAnimationFrame(frame);
  }

  /* ---------- dock button ---------- */
  const row = document.getElementById('btns3');
  if (row && !document.getElementById('bGames')) {
    const b = document.createElement('button'); b.id = 'bGames'; b.type = 'button'; b.innerHTML = '<span class="emo">🎮</span>놀이';
    b.addEventListener('click', () => { try { Snd.wake(); } catch (e) { /* */ } openGames(); });
    row.insertBefore(b, row.children[1] || null);
  }
  window.__gamesDev = { G, openGames, closeGames, startGame, best, climb: d => G.game && climb(G.game, d), press: (f, u) => G.game && press(G.game, f, u) };
})();
