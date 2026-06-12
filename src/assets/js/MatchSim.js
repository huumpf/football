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
