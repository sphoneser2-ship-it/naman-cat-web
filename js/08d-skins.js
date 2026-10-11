/* ============ skins for the bowls, the litter box and the bed ============ */
const SKINS = {
  bowl: {
    default: { n: '분홍 밥그릇', body: '#ff8fb1', light: '#ffc2d6', shade: '#e0678f', inside: '#6b3b24', decal: '#ffd7e4', motif: 'paw' },
    sky:     { n: '하늘 밥그릇', body: '#8fc7ff', light: '#c6e4ff', shade: '#5fa0e0', inside: '#6b3b24', decal: '#e8f4ff', motif: 'paw' },
    wood:    { n: '나무 밥그릇', body: '#c58a56', light: '#e4b57c', shade: '#9a6a3c', inside: '#5a3014', decal: '#f3d3a8', motif: 'none' },
    fish:    { n: '물고기 도자기', body: '#f6f3f1', light: '#ffffff', shade: '#cfc8c2', inside: '#6b3b24', decal: '#5f94cc', motif: 'fish' },
    gold:    { n: '황금 밥그릇', body: '#f6c43a', light: '#fff1b0', shade: '#c58a16', inside: '#6b3b24', decal: '#fff6c8', motif: 'star' },
    heart:   { n: '하트 밥그릇', body: '#e8475f', light: '#ff8fa0', shade: '#b3283e', inside: '#6b3b24', decal: '#ffd7d7', motif: 'heart' },
    mint:    { n: '민트 밥그릇', body: '#7be0c3', light: '#b8f4e3', shade: '#3fb396', inside: '#6b3b24', decal: '#e8fff8', motif: 'paw' },
    lemon:   { n: '레몬 밥그릇', body: '#ffe36a', light: '#fff6b0', shade: '#d9b02a', inside: '#6b3b24', decal: '#fff6c8', motif: 'dot' },
    grape:   { n: '포도 밥그릇', body: '#9a6bf0', light: '#cdb3ff', shade: '#6f46c4', inside: '#6b3b24', decal: '#e8dcff', motif: 'paw' },
    sakura:  { n: '벚꽃 밥그릇', body: '#ffd0e0', light: '#fff0f5', shade: '#e8a0bc', inside: '#6b3b24', decal: '#ff8fb1', motif: 'flower' },
    ocean:   { n: '바다 밥그릇', body: '#4f8fe8', light: '#9cc4ff', shade: '#2f68b8', inside: '#6b3b24', decal: '#e8f4ff', motif: 'wave' },
    choco:   { n: '초코 밥그릇', body: '#8a5a30', light: '#b57d4a', shade: '#5a3a1c', inside: '#3a2010', decal: '#f3d3a8', motif: 'dot' },
    bone:    { n: '뼈다귀 밥그릇', body: '#e9e4dc', light: '#ffffff', shade: '#bfb8ae', inside: '#6b3b24', decal: '#8a8478', motif: 'bone' },
    night:   { n: '밤하늘 밥그릇', body: '#3b3650', light: '#6a6486', shade: '#26223a', inside: '#6b3b24', decal: '#ffd04a', motif: 'star' }
  },
  water: {
    default: { n: '파랑 물그릇', body: '#8fc7ff', light: '#c6e4ff', shade: '#5fa0e0', inside: '#5aa8e8', water: '#7cc0f6', decal: '#d8ecff', motif: 'paw' },
    mint:    { n: '민트 물그릇', body: '#7be0c3', light: '#b8f4e3', shade: '#3fb396', inside: '#4fb8c8', water: '#7fd6e8', decal: '#e8fff8', motif: 'paw' },
    wood:    { n: '나무 물그릇', body: '#c58a56', light: '#e4b57c', shade: '#9a6a3c', inside: '#4f90c8', water: '#6fb0e6', decal: '#f3d3a8', motif: 'none' },
    gold:    { n: '황금 물그릇', body: '#f6c43a', light: '#fff1b0', shade: '#c58a16', inside: '#4f90c8', water: '#6fb0e6', decal: '#fff6c8', motif: 'star' },
    lemon:   { n: '레몬 물그릇', body: '#ffe36a', light: '#fff6b0', shade: '#d9b02a', inside: '#4f90c8', water: '#6fb0e6', decal: '#fff6c8', motif: 'dot' },
    grape:   { n: '포도 물그릇', body: '#9a6bf0', light: '#cdb3ff', shade: '#6f46c4', inside: '#4f90c8', water: '#6fb0e6', decal: '#e8dcff', motif: 'paw' },
    sakura:  { n: '벚꽃 물그릇', body: '#ffd0e0', light: '#fff0f5', shade: '#e8a0bc', inside: '#4f90c8', water: '#6fb0e6', decal: '#ff8fb1', motif: 'flower' },
    ocean:   { n: '바다 물그릇', body: '#4f8fe8', light: '#9cc4ff', shade: '#2f68b8', inside: '#3f7fc0', water: '#6fb0e6', decal: '#e8f4ff', motif: 'wave' },
    silver:  { n: '은빛 물그릇', body: '#c8ccd8', light: '#f0f2f8', shade: '#8a8ea0', inside: '#4f90c8', water: '#6fb0e6', decal: '#ffffff', motif: 'star' },
    coral:   { n: '산호 물그릇', body: '#ff9a7a', light: '#ffc2ae', shade: '#d9684a', inside: '#4f90c8', water: '#6fb0e6', decal: '#fff0e8', motif: 'paw' }
  },
  litter: {
    default: { n: '민트 화장실', body: '#4fb8a8', rim: '#a6f0e4', mid: '#5cc7b6', dark: '#3a9486', hi: '#7fe2d3', motif: '#8fe9dc' },
    wood:    { n: '나무 화장실', body: '#b57d4a', rim: '#e4b57c', mid: '#c58a56', dark: '#8a5a30', hi: '#d9a066', motif: '#e4b57c' },
    pink:    { n: '핑크 화장실', body: '#ff8fb1', rim: '#ffd0e0', mid: '#ffa6c4', dark: '#d9628a', hi: '#ffc2d6', motif: '#ffe4ee' },
    black:   { n: '검정 화장실', body: '#4a4568', rim: '#8a85a8', mid: '#5a5578', dark: '#2f2b48', hi: '#6a6588', motif: '#a8a3c8' },
    sky:     { n: '하늘 화장실', body: '#6fa8e8', rim: '#c0dcff', mid: '#86bcf2', dark: '#4a80c0', hi: '#a0ccf8', motif: '#d8ecff' },
    lavender: { n: '라벤더 화장실', body: '#9a7be0', rim: '#d8c8ff', mid: '#b096ee', dark: '#6f56b4', hi: '#c8b8f8', motif: '#e8dcff' },
    lemon:   { n: '레몬 화장실', body: '#f2c63a', rim: '#fff0a0', mid: '#ffd85a', dark: '#b8921a', hi: '#ffe88a', motif: '#fff8c8' },
    berry:   { n: '딸기 화장실', body: '#e8475f', rim: '#ffb0bc', mid: '#ff6b7e', dark: '#b3283e', hi: '#ff909e', motif: '#ffd7d7' },
    cloud:   { n: '구름 화장실', body: '#c8d0e8', rim: '#f0f4ff', mid: '#d8e0f4', dark: '#98a4c8', hi: '#e8eefc', motif: '#ffffff' },
    forest:  { n: '숲속 화장실', body: '#4f9a58', rim: '#a8e0a8', mid: '#62b06a', dark: '#35703e', hi: '#82cc88', motif: '#c8f0c8' },
    orange:  { n: '오렌지 화장실', body: '#ff9a3d', rim: '#ffd0a0', mid: '#ffae5c', dark: '#c26a18', hi: '#ffc080', motif: '#ffe8d0' }
  },
  bed: {
    default: { n: '민트 방석', a: '#3f9f90', b: '#6fc9b8', c: '#8fe0d0', st: '#4aa898', motif: 'button' },
    heart:   { n: '하트 방석', a: '#d9628a', b: '#ff8fb1', c: '#ffc2d6', st: '#e0759c', motif: 'heart' },
    berry:   { n: '딸기 방석', a: '#c23a4e', b: '#ff6b7e', c: '#ff9aa6', st: '#e0586a', motif: 'seeds' },
    moon:    { n: '달빛 방석', a: '#2f3a78', b: '#4a58a8', c: '#6f7fd0', st: '#5a68b8', motif: 'moon' },
    cloud:   { n: '구름 방석', a: '#b8c4e0', b: '#e4ecfa', c: '#ffffff', st: '#c8d4ee', motif: 'cloud' },
    chick:   { n: '병아리 방석', a: '#e0a82a', b: '#ffd04a', c: '#ffe98a', st: '#f2b632', motif: 'paw' },
    lavender: { n: '라벤더 방석', a: '#8a6bc8', b: '#b89af0', c: '#d8c4ff', st: '#a58ae0', motif: 'flower' },
    check:   { n: '체크 방석', a: '#c23a4e', b: '#ff7a8a', c: '#ffe4e8', st: '#e0586a', motif: 'check' },
    starry:  { n: '별빛 방석', a: '#1f2858', b: '#33408a', c: '#4a58b0', st: '#5a68c8', motif: 'star' },
    stripe:  { n: '줄무늬 방석', a: '#4a80c0', b: '#86bcf2', c: '#c0dcff', st: '#6fa8e8', motif: 'stripe' },
    cookie:  { n: '쿠키 방석', a: '#8a5a30', b: '#c58a56', c: '#e4b57c', st: '#a6743f', motif: 'seeds', seed: '#5a3014' },
    melon:   { n: '수박 방석', a: '#3f9f50', b: '#ff6b7e', c: '#ff9aa6', st: '#5fbf62', motif: 'seeds', seed: '#2a2234' }
  }
};
const Skin = Object.assign({ bowl: 'default', water: 'default', litter: 'default', bed: 'default' }, store.get('skins', {}));
function skinOf(kind) { return SKINS[kind][Skin[kind]] || SKINS[kind].default; }
function setSkin(kind, key) { Skin[kind] = key; store.set('skins', Skin); }

// small decals painted on bowls (art-pixel grid, origin = bowl centre at the floor)
function bowlMotif(g, motif, col) {
  if (motif === 'paw') { A(g, col, -2, -6, 4, 3); A(g, col, -5, -7, 2, 2); A(g, col, -1, -8, 2, 2); A(g, col, 3, -7, 2, 2); }
  else if (motif === 'fish') { A(g, col, -4, -6, 7, 3); A(g, col, 3, -7, 2, 5); A(g, col, 4, -6, 2, 3); A(g, '#ffffff', -3, -6, 1, 1); }
  else if (motif === 'star') { A(g, col, -1, -8, 2, 6); A(g, col, -3, -6, 6, 2); A(g, col, -2, -7, 4, 4); }
  else if (motif === 'dot') { A(g, col, -6, -6, 2, 2); A(g, col, -1, -5, 2, 2); A(g, col, 4, -6, 2, 2); }
  else if (motif === 'flower') { A(g, col, -1, -8, 2, 2); A(g, col, -1, -4, 2, 2); A(g, col, -3, -6, 2, 2); A(g, col, 1, -6, 2, 2); A(g, '#ffd04a', -1, -6, 2, 2); }
  else if (motif === 'wave') { for (let i = 0; i < 6; i++) { A(g, col, -6 + i * 2, i % 2 ? -5 : -6, 2, 1); A(g, col, -6 + i * 2, i % 2 ? -3 : -4, 2, 1); } }
  else if (motif === 'bone') { A(g, col, -4, -6, 8, 2); A(g, col, -5, -7, 2, 2); A(g, col, -5, -5, 2, 2); A(g, col, 3, -7, 2, 2); A(g, col, 3, -5, 2, 2); }
  else if (motif === 'heart') { A(g, col, -4, -7, 3, 3); A(g, col, 1, -7, 3, 3); A(g, col, -3, -5, 6, 2); A(g, col, -2, -3, 4, 1); A(g, col, -1, -2, 2, 1); }
}
