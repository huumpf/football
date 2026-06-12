import * as CFG from './Config.js';

// Single money formatter for the whole app. The display locale is
// intentionally German (1.234.567); the code language stays English.
export function moneyStr(amount) {
  return amount.toLocaleString('de-DE');
}

export function getBiasedRnd (min, max, bias, influence, mixfactor) {
  let rnd = Math.random() * (max - min) + min;
  let mix = mixfactor * influence;
  return rnd * (1 - mix) + bias * mix;
}

export function getFormationsWithPlayers (players) {
  let formations = JSON.parse(JSON.stringify(CFG.formations));

  for (let formation of formations) {
    const { assigned, skillSum } = assignPlayersToFormation(players, formation.positions);
    formation.players = assigned;
    formation.skillSum = skillSum;
  }
  return formations;
}

// The skill a player will have in `years` years, following the same development
// curve PlayerFactory derives skill from: potential decayed by AGE_FACTOR per
// year of distance to the optimal age.
export function projectedSkill(player, years) {
  const distance = Math.abs(player.age + years - player.optimalAge);
  return Math.floor(player.potential * Math.pow(CFG.AGE_FACTOR, distance));
}

// Ages a player by one year (season change): the skill follows the development
// curve (projectedSkill one year out) and the stat profile scales with it.
export function agePlayer(player) {
  const newSkill = projectedSkill(player, 1);
  const factor = player.skill > 0 ? newSkill / player.skill : 0;
  for (const key of Object.keys(player.skills)) {
    player.skills[key] = Math.round(player.skills[key] * factor);
  }
  player.age += 1;
  player.skill = newSkill;
}

// A player's transfer market value: blends current skill with the projected
// skill a few years ahead (young talents outprice declining veterans of equal
// skill), raised to an exponent so stars cost disproportionately more.
export function marketValue(player) {
  const blended = (1 - CFG.MV_FUTURE_WEIGHT) * player.skill
    + CFG.MV_FUTURE_WEIGHT * projectedSkill(player, CFG.MV_HORIZON_YEARS);
  const raw = CFG.MV_BASE * Math.pow(blended / CFG.DRAFT_AVG_POTENTIAL, CFG.MV_EXPONENT);
  return Math.max(CFG.MV_ROUND_STEP, Math.round(raw / CFG.MV_ROUND_STEP) * CFG.MV_ROUND_STEP);
}

// The effective skill a player brings to a given position: full skill if they
// can play it, 0 otherwise.
export function effectiveSkill(player, position) {
  return player.positions.includes(position) ? player.skill : 0;
}

// Optimally fills a formation's slots with the available players, maximising the
// summed effective skill. Each player takes at most one slot, considering every
// position they can play. Solved as a max-weight bipartite assignment so a
// player isn't greedily locked into a slot where another player could not be
// replaced.
function assignPlayersToFormation(players, positionCounts) {
  const assigned = {};
  for (const pos of Object.keys(positionCounts)) assigned[pos] = [];

  // Expand the formation into individual slots (one entry per opening).
  const slots = [];
  for (const [pos, count] of Object.entries(positionCounts)) {
    for (let i = 0; i < count; i++) slots.push(pos.toUpperCase());
  }

  if (slots.length === 0 || players.length === 0) {
    return { assigned, skillSum: 0 };
  }

  // Weight matrix: slots (rows) x players (cols).
  const weight = slots.map(pos => players.map(p => effectiveSkill(p, pos)));

  const slotToPlayer = maxWeightAssignment(weight);

  let skillSum = 0;
  for (let s = 0; s < slots.length; s++) {
    const playerIndex = slotToPlayer[s];
    if (playerIndex < 0) continue;
    const eff = weight[s][playerIndex];
    if (eff <= 0) continue; // player can't actually play this slot
    const key = slots[s].toLowerCase();
    // Keep the original player reference so callers can map a slotted player
    // back to the squad; the effective skill is derived per position on render.
    assigned[key].push(players[playerIndex]);
    skillSum += eff;
  }

  return { assigned, skillSum };
}

// Slot-aligned optimal lineup: returns { pos: [player|null, …] } where each
// array has exactly `positionCounts[pos]` entries (null for an empty slot) and
// every entry is a reference into `players`. Used as the editable starting
// point for a formation before the user reshuffles it by hand.
export function assignLineup(players, positionCounts) {
  const lineup = {};
  const slots = [];
  for (const [pos, count] of Object.entries(positionCounts)) {
    lineup[pos] = new Array(count).fill(null);
    for (let i = 0; i < count; i++) slots.push({ pos, index: i });
  }

  if (slots.length === 0 || players.length === 0) return lineup;

  const weight = slots.map(s => players.map(p => effectiveSkill(p, s.pos.toUpperCase())));
  const slotToPlayer = maxWeightAssignment(weight);

  for (let s = 0; s < slots.length; s++) {
    const pi = slotToPlayer[s];
    if (pi < 0 || weight[s][pi] <= 0) continue;
    lineup[slots[s].pos][slots[s].index] = players[pi];
  }

  return lineup;
}

// Max-weight bipartite matching (Hungarian / Kuhn-Munkres) on a rows x cols
// weight matrix. Returns an array mapping each row to its assigned column index,
// or -1 if unassigned. Pads to a square cost matrix and minimises BIG - weight.
function maxWeightAssignment(weight) {
  const rows = weight.length;
  const cols = weight[0].length;
  const n = Math.max(rows, cols);
  const BIG = 1e6;

  // Square cost matrix; padding cells and ineligible pairs cost BIG (weight 0).
  const cost = [];
  for (let i = 0; i < n; i++) {
    const row = [];
    for (let j = 0; j < n; j++) {
      const w = (i < rows && j < cols) ? weight[i][j] : 0;
      row.push(BIG - w);
    }
    cost.push(row);
  }

  const INF = Infinity;
  const u = new Array(n + 1).fill(0);
  const v = new Array(n + 1).fill(0);
  const p = new Array(n + 1).fill(0); // p[j] = row matched to column j (1-indexed)
  const way = new Array(n + 1).fill(0);

  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(n + 1).fill(INF);
    const used = new Array(n + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = INF;
      let j1 = 0;
      for (let j = 1; j <= n; j++) {
        if (used[j]) continue;
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
        if (minv[j] < delta) { delta = minv[j]; j1 = j; }
      }
      for (let j = 0; j <= n; j++) {
        if (used[j]) { u[p[j]] += delta; v[j] -= delta; }
        else { minv[j] -= delta; }
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0 !== 0);
  }

  const rowToCol = new Array(rows).fill(-1);
  for (let j = 1; j <= n; j++) {
    const row = p[j] - 1;
    if (row >= 0 && row < rows && j - 1 < cols) rowToCol[row] = j - 1;
  }
  return rowToCol;
}

export function getRecommendedFormation (players) {

  const formations = getFormationsWithPlayers(players);
  let recommendedFormation = formations[0];

  for (let i = 1; i < formations.length; i++) {
    if (formations[i].skillSum >= recommendedFormation.skillSum) recommendedFormation = formations[i];
  }
  
  return recommendedFormation;
}