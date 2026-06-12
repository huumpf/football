import { describe, it, expect } from 'vitest';
import { simulateMatch } from '../src/assets/js/MatchSim.js';

describe('simulateMatch', () => {
  it('returns non-negative integer goals', () => {
    for (let i = 0; i < 200; i++) {
      const { homeGoals, awayGoals } = simulateMatch(550, 550);
      expect(Number.isInteger(homeGoals)).toBe(true);
      expect(Number.isInteger(awayGoals)).toBe(true);
      expect(homeGoals).toBeGreaterThanOrEqual(0);
      expect(awayGoals).toBeGreaterThanOrEqual(0);
    }
  });

  it('produces wins, draws and losses between equal teams', () => {
    const outcomes = new Set();
    for (let i = 0; i < 1000; i++) {
      const { homeGoals, awayGoals } = simulateMatch(550, 550);
      outcomes.add(Math.sign(homeGoals - awayGoals));
    }
    expect(outcomes).toEqual(new Set([-1, 0, 1]));
  });

  it('favours the clearly stronger team over many matches', () => {
    let wins = 0;
    let losses = 0;
    for (let i = 0; i < 2000; i++) {
      const { homeGoals, awayGoals } = simulateMatch(600, 450);
      if (homeGoals > awayGoals) wins++;
      if (homeGoals < awayGoals) losses++;
    }
    expect(wins).toBeGreaterThan(losses * 2);
  });
});
