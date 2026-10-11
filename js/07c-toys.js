/* ============ toys: every kind of ball / plush shares one set of physics, only the numbers and the look differ ============ */
const TOYS = {
  yarn:     { n: '털실공',     rest: 0.5,  fric: 1.5, base: true },
  mouse:    { n: '쥐돌이',     rest: 0.4,  fric: 1.8, base: true },
  pingpong: { n: '탁구공',     rest: 0.86, fric: 0.5, snd: 'tick' },
  bell:     { n: '방울공',     rest: 0.55, fric: 1.3, snd: 'jingle' },
  paper:    { n: '종이공',     rest: 0.25, fric: 2.4, snd: 'crinkle' },
  duck:     { n: '오리 인형',  rest: 0.15, fric: 4.5, snd: 'squeak', plush: true },
  fish:     { n: '물고기 인형', rest: 0.1,  fric: 5,   snd: 'thud', plush: true },
  feather:  { n: '깃털',       rest: 0.1,  fric: 3,   grav: 55, air: 2.6, snd: '' },
  rubber:   { n: '고무공',     rest: 0.93, fric: 0.4, snd: 'boing' },
  cork:     { n: '병뚜껑',     rest: 0.5,  fric: 1.1, snd: 'tick' },
  carrot:   { n: '당근 인형',  rest: 0.1,  fric: 5,   snd: 'thud', plush: true },
  cheese:   { n: '치즈 인형',  rest: 0.1,  fric: 5,   snd: 'squeak', plush: true },
  ladybug:  { n: '무당벌레',   rest: 0.3,  fric: 2,   hunt: true, snd: 'tick' },
  balloon:  { n: '풍선',       rest: 0.75, fric: 2.2, grav: 38, air: 1.4, snd: '' },
  spring:   { n: '무지개 스프링', rest: 0.9, fric: 0.6, snd: 'boing' },
  butterfly: { n: '나비',      rest: 0.3,  fric: 2,   hunt: true, snd: '' },
  penguin:  { n: '펭귄 인형',  rest: 0.1,  fric: 5,   snd: 'squeak', plush: true },
  dice:     { n: '주사위',     rest: 0.45, fric: 1.6, snd: 'tick' }
};
TOYS.mouse.hunt = true;
// where the middle of every toy picture is (art px from its bottom centre, up is negative) and where a mouth would grab it;
// used to hold a toy between the paws or in the mouth so the picture, not its corner, lands on that spot
const TOY_C = {
  yarn: [0, -8], mouse: [1, -5], pingpong: [0, -5], bell: [0, -8], paper: [0, -5], duck: [1, -6], fish: [-1, -5], feather: [0, -6], rubber: [0, -6], cork: [0, -3],
  carrot: [2, -4], cheese: [0, -5], ladybug: [1, -4], balloon: [0, -13], spring: [0, -6], butterfly: [0, -8], penguin: [0, -7], dice: [0, -5]
};
const TOY_GRIP = { mouse: [-1, -5], ladybug: [0, -4], butterfly: [0, -8] };
// put toy b so that its grip / centre point sits at world x = wx, height wyUp above the cat's ground line
function placeToyAt(b, wx, wyUp, grip) {
  const c = (grip && TOY_GRIP[b.kind]) || TOY_C[b.kind || 'yarn'] || [0, -6], f = b.face || 1;
  b.x = wx - f * c[0] / SS; b.gy = cat.gy; b.z = wyUp + c[1] / SS;
}
const isHunt = b => !!b && !!(TOYS[b.kind] && TOYS[b.kind].hunt);
const toyOf = b => TOYS[(b && b.kind) || 'yarn'] || TOYS.yarn;
let toySoundT = 0;
function toySound(b) {
  const T = toyOf(b);
  if (!T.snd || NOW - toySoundT < 0.15) return;
  toySoundT = NOW;
  if (Snd[T.snd]) Snd[T.snd]();
}

// drawing: called with the context already moved to the toy (art-pixel grid, y grows downward, feet at 0)
const TOY_DRAW = {
  pingpong(g) { aEllO(g, '#fffdf5', 0, -5, 4, 4); aEll(g, '#e6e1f0', 1, -4, 3, 3); A(g, '#ffa94d', -3, -6, 6, 1); A(g, '#ffffff', -2, -8, 2, 1); },
  bell(g, b) {
    const w = Math.round(Math.sin(Room.t * 18) * Math.min(2, Math.hypot(b.vx, b.vgy) / 30));
    aEllO(g, '#f6c43a', w, -6, 5, 5); aEll(g, '#fff1b0', w - 2, -8, 2, 2); A(g, '#9a6b10', w - 4, -5, 8, 1); A(g, '#9a6b10', w, -5, 1, 3);
    A(g, PO, w - 1, -13, 3, 3); A(g, '#e8a82a', w, -12, 1, 1);
  },
  paper(g) {
    aEllO(g, '#fbfaff', 0, -5, 5, 5); aEll(g, '#e0dcee', 2, -4, 3, 3);
    A(g, '#b9b2c8', -3, -6, 3, 1); A(g, '#b9b2c8', 0, -3, 4, 1); A(g, '#b9b2c8', -2, -2, 1, 2); A(g, '#b9b2c8', 2, -8, 1, 3);
  },
  duck(g, b) {
    g.save(); g.scale(b.face || 1, 1);
    aEllO(g, '#ffd54a', -1, -4, 7, 4); aEll(g, '#ffe98a', -3, -5, 4, 2);
    aEllO(g, '#ffd54a', 4, -9, 4, 4); A(g, '#ff9a3d', 8, -9, 3, 2); A(g, PO, 5, -10, 1, 2);
    aLine(g, '#ffb92a', -7, -5, -9, -7, 2);
    g.restore();
  },
  feather(g, b) {
    const r = Math.sin(Room.t * 2 + b.x * 0.05) * 3, air = b.z > 2;
    aLine(g, '#e9b44c', -9, -3 + r, 9, -9 - r, 2);
    for (let i = -6; i <= 6; i += 2) {
      aLine(g, i % 4 === 0 ? '#ff8fb1' : '#ffc2d6', i, -5 - (i * 0.3) + r, i + 2, -11 - (i * 0.3) - r * 0.6, 2);
      aLine(g, i % 4 === 0 ? '#ff8fb1' : '#ffc2d6', i, -4 - (i * 0.3) + r, i + 1, 0 - (i * 0.3) + r * 0.4, 2);
    }
    if (air) A(g, '#fff6a8', 10, -12, 1, 1);
  },
  rubber(g) { aEllO(g, '#ff5a6a', 0, -6, 6, 6); aEll(g, '#ff8f9a', -2, -8, 3, 3); A(g, '#ffffff', -3, -10, 2, 2); A(g, '#c23a4e', -5, -4, 10, 1); },
  cork(g) { aEllO(g, '#c8ccd8', 0, -3, 5, 3); aEll(g, '#e4e8f0', -1, -4, 3, 1); for (let i = -4; i <= 4; i += 2) A(g, '#8a8ea0', i, -2, 1, 2); A(g, '#e8475f', -2, -4, 4, 1); },
  carrot(g, b) {
    g.save(); g.scale(b.face || 1, 1);
    for (let i = 0; i < 9; i++) { const w = 4 - Math.floor(i / 3); aEllO(g, '#ff9a3d', -8 + i * 2, -4, 2, w); }
    aEll(g, '#ffb870', -3, -6, 5, 1); A(g, '#d97520', -2, -3, 3, 1); A(g, '#d97520', 2, -5, 3, 1);
    aLine(g, PO, 9, -4, 13, -8, 3); aLine(g, '#5fbf62', 9, -4, 13, -8, 1); aLine(g, '#5fbf62', 9, -4, 14, -4, 1); aLine(g, '#5fbf62', 9, -4, 13, 0, 1);
    g.restore();
  },
  cheese(g, b) {
    g.save(); g.scale(b.face || 1, 1);
    for (let y = 0; y < 9; y++) { const w = 12 - y; A(g, PO, -w - 1, -y - 1, 1, 1); A(g, y < 3 ? '#ffd54a' : '#ffe27a', -w, -y - 1, w * 2, 1); A(g, PO, w, -y - 1, 1, 1); }
    A(g, PO, -13, 0, 26, 1); A(g, '#e8a82a', -12, -1, 24, 1);
    aEll(g, '#e8a82a', -4, -5, 2, 2); aEll(g, '#e8a82a', 4, -3, 2, 1); aEll(g, '#e8a82a', 1, -7, 1, 1);
    A(g, PO, 3, -6, 1, 1); A(g, PO, 6, -6, 1, 1); A(g, '#ff8fb1', 4, -4, 1, 1);
    g.restore();
  },
  ladybug(g, b) {
    g.save(); g.scale(b.face || 1, 1);
    const run = b.run ? Math.round(Math.sin(Room.t * 40) * 1) : 0;
    for (let i = -1; i <= 1; i++) { A(g, PO, i * 3, -1, 1, 2 + (i % 2 ? run : 0)); }
    aEllO(g, '#e8475f', 0, -4, 6, 4); aEll(g, '#ff8f9a', -2, -6, 3, 1); A(g, PO, 0, -8, 1, 8);
    for (const [x, y] of [[-3, -5], [3, -5], [-2, -2], [3, -3]]) A(g, '#2a2234', x, y, 2, 2);
    aEllO(g, '#2a2234', 6, -4, 2, 2); A(g, '#ffffff', 6, -5, 1, 1);
    g.restore();
  },
  balloon(g, b) {
    const sw = Math.round(Math.sin(Room.t * 3 + b.x * 0.07) * 2);
    aLine(g, '#dfe6f5', sw, -7, 0, 0, 1);
    aEllO(g, '#ff8fb1', sw, -14, 5, 6); aEll(g, '#ffc2d6', sw - 2, -16, 2, 3); A(g, '#ffffff', sw - 3, -18, 1, 2);
    A(g, '#d9628a', sw - 1, -8, 3, 2); A(g, PO, sw - 1, -7, 3, 1);
  },
  spring(g, b) {
    const cols = ['#ff6b6b', '#ffd04a', '#5fbf62', '#4f8fe8', '#9a6bf0'], sq = Math.min(1, Math.hypot(b.vx, b.vgy) / 90);
    for (let i = 0; i < 5; i++) {
      const y = -2 - i * 2 - Math.round(sq), sh = i % 2 ? 1 : -1;
      A(g, PO, -5 + sh, y - 1, 10, 1); A(g, cols[i], -4 + sh, y, 8, 1); A(g, PO, -5 + sh, y + 1, 10, 1);
    }
  },
  butterfly(g, b) {
    const f = Math.abs(Math.sin(Room.t * (b.run ? 26 : 5))), w = 2 + Math.round(f * 4);
    const o = w + 1;
    aEllO(g, '#c27dff', -o, -5, w, 2); aEllO(g, '#c27dff', o, -5, w, 2);
    aEllO(g, '#ff8fb1', -o, -9, w, 3); aEllO(g, '#ff8fb1', o, -9, w, 3);
    A(g, '#ffffff', -o, -10, 1, 1); A(g, '#ffffff', o, -10, 1, 1);
    A(g, PO, -1, -12, 3, 9); A(g, '#5a4a86', 0, -11, 1, 7); A(g, PO, -2, -14, 1, 2); A(g, PO, 2, -14, 1, 2);
  },
  penguin(g, b) {
    g.save(); g.scale(b.face || 1, 1);
    aEllO(g, '#38456e', 0, -7, 6, 7); aEll(g, '#ffffff', 2, -6, 3, 5);
    A(g, '#ffffff', 2, -12, 2, 2); A(g, PO, 3, -11, 1, 1); A(g, '#ff9a3d', 6, -9, 3, 1); A(g, '#ff9a3d', 1, -1, 3, 1); A(g, '#ff9a3d', -3, -1, 3, 1);
    aLine(g, '#38456e', -5, -9, -8, -5, 2);
    g.restore();
  },
  dice(g, b) {
    A(g, PO, -6, -11, 12, 11); A(g, '#fffdf5', -5, -10, 10, 9); A(g, '#dcd6ea', -5, -2, 10, 1); A(g, '#dcd6ea', 4, -10, 1, 9);
    for (const [x, y] of [[-3, -9], [1, -9], [-3, -4], [1, -4], [-1, -6]]) A(g, '#e8475f', x, y, 2, 2);
  },
  fish(g, b) {
    g.save(); g.scale(b.face || 1, 1);
    aEllO(g, '#7fb2e6', 0, -5, 9, 4); aEll(g, '#bfdcf5', 0, -3, 7, 2);
    for (let i = 0; i < 4; i++) A(g, '#5f94cc', -3 + i * 3, -8, 2, 2);
    aLine(g, PO, -9, -5, -14, -9, 4); aLine(g, '#7fb2e6', -9, -5, -14, -9, 2); aLine(g, PO, -9, -5, -14, -1, 4); aLine(g, '#7fb2e6', -9, -5, -14, -1, 2);
    A(g, '#ffffff', 5, -7, 2, 2); A(g, PO, 6, -6, 1, 1); A(g, '#ff8fb1', 8, -4, 1, 1);
    g.restore();
  }
};
function drawToy(c, b) {
  const fn = TOY_DRAW[b.kind];
  if (!fn) return false;
  const lift = Math.min(1, b.z / 30);
  inArt(c, b.x, b.gy, g => aEll(g, `rgba(30,20,50,${0.22 - lift * 0.1})`, 0, 1, (toyOf(b).plush ? 9 : 6) - lift * 2, 2), PSPEC.shadowS);
  if (!b.face) b.face = b.vx < -3 ? -1 : 1;
  else if (Math.abs(b.vx) > 8) b.face = b.vx < 0 ? -1 : 1;
  inArt(c, b.x, b.gy - b.z, g => fn(g, b), PSPEC.toy);
  return true;
}
