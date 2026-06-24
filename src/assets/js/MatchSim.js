import * as CFG from './Config.js';
import * as HLP from './Helpers.js';

// Standard Poisson sample (Knuth): multiplies uniform draws until they fall
// under e^-lambda; the number of draws needed is the sample.
function poisson(lambda) {
  const limit = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > limit);
  return k - 1;
}

// Rolls a match result from the two teams' strengths. Each side's expected
// goals is its share of MATCH_AVG_GOALS, proportional to its strength raised
// to MATCH_SKILL_EXPONENT; the actual goals are Poisson-rolled around that
// expectation, so upsets and draws fall out naturally. Used as a fallback when
// a side has no usable line-up to run the duel engine on.
export function simulateMatch(homeStrength, awayStrength) {
  const homeShare = strengthShare(homeStrength, awayStrength);
  return {
    homeGoals: poisson(CFG.MATCH_AVG_GOALS * homeShare),
    awayGoals: poisson(CFG.MATCH_AVG_GOALS * (1 - homeShare)),
  };
}

// One side's share of the contest: its strength^exponent over the pair's.
function strengthShare(strength, oppStrength) {
  const a = Math.pow(strength, CFG.MATCH_SKILL_EXPONENT);
  const b = Math.pow(oppStrength, CFG.MATCH_SKILL_EXPONENT);
  return a + b > 0 ? a / (a + b) : 0.5;
}

// Picks one entry from `items`, each weighted by weightFn (clamped to >= 0).
// Falls back to a uniform pick when every weight is zero (or the list is short).
function weightedPick(items, weightFn) {
  const weights = items.map(item => Math.max(0, weightFn(item)));
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return items[Math.floor(Math.random() * items.length)];
  let roll = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll < 0) return items[i];
  }
  return items[items.length - 1];
}

const roleOf = entry => CFG.POSITION_ROLE[entry.position] || 'MID';
// A player's duel inputs, each dampened by his current fitness (a tired player
// attacks, defends and keeps worse — which then drags his match rating down too).
// shot leads the attacking output, progression helps.
const offence = entry => (entry.player.skills.shot + CFG.ATTACK_PROGRESSION_WEIGHT * entry.player.skills.progression) * HLP.fitnessFactor(entry.player);
const effDefence = entry => entry.player.skills.defense * HLP.fitnessFactor(entry.player);
const effKeeping = entry => entry.player.skills.goalkeeping * HLP.fitnessFactor(entry.player);

// Resolves one created chance for `atkSide` against `defSide` into a goal, a
// keeper save or a defender block, recording the displayed goal event and the
// hidden duel contributions. `out` of players removes sent-off players from
// both pools. Returns true when the chance was a goal.
function resolveChance(minute, side, atkSide, defSide, out, events, contribs) {
  const attackers = atkSide.onPitch.filter(e => roleOf(e) !== 'GK' && !out.has(e.player.id));
  if (!attackers.length) return false;

  const keeper = defSide.onPitch.find(e => roleOf(e) === 'GK' && !out.has(e.player.id)) || null;
  let defenders = defSide.onPitch.filter(e => roleOf(e) === 'DEF' && !out.has(e.player.id));
  // No back line left (heavy formation or red cards) -> any outfield defender.
  if (!defenders.length) defenders = defSide.onPitch.filter(e => roleOf(e) !== 'GK' && !out.has(e.player.id));

  const attacker = weightedPick(attackers, offence);
  let defender = null;
  if (defenders.length) {
    // Target the weaker defenders: a defence below the line's average is picked
    // more often, so a strong striker exploits a weak (or tired) centre-back.
    const avgDef = defenders.reduce((s, e) => s + effDefence(e), 0) / defenders.length;
    defender = weightedPick(defenders, e => Math.max(0.2, 2 * avgDef - effDefence(e)));
  }

  const O = Math.max(1, offence(attacker));
  const D = Math.max(1, (defender ? effDefence(defender) : 0)
    + CFG.GK_DUEL_FACTOR * (keeper ? effKeeping(keeper) : 0));
  const Ok = Math.pow(O, CFG.DUEL_EXPONENT);
  const Dk = Math.pow(D, CFG.DUEL_EXPONENT);
  const pGoal = CFG.CONVERSION_BASE * Ok / (Ok + Dk);

  if (Math.random() < pGoal) {
    let assist = null;
    const mates = attackers.filter(e => e !== attacker);
    if (mates.length && Math.random() < CFG.GOAL_ASSIST_CHANCE) {
      assist = weightedPick(mates, e => e.player.skills.progression).player;
    }
    events.push({ minute, type: 'goal', side, player: attacker.player, assist });
    if (defender) contribs.push({ minute, playerId: defender.player.id, kind: 'duelLost' });
    return true;
  }

  // A stopped chance: still credit the attacker for the danger, then hand the
  // stop to the keeper or the defender (weighted by who is better placed).
  contribs.push({ minute, playerId: attacker.player.id, kind: 'shot' });
  const blockW = defender ? effDefence(defender) : 0;
  const saveW = CFG.GK_DUEL_FACTOR * (keeper ? effKeeping(keeper) : 0);
  if (defender && Math.random() < blockW / (blockW + saveW || 1)) {
    contribs.push({ minute, playerId: defender.player.id, kind: 'duelWon' });
  } else if (keeper) {
    contribs.push({ minute, playerId: keeper.player.id, kind: 'save' });
  }
  return false;
}

// Books a player on `side` for a foul: defenders/midfielders offend most, a
// fraction of bookings are reds. A red removes the player and is reported via
// `out`; the caller drops that side's effective strength. Returns 'red' | null.
const FOUL_ROLE_WEIGHT = { DEF: 3, MID: 2, ATT: 1, GK: 0.2 };
function rollCard(minute, side, sideData, out, events) {
  const available = sideData.onPitch.filter(e => !out.has(e.player.id));
  if (!available.length) return null;
  const offender = weightedPick(available, e => FOUL_ROLE_WEIGHT[roleOf(e)] || 1);
  const red = Math.random() < CFG.YELLOW_TO_RED_FRACTION;
  events.push({ minute, type: red ? 'red' : 'yellow', side, player: offender.player });
  if (red) {
    out.add(offender.player.id);
    return 'red';
  }
  return null;
}

// --- Injuries -----------------------------------------------------------
const clamp01 = (x) => Math.max(0, Math.min(1, x));

// Draws an injury from the pool weighted by likelihood, then rolls a hidden exact
// duration uniformly inside its recovery_weeks range. The range string is kept
// for the (vague) tooltip; only `weeks` is the real duration.
function drawInjury() {
  let roll = Math.random() * CFG.INJURY_LIKELIHOOD_TOTAL;
  let chosen = CFG.INJURIES[CFG.INJURIES.length - 1];
  for (const inj of CFG.INJURIES) {
    roll -= inj.likelihood;
    if (roll < 0) { chosen = inj; break; }
  }
  const weeks = chosen.minWeeks + Math.floor(Math.random() * (chosen.maxWeeks - chosen.minWeeks + 1));
  return { name: chosen.name, recovery_weeks: chosen.recovery_weeks, weeks };
}

// Rolls a per-minute injury for each on-pitch player not already off the pitch.
// Chance = base * proneness * (1 + fatigue weight * fitness shortfall), so a more
// injury-prone and/or tired player gets hurt more often. Emits an injury event,
// removes the player from play (added to `out`), and returns the freshly-injured
// entries so the caller can force their substitutions.
function rollInjuries(minute, side, state, out, events) {
  const newly = [];
  for (const entry of state.onPitch) {
    const p = entry.player;
    if (out.has(p.id)) continue;
    const proneness = p.injuryProneness ?? 0;
    if (proneness <= 0) continue;
    const fitness = Math.max(0, Math.min(CFG.STAMINA_MAX, p.fitness ?? CFG.STAMINA_MAX));
    const fatigueMult = 1 + CFG.INJURY_FATIGUE_WEIGHT * (1 - fitness / CFG.STAMINA_MAX);
    if (Math.random() < CFG.INJURY_BASE_RATE * proneness * fatigueMult) {
      events.push({ minute, type: 'injury', side, player: p, injury: drawInjury() });
      out.add(p.id);
      newly.push(entry);
    }
  }
  return newly;
}

// --- Substitutions ------------------------------------------------------
const benchBodyCount = state => state.bench.filter(b => !HLP.isInjured(b.player)).length;

// Per-minute probability a side opens a (voluntary) sub window: zero in the first
// half, then a convex ramp rising toward full time so subs cluster late.
function windowProbability(minute) {
  if (minute <= CFG.SUB_FIRST_HALF_CUTOFF) return 0;
  const t = (minute - CFG.SUB_FIRST_HALF_CUTOFF) / (90 - CFG.SUB_FIRST_HALF_CUTOFF);
  return CFG.SUB_RAMP_BASE + CFG.SUB_RAMP_SLOPE * Math.pow(Math.max(0, t), CFG.SUB_RAMP_CURVE);
}

// How many players come off in a window: 1 likeliest, falling geometrically, hard-
// capped by `budget` (remaining player allowance, bench bodies, eligible starters).
function drawWindowSize(budget) {
  if (budget <= 1) return Math.max(0, budget);
  const weights = [];
  for (let k = 1; k <= budget; k++) weights.push(Math.pow(CFG.SUB_SIZE_DECAY, k - 1));
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = Math.random() * total;
  for (let k = 1; k <= budget; k++) {
    roll -= weights[k - 1];
    if (roll < 0) return k;
  }
  return budget;
}

// A cheap running-form proxy for a player, summed from the duel contributions and
// card/goal events so far, sign-aligned with the rating weights. A bad game
// (lost duels, a booking) trends negative and makes the player a sub candidate.
const PERF_DELTA = { goal: 1.0, assist: 0.6, shot: 0.18, save: 0.22, duelWon: 0.18, duelLost: -0.18 };
function runningPerf(playerId, events, contribs) {
  let perf = 0;
  for (const ev of events) {
    if (ev.type === 'goal' && ev.player.id === playerId) perf += PERF_DELTA.goal;
    else if (ev.type === 'goal' && ev.assist && ev.assist.id === playerId) perf += PERF_DELTA.assist;
    else if (ev.type === 'yellow' && ev.player.id === playerId) perf -= 0.5;
    else if (ev.type === 'red' && ev.player.id === playerId) perf -= 2.0;
  }
  for (const c of contribs) {
    if (c.playerId === playerId) perf += PERF_DELTA[c.kind] || 0;
  }
  return perf;
}

// Desirability of taking `entry` off: a weighted blend of low fitness, low skill,
// a clearly better bench replacement waiting, and poor form so far this match.
function subOffScore(entry, state, events, contribs) {
  const p = entry.player;
  const pos = entry.position;
  const fitness = Math.max(0, Math.min(CFG.STAMINA_MAX, p.fitness ?? CFG.STAMINA_MAX));
  const fitDeficit = clamp01((CFG.SUB_FIT_REF - fitness) / CFG.SUB_FIT_REF);
  const skillDeficit = clamp01((CFG.SUB_SKILL_REF - HLP.effectiveSkill(p, pos)) / CFG.SUB_SKILL_REF);
  let bestBench = 0;
  for (const b of state.bench) bestBench = Math.max(bestBench, HLP.aiSelectionSkill(b.player, pos));
  const upgrade = clamp01((bestBench - HLP.aiSelectionSkill(p, pos)) / CFG.SUB_SKILL_REF);
  const perfDeficit = clamp01(-runningPerf(p.id, events, contribs) / CFG.SUB_PERF_SCALE);
  return CFG.SUB_W_FIT * fitDeficit + CFG.SUB_W_SKILL * skillDeficit
    + CFG.SUB_W_UPGRADE * upgrade + CFG.SUB_W_PERF * perfDeficit;
}

// Replaces `offEntry` with the best positional fit left on the bench: a real fit
// (effectiveSkill > 0) is preferred, falling back to the strongest out-of-position
// body so a slot (especially GK) is never left empty while a sub remains. Mutates
// the live lineup and bench and emits the sub event. Returns false (a man down) if
// no bench player is available.
function makeSub(minute, side, state, offEntry, events, forced) {
  const pos = offEntry.position;
  let pick = null, pickScore = 0, pickIdx = -1;
  state.bench.forEach((b, i) => {
    const score = HLP.aiSelectionSkill(b.player, pos); // 0 if injured / can't play the slot
    if (score > pickScore) { pickScore = score; pick = b; pickIdx = i; }
  });
  if (!pick) {
    let best = -1;
    state.bench.forEach((b, i) => {
      if (HLP.isInjured(b.player)) return;
      const fs = HLP.fieldSkill(b.player, pos);
      if (fs > best) { best = fs; pick = b; pickIdx = i; }
    });
  }
  const offIdx = state.onPitch.indexOf(offEntry);
  if (offIdx >= 0) state.onPitch.splice(offIdx, 1);
  if (!pick) return false; // bench empty -> a man down
  state.bench.splice(pickIdx, 1);
  state.onPitch.push({ player: pick.player, position: pos });
  events.push({ minute, type: 'sub', side, player: offEntry.player, playerIn: pick.player, position: pos, forced });
  return true;
}

// Runs a side's substitutions for one minute: forced injury replacements first
// (they consume a window and a player from the same 3-window / 5-player budget),
// then, if budget and the cooldown allow and the ramp fires, an optional voluntary
// window taking off the highest-desirability starters. Returns the number of
// players who left unreplaced (bench/budget exhausted), so the caller can drop the
// side's effective strength like a red card.
function runSideSubs(minute, side, state, out, events, contribs, forced) {
  let manDown = 0;
  let windowOpened = false;
  const openWindow = () => {
    if (!windowOpened) { state.windowsUsed += 1; windowOpened = true; }
    state.lastSubMinute = minute;
  };

  // 1. Forced injury subs.
  for (const offEntry of forced) {
    const canWindow = windowOpened || state.windowsUsed < CFG.SUB_MAX_WINDOWS;
    if (canWindow && state.subsMade < CFG.SUB_MAX_PLAYERS && benchBodyCount(state) > 0
        && makeSub(minute, side, state, offEntry, events, true)) {
      state.subsMade += 1;
      openWindow();
    } else {
      // Out of windows/players or no bench body: the injured player just leaves.
      const i = state.onPitch.indexOf(offEntry);
      if (i >= 0) state.onPitch.splice(i, 1);
      manDown += 1;
    }
  }

  // 2. Voluntary window.
  if (!windowOpened
      && minute > CFG.SUB_FIRST_HALF_CUTOFF
      && state.windowsUsed < CFG.SUB_MAX_WINDOWS
      && state.subsMade < CFG.SUB_MAX_PLAYERS
      && minute - state.lastSubMinute >= CFG.SUB_MIN_GAP
      && benchBodyCount(state) > 0
      && Math.random() < windowProbability(minute)) {
    const candidates = state.onPitch
      .filter(e => roleOf(e) !== 'GK' && !out.has(e.player.id))
      .map(e => ({ entry: e, score: subOffScore(e, state, events, contribs) }))
      .filter(c => c.score >= CFG.SUB_MIN_SCORE)
      .sort((a, b) => b.score - a.score);
    const budget = Math.min(CFG.SUB_MAX_PLAYERS - state.subsMade, benchBodyCount(state), candidates.length);
    const k = drawWindowSize(budget);
    for (let n = 0; n < k; n++) {
      if (makeSub(minute, side, state, candidates[n].entry, events, false)) {
        state.subsMade += 1;
        openWindow();
      }
    }
  }

  return manDown;
}

// One side's live working state for a match: a mutable on-pitch lineup (starts as
// the XI, gains substitutes), the remaining bench, and the sub bookkeeping.
function makeSideState(side) {
  return {
    onPitch: [...side.xi],
    bench: [...(side.bench || [])],
    subsMade: 0,
    windowsUsed: 0,
    lastSubMinute: -Infinity,
  };
}

// Plays a full match minute by minute so it can be revealed live. Each side is
// { name, xi: [{ player, position }], bench: [{ player, position }], strength }.
// Every minute both teams roll for a goal-scoring chance (a duel) and may concede
// a foul/card, then roll for injuries and run substitutions. A red card or an
// unreplaced injury removes the player and scales that side's effective strength
// by RED_CARD_STRENGTH_FACTOR for the rest of the match. Returns the timeline:
// displayed `events` (goals, cards, injuries, subs) plus hidden per-minute
// `contribs` that computeRatings folds into player ratings, and the final score.
export function simulateLiveMatch(home, away) {
  const totalMinutes = 90 + Math.floor(Math.random() * (CFG.MATCH_MAX_STOPPAGE + 1));
  const out = new Set();
  let homeEff = home.strength;
  let awayEff = away.strength;

  // Mutable per-side state (on-pitch lineup, bench, sub counters). The duel and
  // card engine read state.onPitch, so substitutes become real participants.
  const homeState = makeSideState(home);
  const awayState = makeSideState(away);

  const events = [];
  const contribs = [];
  let homeGoals = 0;
  let awayGoals = 0;

  // Per-player fitness drain, accumulated minute by minute for whoever is on the
  // pitch (so it scales with minutes actually played). Each player gets one random
  // per-match intensity, drawn lazily, plus fine per-minute noise on top.
  const drain = {};
  const intensity = {};
  const drainOnPitch = (state) => {
    for (const e of state.onPitch) {
      const id = e.player.id;
      if (out.has(id)) continue;
      if (intensity[id] === undefined) {
        intensity[id] = 1 + (Math.random() * 2 - 1) * CFG.FITNESS_DRAIN_INTENSITY_SPREAD;
      }
      const jitter = 1 + (Math.random() * 2 - 1) * CFG.FITNESS_DRAIN_MINUTE_JITTER;
      drain[id] = (drain[id] || 0) + Math.max(0, CFG.FITNESS_DRAIN_PER_MINUTE * intensity[id] * jitter);
    }
  };

  for (let minute = 1; minute <= totalMinutes; minute++) {
    const homeChance = 2 * CFG.CHANCE_PER_MINUTE * strengthShare(homeEff, awayEff);
    const awayChance = 2 * CFG.CHANCE_PER_MINUTE * strengthShare(awayEff, homeEff);

    if (Math.random() < homeChance && resolveChance(minute, 'home', homeState, awayState, out, events, contribs)) homeGoals++;
    if (Math.random() < awayChance && resolveChance(minute, 'away', awayState, homeState, out, events, contribs)) awayGoals++;

    if (Math.random() < CFG.FOUL_CHANCE_PER_MINUTE) {
      const side = Math.random() < 0.5 ? 'home' : 'away';
      const card = rollCard(minute, side, side === 'home' ? homeState : awayState, out, events);
      if (card === 'red') {
        if (side === 'home') homeEff *= CFG.RED_CARD_STRENGTH_FACTOR;
        else awayEff *= CFG.RED_CARD_STRENGTH_FACTOR;
      }
    }

    // Injuries are rolled after the duel/card resolution, then substitutions
    // (forced injury replacements first, then voluntary). A player who leaves
    // unreplaced drops the side's effective strength like a red card.
    const homeInjured = rollInjuries(minute, 'home', homeState, out, events);
    const awayInjured = rollInjuries(minute, 'away', awayState, out, events);
    const homeManDown = runSideSubs(minute, 'home', homeState, out, events, contribs, homeInjured);
    const awayManDown = runSideSubs(minute, 'away', awayState, out, events, contribs, awayInjured);
    homeEff *= Math.pow(CFG.RED_CARD_STRENGTH_FACTOR, homeManDown);
    awayEff *= Math.pow(CFG.RED_CARD_STRENGTH_FACTOR, awayManDown);

    // Tire whoever ended the minute on the pitch (post-subs, excluding sent-off).
    drainOnPitch(homeState);
    drainOnPitch(awayState);
  }
  return { totalMinutes, homeGoals, awayGoals, events, contribs, drain };
}

// Folds a timeline into per-player ratings for both sides, considering only
// what happened up to `uptoMinute` (the running clock for the live view;
// Infinity for the finished match). Every starter begins at MATCH_RATING_BASE;
// goals, assists, duel outcomes, cards, goals conceded, a clean sheet and the
// running scoreline move it. Returns { [playerId]: rating } rounded to 0.1.
export function computeRatings(timeline, home, away, uptoMinute = Infinity) {
  const elapsed = Math.min(uptoMinute, timeline.totalMinutes);

  // Per-player accumulator seeded for every starter (so even the untouched ones
  // get a base rating). Carries the player's role and side.
  const acc = {};
  const seed = (side, entry) => {
    acc[entry.player.id] = {
      side, role: roleOf(entry),
      goal: 0, assist: 0, shot: 0, save: 0, duelWon: 0, duelLost: 0, yellow: 0, red: 0,
    };
  };
  for (const e of home.xi) seed('home', e);
  for (const e of away.xi) seed('away', e);

  // Substitutes who have come on by `elapsed` also earn a rating, seeded once from
  // the sub event's slot and side. A player who never left the bench is never
  // seeded (he keeps the dash); a subbed-off starter stays seeded (from xi) and
  // simply stops accruing contributions once he is off the pitch.
  for (const ev of timeline.events) {
    if (ev.type === 'sub' && ev.playerIn && ev.minute <= elapsed && !acc[ev.playerIn.id]) {
      acc[ev.playerIn.id] = {
        side: ev.side, role: CFG.POSITION_ROLE[ev.position] || 'MID',
        goal: 0, assist: 0, shot: 0, save: 0, duelWon: 0, duelLost: 0, yellow: 0, red: 0,
      };
    }
  }

  let homeGoals = 0;
  let awayGoals = 0;
  for (const ev of timeline.events) {
    if (ev.minute > elapsed) continue;
    if (ev.type === 'goal') {
      if (ev.side === 'home') homeGoals++; else awayGoals++;
      if (acc[ev.player.id]) acc[ev.player.id].goal++;
      if (ev.assist && acc[ev.assist.id]) acc[ev.assist.id].assist++;
    } else if (ev.type === 'yellow' && acc[ev.player.id]) {
      acc[ev.player.id].yellow++;
    } else if (ev.type === 'red' && acc[ev.player.id]) {
      acc[ev.player.id].red++;
    }
  }
  for (const c of timeline.contribs) {
    if (c.minute > elapsed) continue;
    if (acc[c.playerId]) acc[c.playerId][c.kind]++;
  }

  const concededBy = side => (side === 'home' ? awayGoals : homeGoals);
  const cleanSheetFactor = side => (concededBy(side) === 0 ? elapsed / timeline.totalMinutes : 0);

  const ratings = {};
  for (const id in acc) {
    const a = acc[id];
    const w = CFG.RATING_WEIGHTS[a.role];
    const conceded = concededBy(a.side);
    const goalDiff = (a.side === 'home' ? homeGoals - awayGoals : awayGoals - homeGoals);
    const resultMod = Math.max(-CFG.RESULT_MAX, Math.min(CFG.RESULT_MAX, goalDiff * CFG.RESULT_PER_GOAL_DIFF));

    const raw = CFG.MATCH_RATING_BASE
      + w.goal * a.goal + w.assist * a.assist + w.shot * a.shot + w.save * a.save
      + w.duelWon * a.duelWon + w.duelLost * a.duelLost
      + w.concededPerGoal * conceded + w.cleanSheet * cleanSheetFactor(a.side)
      + w.yellow * a.yellow + w.red * a.red
      + resultMod;

    ratings[id] = Math.round(Math.max(1, Math.min(10, raw)) * 10) / 10;
  }
  return ratings;
}

// Collects a timeline's injuries into an id-keyed map ({ [playerId]: injury }),
// parallel to the ratings map, for the store to stamp onto the actual players.
export function injuriesFromTimeline(timeline) {
  const map = {};
  for (const ev of timeline.events) {
    if (ev.type === 'injury') map[ev.player.id] = ev.injury;
  }
  return map;
}

// Runs a full match instantly (no live reveal) and returns the score together
// with the final per-player ratings and any injuries. Used for the AI fixtures
// of a matchday (and the player's own fixture on a skipped matchday).
export function simulateInstant(home, away) {
  const timeline = simulateLiveMatch(home, away);
  return {
    homeGoals: timeline.homeGoals,
    awayGoals: timeline.awayGoals,
    ratings: computeRatings(timeline, home, away),
    injuries: injuriesFromTimeline(timeline),
    drain: timeline.drain,
  };
}
