/* ============ pixel art: coats, sprites, cat rasteriser ============ */

function mkSprite(rows, pal) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true });
  rows.forEach((r, j) => {
    for (let i = 0; i < r.length; i++) {
      const ch = r[i];
      if (ch !== '.' && ch !== ' ' && pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(i, j, 1, 1); }
    }
  });
  return c;
}

// rect list -> outlined pixel canvas. rects: [x,y,w,h,color]
function mkOutlined(w, h, rects, outline, pad = 1) {
  const bw = w + pad * 2, bh = h + pad * 2;
  const buf = new Array(bw * bh).fill(null);
  for (const [x, y, rw, rh, col] of rects)
    for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) {
      const px = x + i + pad, py = y + j + pad;
      if (px >= 0 && py >= 0 && px < bw && py < bh) buf[py * bw + px] = col;
    }
  const c = document.createElement('canvas');
  c.width = bw; c.height = bh;
  const g = c.getContext('2d', { willReadFrequently: true });
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
    const i = y * bw + x;
    if (buf[i]) { g.fillStyle = buf[i]; g.fillRect(x, y, 1, 1); }
    else if ((x > 0 && buf[i - 1]) || (x < bw - 1 && buf[i + 1]) || (y > 0 && buf[i - bw]) || (y < bh - 1 && buf[i + bw])) {
      g.fillStyle = outline; g.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

/* ---------- random coats: colour, pattern, patches ---------- */
const FUR = [
  { k: 'cheese', n: '치즈', c: '#f0a35a', st: '#c9722b', w: 3 },
  { k: 'cream', n: '크림', c: '#f4dcae', st: '#d7b074', w: 1.5 },
  { k: 'grey', n: '회색', c: '#a9b2c6', st: '#7b839c', w: 2.5 },
  { k: 'silver', n: '실버', c: '#cfd3de', st: '#9298aa', w: 1 },
  { k: 'black', n: '검정', c: '#3b3650', st: '#262234', w: 2.5 },
  { k: 'brown', n: '갈색', c: '#9b6b47', st: '#6b4328', w: 1.5 },
  { k: 'choco', n: '초콜릿', c: '#6e4c3d', st: '#4b3025', w: 1 },
  { k: 'white', n: '흰색', c: '#f6f3f1', st: '#d7d1ce', w: 1.5 }
];
const PATTERNS = [
  { k: 'solid', n: '민무늬', w: 2 }, { k: 'tabby', n: '줄무늬', w: 3.5 }, { k: 'tuxedo', n: '턱시도', w: 2 },
  { k: 'cow', n: '젖소', w: 1.5 }, { k: 'calico', n: '삼색', w: 1.5 }, { k: 'point', n: '포인트', w: 1 }, { k: 'spotted', n: '점박이', w: 1.3 }
];
const EYE_COLORS = [
  { k: 'green', n: '초록 눈', c: '#7fd96b', w: 3 }, { k: 'gold', n: '금색 눈', c: '#ffc83d', w: 3 },
  { k: 'amber', n: '호박색 눈', c: '#f09a3a', w: 2 }, { k: 'blue', n: '파란 눈', c: '#6fb6ff', w: 1.5 },
  { k: 'lime', n: '연두색 눈', c: '#c4e05a', w: 1.5 }
];

const BREEDS = {
  ksh:     { k: 'ksh',     n: '코리안 숏헤어',   w: 3,   head: [12, 10], ear: 'normal', tail: 5, tailN: 7 },
  brit:    { k: 'brit',    n: '브리티시 숏헤어', w: 1.5, head: [13, 10.5], cheek: true, hr: 1, cr: 1.5, drop: 2, ear: 'normal', tail: 6, tailN: 7 },
  fold:    { k: 'fold',    n: '스코티시 폴드',   w: 1.3, head: [12, 10.5], ear: 'fold', tail: 5, tailN: 7 },
  munch:   { k: 'munch',   n: '먼치킨',          w: 1.3, head: [12, 10], drop: 4.5, ear: 'normal', tail: 5, tailN: 7 },
  persian: { k: 'persian', n: '페르시안',        w: 1.1, head: [14, 10], ear: 'small', flat: true, fluff: true, hr: 1, cr: 1.5, drop: 1, tail: 8, tailN: 8 },
  coon:    { k: 'coon',    n: '메인쿤',          w: 1.1, head: [13, 11], ear: 'tuft', fluff: true, hr: 1.5, cr: 2, tail: 8, tailN: 9 },
  siamese: { k: 'siamese', n: '샴',              w: 1,   head: [11, 9], ear: 'big', hr: -1, cr: -1, lift: 2, tail: 3, tailN: 9 }
};
// breeds that came later: only cats adopted after that update (coat version 2) can have them, so every cat that already exists keeps its look
Object.assign(BREEDS, {
  russian:   { k: 'russian',   n: '러시안 블루',   w: 0, head: [11.5, 9.5], ear: 'big', hr: -0.5, tail: 5, tailN: 8 },
  abys:      { k: 'abys',      n: '아비시니안',     w: 0, head: [11, 9.5], ear: 'big', lift: 1, hr: -0.5, cr: -0.5, tail: 4, tailN: 9 },
  norwegian: { k: 'norwegian', n: '노르웨이 숲',   w: 0, head: [13, 11], ear: 'tuft', fluff: true, hr: 1, cr: 2, tail: 8, tailN: 9 },
  ragdoll:   { k: 'ragdoll',   n: '랙돌',          w: 0, head: [13, 10.5], ear: 'normal', fluff: true, cheek: true, hr: 1, cr: 1.5, tail: 8, tailN: 8 },
  sphynx:    { k: 'sphynx',    n: '스핑크스',       w: 0, head: [11, 9.5], ear: 'big', lift: 1.5, hr: -1, cr: -1, tail: 3, tailN: 10 },
  bengal:    { k: 'bengal',    n: '벵갈',          w: 0, head: [12, 10], ear: 'normal', lift: 0.5, tail: 5, tailN: 8 }
});
const BREED_LIST = ['ksh', 'brit', 'fold', 'munch', 'persian', 'coon', 'siamese'].map(k => BREEDS[k]);
const NEW_BREEDS = ['russian', 'abys', 'norwegian', 'ragdoll', 'sphynx', 'bengal'];
const FUR_X = [
  { k: 'blue',     n: '블루',     c: '#8794ad', st: '#5d6985' },
  { k: 'lilac',    n: '라일락',   c: '#cdbccb', st: '#9a8498' },
  { k: 'red',      n: '레드',     c: '#dd7a35', st: '#a84a18' },
  { k: 'fawn',     n: '연갈색',   c: '#dcc3a2', st: '#b49670' },
  { k: 'gold',     n: '골드',     c: '#e8b36a', st: '#7a4a24' },
  { k: 'ruddy',    n: '루디',     c: '#b86a3a', st: '#7a3f1f' },
  { k: 'skin',     n: '살구빛',   c: '#e8bfae', st: '#c99a88' },
  { k: 'skingrey', n: '회갈빛',   c: '#bfa9a6', st: '#9c8582' }
];
const PATTERNS_X = [{ k: 'tortie', n: '토티(거북이 등딱지)' }, { k: 'van', n: '밴 무늬' }, { k: 'ticked', n: '틱드' }];
const EYE_X = [{ k: 'violet', n: '보랏빛 눈', c: '#b99bff' }, { k: 'aqua', n: '민트빛 눈', c: '#6fe0d0' }, { k: 'copper', n: '구릿빛 눈', c: '#d9783a' }];
// the "something new" a cat of coat version 2 may get (about 45 %); drawn from its own generator so the normal coat below is the same as before
function extVariety(seed) {
  const r = mulberry32(((seed >>> 0) ^ 0x5bd1e995) >>> 0);
  if (r() > 0.45) return null;
  const x = r(), at = a => a[Math.floor(r() * a.length)];
  if (x < 0.5) return { breed: at(NEW_BREEDS) };
  if (x < 0.7) return { pat: at(PATTERNS_X) };
  if (x < 0.9) return { fur: FUR_X.find(f => f.k === at(['lilac', 'red', 'fawn', 'blue'])) };
  return { eye: at(EYE_X) };
}

function genCoat(seed, cv = 1) {
  const r = mulberry32(seed >>> 0);
  const rr = (a, b) => a + (b - a) * r();
  // everything about the coat must come from the seed, or the saved cat looks different after a restart
  const rint = (a, b) => Math.floor(a + r() * (b - a + 1));
  const pick = a => a[Math.floor(r() * a.length)];
  const wp = arr => { let t = 0; for (const o of arr) t += o.w; let x = r() * t; for (const o of arr) { x -= o.w; if (x <= 0) return o; } return arr[arr.length - 1]; };
  const X = cv >= 2 ? extVariety(seed) : null;
  let breed = wp(BREED_LIST);
  if (X && X.breed) breed = BREEDS[X.breed];
  const pk = a => a[Math.floor(r() * a.length)];
  const furOf = k => FUR.find(f => f.k === k) || FUR_X.find(f => f.k === k);
  const patOf = k => PATTERNS.find(p => p.k === k) || PATTERNS_X.find(p => p.k === k);
  let fur = wp(FUR);
  let pat = wp(PATTERNS);
  if (X && X.fur) fur = X.fur;
  if (X && X.pat) pat = X.pat;
  // each breed has coats it is known for
  if (breed.k === 'russian') { fur = furOf('blue'); pat = patOf('solid'); }
  else if (breed.k === 'abys') { fur = furOf(pk(['ruddy', 'ruddy', 'red', 'fawn'])); pat = patOf('ticked'); }
  else if (breed.k === 'norwegian') { fur = furOf(pk(['brown', 'grey', 'black', 'cheese', 'white', 'silver'])); pat = patOf(pk(['tabby', 'tabby', 'tuxedo', 'solid'])); }
  else if (breed.k === 'ragdoll') pat = patOf('point');
  else if (breed.k === 'sphynx') { fur = furOf(pk(['skin', 'skin', 'skingrey'])); pat = patOf('solid'); }
  else if (breed.k === 'bengal') { fur = furOf(pk(['gold', 'gold', 'cream'])); pat = patOf('spotted'); }
  else if (breed.k === 'siamese') pat = patOf('point');
  else if (breed.k === 'brit') { fur = furOf(pk(['grey', 'grey', 'cheese', 'cream', 'black', 'silver', 'white'])); pat = patOf(pk(['solid', 'solid', 'tabby', 'tuxedo'])); }
  else if (breed.k === 'persian') { fur = furOf(pk(['cream', 'white', 'grey', 'cheese', 'silver'])); pat = patOf(pk(['solid', 'solid', 'tabby', 'tuxedo'])); }
  else if (breed.k === 'coon') { fur = furOf(pk(['brown', 'grey', 'black', 'cheese', 'choco'])); pat = patOf(pk(['tabby', 'tabby', 'tabby', 'tuxedo', 'solid'])); }
  if (pat.k === 'tuxedo' && (fur.k === 'white' || fur.k === 'cream')) fur = FUR.find(f => f.k === 'black');
  if (pat.k === 'tabby' && fur.k === 'white') fur = FUR.find(f => f.k === 'grey');
  if (pat.k === 'spotted' && fur.k === 'black') fur = FUR.find(f => f.k === 'silver');
  const WHITE = '#faf6ff';
  const bodyP = [], headP = [], tail = new Array(10).fill(null);
  const bp = (c, big) => ({ t: rr(-0.05, 1.05), v: rr(-0.7, 0.7), rt: rr(0.18, 0.34) * (big ? 1.5 : 1), rv: rr(0.4, 0.75) * (big ? 1.25 : 1), c });
  const hp = (c, sm) => ({ dx: rr(-5, 5), dy: rr(-3.5, 4), rx: rr(1.8, 3.6) * (sm ? 0.6 : 1), ry: rr(1.6, 3.2) * (sm ? 0.6 : 1), c });
  const desc = [fur.n + ' ' + pat.k === 'solid' ? fur.n : fur.n + ' ' + pat.n];
  let base = fur.c, stripe = null, bib = false, blaze = false, socks = false, tabby = false, mask = null, pawCol = null, belly = null;
  const extraN = { v: 0 };

  switch (pat.k) {
    case 'tabby': tabby = true; stripe = fur.st; break;
    case 'tuxedo': bib = true; blaze = r() < 0.75; socks = true; belly = WHITE; break;
    case 'cow': {
      base = '#f6f3f1';
      const pc = wp(FUR.filter(f => !['white', 'cream', 'silver'].includes(f.k))).c;
      const n = rint(3, 4);
      for (let i = 0; i < n; i++) bodyP.push(bp(pc, true));
      for (let i = 0; i < rint(1, 2); i++) headP.push(hp(pc));
      headP.push({ dx: 4, dy: 6, rx: 2.6, ry: 3, c: pc });
      if (r() < 0.6) for (let i = 5; i < 10; i++) tail[i] = pc;
      belly = WHITE; desc[0] = fur.n === '흰색' ? '젖소' : '젖소'; break;
    }
    case 'calico': {
      base = '#f6f3f1';
      const o = '#e9954a', k = '#38333f';
      for (let i = 0; i < 2; i++) { bodyP.push(bp(o, true)); bodyP.push(bp(k, true)); }
      headP.push(hp(o), hp(k), { dx: -4, dy: 6, rx: 2.6, ry: 3, c: o }, { dx: 4, dy: 6, rx: 2.6, ry: 3, c: k });
      for (let i = 4; i < 10; i++) tail[i] = i % 4 < 2 ? k : o;
      belly = WHITE; desc[0] = '삼색'; break;
    }
    case 'point': {
      base = pick(['#f1e4cc', '#ece6df']);
      const pc = pick(['#6a4c3e', '#5d5668', '#7a5a48']);
      mask = pc; pawCol = pc;
      if (breed.k === 'ragdoll') { bib = true; pawCol = WHITE; }
      headP.push({ dx: 0, dy: -2, rx: 4.6, ry: 3.4, c: pc }, { dx: 4, dy: 6, rx: 3, ry: 3, c: pc }, { dx: -4, dy: 6, rx: 3, ry: 3, c: pc });
      for (let i = 0; i < 10; i++) tail[i] = pc;
      desc[0] = '포인트'; break;
    }
    case 'tortie': {
      const o = '#e9954a', k = '#38333f';
      base = k;
      for (let i = 0; i < 9; i++) bodyP.push({ t: rr(-0.05, 1.05), v: rr(-0.75, 0.75), rt: rr(0.1, 0.2), rv: rr(0.22, 0.45), c: o });
      headP.push(hp(o), hp(o, true), { dx: -4, dy: 6, rx: 2.6, ry: 3, c: o });
      for (let i = 3; i < 10; i++) tail[i] = i % 3 === 0 ? o : k;
      desc[0] = '토티'; break;
    }
    case 'van': {
      base = '#f6f3f1';
      const pc = wp(FUR.filter(f => !['white', 'cream', 'silver'].includes(f.k))).c;
      bodyP.push(bp(pc, true));
      if (r() < 0.5) bodyP.push(bp(pc, false));
      headP.push({ dx: 0, dy: 5.5, rx: 4.6, ry: 3.4, c: pc }, { dx: 4, dy: 6, rx: 3, ry: 3, c: pc }, { dx: -4, dy: 6, rx: 3, ry: 3, c: pc });
      for (let i = 0; i < 10; i++) tail[i] = pc;
      belly = WHITE; desc[0] = '밴'; break;
    }
    case 'ticked': tabby = true; stripe = mixHex(fur.c, fur.st, 0.5); break;
    case 'spotted': {
      stripe = fur.st;
      const big = breed.k === 'bengal';
      const n = big ? rint(9, 13) : rint(8, 13);
      for (let i = 0; i < n; i++) bodyP.push({ t: rr(-0.05, 1.05), v: rr(-0.75, 0.75), rt: big ? rr(0.09, 0.14) : rr(0.06, 0.1), rv: big ? rr(0.22, 0.34) : rr(0.14, 0.24), c: fur.st });
      for (let i = 0; i < 3; i++) headP.push(hp(fur.st, true));
      break;
    }
    default: break;
  }
  // 얼룩: extra patches on any coat
  const plain = breed.k === 'russian' || breed.k === 'sphynx' || breed.k === 'abys';      // these breeds have an even coat: no white socks or patches
  if (!['cow', 'calico', 'spotted', 'tortie', 'van'].includes(pat.k) && !plain && r() < 0.5) {
    const n = rint(1, 3), white = fur.k !== 'white' && r() < 0.6;
    const col = white ? WHITE : (fur.k === 'white' ? '#cfa27a' : fur.st);
    for (let i = 0; i < n; i++) bodyP.push(bp(col, false));
    if (r() < 0.5) headP.push(hp(col, true));
    extraN.v = n;
  }
  if (pat.k !== 'tuxedo' && pat.k !== 'point' && pat.k !== 'cow' && pat.k !== 'calico' && pat.k !== 'tortie' && pat.k !== 'van' && !plain) {
    if (r() < 0.35) socks = true;
    if (r() < 0.2) blaze = fur.k !== 'white';
    if (r() < 0.25) { tail[8] = WHITE; tail[9] = WHITE; }
  }
  if (!belly) belly = mixHex(base, '#ffffff', fur.k === 'white' ? 0 : 0.5);
  if (!pawCol) pawCol = socks ? WHITE : base;
  let eye = wp(EYE_COLORS);
  if (X && X.eye) eye = X.eye;
  if (breed.k === 'russian') eye = EYE_COLORS.find(e => e.k === 'green');
  if (pat.k === 'point') eye = EYE_COLORS.find(e => e.k === 'blue');
  else if (fur.k === 'white' && r() < 0.3) eye = EYE_COLORS.find(e => e.k === 'blue');
  const odd = r() < 0.05;
  const eye2 = odd ? (eye.k === 'blue' ? EYE_COLORS.find(e => e.k === 'gold') : EYE_COLORS.find(e => e.k === 'blue')) : eye;
  const parts = [fur.k === 'white' && ['cow', 'calico'].includes(pat.k) ? '' : ''].filter(Boolean);
  const label = (pat.k === 'solid' ? fur.n : (['cow', 'calico', 'point', 'tortie', 'van'].includes(pat.k) ? pat.n : `${fur.n} ${pat.n}`)) + ' ' + breed.n;
  const extra = [];
  if (socks && pat.k !== 'tuxedo') extra.push('흰 양말');
  if (blaze && pat.k !== 'tuxedo') extra.push('얼굴 흰 줄');
  if (tail[9] === WHITE && tail[8] === WHITE) extra.push('꼬리 끝 하양');
  if (extraN.v) extra.push(`얼룩 ${extraN.v}개`);
  extra.push(odd ? '짝눈' : eye.n);
  return {
    seed, breed: breed.k, fur: fur.k, pattern: pat.k, label, extra, eyeKey: eye.k,
    base, stripe, tabby, bib, blaze, belly, light: WHITE, paw: pawCol, mask,
    iris: eye.c, iris2: eye2.c, bodyP, headP, tail
  };
}

function packCoat(c) {
  const k = {};
  k.base = packC(c.base);
  k.shade = packC(mixHex(c.base, '#2a1d38', 0.22));
  k.outline = packC(mixHex(c.base, '#1e1428', 0.74));
  { const [r, g, b] = hexRgb(c.base); k.dark = (0.299 * r + 0.587 * g + 0.114 * b) < 100; }
  k.edge = packC(mixHex(mixHex(c.base, '#1e1428', 0.74), c.base, 0.55));
  k.rim = packC(k.dark ? mixHex(c.base, '#ffffff', 0.14) : mixHex(c.base, '#2a1d38', 0.14));
  // the haunch only needs a hint of an edge; a full-strength rim there read as broken pixels on the rump
  k.rimSoft = packC(k.dark ? mixHex(c.base, '#ffffff', 0.06) : mixHex(c.base, '#2a1d38', 0.07));
  k.shade2 = packC(mixHex(c.base, '#2a1d38', 0.1));
  k.belly = packC(c.belly);
  k.light = packC(c.light);
  k.paw = packC(c.paw);
  k.stripe = c.stripe ? packC(c.stripe) : 0;
  k.tabby = c.tabby; k.bib = c.bib; k.blaze = c.blaze;
  k.muzzle = packC(c.mask ? mixHex(c.mask, '#ffffff', 0.4) : (c.bib || c.pattern === 'cow' || c.pattern === 'calico' ? c.light : c.belly));
  k.iris = packC(c.iris); k.iris2 = packC(c.iris2);
  k.nose = packC('#ff8fa5');
  k.pupil = packC('#1b1424'); k.white = packC('#ffffff');
  k.ear = packC('#ffb2c3');
  k.blush = packC('#ff7f9d', 190);
  k.whisk = packC('#ffffff', 215);
  k.mouthIn = packC('#7c2336'); k.tongue = packC('#ff7a97'); k.tongue2 = packC('#e5587a');
  k.bodyP = c.bodyP.map(p => Object.assign({}, p, { c: packC(p.c) }));
  k.headP = c.headP.map(p => Object.assign({}, p, { c: packC(p.c) }));
  k.tail = c.tail.map(t => (t ? packC(t) : 0));
  k.breed = BREEDS[c.breed] || BREEDS.ksh;
  k.right = Object.assign({}, k, { iris: k.iris2 });
  return k;
}
const bodyPatchCol = (K, t, v) => {
  for (const p of K.bodyP) { const a = (t - p.t) / p.rt, b = (v - p.v) / p.rv; if (a * a + b * b < 1) return p.c; }
  return 0;
};
const headPatchCol = (K, dx, dy) => {
  for (const p of K.headP) { const a = (dx - p.dx) / p.rx, b = (dy - p.dy) / p.ry; if (a * a + b * b < 1) return p.c; }
  return 0;
};

/* ---------- little sprites ---------- */
const SPR = {};
SPR.poop = mkSprite([
  '...###...',
  '..#ooo#..',
  '.#ohooo#.',
  '.#######.',
  '#oohooooo'.slice(0, 8) + '#',
  '#ooooooo#',
  '.#######.'
], { '#': '#3b2210', o: '#7a4a22', h: '#a8703a' });
SPR.poopSm = mkSprite([
  '..##..',
  '.#oo#.',
  '#ohoo#',
  '#oooo#',
  '.####.'
], { '#': '#3b2210', o: '#7a4a22', h: '#a8703a' });
SPR.hairball = mkSprite([
  '..#####.',
  '.#gggggg#'.slice(0, 8),
  '#gdgggdg'.slice(0, 7) + '#',
  '.######.'
], { '#': '#4a4350', g: '#a79fae', d: '#7c7484' });
SPR.ball = mkSprite([
  '..###..',
  '.#pwpp#',
  '#pppwp#',
  '#ppwppp',
  '#pwpppp',
  '.#pppp#',
  '..###..'
].map(r => r.padEnd(7, '#').slice(0, 7)), { '#': '#7a2a52', p: '#ff7aa6', w: '#ffc4d8' });
SPR.paw = mkSprite(['.p.p.', '.....', 'p.p.p', '.ppp.', '.ppp.'].map(r => r), { p: '#6b5a74' });
SPR.pawS = mkSprite(['p.p', '.p.', 'ppp'], { p: '#6b5a74' });

SPR.bird = [
  mkSprite(['..bb...', '.bbbb..', 'bbbbbbk', '.bwwb..', '..bb...', '..y.y..'], { b: '#7f6a5c', w: '#e9dccd', k: '#f2b24a', y: '#d38b3b' }),
  mkSprite(['b.bb.b.', '.bbbb..', 'bbbbbbk', '.bwwb..', '..bb...', '..y.y..'], { b: '#7f6a5c', w: '#e9dccd', k: '#f2b24a', y: '#d38b3b' })
];

/* emote bubbles */
const BUBBLE = [
  '..#######..',
  '.#fffffff#.',
  '#fffffffff#',
  '#fffffffff#',
  '#fffffffff#',
  '#fffffffff#',
  '#fffffffff#',
  '#fffffffff#',
  '.#fffffff#.',
  '..###f###..',
  '.....#.....'
];
const ICON7 = {
  heart:  { rows: ['.......', '.rr.rr.', 'rwrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'], pal: { r: '#ff5d86', w: '#ffc2d3' } },
  note:   { rows: ['....rr.', '....r.r', '....r..', '....r..', '..rrr..', '.rrrr..', '..rr...'], pal: { r: '#7a5cff' } },
  ask:    { rows: ['..rrr..', '.r...r.', '.....r.', '....r..', '...r...', '.......', '...r...'], pal: { r: '#5a6bd8' } },
  alert:  { rows: ['...r...', '...r...', '...r...', '...r...', '...r...', '.......', '...r...'], pal: { r: '#ff4a4a' } },
  zzz:    { rows: ['rrrr...', '..r....', '.r.....', 'rrrr.rr', '.....r.', '....r..', '.....rr'], pal: { r: '#5a7bd8' } },
  sweat:  { rows: ['...b...', '..bbb..', '.bbwbb.', '.bbbbb.', '.bbbbb.', '..bbb..', '.......'], pal: { b: '#4aa8ff', w: '#d6ecff' } },
  food:   { rows: ['.......', '..k.k..', '.kkkkk.', 'rrrrrrr', '.rrrrr.', '..rrr..', '.......'], pal: { r: '#ff7aa0', k: '#b8743a' } },
  poop:   { rows: ['...b...', '..bbb..', '..bwb..', '.bbbbb.', '.bbbbb.', 'bbbbbbb', '.......'], pal: { b: '#8a5a2b', w: '#c28a4e' } },
  star:   { rows: ['...y...', '...y...', 'yyyyyyy', '..yyy..', '.yy.yy.', 'y.....y', '.......'], pal: { y: '#ffc83a' } },
  dots:   { rows: ['.......', '.......', 'k.k.k.k', '.......', '.......', '.......', '.......'], pal: { k: '#6b6490' } },
  fish:   { rows: ['.......', '..bbb.b', '.bwbbbb', 'bbbbbbb', '.bbbbbb', '..bbb.b', '.......'], pal: { b: '#59b7e8', w: '#e6f6ff' } },
  punch:  { rows: ['r..r..r', '.r.r.r.', '..rrr..', 'rrrrrrr', '..rrr..', '.r.r.r.', 'r..r..r'], pal: { r: '#ff7a3a' } }
};
const EMOTE = {};
for (const [k, v] of Object.entries(ICON7)) {
  const c = mkSprite(BUBBLE, { '#': '#5a4a7a', f: '#ffffff' });
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(mkSprite(v.rows, v.pal), 2, 2);
  EMOTE[k] = c;
}
const MINI = {
  heart: mkSprite(['.r.r.', 'rrrrr', 'rrrrr', '.rrr.', '..r..'], { r: '#ff5d86' }),
  z: mkSprite(['zzz', '.z.', 'zzz'], { z: '#ffffff' }),
  Z: mkSprite(['zzzz', '..z.', '.z..', 'zzzz'], { z: '#ffffff' }),
  note: mkSprite(['.rr', '.r.', 'rr.'], { r: '#ffffff' }),
  spark: mkSprite(['.y.', 'yyy', '.y.'], { y: '#fff3a0' }),
  drop: mkSprite(['.b', 'bb', 'bb'], { b: '#6cc0ff' })
};
