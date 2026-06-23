import { describe, it, expect, vi } from 'vitest';
import {
  rollStamina,
  staminaAgePenalty,
  fitnessFactor,
  fitnessTier,
  updateFitness,
  agePlayer,
  developPlayers,
  aiSelectionSkill,
  buildClubSheet,
} from '../src/assets/js/Helpers.js';
import { makePlayer } from '../src/assets/js/PlayerFactory.js';
import { simulateLiveMatch } from '../src/assets/js/MatchSim.js';
import * as CFG from '../src/assets/js/Config.js';

describe('rollStamina', () => {
  it('draws a lower ceiling for older players (age penalty)', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.5); // spread factor = 1
    const young = rollStamina(20); // below prime -> no penalty
    const old = rollStamina(34);
    expect(young).toBeCloseTo(CFG.STAMINA_MEAN, 5);
    expect(old).toBeCloseTo(CFG.STAMINA_MEAN - CFG.STAMINA_AGE_PENALTY * (34 - CFG.STAMINA_PRIME_AGE), 5);
    expect(old).toBeLessThan(young);
    spy.mockRestore();
  });

  it('stays within [STAMINA_MIN_ROLL, STAMINA_MAX] across the age range', () => {
    for (let i = 0; i < 1000; i++) {
      for (let age = CFG.PLAYER_AGE_MIN; age <= CFG.PLAYER_AGE_MAX; age++) {
        const s = rollStamina(age);
        expect(s).toBeGreaterThanOrEqual(CFG.STAMINA_MIN_ROLL);
        expect(s).toBeLessThanOrEqual(CFG.STAMINA_MAX);
      }
    }
  });

  it('clamps a heavily age-penalised ceiling up to the floor', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0); // lowest spread factor
    expect(rollStamina(60)).toBe(CFG.STAMINA_MIN_ROLL);
    spy.mockRestore();
  });
});

describe('staminaAgePenalty', () => {
  it('is zero up to the prime age and linear beyond it', () => {
    expect(staminaAgePenalty(CFG.STAMINA_PRIME_AGE)).toBe(0);
    expect(staminaAgePenalty(CFG.STAMINA_PRIME_AGE - 5)).toBe(0);
    expect(staminaAgePenalty(CFG.STAMINA_PRIME_AGE + 10)).toBeCloseTo(CFG.STAMINA_AGE_PENALTY * 10, 5);
  });
});

describe('fitnessFactor', () => {
  it('is full at/above FITNESS_PERF_FULL and the floor at zero', () => {
    expect(fitnessFactor({ fitness: 100 })).toBe(1);
    expect(fitnessFactor({ fitness: CFG.FITNESS_PERF_FULL })).toBe(1);
    expect(fitnessFactor({ fitness: 0 })).toBeCloseTo(CFG.FITNESS_PERF_MIN, 5);
  });

  it('decreases monotonically as fitness drops', () => {
    expect(fitnessFactor({ fitness: 40 })).toBeLessThan(fitnessFactor({ fitness: 80 }));
  });

  it('treats a missing fitness as full (no malus)', () => {
    expect(fitnessFactor({})).toBe(1);
  });

  it('clamps to the floor when the linear malus would undershoot it', () => {
    // A negative (synthetic) fitness drives the unclamped line below
    // FITNESS_PERF_MIN, so this exercises the lower clamp itself, not the line.
    expect(fitnessFactor({ fitness: -50 })).toBe(CFG.FITNESS_PERF_MIN);
  });
});

describe('fitnessTier', () => {
  it('maps fitness to the ring colour tiers', () => {
    expect(fitnessTier(CFG.FITNESS_TIER_GOOD)).toBe('good');
    expect(fitnessTier(CFG.FITNESS_TIER_GOOD - 1)).toBe('ok');
    expect(fitnessTier(CFG.FITNESS_TIER_OK)).toBe('ok');
    expect(fitnessTier(CFG.FITNESS_TIER_OK - 1)).toBe('low');
  });
});

describe('updateFitness', () => {
  it('drains a starter then recovers part of the gap', () => {
    const p = { stamina: 88, fitness: 88 };
    updateFitness(p, true);
    // drains by FITNESS_MATCH_DRAIN, then recovers half the gap to the ceiling
    expect(p.fitness).toBeCloseTo(88 - CFG.FITNESS_MATCH_DRAIN * (1 - CFG.FITNESS_REGEN_RATE), 5);
  });

  it('leaves a fully-fit rested player at his ceiling', () => {
    const p = { stamina: 88, fitness: 88 };
    updateFitness(p, false);
    expect(p.fitness).toBeCloseTo(88, 5);
  });

  it('recovers a rested, drained player toward his ceiling', () => {
    const p = { stamina: 88, fitness: 40 };
    updateFitness(p, false);
    // 40 + (88 - 40) * 0.5 = 64
    expect(p.fitness).toBeCloseTo(64, 5);
  });

  it('settles a weekly starter at a stable equilibrium (ceiling - drain)', () => {
    const p = { stamina: 88, fitness: 88 - CFG.FITNESS_MATCH_DRAIN };
    for (let i = 0; i < 30; i++) updateFitness(p, true);
    expect(p.fitness).toBeCloseTo(88 - CFG.FITNESS_MATCH_DRAIN, 5);
  });

  it('keeps a strong player playable but pushes an overplayed weak one into the red', () => {
    const strong = { stamina: 95, fitness: 95 };
    const weak = { stamina: 62, fitness: 62 };
    for (let i = 0; i < 30; i++) { updateFitness(strong, true); updateFitness(weak, true); }
    expect(strong.fitness).toBeGreaterThan(CFG.FITNESS_TIER_OK); // a strong player stays playable (yellow)
    expect(weak.fitness).toBeLessThan(CFG.FITNESS_TIER_OK);      // an overplayed weak player drops into red
  });

  it('recovers toward but never past the ceiling', () => {
    const p = { stamina: 80, fitness: 50 };
    for (let i = 0; i < 20; i++) updateFitness(p, false);
    expect(p.fitness).toBeLessThanOrEqual(80);
    expect(p.fitness).toBeCloseTo(80, 1); // converges up to the ceiling
  });

  it('keeps a season-fresh player above his ceiling until he plays', () => {
    const p = { stamina: 70, fitness: CFG.STAMINA_MAX }; // started the season fresh
    updateFitness(p, false);
    expect(p.fitness).toBe(CFG.STAMINA_MAX); // recovery never pulls him down
    updateFitness(p, true);                  // first match drains him
    expect(p.fitness).toBeLessThan(CFG.STAMINA_MAX);
  });

  it('clamps to zero with a synthetic ceiling below the match drain', () => {
    // Out-of-range ceiling (below FITNESS_MATCH_DRAIN) so the post-regen value
    // would go negative — exercises the defensive lower clamp.
    const p = { stamina: 10, fitness: 0 };
    updateFitness(p, true); // 0 - 30 = -30, then + (10 - -30) * 0.5 = -10 -> clamp 0
    expect(p.fitness).toBe(0);
  });
});

describe('agePlayer with stamina', () => {
  it('lowers the ceiling on a birthday past the prime, leaving current fitness alone', () => {
    const p = { age: 30, stamina: 88, fitness: 60 };
    agePlayer(p);
    expect(p.age).toBe(31);
    expect(p.stamina).toBeCloseTo(88 - CFG.STAMINA_AGE_PENALTY, 5);
    expect(p.fitness).toBe(60); // only matches drain fitness — aging never does
  });

  it('does not lower the ceiling while still below the prime age', () => {
    const p = { age: 20, stamina: 88, fitness: 88 };
    agePlayer(p);
    expect(p.age).toBe(21);
    expect(p.stamina).toBe(88);
  });

  it('does not lower the ceiling below the floor', () => {
    const p = { age: 30, stamina: CFG.STAMINA_MIN_ROLL, fitness: CFG.STAMINA_MIN_ROLL };
    agePlayer(p);
    expect(p.stamina).toBe(CFG.STAMINA_MIN_ROLL);
    expect(p.fitness).toBe(CFG.STAMINA_MIN_ROLL);
  });
});

describe('makePlayer', () => {
  it('gives every player a stamina ceiling and a full starting fitness', () => {
    for (let i = 0; i < 200; i++) {
      const p = makePlayer();
      expect(p.stamina).toBeGreaterThanOrEqual(CFG.STAMINA_MIN_ROLL);
      expect(p.stamina).toBeLessThanOrEqual(CFG.STAMINA_MAX);
      expect(p.fitness).toBe(CFG.STAMINA_MAX); // starts fully fresh

    }
  });
});

describe('developPlayers fitness pass', () => {
  function devPlayer(over = {}) {
    return {
      id: 1, age: 28, optimalAge: 28, potential: 60, drawnPotential: 60,
      skill: 50, skillExact: 50, positions: { position: 'ST' },
      skills: { goalkeeping: 0, defense: 0, progression: 15, shot: 35 },
      stamina: 88, fitness: 88, ...over,
    };
  }

  it('drains a player who featured this week', () => {
    const p = devPlayer();
    developPlayers([p], { [p.id]: 6.5 });
    expect(p.fitness).toBeLessThan(88);
  });

  it('recovers a rested, drained player', () => {
    const p = devPlayer({ fitness: 50 });
    developPlayers([p], {});
    expect(p.fitness).toBeGreaterThan(50);
  });
});

describe('low fitness hurts match performance', () => {
  let nextId = 1;
  const PROFILE = {
    GK: s => ({ goalkeeping: s, defense: 0, progression: 0, shot: 0 }),
    DEF: s => ({ goalkeeping: 0, defense: Math.round(s * 0.75), progression: Math.round(s * 0.25), shot: 0 }),
    MID: s => ({ goalkeeping: 0, defense: Math.round(s * 0.25), progression: Math.round(s * 0.5), shot: Math.round(s * 0.25) }),
    ATT: s => ({ goalkeeping: 0, defense: 0, progression: Math.round(s * 0.3), shot: Math.round(s * 0.7) }),
  };
  function entry(position, skill, fitness) {
    return { player: { id: nextId++, lastName: `P${nextId}`, stamina: 100, fitness, skills: PROFILE[CFG.POSITION_ROLE[position]](skill) }, position };
  }
  function side(skill, fitness) {
    const xi = ['GK', 'CB', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'ST', 'LF', 'RF']
      .map(pos => entry(pos, skill, fitness));
    return { strength: skill * 11, xi };
  }
  // A full-fitness side except its defenders, set to `defFitness` — isolates the
  // defender fitness malus (selection weighting + the duel defence term).
  function sideDefFitness(skill, defFitness) {
    const xi = ['GK', 'CB', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'ST', 'LF', 'RF']
      .map(pos => entry(pos, skill, CFG.POSITION_ROLE[pos] === 'DEF' ? defFitness : 100));
    return { strength: skill * 11, xi };
  }

  it('a tired side scores fewer and concedes more than a fresh one', () => {
    const runs = 600;
    const measure = awayFitness => {
      let awayGoals = 0, homeGoals = 0;
      for (let i = 0; i < runs; i++) {
        const tl = simulateLiveMatch(side(55, 100), side(55, awayFitness));
        homeGoals += tl.homeGoals;
        awayGoals += tl.awayGoals;
      }
      return { awayGoals: awayGoals / runs, homeGoals: homeGoals / runs };
    };
    const fresh = measure(100);
    const tired = measure(25);
    expect(tired.awayGoals).toBeLessThan(fresh.awayGoals);   // the tired away side scores less
    expect(tired.homeGoals).toBeGreaterThan(fresh.homeGoals); // and concedes more
  });

  it('a side with tired defenders (only) concedes more', () => {
    const runs = 600;
    const homeGoalsVs = awayDefFitness => {
      let goals = 0;
      for (let i = 0; i < runs; i++) {
        goals += simulateLiveMatch(side(55, 100), sideDefFitness(55, awayDefFitness)).homeGoals;
      }
      return goals / runs;
    };
    // Away attackers and keeper are fresh in both runs, so the extra goals come
    // from the fitness malus on the defenders specifically (D term + targeting).
    expect(homeGoalsVs(20)).toBeGreaterThan(homeGoalsVs(100));
  });
});

describe('aiSelectionSkill', () => {
  const mk = (skill, fitness) => ({
    skill, fitness, stamina: 100,
    positions: { position: 'ST', primary: ['ST'], secondary: [] },
  });

  it('equals effective skill scaled by the fitness factor', () => {
    const p = mk(60, 50);
    expect(aiSelectionSkill(p, 'ST')).toBeCloseTo(60 * fitnessFactor(p), 5);
  });

  it('ranks a fresh player above an equal-skill tired one', () => {
    expect(aiSelectionSkill(mk(60, 100), 'ST')).toBeGreaterThan(aiSelectionSkill(mk(60, 30), 'ST'));
  });
});

describe('fitness-aware AI sheet selection', () => {
  // A clean 4-4-2-shaped squad (the only formation it fully fills) with depth at
  // ST: the highest-skill striker is exhausted, two fresh backups sit behind him.
  const mk = (id, pos, skill, fitness) => ({
    id, skill, fitness, stamina: 100,
    positions: { position: pos, primary: [pos], secondary: [], sort: 0 },
  });
  const squad = () => [
    mk(1, 'GK', 60, 100),
    mk(2, 'LB', 60, 100), mk(3, 'CB', 60, 100), mk(4, 'CB', 60, 100), mk(5, 'RB', 60, 100),
    mk(6, 'LM', 60, 100), mk(7, 'CM', 60, 100), mk(8, 'CM', 60, 100), mk(9, 'RM', 60, 100),
    mk(10, 'ST', 70, 10),  // best striker by skill, but exhausted
    mk(11, 'ST', 64, 100), // fresh
    mk(12, 'ST', 62, 100), // fresh backup
  ];
  const xiIds = sheet => new Set(Object.values(sheet.formation.players).flat().map(p => p.id));

  it('skill-only selection starts the strongest striker even when exhausted', () => {
    const ids = xiIds(buildClubSheet(squad(), CFG.BENCH_SIZE));
    expect(ids.has(10)).toBe(true);
  });

  it('fitness-aware selection benches the exhausted striker for fresher backups', () => {
    const ids = xiIds(buildClubSheet(squad(), CFG.BENCH_SIZE, aiSelectionSkill));
    expect(ids.has(10)).toBe(false); // tired star rotated out
    expect(ids.has(11)).toBe(true);  // fresh strikers promoted
    expect(ids.has(12)).toBe(true);
  });
});
