import { describe, it, expect } from 'vitest';
import { makePlayer, makeDraftSet } from '../src/assets/js/PlayerFactory.js';
import * as CFG from '../src/assets/js/Config.js';

const SAMPLE = Array.from({ length: 300 }, () => makePlayer());

describe('makePlayer', () => {
  it('assigns unique ids', () => {
    const ids = new Set(SAMPLE.map(p => p.id));
    expect(ids.size).toBe(SAMPLE.length);
  });

  it('keeps age and optimal age within their configured inclusive ranges', () => {
    for (const p of SAMPLE) {
      expect(p.age).toBeGreaterThanOrEqual(CFG.PLAYER_AGE_MIN);
      expect(p.age).toBeLessThanOrEqual(CFG.PLAYER_AGE_MAX);
      expect(p.optimalAge).toBeGreaterThanOrEqual(CFG.PLAYER_OPTAGE_MIN);
      expect(p.optimalAge).toBeLessThanOrEqual(CFG.PLAYER_OPTAGE_MAX);
    }
  });

  it('splits the stat profile so it sums to the total skill', () => {
    for (const p of SAMPLE) {
      const { goalkeeping, defense, progression, shot } = p.skills;
      expect(goalkeeping + defense + progression + shot).toBe(p.skill);
    }
  });

  it('keeps the original position as the first primary', () => {
    for (const p of SAMPLE) {
      expect(p.positions.primary[0]).toBe(p.positions.position);
    }
  });

  it('caps the total number of positions and draws extras from the alternatives', () => {
    for (const p of SAMPLE) {
      const { position, primary, secondary } = p.positions;
      expect(primary.length + secondary.length).toBeLessThanOrEqual(CFG.MAX_TOTAL_POSITIONS);
      const allowed = CFG.POSITION_ALTERNATIVES[position];
      for (const extra of [...primary.slice(1), ...secondary]) {
        expect(allowed).toContain(extra);
      }
    }
  });

  it('keeps the salary within the greed and position-surcharge bounds', () => {
    for (const p of SAMPLE) {
      const base = CFG.SALARY_BASE * Math.pow(p.skill / CFG.DRAFT_AVG_POTENTIAL, CFG.SALARY_EXPONENT);
      const { primary, secondary } = p.positions;
      const surcharge = 1
        + (primary.length - 1) * CFG.EXTRA_PRIMARY_SALARY_MAX
        + secondary.length * CFG.SECONDARY_SALARY_MAX;
      expect(p.salary).toBeGreaterThan(0);
      expect(p.salary).toBeGreaterThanOrEqual(base * (1 - CFG.PLAYER_GREED_SPREAD) - CFG.SALARY_ROUND_STEP);
      expect(p.salary).toBeLessThanOrEqual(base * (1 + CFG.PLAYER_GREED_SPREAD) * surcharge + CFG.SALARY_ROUND_STEP);
    }
  });
});

describe('makeDraftSet', () => {
  it('returns DRAFT_PLAYERS_PER_PICK players', () => {
    expect(makeDraftSet().length).toBe(CFG.DRAFT_PLAYERS_PER_PICK);
  });
});
