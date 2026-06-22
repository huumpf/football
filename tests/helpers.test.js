import { describe, it, expect } from 'vitest';
import {
  moneyStr,
  projectedSkill,
  effectiveSkill,
  marketValue,
  assignLineup,
  getFormationsWithPlayers,
  getRecommendedFormation,
  lineupSkill,
  selectBench,
  buildSheet,
  buildFormationSheets,
  buildClubSheet,
  reconcileSheet,
} from '../src/assets/js/Helpers.js';
import * as CFG from '../src/assets/js/Config.js';

// Minimal player fixture matching the shape PlayerFactory produces.
function player(skill, primary, secondary = []) {
  return {
    skill,
    positions: { position: primary[0], primary, secondary },
  };
}

// Like player() but with a unique id (the sheet helpers key players by id).
let _id = 0;
function p(skill, primary, secondary = []) {
  return { id: ++_id, skill, positions: { position: primary[0], primary, secondary, sort: 0 } };
}

// All player ids currently sitting in a sheet's three buckets.
function sheetIds(sheet) {
  return [
    ...Object.values(sheet.lineup).flat(),
    ...sheet.bench,
    ...sheet.reserve,
  ].filter(Boolean).map(pl => pl.id);
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

describe('lineupSkill', () => {
  it('sums the effective skill of the slotted players', () => {
    expect(lineupSkill({ gk: [p(70, ['GK'])], st: [p(80, ['ST'])] })).toBe(150);
  });

  it('skips empty slots', () => {
    expect(lineupSkill({ gk: [p(70, ['GK'])], st: [null] })).toBe(70);
  });

  it('counts an out-of-position player as zero (symmetric with the optimum)', () => {
    expect(lineupSkill({ cb: [p(80, ['ST'])] })).toBe(0);
  });
});

describe('selectBench', () => {
  it('takes one backup per position before raw skill (incl. a backup GK)', () => {
    const gk = p(40, ['GK']);
    const st1 = p(90, ['ST']);
    const st2 = p(85, ['ST']);
    const st3 = p(30, ['ST']);
    // Two bench slots, two distinct positions: the low-skill GK still earns a
    // slot over the higher-skill second striker.
    const bench = selectBench([gk, st1, st2, st3], { gk: 1, st: 1 }, 2);
    expect(bench).toContain(gk);
    expect(bench).toContain(st1);
    expect(bench).not.toContain(st2);
    expect(bench.length).toBe(2);
  });

  it('does not stack one position when others can be covered', () => {
    const gk = p(50, ['GK']);
    const st = p(55, ['ST']);
    const cbs = Array.from({ length: 10 }, (_, i) => p(60 + i, ['CB']));
    const bench = selectBench([gk, st, ...cbs], { gk: 1, cb: 2, st: 1 }, 9);
    expect(bench).toContain(gk);
    expect(bench).toContain(st);
    expect(bench.length).toBe(9);
    expect(bench.every(pl => pl.positions.position === 'CB')).toBe(false);
  });

  it('fills remaining slots by skill once positions are covered', () => {
    const gk = p(50, ['GK']);
    const st = p(60, ['ST']);
    const cbHigh = p(80, ['CB']);
    const cbLow = p(55, ['CB']);
    const bench = selectBench([gk, st, cbHigh, cbLow], { gk: 1, st: 1 }, 4);
    // Covers gk + st + best cb, then the leftover cb by skill.
    expect(bench.length).toBe(4);
    expect(bench).toContain(cbHigh);
    expect(bench).toContain(cbLow);
  });

  it('tolerates a squad smaller than the bench', () => {
    const bench = selectBench([p(50, ['GK'])], { gk: 1, cb: 2 }, 9);
    expect(bench.length).toBe(1);
  });
});

describe('buildSheet', () => {
  it('partitions the squad into lineup, bench and reserve with no overlap', () => {
    const squad = [p(70, ['GK']), p(80, ['ST']), p(75, ['ST']), p(60, ['ST'])];
    const sheet = buildSheet(squad, { gk: 1, st: 1 }, 1);
    // GK + best ST on the pitch, one ST on the bench, one in reserve.
    expect(sheet.lineup.gk[0].positions.position).toBe('GK');
    expect(sheet.bench.length).toBe(1);
    expect(sheet.reserve.length).toBe(1);
    const ids = sheetIds(sheet);
    expect(new Set(ids).size).toBe(squad.length); // every player once
  });
});

describe('buildFormationSheets', () => {
  it('builds a partitioning sheet for every formation and names the strongest default', () => {
    const squad = [
      p(70, ['GK']), p(72, ['LB']), p(74, ['CB']), p(73, ['CB']), p(71, ['RB']),
      p(75, ['CM']), p(76, ['CM']), p(77, ['LM']), p(78, ['RM']),
      p(82, ['ST']), p(80, ['ST']), p(60, ['CB']), p(58, ['GK']),
    ];
    const { sheets, defaultName } = buildFormationSheets(squad, CFG.BENCH_SIZE);
    expect(Object.keys(sheets).length).toBe(CFG.formations.length);
    expect(defaultName).toBe(getRecommendedFormation(squad).name);
    for (const sheet of Object.values(sheets)) {
      expect(new Set(sheetIds(sheet)).size).toBe(squad.length);
    }
  });
});

describe('buildClubSheet', () => {
  it('uses the strongest formation and partitions the squad', () => {
    const squad = [
      p(70, ['GK']), p(72, ['CB']), p(74, ['CB']), p(73, ['CB']),
      p(75, ['CM']), p(76, ['CM']), p(77, ['CM']),
      p(82, ['ST']), p(80, ['ST']), p(60, ['LB']), p(58, ['RB']),
      p(55, ['GK']), p(54, ['CB']),
    ];
    const { formation, bench, reserve } = buildClubSheet(squad, CFG.BENCH_SIZE);
    expect(formation.name).toBe(getRecommendedFormation(squad).name);
    const placed = Object.values(formation.players).flat();
    const ids = [...placed, ...bench, ...reserve].map(pl => pl.id);
    expect(new Set(ids).size).toBe(squad.length);
  });
});

describe('reconcileSheet', () => {
  const a = p(70, ['GK']);
  const b = p(80, ['ST']);
  const c = p(60, ['CB']);
  const base = () => ({ lineup: { gk: [a], st: [b] }, bench: [c], reserve: [] });

  it('vacates a pitch slot when its player leaves the squad', () => {
    const r = reconcileSheet(base(), [a, c]);
    expect(r.lineup.st[0]).toBeNull();
    expect(r.lineup.gk[0]).toBe(a);
    expect(sheetIds(r)).not.toContain(b.id);
  });

  it('appends a new signing to the reserve', () => {
    const d = p(50, ['LB']);
    const r = reconcileSheet(base(), [a, b, c, d]);
    expect(r.reserve.map(pl => pl.id)).toContain(d.id);
    expect(r.lineup.st[0]).toBe(b);
  });

  it('dedupes a player that appears in more than one bucket', () => {
    const dup = { lineup: { gk: [a] }, bench: [a], reserve: [a] };
    const r = reconcileSheet(dup, [a]);
    expect(sheetIds(r).filter(id => id === a.id).length).toBe(1);
  });
});
