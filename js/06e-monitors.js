/* ============ roaming to the other monitors ============
   The overlay lives on one monitor at a time. When the cat walks off the side of the screen that touches another monitor,
   the main process moves the overlay there. Furniture stays on the home monitor, so the cat goes back for food and the litter box. */
const isHome = () => !Host.display || Host.display.home !== false;
function roamEdges() {
  const e = Host.display && Host.display.edges, out = [];
  if (e && e.left !== undefined && e.left !== false) out.push('left');
  if (e && e.right !== undefined && e.right !== false) out.push('right');
  return out;
}

function* bVisitMonitor() {
  const edges = roamEdges();
  if (!edges.length || !Host.hopDisplay) return;
  const edge = pick(edges);
  S('{n}가 옆 모니터가 궁금한가 봐요');
  face('open'); setPose('stand');
  yield* walkTo(edge === 'right' ? W - 10 : 10, clamp(cat.gy, GY_MIN, GY_MAX), { speed: SPD.walk, timeout: 60 });
  cat.dir = edge === 'right' ? 1 : -1;
  setPose('stand'); face('wide', 'closed', 'fwd');
  yield* walkXOnly(edge === 'right' ? W + 4 : -4, SPD.stroll);
  Host.hopDisplay(edge);
  yield* wait(8);                    // the screen change restarts the cat (see onDisplayChange)
}
BEH.visitMonitor = bVisitMonitor;

function* bGoHome() {
  const edge = Host.display && Host.display.homeEdge;
  if (!edge || !Host.hopDisplay) return;
  S('{n}가 원래 있던 모니터로 돌아가요');
  face('open'); setPose('stand');
  yield* walkTo(edge === 'right' ? W - 10 : 10, clamp(cat.gy, GY_MIN, GY_MAX), { speed: SPD.trot, timeout: 60, noVigor: true });
  cat.dir = edge === 'right' ? 1 : -1;
  yield* walkXOnly(edge === 'right' ? W + 4 : -4, SPD.walk);
  Host.hopDisplay(edge);
  yield* wait(8);
}
BEH.goHome = bGoHome;

function* bArriveAway(enter) {
  cat.surface = 'floor'; cat.sortOverride = null; cat.plat = null; cat.z = 0;
  cat.awaySince = NOW;
  const fromLeft = enter === 'left';
  cat.x = fromLeft ? -4 : W + 4;
  cat.dir = fromLeft ? 1 : -1;
  setPose('stand'); face('wide', 'closed', 'fwd');
  yield* walkXOnly(fromLeft ? 26 : W - 26, SPD.walk);
  if (!isHome()) S('{n}가 처음 보는 모니터를 두리번거려요');
  yield* pauseLook(); face('open');
  if (chance(0.7)) yield* sniffSpot();
}
BEH.arriveAway = bArriveAway;

// called when the main process has moved the overlay to another monitor
function onDisplayChange(disp) {
  if (!disp || !disp.enter || !cat.visible) return;
  cat.gy = clamp(cat.gy, GY_MIN, GY_MAX);
  cat.gen = null; cat.busy = false; cat.pend = null; cat.z = 0; cat.label = '';
  Room.ball = null;
  startBehavior(() => bArriveAway(disp.enter), 'arriveAway');
}

function applyMonitorWeights(w) {
  const home = isHome();
  if (home) {
    const can = roamEdges().length && Prefs.roam !== false && !isDeepNight() && !isQuiet() && cat.needs.sat > 45 && cat.needs.bowel < 70 && cat.needs.energy > 35;
    w.visitMonitor = can ? 0.12 + cat.traits.curious * 0.3 : 0;
    w.goHome = 0;
    return;
  }
  // away: nothing that needs the furniture
  for (const k of ['eat', 'drink', 'checkBowl', 'scratch', 'toilet', 'inspect', 'window', 'knock', 'hairball', 'visitMonitor', 'peek']) if (k in w) w[k] = 0;
  const away = NOW - (cat.awaySince || NOW);
  const hungry = cat.needs.sat < 40 ? 4 : 0, needsLoo = cat.needs.bowel > 80 ? 5 : 0;
  w.goHome = clamp(away / 150, 0, 1) * 3 + hungry + needsLoo + (isDeepNight() ? 3 : 0);
  w.visitMonitor = 0;
}
