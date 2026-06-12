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

  it('caps the positions at two and draws the second from the alternatives', () => {
    for (const p of SAMPLE) {
      expect(p.positions.length).toBeGreaterThanOrEqual(1);
      expect(p.positions.length).toBeLessThanOrEqual(2);
      const allowed = CFG.POSITION_ALTERNATIVES[p.positions[0]];
      for (const extra of p.positions.slice(1)) {
        expect(allowed).toContain(extra);
      }
    }
  });

  it('produces a positive salary', () => {
    for (const p of SAMPLE) {
      expect(p.salary).toBeGreaterThan(0);
    }
  });
});

describe('makeDraftSet', () => {
  it('returns DRAFT_PLAYERS_PER_PICK players', () => {
    expect(makeDraftSet().length).toBe(CFG.DRAFT_PLAYERS_PER_PICK);
  });
});
