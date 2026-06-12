import * as CFG from './Config.js';

// Fisher-Yates shuffle on a copy, so each season's schedule comes out different.
function shuffle(list) {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Double round robin via the circle method: the first team stays fixed while
// the rest rotate one step per round, giving n-1 rounds in which every team
// plays exactly once. The second half repeats the first in the same matchday
// order with home advantage swapped, so every pairing happens exactly once in
// each team's home ground. Returns 2*(n-1) matchdays of n/2 matches, each
// match a { home, away } pair of club ids (null = the player's club).
export function makeFixtures(clubIds) {
  const teams = shuffle(clubIds);
  const n = teams.length;

  const firstHalf = [];
  for (let round = 0; round < n - 1; round++) {
    const matches = [];
    for (let i = 0; i < n / 2; i++) {
      const a = teams[i];
      const b = teams[n - 1 - i];
      // Alternate the orientation per round so no team (especially the fixed
      // first one) plays at home for many rounds in a row.
      matches.push(round % 2 === 0 ? { home: a, away: b } : { home: b, away: a });
    }
    firstHalf.push(matches);
    teams.splice(1, 0, teams.pop());
  }

  const secondHalf = firstHalf.map(matches =>
    matches.map(({ home, away }) => ({ home: away, away: home }))
  );
  return [...firstHalf, ...secondHalf];
}

// The matchday (index into the fixtures) played in a given week, or null in a
// match-free week. First half: weeks 11-27 -> matchdays 0-16; second half:
// weeks 35-51 -> matchdays 17-33.
export function matchdayForWeek(week) {
  if (week >= CFG.FIRST_HALF_START_WEEK && week < CFG.FIRST_HALF_START_WEEK + CFG.MATCHDAYS_PER_HALF) {
    return week - CFG.FIRST_HALF_START_WEEK;
  }
  if (week >= CFG.SECOND_HALF_START_WEEK && week < CFG.SECOND_HALF_START_WEEK + CFG.MATCHDAYS_PER_HALF) {
    return CFG.MATCHDAYS_PER_HALF + (week - CFG.SECOND_HALF_START_WEEK);
  }
  return null;
}
