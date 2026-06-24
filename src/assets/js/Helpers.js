import * as CFG from './Config.js';

// Single money formatter for the whole app. The display locale is
// intentionally German (1.234.567); the code language stays English.
export function moneyStr(amount) {
  return amount.toLocaleString('de-DE');
}

// Folds a matchday's per-player ratings ({ [playerId]: rating }) into a season
// log on each player it finds, creating the log lazily. Called per squad by the
// APPLY_RATINGS mutations of the team and league modules.
export function applySeasonRatings(players, ratings) {
  for (const player of players) {
    const rating = ratings[player.id];
    if (rating == null) continue;
    if (!player.season) player.season = { games: 0, ratingSum: 0 };
    player.season.games += 1;
    player.season.ratingSum += rating;
  }
}

// A player's season average match rating, or null before they have played.
export function seasonAvgRating(player) {
  if (!player.season || !player.season.games) return null;
  return player.season.ratingSum / player.season.games;
}

// Writes a matchday's injuries ({ [playerId]: injury }) onto whichever of
// `players` they belong to, pinning the injured player's fitness at once so the
// squad screens reflect it immediately. The team and league APPLY_INJURIES
// mutations call this per squad, mirroring applySeasonRatings.
export function applyInjuries(players, injuries) {
  for (const player of players) {
    const injury = injuries[player.id];
    if (!injury) continue;
    player.injury = injury;
    player.fitness = CFG.INJURY_FITNESS_INJURED;
  }
}

// A monotonic week index across seasons, so a span counted in weeks is correct
// over a season rollover (week 52 -> week 1 of the next season is one week).
export function absoluteWeek(season, week) {
  return (season - 1) * CFG.SEASON_WEEKS + week;
}

// Tooltip line for when a player picked up his current injury, relative to the
// club's clock: "Today" the week it happened, otherwise "N weeks ago".
export function injuryTimingLabel(player, club) {
  if (!player || !player.injury || !club) return '';
  const ago = absoluteWeek(club.season, club.week) - player.injury.injuredAtAbsWeek;
  if (ago <= 0) return 'Today';
  return ago === 1 ? '1 week ago' : `${ago} weeks ago`;
}

// Tooltip line for the (deliberately vague) typical duration, read straight from
// the pool's recovery_weeks range — never the exact rolled weeks.
export function injuryDurationLabel(player) {
  return player && player.injury ? `typical duration: ${player.injury.recovery_weeks} weeks` : '';
}

export function getBiasedRnd (min, max, bias, influence, mixfactor) {
  let rnd = Math.random() * (max - min) + min;
  let mix = mixfactor * influence;
  return rnd * (1 - mix) + bias * mix;
}

export function getFormationsWithPlayers (players, skillFn = effectiveSkill) {
  let formations = JSON.parse(JSON.stringify(CFG.formations));

  for (let formation of formations) {
    const { assigned, skillSum } = assignPlayersToFormation(players, formation.positions, skillFn);
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

// Ages a player by one year, on his birthday week. Skill is no longer snapped to
// the age curve here — continuous weekly development (developPlayers) tracks it;
// aging just shifts the curve target a year older, which development then chases.
export function agePlayer(player) {
  player.age += 1;
  // Aging past the prime gradually lowers the conditioning ceiling, so a player
  // gets less fit as his career winds down. Current fitness is left alone (only
  // matches drain it); it simply can no longer recover as high afterwards.
  if (player.stamina != null && player.age > CFG.STAMINA_PRIME_AGE) {
    player.stamina = Math.max(CFG.STAMINA_MIN_ROLL, player.stamina - CFG.STAMINA_AGE_PENALTY);
  }
}

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

// The conditioning ceiling lost to age: zero up to the prime age, then
// STAMINA_AGE_PENALTY points per year older. Applied both at creation and on
// every birthday (agePlayer), so older players are generally less fit.
export function staminaAgePenalty(age) {
  return CFG.STAMINA_AGE_PENALTY * Math.max(0, age - CFG.STAMINA_PRIME_AGE);
}

// Rolls a player's stamina (conditioning ceiling) for an age: a corridor around
// STAMINA_MEAN with ~±STAMINA_SPREAD cross-player divergence, lowered by the age
// penalty, bounded to [STAMINA_MIN_ROLL, STAMINA_MAX].
export function rollStamina(age) {
  const spread = 1 + (Math.random() * 2 - 1) * CFG.STAMINA_SPREAD;
  return clamp(CFG.STAMINA_MEAN * spread - staminaAgePenalty(age), CFG.STAMINA_MIN_ROLL, CFG.STAMINA_MAX);
}

// Match-performance multiplier from a player's current fitness: 1 at/above
// FITNESS_PERF_FULL, falling linearly to FITNESS_PERF_MIN at zero fitness.
// Missing fitness (test fixtures) reads as full — no malus.
export function fitnessFactor(player) {
  const fitness = player.fitness ?? CFG.STAMINA_MAX;
  const slope = (1 - CFG.FITNESS_PERF_MIN) / CFG.FITNESS_PERF_FULL;
  return clamp(1 - Math.max(0, CFG.FITNESS_PERF_FULL - fitness) * slope, CFG.FITNESS_PERF_MIN, 1);
}

// The ring colour tier for a fitness value: 'good' (green), 'ok' (yellow), 'low' (red).
export function fitnessTier(fitness) {
  if (fitness >= CFG.FITNESS_TIER_GOOD) return 'good';
  if (fitness >= CFG.FITNESS_TIER_OK) return 'ok';
  return 'low';
}

// One week of fitness change for a player: a starter (played) first loses
// FITNESS_MATCH_DRAIN, then he recovers FITNESS_REGEN_RATE of the gap back up
// toward his stamina ceiling. Recovery only ever raises fitness — a match is the
// only thing that lowers it — so a player who starts the season fresh above his
// ceiling (see RESET_SEASON_STATS) stays there until he plays. A high-ceiling
// player nets out about even on a match a week; a low-ceiling one slips and must
// be rested. Bounded to [0, STAMINA_MAX].
export function updateFitness(player, played) {
  // An injured player ignores normal drain/recovery: each weekly tick advances
  // his recovery by one week while his fitness stays pinned low. Once the (hidden)
  // drawn duration elapses the injury clears and fitness is restored part-way —
  // rest brings back more than match play, but not all the way.
  const injury = player.injury;
  if (injury) {
    injury.elapsed += 1;
    if (injury.elapsed >= injury.weeks) {
      player.injury = null;
      player.fitness = CFG.INJURY_FITNESS_RECOVERED;
    } else {
      player.fitness = CFG.INJURY_FITNESS_INJURED;
    }
    return;
  }
  const ceiling = player.stamina ?? CFG.STAMINA_MAX;
  let fitness = player.fitness ?? ceiling;
  if (played) fitness -= CFG.FITNESS_MATCH_DRAIN;
  if (fitness < ceiling) fitness += (ceiling - fitness) * CFG.FITNESS_REGEN_RATE;
  player.fitness = clamp(fitness, 0, CFG.STAMINA_MAX);
}

// Whether a player currently carries an injury (can't play; greyed in the UI).
export function isInjured(player) {
  return !!(player && player.injury);
}

// Applies a fractional skill value to a player. The exact value lives in
// `skillExact` so the tiny weekly development steps accumulate instead of
// rounding away, while the integer `skill` (read everywhere else) and the stat
// profile (read by the match engine) follow it rounded to whole numbers.
function setSkill(player, exact) {
  player.skillExact = exact;
  const newSkill = Math.round(exact);
  if (player.skills) {
    const sum = Object.values(player.skills).reduce((s, v) => s + v, 0);
    if (sum > 0) {
      const factor = newSkill / sum;
      for (const key of Object.keys(player.skills)) player.skills[key] = Math.round(player.skills[key] * factor);
    }
  }
  player.skill = newSkill;
}

// Develops a whole squad for one week from a matchday ratings map
// ({ [playerId]: rating }, empty in training/match-free weeks). For every player:
//  - skill chases its natural age-curve value (training/aging) — applies to all,
//    bench/reserve at DEV_TRAIN_WEIGHT;
//  - a player who featured gets a performance push of (rating - role baseline):
//    above the role's empirical mean pushes skill over the curve and drifts
//    potential up, below pushes them down;
//  - potential reverts gently toward its drawn value (bounds long-run drift).
// All bounded to [0, 100]. Shared by the team and league APPLY/DEVELOP paths so
// the own squad and every AI club develop identically.
export function developPlayers(players, ratings = {}) {
  for (const player of players) {
    if (player.drawnPotential == null) player.drawnPotential = player.potential;
    if (player.skillExact == null) player.skillExact = player.skill;
    const rating = ratings[player.id];
    const played = rating != null;
    const weight = played ? 1 : CFG.DEV_TRAIN_WEIGHT;

    // Convergence toward the natural curve (training / aging) for everyone.
    let delta = (projectedSkill(player, 0) - player.skillExact) * CFG.DEV_CONVERGE * weight;

    if (played) {
      const role = CFG.POSITION_ROLE[player.positions.position] || 'MID';
      const baseline = CFG.DEV_BASELINE[role] ?? CFG.MATCH_RATING_BASE;
      const perf = clamp(rating - baseline, -CFG.DEV_PERF_CAP, CFG.DEV_PERF_CAP);
      // Youth learn more from playing: full bonus for teenagers, none at/after peak.
      const optimalAge = player.optimalAge ?? player.age;
      const youthFactor = 1 + CFG.DEV_YOUTH_BONUS * Math.max(0, (optimalAge - player.age) / 12);
      delta += perf * CFG.DEV_PERF_RATE * youthFactor;
      player.potential = clamp(player.potential + perf * CFG.DEV_POT_RATE * youthFactor, 0, 100);
    }

    player.potential = clamp(
      player.potential + (player.drawnPotential - player.potential) * CFG.DEV_POT_REVERSION,
      0, 100,
    );
    setSkill(player, clamp(player.skillExact + delta, 0, 100));

    // Fitness recovers (and starters drain) once a week, on the same tick.
    updateFitness(player, played);
  }
}

// The integer skill change a player has made over a timeframe (a DEV_TIMEFRAMES
// key), for the squad list's "Dev" column. "Last N weeks" reads the rolling
// skillLog; "season"/"join" read the snapshot marks. Missing data (old saves,
// players with no history yet) reads as no change.
export function developmentDelta(player, timeframe) {
  const now = Math.round(player.skill);
  if (timeframe === 'season') {
    return player.seasonStartSkill == null ? 0 : now - Math.round(player.seasonStartSkill);
  }
  if (timeframe === 'join') {
    return player.joinSkill == null ? 0 : now - Math.round(player.joinSkill);
  }
  // "Last N weeks": the log holds one skill value per past week (most recent
  // last). Compare to the value `weeks` entries back, or the oldest we have.
  const spec = CFG.DEV_TIMEFRAMES.find(t => t.key === timeframe);
  const log = player.skillLog;
  if (!spec || !spec.weeks || !log || !log.length) return 0;
  const idx = log.length - 1 - spec.weeks;
  const past = idx >= 0 ? log[idx] : log[0];
  return now - Math.round(past);
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

// The effective skill a player brings to a given position: full skill on a
// primary position, penalised on a secondary one, 0 if they can't play it.
export function effectiveSkill(player, position) {
  const primary = player.positions.primary || [player.positions.position];
  const secondary = player.positions.secondary || [];
  if (primary.includes(position)) return player.skill;
  if (secondary.includes(position)) {
    return Math.round(player.skill * (1 - CFG.SECONDARY_POSITION_PENALTY));
  }
  return 0;
}

// The skill shown for a player placed on a position by hand (team-page lineup).
// Like effectiveSkill, but a position the player can't play at all isn't
// rejected — it costs OUT_OF_POSITION_PENALTY of their skill, because the editor
// lets you force any player onto any slot. Keep effectiveSkill (0 = ineligible)
// for the optimal assignment, which must not place players out of position.
export function fieldSkill(player, position) {
  const eff = effectiveSkill(player, position);
  return eff > 0 ? eff : Math.round(player.skill * (1 - CFG.OUT_OF_POSITION_PENALTY));
}

// The selection skill an AI club uses to pick its matchday XI and bench:
// effective skill dampened by current fitness, so a tired player is auto-rotated
// out in favour of a fresher comparable one. Only the AI uses this — the human
// sets his line-up by hand and judges fitness from the rings.
export function aiSelectionSkill(player, position) {
  // An injured player can't be fielded: a zero weight drops him from the optimal
  // assignment (and selectBench), so the AI never starts or benches him.
  if (player.injury) return 0;
  return effectiveSkill(player, position) * fitnessFactor(player);
}

// Optimally fills a formation's slots with the available players, maximising the
// summed effective skill. Each player takes at most one slot, considering every
// position they can play (primary at full skill, secondary penalised). Solved as
// a max-weight bipartite assignment so a player isn't greedily locked into a slot
// where another player could not be replaced.
function assignPlayersToFormation(players, positionCounts, skillFn = effectiveSkill) {
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
  const weight = slots.map(pos => players.map(p => skillFn(p, pos)));

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

export function getRecommendedFormation (players, skillFn = effectiveSkill) {

  const formations = getFormationsWithPlayers(players, skillFn);
  let recommendedFormation = formations[0];

  for (let i = 1; i < formations.length; i++) {
    if (formations[i].skillSum >= recommendedFormation.skillSum) recommendedFormation = formations[i];
  }

  return recommendedFormation;
}

// The effective skill the placed players bring to their slots — the strength a
// slot-aligned lineup actually fields. Same metric assignPlayersToFormation
// sums into skillSum, so a saved lineup stays comparable with a formation's
// skillSum and with the AI side's strength.
export function lineupSkill(lineup) {
  let sum = 0;
  for (const [pos, slots] of Object.entries(lineup)) {
    const POS = pos.toUpperCase();
    for (const player of slots) {
      if (player) sum += effectiveSkill(player, POS);
    }
  }
  return sum;
}

// Picks the matchday bench from the players left over after the XI: first one
// backup for each distinct formation position (the best effective skill there,
// GK first by key order), then the strongest remaining players fill the rest of
// the bench. Returns up to benchSize players, positionally varied rather than
// just the top scorers; the caller treats whoever is left as reserve. Tolerates
// squads too small to fill the bench.
export function selectBench(nonXi, positionCounts, benchSize, skillFn = effectiveSkill) {
  const chosen = [];
  const used = new Set();

  for (const pos of Object.keys(positionCounts)) {
    if (chosen.length >= benchSize) break;
    const POS = pos.toUpperCase();
    let best = null;
    let bestSkill = 0;
    for (const player of nonXi) {
      if (used.has(player.id)) continue;
      const skill = skillFn(player, POS);
      if (skill > bestSkill) {
        bestSkill = skill;
        best = player;
      }
    }
    if (best) {
      chosen.push(best);
      used.add(best.id);
    }
  }

  const rest = nonXi
    .filter(player => !used.has(player.id))
    .sort((a, b) => b.skill - a.skill);
  for (const player of rest) {
    if (chosen.length >= benchSize) break;
    chosen.push(player);
  }

  return chosen;
}

// Ids of the players currently slotted in a {pos:[player|null]} lineup.
function placedIds(lineup) {
  const ids = new Set();
  for (const slots of Object.values(lineup)) {
    for (const player of slots) if (player) ids.add(player.id);
  }
  return ids;
}

// Splits the squad outside the XI into a bench (positionally aware) and the
// reserve (everyone else).
function benchAndReserve(players, placed, positionCounts, benchSize, skillFn = effectiveSkill) {
  const nonXi = players.filter(p => !placed.has(p.id));
  const bench = selectBench(nonXi, positionCounts, benchSize, skillFn);
  const benchIds = new Set(bench.map(p => p.id));
  const reserve = nonXi.filter(p => !benchIds.has(p.id));
  return { bench, reserve };
}

// One saved team sheet for a squad in a formation: the optimal slot-aligned XI,
// a positionally aware bench, and the rest in reserve.
export function buildSheet(players, positionCounts, benchSize) {
  const lineup = assignLineup(players, positionCounts);
  const { bench, reserve } = benchAndReserve(players, placedIds(lineup), positionCounts, benchSize);
  return { lineup, bench, reserve };
}

// A saved sheet for every formation, keyed by name, plus the strongest
// formation's name as the default. Run once to seed the player's club.
export function buildFormationSheets(players, benchSize) {
  const sheets = {};
  for (const formation of getFormationsWithPlayers(players)) {
    sheets[formation.name] = buildSheet(players, formation.positions, benchSize);
  }
  return { sheets, defaultName: getRecommendedFormation(players).name };
}

// An AI club's matchday sheet: its strongest formation (with its slotted XI and
// skillSum) plus a positionally aware bench and the reserve. The single-
// formation counterpart to buildFormationSheets — the AI never switches or
// hand-edits, so it is regenerated wholesale each week.
export function buildClubSheet(players, benchSize, skillFn = effectiveSkill) {
  const formation = getRecommendedFormation(players, skillFn);
  const { bench, reserve } = benchAndReserve(players, placedIds(formation.players), formation.positions, benchSize, skillFn);
  return { formation, bench, reserve };
}

// Realigns a saved sheet with the current squad after a transfer or retirement:
// drops players no longer in the squad (vacating their pitch slot or removing
// their row), dedupes so each player sits in exactly one bucket, and drops any
// squad player left in none into the reserve. Never reorders or re-optimises, so
// the manager's arrangement survives squad churn.
export function reconcileSheet(sheet, players) {
  const byId = new Map(players.map(p => [p.id, p]));
  const seen = new Set();

  const take = player => {
    if (player && byId.has(player.id) && !seen.has(player.id)) {
      seen.add(player.id);
      return byId.get(player.id);
    }
    return null;
  };

  const lineup = {};
  for (const [pos, slots] of Object.entries(sheet.lineup)) {
    lineup[pos] = slots.map(take);
  }
  const bench = sheet.bench.map(take).filter(Boolean);
  const reserve = sheet.reserve.map(take).filter(Boolean);

  for (const player of players) {
    if (!seen.has(player.id)) reserve.push(player);
  }

  return { lineup, bench, reserve };
}