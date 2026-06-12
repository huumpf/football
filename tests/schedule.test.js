import { describe, it, expect } from 'vitest';
import { makeFixtures, matchdayForWeek } from '../src/assets/js/Schedule.js';

// 18 teams like the real league: the player's club (null) plus 17 AI ids.
const clubIds = [null, ...Array.from({ length: 17 }, (_, i) => i)];

describe('makeFixtures', () => {
  it('schedules 34 matchdays of 9 matches for 18 teams', () => {
    const fixtures = makeFixtures(clubIds);
    expect(fixtures.length).toBe(34);
    for (const matchday of fixtures) expect(matchday.length).toBe(9);
  });

  it('has every team play exactly once per matchday', () => {
    for (const matchday of makeFixtures(clubIds)) {
      const teams = matchday.flatMap(m => [m.home, m.away]);
      expect(new Set(teams).size).toBe(18);
    }
  });

  it('pairs every team with every other twice, once at home and once away', () => {
    const orientedPairs = new Set(
      makeFixtures(clubIds).flat().map(m => `${m.home}>${m.away}`)
    );
    // 306 matches in total; all ordered pairs distinct means every pairing
    // occurs exactly once in each orientation.
    expect(orientedPairs.size).toBe(18 * 17);
  });

  it('mirrors the second half in the same matchday order', () => {
    const fixtures = makeFixtures(clubIds);
    for (let round = 0; round < 17; round++) {
      const mirrored = fixtures[round].map(({ home, away }) => ({ home: away, away: home }));
      expect(fixtures[round + 17]).toEqual(mirrored);
    }
  });
});

describe('matchdayForWeek', () => {
  it('maps match weeks to matchdays and leaves the rest match-free', () => {
    expect(matchdayForWeek(1)).toBe(null);
    expect(matchdayForWeek(10)).toBe(null);
    expect(matchdayForWeek(11)).toBe(0);
    expect(matchdayForWeek(27)).toBe(16);
    expect(matchdayForWeek(28)).toBe(null);
    expect(matchdayForWeek(34)).toBe(null);
    expect(matchdayForWeek(35)).toBe(17);
    expect(matchdayForWeek(51)).toBe(33);
    expect(matchdayForWeek(52)).toBe(null);
  });
});
