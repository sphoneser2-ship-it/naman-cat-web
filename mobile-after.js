'use strict';
/* ============ mobile tweaks applied after the game has booted ============ */
(function () {
  // the browser preview draws fake desktop icons; a phone has none
  try { drawFakeIcons = function () {}; } catch (e) { /* not defined in this build */ }

  // menu items that only make sense on a Windows desktop
  for (const id of ['mPass', 'mFs', 'mBehind', 'mAuto', 'mRoam', 'mQuit']) {
    const el = document.getElementById(id);
    if (el) el.hidden = true;
  }

  const tip = document.querySelector('#panel .tip');
  if (tip) tip.textContent = '쓰다듬기: 손가락으로 고양이를 살살 문질러요. 들어 올리기: 고양이를 길게 누른 채 끌어요. 똥은 톡 눌러서 치워요. 밥그릇·물그릇·화장실·침대 색은 「가구」에서 바꿔요.';

  // wall/floor seam follows the cat room's own floor line at any screen size
  function syncFloor() {
    try { document.documentElement.style.setProperty('--floor', Math.round((Room.oy + ROOM_FLOOR_TOP) * S_PX) + 'px'); } catch (e) { /* not ready */ }
  }
  syncFloor();
  window.addEventListener('resize', () => setTimeout(syncFloor, 0));

  // Android app only: a menu button that opens the live wallpaper picker
  if (window.NamanAndroid && document.getElementById('menu')) {
    const b = document.createElement('button');
    b.type = 'button'; b.id = 'mWallpaper'; b.textContent = '배경화면으로 설정';
    b.addEventListener('click', () => { try { window.NamanAndroid.setWallpaper(); } catch (e) { toast('배경화면 설정을 열지 못했어요'); } });
    const menu = document.getElementById('menu');
    menu.insertBefore(b, menu.firstChild);
  }

  // live wallpaper: no care panel (the room app is for that), and the room sits above the launcher's app dock
  if (/[?&]wallpaper=1/.test(location.search)) {
    document.documentElement.classList.add('wallpaper');
    try {
      applyLayout = function () {
        Host.display = { w: innerWidth, h: innerHeight, workBottom: Math.round(innerHeight * 0.78), scale: 1 };
        DPR = window.devicePixelRatio || 1;
        const cssW = window.innerWidth, cssH = window.innerHeight;
        S_PX = pickScale();
        canvas.width = Math.round(cssW * DPR); canvas.height = Math.round(cssH * DPR);
        canvas.style.width = cssW + 'px'; canvas.style.height = cssH + 'px';
        layoutWorld(cssW, cssH, Host.display.workBottom);
        placeDock();
        document.getElementById('bubbles').style.cssText = `position:fixed;left:0;top:0;width:${cssW}px;height:${cssH}px;`;
        syncFloor();
      };
      applyLayout();
    } catch (e) { /* keep the default layout */ }
  }

  // iOS: block the double-tap zoom and the rubber-band page scroll outside the care panel
  let lastTap = 0;
  document.addEventListener('touchend', e => {
    const now = Date.now();
    if (now - lastTap < 300 && !(e.target.closest && e.target.closest('input'))) e.preventDefault();
    lastTap = now;
  }, { passive: false });
  document.addEventListener('touchmove', e => {
    if (!(e.target.closest && e.target.closest('#panel, #sheet'))) e.preventDefault();
  }, { passive: false });
  // A long press (holding the cat, dragging a bowl) fires "contextmenu" on phones, which opened the skin menu
  // under the finger, so the next tap could change the bowl colour by accident. Skins are changed in 「가구」.
  window.addEventListener('contextmenu', e => { e.preventDefault(); e.stopImmediatePropagation(); }, true);
  // The water bowl redrew its whole picture several times a second for a tiny sliding glint; on phone screens
  // that read as the bowl changing colour and blinking. On the phone the water is drawn still.
  try {
    drawWater = function (c) {
      const { x, gy } = Room.water, P = skinOf('water');
      inArt(c, x, gy, g => {
        bowlArt(g, P.body, P.light, P.shade, P.inside, 0, P.decal, P.motif);
        aEll(g, P.water, 0, -10, 11, 2);
        A(g, '#ffffff', -4, -11, 3, 1);
      }, { ...PSPEC.bowl, key: 'water:' + Skin.water + ':still' });
    };
  } catch (e) { /* older build */ }
  /* ---------- hammock: a real frame, ropes and a full striped cloth (it was a thin strip between two sticks) ---------- */
  try {
    PSPEC.furn.hammock = { w: 96, h: 60, ox: 48, oy: 54 };
    const sag = x => -34 + Math.round(15 * (1 - Math.pow(x / 38, 2)));
    const baseDrawFurn = drawFurn;
    drawFurn = function (c, k, layer) {
      if (k !== 'hammock' || layer === 'shadow') return baseDrawFurn(c, k, layer);
      const F = Room.furn[k];
      inArt(c, F.x, F.gy, g => {
        if (layer === 'back') {
          // floor bar and feet
          boxO(g, -45, -5, 90, 5, '#8a5a33'); A(g, '#b98552', -44, -4, 88, 1); A(g, '#6e4426', -44, -1, 88, 1);
          boxO(g, -46, -3, 8, 3, '#7a4d28'); boxO(g, 38, -3, 8, 3, '#7a4d28');
          // posts with round caps
          for (const sx of [-44, 39]) {
            boxO(g, sx, -46, 5, 42, '#a67447'); A(g, '#cf9c68', sx + 1, -45, 1, 40); A(g, '#86592f', sx + 4, -45, 1, 40);
            boxO(g, sx - 1, -50, 7, 4, '#7a4d28'); A(g, '#a67447', sx, -49, 5, 1);
          }
          // ropes from the post tops to the cloth corners
          for (const [x0, x1] of [[-40, -36], [41, 36]]) {
            const y0 = -45, y1 = sag(x1) - 1, n = 12;
            for (let i = 0; i <= n; i++) { const t = i / n; A(g, '#e9d8b4', Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), 1, 1); }
          }
          // the inside of the cloth (seen above the front edge)
          for (let x = -36; x <= 36; x++) {
            const y = sag(x), stripe = ((x + 40) % 10) < 5;
            A(g, PO, x, y - 1, 1, 1);
            A(g, stripe ? '#f4a9c2' : '#fff1f6', x, y, 1, 9);
            A(g, stripe ? '#e48fae' : '#f7d3e0', x, y + 6, 1, 3);
            if (x % 6 === 0) A(g, '#ffffff', x, y + 1, 1, 1);
          }
        } else {
          // the near edge of the cloth, a little thicker, with tassels hanging under it
          for (let x = -36; x <= 36; x++) {
            const y = sag(x) + 6, stripe = ((x + 40) % 10) < 5;
            A(g, stripe ? '#e48fae' : '#f5c6d6', x, y, 1, 4);
            A(g, '#ffd6e4', x, y, 1, 1);
            A(g, PO, x, y + 4, 1, 1);
            if ((x + 40) % 5 === 0 && Math.abs(x) < 34) { A(g, '#ffe36a', x, y + 5, 1, 3); A(g, PO, x, y + 8, 1, 1); }
          }
          A(g, PO, -37, sag(-37), 1, 10); A(g, PO, 37, sag(37), 1, 10);
        }
      }, { ...PSPEC.furn.hammock, key: 'furn:hammock2:' + layer, name: 'furn:hammock' });
    };
  } catch (e) { console.error(e); }

  /* ---------- furniture placement on a phone ----------
     The desktop places pieces by their distance from the right edge of a wide screen, so on a phone every
     piece ended up squeezed against the left edge. Here they get their own spots across the floor, and a
     piece the player drags stays where it was put (saved separately from the desktop layout). */
  try {
    const DEF = { cardbox: [0.2, 0.32], tower: [0.88, 0.22], grass: [0.6, 0.18], hammock: [0.36, 0.6], tent: [0.74, 0.52] };
    const saved = () => { try { return JSON.parse(localStorage.getItem('catdesk.furnMobile') || '{}'); } catch (e) { return {}; } };
    const floorTop = () => {
      try { const l = window.__room && window.__room.L(); if (l) return (l.floorY + (window.__roomFloorDepth || 10)) / S_PX + 8; } catch (e) { /* */ }
      return GY_MIN + 8;
    };
    const floorBottom = () => propBottom() - 18;          // keep clear of the bowls, litter box and bed along the bottom
    layoutFurn = function () {
      const sv = saved(), top = floorTop(), bot = Math.max(top + 10, floorBottom());
      for (const k of FURN_KEYS) {
        const F = Room.furn[k], p = sv[k] || DEF[k] || [0.5, 0.5];
        F.x = clamp(W * p[0], 30, W - 30); F.gy = clamp(top + (bot - top) * p[1], 40, propBottom());
      }
    };
    const baseSetPos = setFurnPos;
    setFurnPos = function (k, x, y) {
      baseSetPos(k, x, y);
      const F = Room.furn[k], top = floorTop(), bot = Math.max(top + 10, floorBottom()), sv = saved();
      sv[k] = [clamp(F.x / W, 0, 1), clamp((F.gy - top) / (bot - top), -0.2, 1.4)];
      try { localStorage.setItem('catdesk.furnMobile', JSON.stringify(sv)); } catch (e) { /* */ }
    };
    layoutFurn();
  } catch (e) { console.error(e); }
  /* ---------- petting is welcome: a cat that is grooming or resting lets itself be petted ---------- */
  try {
    let prevLabel = '';
    const baseStart = startPetting;
    startPetting = function (silent) { prevLabel = cat.label || ''; return baseStart(silent); };
    const baseAccept = acceptPet;
    const CALM = new Set(['groom', 'idleSit', 'idleStand', 'loaf', 'sunbathe', 'perch', 'watchWeather', 'nodOff', 'follow', 'rub', 'greet', 'wander', 'inspect', 'nap', 'hammock', 'cardbox', 'tower', 'tent', 'stretch', 'yowl', 'ghost', '']);
    acceptPet = function (fromSleep) {
      if (CALM.has(prevLabel)) return true;               // grooming, sitting, loafing: always happy to be petted
      return baseAccept(fromSleep) || Math.random() < 0.5;  // otherwise mostly yes (kids should not be refused often)
    };
  } catch (e) { console.error(e); }
  /* ---------- a finger resting on or rubbing a calm cat always starts petting ----------
     The desktop rule waits 4 s after a petting ends before it may start again and ignores fast strokes,
     so a child rubbing a grooming cat right after a tap got nothing. */
  try {
    const CALM2 = new Set(['groom', 'idleSit', 'idleStand', 'loaf', 'sunbathe', 'perch', 'watchWeather', 'nodOff', 'follow', 'rub', 'greet', 'wander', 'inspect', 'nap', 'hammock', 'cardbox', 'tower', 'tent', 'stretch', 'yowl', 'ghost', '']);
    let dwell = 0;
    setInterval(() => {
      if (typeof cat === 'undefined' || !cat.visible || window.__bathOpen) { dwell = 0; return; }
      const C = Desk.cursor, on = C.x > -9000 && !!catHit(C.x, C.y);
      const free = !Interact.drag && !Interact.draggingBall && (Interact.mode === 'none' || Interact.mode === 'brush') && !cat.protect && !cat.busy;
      if (on && free && CALM2.has(cat.label || '') && cat.speed < 40) {
        dwell += 0.1;
        if (dwell >= 0.25) { dwell = 0; Interact.petRetry = 0; cat.petCooldown = 0; startPetting(true); }
      } else dwell = 0;
    }, 100);
  } catch (e) { console.error(e); }

  /* ---------- iPhone (Safari): every smoothed prop picture gets its own pixels ----------
     The desktop code smooths a prop on one shared scratch canvas per size and then copies it with drawImage.
     Safari copies canvas-to-canvas lazily, so two props of the same size drawn in one frame (the food bowl and
     the water bowl) both ended up with the last picture: two blue water bowls until feeding redrew the food bowl.
     Here the finished pixels are written straight into the picture's own canvas with putImageData. */
  try {
    const pool = {};
    smoothArt = function (spec, fn) {
      if (spec.key !== undefined) { const hit = pCache.get(spec.key); if (hit) return hit; }
      const w = spec.w, h = spec.h, s = pScratchFor(w, h), g = s.cx;
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.clearRect(0, 0, w, h);
      g.save(); g.translate(spec.ox, spec.oy); fn(g); g.restore();
      const src = new Uint32Array(g.getImageData(0, 0, w, h).data.buffer);
      s.mid.fill(0); s.ob.fill(0);
      scale2xInto(src, w, h, s.mid, 0, 0, w - 1, h - 1);
      scale2xInto(s.mid, w * 2, h * 2, s.ob, 0, 0, w * 2 - 1, h * 2 - 1);
      let out;
      if (spec.key !== undefined) {
        out = document.createElement('canvas'); out.width = w * PSK; out.height = h * PSK;
        if (pCache.size > 200) pCache.clear();
        pCache.set(spec.key, out);
      } else {                                   // unnamed pictures: a small ring of canvases, so one frame never reuses one
        const k = w + 'x' + h, ring = pool[k] || (pool[k] = { i: 0, c: [] });
        ring.i = (ring.i + 1) % 12;
        out = ring.c[ring.i] || (ring.c[ring.i] = Object.assign(document.createElement('canvas'), { width: w * PSK, height: h * PSK }));
      }
      out.getContext('2d').putImageData(s.oi, 0, 0);
      return out;
    };
    pCache.clear();                              // drop pictures made before this fix
  } catch (e) { console.error(e); }

  /* ---------- the water bowl never looks like the food bowl ---------- */
  try {
    // colours are compared the way eyes see them (CIE Lab), so red next to coral or pink next to coral count as "the same"
    const lab = h => {
      const [r, g, b] = [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16) / 255).map(c => (c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92));
      const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047, y = r * 0.2126 + g * 0.7152 + b * 0.0722, z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
      const f = t => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
      return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
    };
    const near = (a, b) => { const A = lab(a), B = lab(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]) < 40; };
    const clash = (bowlKey, waterKey) => near((SKINS.bowl[bowlKey] || SKINS.bowl.default).body, (SKINS.water[waterKey] || SKINS.water.default).body);
    const baseSet = setSkin;
    const fixWater = () => {
      if (!clash(Skin.bowl, Skin.water)) return false;
      let ok = Object.keys(SKINS.water).find(k => ownsSkin('water', k) && !clash(Skin.bowl, k));
      if (!ok) {
        // nothing owned fits (e.g. only the basic blue one next to a blue food bowl): the cat gets a spare water bowl
        ok = ['mint', 'silver', 'coral', 'lemon', 'grape', 'wood'].find(k => SKINS.water[k] && !clash(Skin.bowl, k)) || Object.keys(SKINS.water).find(k => !clash(Skin.bowl, k));
        if (!ok) return false;
        try { Unlocks.have.add('skin:water:' + ok); saveUnlocks(); } catch (e) { /* */ }
      }
      baseSet('water', ok);
      return true;
    };
    setSkin = function (kind, key) {
      if (kind === 'water' && clash(Skin.bowl, key)) { toast('밥그릇과 비슷한 색은 물그릇으로 고를 수 없어요'); return; }
      baseSet(kind, key);
      if (kind === 'bowl' && fixWater()) toast('밥그릇과 겹치지 않게 물그릇 색도 바꿨어요');
    };
    fixWater();
  } catch (e) { console.error(e); }
  // which build is running (shown at the bottom of the settings menu)
  try {
    const menu = document.getElementById('menu');
    if (menu) { const v = document.createElement('p'); v.className = 'hint'; v.style.cssText = 'margin:6px 0 0;font-size:11px;opacity:.7;'; v.textContent = '버전 ' + (window.__BUILD || '개발'); menu.appendChild(v); window.addEventListener('load', () => { v.textContent = '버전 ' + (window.__BUILD || '개발'); }); }
  } catch (e) { /* */ }
})();
