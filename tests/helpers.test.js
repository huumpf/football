import { describe, it, expect } from 'vitest';
import {
  moneyStr,
  projectedSkill,
  effectiveSkill,
  marketValue,
  assignLineup,
  getFormationsWithPlayers,
  getRecommendedFormation,
} from '../src/assets/js/Helpers.js';
import * as CFG from '../src/assets/js/Config.js';

// Minimal player fixture matching the shape PlayerFactory produces.
function player(skill, primary, secondary = []) {
  return {
    skill,
    positions: { position: primary[0], primary, secondary },
  };
}

describe('moneyStr', () => {
  it('formats with German thousands separators', () => {
    expect(moneyStr(1234567)).toBe('1.234.567');
    expect(moneyStr(300000)).toBe('300.000');
    expect(moneyStr(0)).toBe('0');
  });
});

describe('projectedSkill', () => {
  it('decays potential by AGE_FACTOR per year of distance to the optimal age', () => {
    const p = { age: 24, optimalAge: 28, potential: 80 };
    expect(projectedSkill(p, 4)).toBe(80); // lands exactly on the optimal age
    expect(projectedSkill(p, 0)).toBe(Math.floor(80 * Math.pow(CFG.AGE_FACTOR, 4)));
    expect(projectedSkill(p, 8)).toBe(Math.floor(80 * Math.pow(CFG.AGE_FACTOR, 4)));
  });
});

describe('marketValue', () => {
  it('is MV_BASE for an average player holding his level', () => {
    // Projected skill equals current skill (lands on the optimal age), so the
    // blend is exactly DRAFT_AVG_POTENTIAL.
    const p = { skill: 50, potential: 50, age: 24, optimalAge: 24 + CFG.MV_HORIZON_YEARS };
    expect(marketValue(p)).toBe(CFG.MV_BASE);
  });

  it('grows with skill', () => {
    const at = skill => marketValue({ skill, potential: skill, age: 24, optimalAge: 28 });
    expect(at(60)).toBeGreaterThan(at(40));
    expect(at(90)).toBeGreaterThan(at(60));
  });

  it('values a young talent above a declining veteran of equal skill', () => {
    const young = { skill: 60, potential: 70, age: 22, optimalAge: 28 };
    const old = { skill: 60, potential: 75, age: 32, optimalAge: 28 };
    expect(marketValue(young)).toBeGreaterThan(marketValue(old));
  });

  it('rounds to MV_ROUND_STEP and never drops below it', () => {
    const junk = { skill: 1, potential: 1, age: 34, optimalAge: 28 };
    expect(marketValue(junk)).toBe(CFG.MV_ROUND_STEP);
    const star = { skill: 87, potential: 91, age: 26, optimalAge: 29 };
    expect(marketValue(star) % CFG.MV_ROUND_STEP).toBe(0);
  });
});

describe('effectiveSkill', () => {
  it('returns full skill on a primary position', () => {
    expect(effectiveSkill(player(80, ['ST']), 'ST')).toBe(80);
  });

  it('applies the penalty on a secondary position', () => {
    expect(effectiveSkill(player(80, ['ST'], ['CAM']), 'CAM'))
      .toBe(Math.round(80 * (1 - CFG.SECONDARY_POSITION_PENALTY)));
  });

  it('returns 0 for a position the player cannot play', () => {
    expect(effectiveSkill(player(80, ['ST'], ['CAM']), 'GK')).toBe(0);
  });
});

describe('assignLineup', () => {
  it('assigns players to the slots they can play', () => {
    const gk = player(70, ['GK']);
    const st = player(80, ['ST']);
    const lineup = assignLineup([gk, st], { gk: 1, st: 1 });
    expect(lineup.gk[0]).toBe(gk);
    expect(lineup.st[0]).toBe(st);
  });

  it('finds the globally optimal assignment instead of a greedy one', () => {
    // Greedy would put the flexible 95 on ST (its first listed slot) and leave
    // CAM empty for the ST-only player; optimal is 95 + 90.
    const flexible = player(95, ['ST', 'CAM']);
    const stOnly = player(90, ['ST']);
    const lineup = assignLineup([flexible, stOnly], { st: 1, cam: 1 });
    expect(lineup.st[0]).toBe(stOnly);
    expect(lineup.cam[0]).toBe(flexible);
  });

  it('uses each player at most once', () => {
    const cb = player(75, ['CB']);
    const lineup = assignLineup([cb], { cb: 2 });
    const filled = lineup.cb.filter(Boolean);
    expect(filled).toEqual([cb]);
  });

  it('leaves slots null when nobody can play them', () => {
    const st = player(80, ['ST']);
    const lineup = assignLineup([st], { gk: 1, st: 1 });
    expect(lineup.gk[0]).toBeNull();
    expect(lineup.st[0]).toBe(st);
  });

  it('prefers a strong secondary over a weak primary', () => {
    const weakPrimary = player(40, ['CAM']);
    const strongSecondary = player(90, ['ST'], ['CAM']); // 77 effective on CAM
    const lineup = assignLineup([weakPrimary, strongSecondary], { cam: 1 });
    expect(lineup.cam[0]).toBe(strongSecondary);
  });
});

describe('getFormationsWithPlayers / getRecommendedFormation', () => {
  it('returns every configured formation with a skill sum', () => {
    const formations = getFormationsWithPlayers([player(80, ['ST']), player(70, ['GK'])]);
    expect(formations.length).toBe(CFG.formations.length);
    for (const f of formations) {
      // Every formation can field the GK and the ST: 150 total.
      expect(f.skillSum).toBe(150);
    }
  });

  it('handles an empty squad', () => {
    const best = getRecommendedFormation([]);
    expect(best.skillSum).toBe(0);
    expect(best.name).toBeTruthy();
  });

  it('recommends a formation with the maximal skill sum', () => {
    // A squad of one CDM: only formations with a CDM slot score 60.
    const squad = [player(60, ['CDM'])];
    const best = getRecommendedFormation(squad);
    const max = Math.max(...getFormationsWithPlayers(squad).map(f => f.skillSum));
    expect(best.skillSum).toBe(max);
  });
});
