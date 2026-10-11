/* ============ the cat's diary: what happened today ============ */
const Diary = { days: store.get('diary', {}), dirty: false, saveT: 20, view: 0, last: '' };
const dayKey = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
function todayStat() {
  const k = dayKey();
  if (!Diary.days[k]) Diary.days[k] = {};
  return Diary.days[k];
}
function diaryNote(kind, amount = 1) {
  const t = todayStat();
  t[kind] = (t[kind] || 0) + amount;
  Diary.dirty = true;
}
// counted when a behaviour starts
const DIARY_COUNT = { eat: 'eat', drink: 'drink', zoom: 'zoom', zoomSmall: 'zoom', toilet: 'toilet', scratch: 'scratch', hairball: 'hair', sneeze: 'sneeze', churu: 'churu', flop: 'flop',
  perch: 'perch', punchIcon: 'punch', loafIcon: 'iconLoaf', tailChase: 'tail', knock: 'knock', peek: 'peek', sunbathe: 'sun', follow: 'follow', hunt: 'hunt', fly: 'bug', nip: 'nip', gift: 'gift', greet: 'greet' };
function diaryStart(label) {
  if (DIARY_COUNT[label]) diaryNote(DIARY_COUNT[label], 1);
}
function diaryTick(dt) {
  if (!cat.visible) return;
  if (cat.asleep) diaryNote('sleepSec', dt);
  else if (cat.label === 'pet') diaryNote('petSec', dt);
  else if (cat.label === 'toy' || cat.label === 'ball' || cat.label === 'mouse') diaryNote('playSec', dt);
  if (cat.label === 'loaf') diaryNote('loafSec', dt);
  Diary.saveT -= dt;
  if (Diary.saveT <= 0) { Diary.saveT = 30; flushDiary(); }
}
function flushDiary() {
  if (!Diary.dirty) return;
  const keys = Object.keys(Diary.days).sort();
  while (keys.length > 21) delete Diary.days[keys.shift()];
  store.set('diary', Diary.days);
  Diary.dirty = false;
}
window.addEventListener('beforeunload', flushDiary);

const mins = s => Math.round(s / 60);
function dur(s) { const m = mins(s); return m >= 60 ? Math.floor(m / 60) + '시간 ' + (m % 60 ? (m % 60) + '분' : '') : m + '분'; }
function diaryLines(key) {
  const t = Diary.days[key] || {};
  const n = cat.name, out = [];
  if (t.sleepSec > 120) out.push(`낮잠과 밤잠을 합쳐 ${dur(t.sleepSec)} 동안 잤어요.`);
  if (t.eat) out.push(`밥을 ${t.eat}번 먹으러 갔어요.`);
  if (t.churu) out.push(`츄르를 ${t.churu}번 얻어먹었어요. 최고의 순간!`);
  if (t.drink) out.push(`물을 ${t.drink}번 마셨어요.`);
  if (t.petSec > 20) out.push(`쓰다듬어 준 시간은 ${dur(t.petSec)}. 골골송이 끊이질 않았어요.`);
  if (t.brush) out.push(`빗질이 시원했는지 ${t.brush}번이나 몸을 맡겼어요.`);
  if (t.playSec > 20) out.push(`장난감과 ${dur(t.playSec)} 동안 신나게 놀았어요.`);
  if (t.zoom) out.push(`갑자기 우다다를 ${t.zoom}번 했어요. 이유는 아무도 몰라요.`);
  if (t.scratch) out.push(`스크래처를 ${t.scratch}번 박박 긁었어요.`);
  if (t.perch) out.push(`창 위에 ${t.perch}번 올라가 세상을 내려다봤어요.`);
  if (t.punch) out.push(`폴더를 ${t.punch}번 냥냥펀치로 혼내줬어요.`);
  if (t.iconLoaf) out.push(`폴더 위에서 식빵을 ${t.iconLoaf}번 구웠어요.`);
  if (t.knock) out.push(`물건을 ${t.knock}번 떨어뜨리려고 했어요.`);
  if (t.nip) out.push('캣닢에 취해서 한바탕 굴렀어요.');
  if (t.gift) out.push(`받은 선물이 ${t.gift}개 있어요. 마음에 들었나 봐요.`);
  if (t.greet) out.push('돌아온 걸 알고 마중을 나왔어요.');
  if (t.present) out.push('선물을 ' + t.present + '번 물어다 줬어요. 오늘은 무엇을 가져왔을까요?');
  if (t.bug) out.push('날아다니는 벌레를 쫓아다녔어요.');
  if (t.toilet) out.push(`화장실에 ${t.toilet}번 다녀왔어요.`);
  if (t.hair) out.push('헤어볼을 토하고 시무룩했어요.');
  if (t.sneeze) out.push('재채기를 했어요. 에취!');
  if (!out.length) out.push(`${n}는 오늘 별다른 일 없이 조용히 지냈어요.`);
  return out;
}
function diaryDayKeys() {
  const k = Object.keys(Diary.days).sort().reverse();
  const today = dayKey();
  if (!k.includes(today)) k.unshift(today);
  return k;
}
function paintDiary() {
  const keys = diaryDayKeys();
  Diary.view = clamp(Diary.view, 0, keys.length - 1);
  const key = keys[Diary.view];
  const el = document.getElementById('diaryText');
  const lbl = document.getElementById('diaryDate');
  const label = key === dayKey() ? '오늘' : key.slice(5).replace('-', '월 ') + '일';
  lbl.textContent = label + ' 의 ' + cat.name;
  el.innerHTML = '';
  for (const ln of diaryLines(key)) { const li = document.createElement('li'); li.textContent = ln; el.appendChild(li); }
  document.getElementById('diaryPrev').disabled = Diary.view >= keys.length - 1;
  document.getElementById('diaryNext').disabled = Diary.view <= 0;
}
