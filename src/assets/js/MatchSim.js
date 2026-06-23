import * as CFG from './Config.js';

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
// A player's attacking output for the duel maths: shot leads, progression helps.
const offence = entry => entry.player.skills.shot + CFG.ATTACK_PROGRESSION_WEIGHT * entry.player.skills.progression;

// Resolves one created chance for `atkSide` against `defSide` into a goal, a
// keeper save or a defender block, recording the displayed goal event and the
// hidden duel contributions. `out` of players removes sent-off players from
// both pools. Returns true when the chance was a goal.
function resolveChance(minute, side, atkSide, defSide, out, events, contribs) {
  const attackers = atkSide.xi.filter(e => roleOf(e) !== 'GK' && !out.has(e.player.id));
  if (!attackers.length) return false;

  const keeper = defSide.xi.find(e => roleOf(e) === 'GK' && !out.has(e.player.id)) || null;
  let defenders = defSide.xi.filter(e => roleOf(e) === 'DEF' && !out.has(e.player.id));
  // No back line left (heavy formation or red cards) -> any outfield defender.
  if (!defenders.length) defenders = defSide.xi.filter(e => roleOf(e) !== 'GK' && !out.has(e.player.id));

  const attacker = weightedPick(attackers, offence);
  let defender = null;
  if (defenders.length) {
    // Target the weaker defenders: a defence below the line's average is picked
    // more often, so a strong striker exploits a weak centre-back.
    const avgDef = defenders.reduce((s, e) => s + e.player.skills.defense, 0) / defenders.length;
    defender = weightedPick(defenders, e => Math.max(0.2, 2 * avgDef - e.player.skills.defense));
  }

  const O = Math.max(1, offence(attacker));
  const D = Math.max(1, (defender ? defender.player.skills.defense : 0)
    + CFG.GK_DUEL_FACTOR * (keeper ? keeper.player.skills.goalkeeping : 0));
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
  const blockW = defender ? defender.player.skills.defense : 0;
  const saveW = CFG.GK_DUEL_FACTOR * (keeper ? keeper.player.skills.goalkeeping : 0);
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
  const onPitch = sideData.xi.filter(e => !out.has(e.player.id));
  if (!onPitch.length) return null;
  const offender = weightedPick(onPitch, e => FOUL_ROLE_WEIGHT[roleOf(e)] || 1);
  const red = Math.random() < CFG.YELLOW_TO_RED_FRACTION;
  events.push({ minute, type: red ? 'red' : 'yellow', side, player: offender.player });
  if (red) {
    out.add(offender.player.id);
    return 'red';
  }
  return null;
}

// Plays a full match minute by minute so it can be revealed live. Each side is
// { name, xi: [{ player, position }], strength }. Every minute both teams roll
// for a goal-scoring chance (a duel) and may concede a foul/card. A red card
// removes the player and scales that side's effective strength by
// RED_CARD_STRENGTH_FACTOR for the rest of the match. Returns the timeline:
// displayed `events` (goals + cards) plus hidden per-minute `contribs` that
// computeRatings folds into player ratings, and the final score.
export function simulateLiveMatch(home, away) {
  const totalMinutes = 90 + Math.floor(Math.random() * (CFG.MATCH_MAX_STOPPAGE + 1));
  const out = new Set();
  let homeEff = home.strength;
  let awayEff = away.strength;

  const events = [];
  const contribs = [];
  let homeGoals = 0;
  let awayGoals = 0;

  for (let minute = 1; minute <= totalMinutes; minute++) {
    const homeChance = 2 * CFG.CHANCE_PER_MINUTE * strengthShare(homeEff, awayEff);
    const awayChance = 2 * CFG.CHANCE_PER_MINUTE * strengthShare(awayEff, homeEff);

    if (Math.random() < homeChance && resolveChance(minute, 'home', home, away, out, events, contribs)) homeGoals++;
    if (Math.random() < awayChance && resolveChance(minute, 'away', away, home, out, events, contribs)) awayGoals++;

    if (Math.random() < CFG.FOUL_CHANCE_PER_MINUTE) {
      const side = Math.random() < 0.5 ? 'home' : 'away';
      const card = rollCard(minute, side, side === 'home' ? home : away, out, events);
      if (card === 'red') {
        if (side === 'home') homeEff *= CFG.RED_CARD_STRENGTH_FACTOR;
        else awayEff *= CFG.RED_CARD_STRENGTH_FACTOR;
      }
    }
  }
  return { totalMinutes, homeGoals, awayGoals, events, contribs };
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

// Runs a full match instantly (no live reveal) and returns the score together
// with the final per-player ratings. Used for the AI fixtures of a matchday.
export function simulateInstant(home, away) {
  const timeline = simulateLiveMatch(home, away);
  return {
    homeGoals: timeline.homeGoals,
    awayGoals: timeline.awayGoals,
    ratings: computeRatings(timeline, home, away),
  };
}
