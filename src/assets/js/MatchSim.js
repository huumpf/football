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
// expectation, so upsets and draws fall out naturally.
export function simulateMatch(homeStrength, awayStrength) {
  const home = Math.pow(homeStrength, CFG.MATCH_SKILL_EXPONENT);
  const away = Math.pow(awayStrength, CFG.MATCH_SKILL_EXPONENT);
  const homeShare = home + away > 0 ? home / (home + away) : 0.5;
  return {
    homeGoals: poisson(CFG.MATCH_AVG_GOALS * homeShare),
    awayGoals: poisson(CFG.MATCH_AVG_GOALS * (1 - homeShare)),
  };
}

// One team's per-minute goal chance: the evenly-matched baseline (1/60) scaled
// by twice its strength share, so a 50/50 share leaves it at the baseline and a
// stronger side scores more. Same strength^exponent share as simulateMatch.
function perMinuteGoalChance(strength, oppStrength) {
  const a = Math.pow(strength, CFG.MATCH_SKILL_EXPONENT);
  const b = Math.pow(oppStrength, CFG.MATCH_SKILL_EXPONENT);
  const share = a + b > 0 ? a / (a + b) : 0.5;
  return 2 * CFG.GOAL_CHANCE_PER_MINUTE * share;
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

// Builds a goal event for a scoring side: the scorer is weighted by shooting
// ability (so keepers effectively never score), and most goals carry an assist
// from a team-mate weighted by progression.
function makeGoal(minute, side, xi) {
  const scorer = weightedPick(xi, p => p.skills.shot);
  let assist = null;
  const others = xi.filter(p => p !== scorer);
  if (others.length && Math.random() < CFG.GOAL_ASSIST_CHANCE) {
    assist = weightedPick(others, p => p.skills.progression);
  }
  return { minute, side, scorer, assist };
}

// Plays a full match minute by minute so it can be revealed live. Each side is
// { name, xi: [player], strength }. Every minute both teams roll once for a
// goal; goals are attributed to a scorer (+ usually an assister). Returns the
// full timeline plus the final score and total minutes (90 + rolled stoppage).
export function simulateLiveMatch(home, away) {
  const totalMinutes = 90 + Math.floor(Math.random() * (CFG.MATCH_MAX_STOPPAGE + 1));
  const homeChance = perMinuteGoalChance(home.strength, away.strength);
  const awayChance = perMinuteGoalChance(away.strength, home.strength);

  const events = [];
  let homeGoals = 0;
  let awayGoals = 0;
  for (let minute = 1; minute <= totalMinutes; minute++) {
    if (home.xi.length && Math.random() < homeChance) {
      events.push(makeGoal(minute, 'home', home.xi));
      homeGoals++;
    }
    if (away.xi.length && Math.random() < awayChance) {
      events.push(makeGoal(minute, 'away', away.xi));
      awayGoals++;
    }
  }
  return { totalMinutes, homeGoals, awayGoals, events };
}
