/* ============ outfits: collars and hats, drawn straight into the cat sprite ============ */
const COLLARS = {
  red:    { n: '빨강 목걸이', c: '#e8475f', l: '#ff8fa0', bell: true },
  blue:   { n: '파랑 목걸이', c: '#4f8fe8', l: '#9cc4ff', bell: true },
  yellow: { n: '노랑 목걸이', c: '#f2b632', l: '#ffe08a', bell: true },
  pink:   { n: '분홍 목걸이', c: '#ff7fb0', l: '#ffc2dc', bell: true },
  black:  { n: '검정 목걸이', c: '#3b3650', l: '#6a6486', bell: true },
  bowtie: { n: '나비넥타이', c: '#4f8fe8', l: '#9cc4ff', bell: false, bow: true },
  green:  { n: '초록 목걸이', c: '#5fbf62', l: '#a8f0a0', bell: true, nw: true },
  purple: { n: '보라 목걸이', c: '#9a6bf0', l: '#cdb3ff', bell: true, nw: true },
  white:  { n: '하양 목걸이', c: '#e9e9f2', l: '#ffffff', bell: true, nw: true },
  rainbow:{ n: '무지개 목걸이', c: '#ffd04a', l: '#ffffff', bell: true, nw: true, rainbow: true },
  scarf:  { n: '빨간 스카프', c: '#e8475f', l: '#ff8fa0', bell: false, scarf: true, nw: true },
  bandana:{ n: '파란 반다나', c: '#4f8fe8', l: '#9cc4ff', bell: false, scarf: true, nw: true },
  pearl:  { n: '진주 목걸이', c: '#f4f1fa', l: '#ffffff', bell: false, pearl: true, nw: true },
  gold:   { n: '금 사슬 목걸이', c: '#f6c43a', l: '#fff1b0', bell: false, chain: true, nw: true },
  heartc: { n: '하트 목걸이', c: '#ff7fb0', l: '#ffc2dc', bell: false, charm: true, nw: true },
  lei:    { n: '꽃 목걸이', c: '#5fbf62', l: '#a8f0a0', bell: false, lei: true, nw: true },
  tie:    { n: '빨간 넥타이', c: '#e8475f', l: '#ff8fa0', bell: false, tie: true, nw: true },
  spike:  { n: '펑크 목걸이', c: '#2f2b48', l: '#6a6486', bell: false, spike: true, nw: true },
  lace:   { n: '레이스 목걸이', c: '#ffffff', l: '#ffffff', bell: false, lace: true, nw: true },
  starc:  { n: '별 목걸이', c: '#4f5fd8', l: '#9cb0ff', bell: false, charm: 'star', nw: true },
  fishc:  { n: '물고기 목걸이', c: '#4fb8c8', l: '#a6ecf4', bell: false, charm: 'fish', nw: true }
};
const HATS = {
  bow:     { n: '핑크 리본' },
  party:   { n: '파티 모자' },
  crown:   { n: '왕관' },
  glasses: { n: '동그란 안경' },
  flower:  { n: '꽃 장식' },
  santa:   { n: '산타 모자' },
  beanie:  { n: '털모자', nw: true },
  chef:    { n: '요리사 모자', nw: true },
  witch:   { n: '마녀 모자', nw: true },
  tophat:  { n: '신사 모자', nw: true },
  shades:  { n: '선글라스', nw: true },
  bunny:   { n: '토끼 귀', nw: true },
  halo:    { n: '천사 링', nw: true },
  berry:   { n: '딸기 핀', nw: true },
  cap:     { n: '야구 모자', nw: true },
  flowercrown: { n: '꽃관', nw: true },
  pirate:  { n: '해적 모자', nw: true },
  antlers: { n: '루돌프 뿔', nw: true },
  phones:  { n: '헤드폰', nw: true },
  pumpkin: { n: '호박 모자', nw: true },
  sprout:  { n: '새싹', nw: true },
  devil:   { n: '악마 뿔', nw: true },
  heartglasses: { n: '하트 안경', nw: true },
  eyepatch: { n: '해적 안대', nw: true },
  strawhat: { n: '밀짚모자', nw: true },
  cowboy:  { n: '카우보이 모자', nw: true },
  wizard:  { n: '마법사 모자', nw: true },
  headband: { n: '닌자 머리띠', nw: true },
  bee:     { n: '꿀벌 더듬이', nw: true },
  mushroom: { n: '버섯 모자', nw: true },
  propeller: { n: '프로펠러 모자', nw: true },
  unicorn: { n: '유니콘 뿔', nw: true },
  tiara:   { n: '은빛 티아라', nw: true }
};

// is there already a cat pixel here? (so a collar can only ever sit on the body, never float in the air)
function solidAt(x, y) {
  if (FY !== null) y = 2 * FY - y;
  const xx = OX + Math.round(x), yy = OY - Math.round(y);
  return xx >= 0 && yy >= 0 && xx < SW && yy < SH && spr[yy * SW + xx] !== 0;
}
// stamp a tiny sprite (rows top -> bottom) with (x, y) = its bottom-left corner in cat space; outlined
function stamp(rows, pal, x, y, O, clip) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const at = (c, r) => (r >= 0 && r < h && c >= 0 && c < rows[r].length && rows[r][c] !== '.' && rows[r][c] !== ' ');
  for (let r = -1; r <= h; r++) for (let c = -1; c <= w; c++) {
    if (at(c, r)) continue;
    if ((at(c - 1, r) || at(c + 1, r) || at(c, r - 1) || at(c, r + 1)) && (!clip || solidAt(x + c, y + (h - 1 - r)))) pS(x + c, y + (h - 1 - r), O);
  }
  for (let r = 0; r < h; r++) for (let c = 0; c < rows[r].length; c++) {
    const ch = rows[r][c];
    if (ch !== '.' && ch !== ' ' && pal[ch] && (!clip || solidAt(x + c, y + (h - 1 - r)))) pS(x + c, y + (h - 1 - r), packC(pal[ch]));
  }
}

function drawOutfit(o, g) {
  // g: geometry of the head in cat space (see renderCat)
  const { hdx, hdy, HX, HY, ns, ys, ey, exL, exR, tilt, O } = g;
  if (o.collar && COLLARS[o.collar]) {
    const C = COLLARS[o.collar];
    if (C.scarf) {
      const cx = hdx + Math.round(ns * 0.5), by = hdy - HY - 3;
      stamp(['RRRRRRRRRR', '.RRWRRWRR.', '..RRRRRR..', '...RRRR...', '....RR....'], { R: C.c, W: '#ffffff' }, cx - 5, by - 4, O, true);
    } else if (C.tie) {
      const cx = hdx + Math.round(ns * 0.6), by = hdy - HY - 1;
      stamp(['.RR.', '.DD.', 'RRRR', 'RLRR', 'RRRR', '.RR.', '..R.'], { R: C.c, L: C.l, D: '#b3283e' }, cx - 2, by - 6, O, true);
    } else if (C.bow) {
      const cx = hdx + Math.round(ns * 0.6), by = hdy - HY - 1;
      stamp(['BB...BB', 'BLB.BLB', 'BBBDBBB', 'BLB.BLB', 'BB...BB'], { B: C.c, L: C.l, D: '#2a4f9a' }, cx - 3, by - 4, O, true);
    } else {
      // a band that follows the underside of the head, with a bell hanging in the middle
      // a loose band hanging a little below the chin (a U shape), not a rope tight around the head
      const half = HX - 3;
      for (let x = -half; x <= half; x++) {
        const t = x / half, yb = hdy - Math.round(HY * Math.sqrt(Math.max(0, 1 - (x / HX) * (x / HX) * 0.92))), px = hdx + Math.round(ns * 0.5) + x;
        const top = yb - 1 - Math.round(1.6 * (1 - t * t));
        let rb = C.rainbow ? ['#ff6b6b', '#ffd04a', '#5fbf62', '#4f8fe8', '#9a6bf0'][((x + 40) >> 1) % 5] : null;
        if (C.pearl) rb = ((x + 40) % 3 === 0) ? '#dcd6ea' : '#ffffff';
        if (C.chain) rb = ((x + 40) % 2 === 0) ? '#f6c43a' : '#b3841a';
        if (C.lei) rb = ['#ff7fb0', '#ffd04a', '#ff9a3d', '#ffffff', '#c27dff'][((x + 40) >> 1) % 5];
        if (C.spike) rb = ((x + 40) % 3 === 0) ? '#e4e8f2' : '#2f2b48';
        // only where the body really is
        if (solidAt(px, top)) pS(px, top, packC(C.spike && (x + 40) % 3 === 0 ? '#ffffff' : C.l));
        if (solidAt(px, top - 1)) pS(px, top - 1, packC(rb || C.c));
        if (solidAt(px, top - 2)) pS(px, top - 2, packC(C.lace && (x + 40) % 2 === 0 ? '#ffd7e4' : (rb || C.c)));
        if (solidAt(px, top - 3)) pS(px, top - 3, O);
        if ((C.pearl || C.lace) && solidAt(px, top + 1)) pS(px, top + 1, packC('#b9b0cc'));   // a soft edge so a white necklace shows on a white cat
      }
      if (C.charm || C.chain) {
        const bx = hdx + Math.round(ns * 0.5), by = hdy - HY - 4;
        if (solidAt(bx, by - 1) || solidAt(bx, by - 3)) {
          if (C.charm === 'star') stamp(['..Y..', '.YYY.', 'YYLYY', '.YYY.', '.Y.Y.'], { Y: '#ffd04a', L: '#fff3b0' }, bx - 2, by - 4, O);
          else if (C.charm === 'fish') stamp(['.BBB..B', 'BBWBBBB', '.BBB..B'], { B: '#4f8fe8', W: '#ffffff' }, bx - 3, by - 2, O);
          else if (C.charm) stamp(['.RR.RR.', 'RRRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'], { R: '#e8475f' }, bx - 3, by - 5, O);
          else stamp(['.G.', 'GLG', '.G.'], { G: '#f6c43a', L: '#fff1b0' }, bx - 1, by - 3, O);
        }
      }
      if (C.bell) {
        const bx = hdx + Math.round(ns * 0.5), by = hdy - HY - 4;
        if (solidAt(bx, by - 1) || solidAt(bx, by - 3)) {
          stamp(['.GG.', 'GLGG', 'GGGG', '.GG.'], { G: '#f6c43a', L: '#fff1b0' }, bx - 2, by - 3, O);
          pS(bx, by - 1, packC('#9a6b10'));
        }
      }
    }
  }
  const GL = packC('#2a2234');
  const earTop = hdy + HY;       // top of the head
  const cxh = hdx + ys;
  const sh = Math.round(tilt * 2);
  switch (o.hat) {
    case 'bow':
      stamp(['PPP...PPP', 'PLPP.PPLP', 'PPPPDPPPP', 'PLPP.PPLP', 'PPP...PPP'], { P: '#ff7fb0', L: '#ffc2dc', D: '#d94d86' }, cxh + 4, hdy + 6, O);
      break;
    case 'party':
      stamp(['.....yy.....', '.....yy.....', '....pppp....', '....pYYp....', '...pppppp...', '...pYYYYp...', '..pppppppp..', '..pYYYYYYp..', '.pppppppppp.', '.pYYYYYYYYp.', 'pppppppppppp'],
        { y: '#ffe36a', Y: '#ffd04a', p: '#ff6fa4' }, cxh - 6 + sh, earTop - 3, O);
      break;
    case 'crown':
      stamp(['G....G....G', 'GG..GGG..GG', 'GGGGGGGGGGG', 'GGGGGGGGGGG', 'GLGGGRGGGLG', 'GGGGGGGGGGG', 'DDDDDDDDDDD'],
        { G: '#ffd04a', L: '#fff3b0', R: '#e8475f', D: '#d09a1f' }, cxh - 5 + sh, earTop - 2, O);
      break;
    case 'glasses': {
      // two round frames around the eyes (the eyes stay visible)
      const ring = (cx, cy) => {
        for (let a = 0; a < 28; a++) {
          const t = a / 28 * Math.PI * 2;
          pS(Math.round(cx + Math.cos(t) * 5.2), Math.round(cy + Math.sin(t) * 4.6), GL);
        }
      };
      ring(exL + 2, ey + 2); ring(exR + 2, ey + 2);
      for (let x = exL + 8; x <= exR - 4; x++) pS(x, ey + 3, GL);
      pS(exL - 4, ey + 3, GL); pS(exR + 8, ey + 3, GL);
      break;
    }
    case 'flower':
      stamp(['..pp..', '.pppp.', 'ppYYpp', 'ppYYpp', '.pppp.', '..pp..'], { p: '#ffb3d0', Y: '#ffd04a' }, cxh + 4, hdy + 8, O);
      stamp(['.gg', 'ggg'], { g: '#7ac96b' }, cxh + 10, hdy + 7, O);
      break;
    case 'santa':
      stamp(['.......ww.....', '......rrww....', '.....rrrrr....', '....rrrrrrr...', '...rrrrrrrrr..', '..rrrrrrrrrrr.', 'wwwwwwwwwwwwww'],
        { r: '#e8475f', w: '#ffffff' }, cxh - 7 + sh, earTop - 3, O);
      break;
    case 'beanie':
      stamp(['......ww......', '.....wwww.....', '....bbbbbb....', '...bbLbbLbb...', '..bbbbbbbbbb..', '..bLbbLbbLbb..', '.bbbbbbbbbbbb.', 'wwwwwwwwwwwwww'],
        { b: '#4f8fe8', L: '#9cc4ff', w: '#ffffff' }, cxh - 7 + sh, earTop - 3, O);
      break;
    case 'chef':
      stamp(['...wwwwwww...', '..wwwwwwwww..', '.wwwwwwwwwww.', '.wwLwwwwwLww.', '.wwwwwwwwwww.', '..wwwwwwwww..', '..LLLLLLLLL..', '..wwwwwwwww..'],
        { w: '#ffffff', L: '#dfe6f5' }, cxh - 6 + sh, earTop - 3, O);
      break;
    case 'witch':
      stamp(['......kk......', '......kk......', '.....kkkk.....', '.....kkkk.....', '....kkkkkk....', '....kkkkkk....', '...kkkkkkkk...', '...ppppqppp...', '.kkkkkkkkkkkk.', 'kkkkkkkkkkkkkk'],
        { k: '#3a2f55', p: '#9a6bf0', q: '#ffd04a' }, cxh - 7 + sh, earTop - 4, O);
      break;
    case 'tophat':
      stamp(['.kkkkkkkk.', '.kkgkkkkk.', '.kkgkkkkk.', '.kkkkkkkk.', '.rrrrrrrr.', 'kkkkkkkkkk'],
        { k: '#2a2234', g: '#5a4f70', r: '#e8475f' }, cxh - 5 + sh, earTop - 2, O);
      break;
    case 'shades': {
      const lens = (cx, cy) => {
        for (let yy = -2; yy <= 2; yy++) for (let xx = -4; xx <= 4; xx++) if (!(Math.abs(yy) === 2 && Math.abs(xx) >= 3)) pS(cx + xx, cy + yy, GL);
        pS(cx - 2, cy + 1, packC('#ffffff')); pS(cx - 1, cy + 1, packC('#ffffff'));
      };
      lens(exL + 2, ey + 2); lens(exR + 2, ey + 2);
      for (let x = exL + 7; x <= exR - 3; x++) pS(x, ey + 3, GL);
      break;
    }
    case 'bunny':
      stamp(['.ww.', 'wppw', 'wppw', 'wppw', 'wppw', 'wppw', '.ww.'], { w: '#ffffff', p: '#ffb3d0' }, cxh - 7 + sh, earTop - 1, O);
      stamp(['.ww.', 'wppw', 'wppw', 'wppw', 'wppw', 'wppw', '.ww.'], { w: '#ffffff', p: '#ffb3d0' }, cxh + 3 + sh, earTop - 1, O);
      break;
    case 'halo': {
      const ry = earTop + 4;                // floats just above the ears, not far up in the air
      for (let a = 0; a < 26; a++) { const t = a / 26 * Math.PI * 2; const px = cxh + Math.round(Math.cos(t) * 7), py = ry + Math.round(Math.sin(t) * 2); pS(px, py, packC('#ffe36a')); pS(px, py + 1, O); }
      break;
    }
    case 'cap':
      stamp(['..rrrrrrrr....', '.rrrrrrrrrr...', '.rrrrLrrrrr...', 'rrrrrrrrrrrr..', 'dddddddddddddd'], { r: '#e8475f', L: '#ff8fa0', d: '#b3283e' }, cxh - 7 + sh, earTop - 3, O);
      break;
    case 'flowercrown':
      stamp(['..p...y...p...y...p', '.pYp.yWy.pYp.yWy.pYp', '..p.gg.gg.p.gg.gg.p.', 'ggggggggggggggggggg'], { p: '#ff7fb0', y: '#ffd04a', Y: '#ffd04a', W: '#ffffff', g: '#5fbf62' }, cxh - 9 + sh, earTop - 3, O);
      break;
    case 'pirate':
      stamp(['.....kkkk.....', '...kkkkkkkk...', '..kkkwwwkkkk..', '.kkkkwkwkkkkk.', 'kkkkkkkkkkkkkk', 'ggkkkkkkkkkkgg'], { k: '#2a2234', w: '#ffffff', g: '#d9a82a' }, cxh - 7 + sh, earTop - 4, O);
      break;
    case 'antlers': {
      const A1 = ['b..b..', 'bb.b..', '.bbb..', '..bb..', '..bb..', '..bb..', '..bb..', '..bb..'];
      const A2 = A1.map(r => r.split('').reverse().join(''));
      stamp(A1, { b: '#a6743f' }, cxh - 9 + sh, earTop - 2, O);
      stamp(A2, { b: '#a6743f' }, cxh + 4 + sh, earTop - 2, O);
      break;
    }
    case 'phones': {
      for (let a = 0; a <= 30; a++) {
        const t = Math.PI * a / 30, px = cxh + Math.round(Math.cos(t) * (HX + 2)), py = hdy + 2 + Math.round(Math.sin(t) * (HY + 3));
        pS(px, py, packC('#ff8fb1')); pS(px, py + 1, packC('#ff8fb1')); pS(px, py + 2, O);
      }
      stamp(['PPPP', 'PDDP', 'PDDP', 'PDDP', 'PPPP'], { P: '#ff8fb1', D: '#7a3f68' }, cxh - HX - 5, hdy - 2, O);
      stamp(['PPPP', 'PDDP', 'PDDP', 'PDDP', 'PPPP'], { P: '#ff8fb1', D: '#7a3f68' }, cxh + HX + 1, hdy - 2, O);
      break;
    }
    case 'pumpkin':
      stamp(['....gg....', '...gg.....', '..oooooo..', '.oOooOooO.', 'ooOooOooOo', '.oOooOooO.', '..oooooo..'], { g: '#5fbf62', o: '#ff9a3d', O: '#d97520' }, cxh - 5 + sh, earTop - 3, O);
      break;
    case 'sprout':
      stamp(['.gg..gg.', 'gGGggGGg', '.gG..Gg.', '..gggg..', '...gg...', '...gg...'], { g: '#5fbf62', G: '#a8f0a0' }, cxh - 4 + sh, earTop - 2, O);
      break;
    case 'devil':
      stamp(['..r', '.rr', 'rrr', 'rr.'], { r: '#e8475f' }, cxh - 9 + sh, earTop - 1, O);
      stamp(['r..', 'rr.', 'rrr', '.rr'], { r: '#e8475f' }, cxh + 6 + sh, earTop - 1, O);
      break;
    case 'heartglasses': {
      const H = ['.XX.XX.', 'X..X..X', 'X.....X', '.X...X.', '..X.X..', '...X...'];
      const pk = packC('#ff6fa4');
      for (const ex of [exL + 2, exR + 2]) for (let r = 0; r < H.length; r++) for (let c = 0; c < 7; c++) if (H[r][c] === 'X') pS(ex - 3 + c, ey + 5 - r, pk);
      for (let x = exL + 6; x <= exR - 2; x++) pS(x, ey + 4, pk);
      break;
    }
    case 'eyepatch': {
      for (let yy = -3; yy <= 3; yy++) for (let xx = -4; xx <= 4; xx++) if (xx * xx / 20 + yy * yy / 11 <= 1) pS(exR + 2 + xx, ey + 2 + yy, GL);
      for (let x = exL - 4; x <= exR - 2; x++) pS(x, ey + 6 + Math.round((x - exL) * 0.15), GL);
      break;
    }
    case 'strawhat':
      stamp(['....yyyyyy....', '...yyyyLyyy...', '...yyyyyyyy...', '...rrrrrrrr...', 'yyyyyyyyyyyyyy'], { y: '#f2d27a', L: '#fff0b0', r: '#e8475f' }, cxh - 7 + sh, earTop - 3, O);
      break;
    case 'cowboy':
      stamp(['.....bbbbb.....', '....bbbbbbb....', '....bbbbbbb....', '....ddddddd....', 'bb.bbbbbbbbb.bb', '.bbbbbbbbbbbbb.'], { b: '#a6743f', d: '#6a4520' }, cxh - 7 + sh, earTop - 3, O);
      break;
    case 'wizard':
      stamp(['......b......', '.....bbb.....', '.....bYb.....', '....bbbbb....', '....bbbYb....', '...bbbbbbb...', '...bYbbbbb...', '..bbbbbbbbb..', '..ppppppppp..', 'bbbbbbbbbbbbb'], { b: '#4f5fd8', Y: '#ffe36a', p: '#ffd04a' }, cxh - 6 + sh, earTop - 4, O);
      break;
    case 'headband':
      stamp(['rrrrrrrrrrrrr', 'rLLLLrrrrrrrr', 'ddddddddddddd'], { r: '#e8475f', L: '#dfe6f5', d: '#b3283e' }, cxh - 6 + sh, earTop - 6, O);
      stamp(['..rr', '.rr.', 'rr..'], { r: '#e8475f' }, cxh + 7 + sh, earTop - 6, O);
      break;
    case 'bee':
      stamp(['YY.', 'YY.', '.k.', '.k.', '..k'], { Y: '#ffd04a', k: '#2a2234' }, cxh - 6 + sh, earTop - 2, O);
      stamp(['.YY', '.YY', '.k.', '.k.', 'k..'], { Y: '#ffd04a', k: '#2a2234' }, cxh + 4 + sh, earTop - 2, O);
      break;
    case 'mushroom':
      stamp(['...rrrrrr...', '..rrwrrwrr..', '.rrrrrrrrrr.', 'rwrrrwrrrrwr', 'rrrrrrrrrrrr'], { r: '#e8475f', w: '#ffffff' }, cxh - 6 + sh, earTop - 3, O);
      break;
    case 'propeller':
      stamp(['rrrr..y..bbbb', '......y......', '....ggggg....', '...grggbgg...', '..ggggggggg..', '.ddddddddddd.'], { r: '#e8475f', b: '#4f8fe8', y: '#ffd04a', g: '#5fbf62', d: '#3f8f42' }, cxh - 6 + sh, earTop - 3, O);
      break;
    case 'unicorn':
      // a gold spiral horn: visible on white cats too (it used to be white and pink)
      stamp(['..y..', '..y..', '.yLy.', '.yyy.', '.Lyy.', 'yyyLy', 'yLyyy', '.ppp.'], { y: '#f6c43a', L: '#fff1b0', p: '#ff9cc4' }, cxh - 2 + sh, earTop - 4, O);
      break;
    case 'tiara':
      stamp(['y....y....y', 'yy..yyy..yy', 'yyyyyyyyyyy', 'yyyyybyyyyy'], { y: '#dfe6f5', b: '#ff6fa4' }, cxh - 5 + sh, earTop - 2, O);
      break;
    case 'berry':
      stamp(['.gg.', 'rrrr', 'rwrr', 'rrrr', '.rr.'], { g: '#5fbf62', r: '#e8475f', w: '#ffd7d7' }, cxh + 5, hdy + 7, O);
      break;
    default:
  }
}
