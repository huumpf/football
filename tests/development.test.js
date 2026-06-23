import { describe, it, expect } from 'vitest';
import { developPlayers, projectedSkill, developmentDelta } from '../src/assets/js/Helpers.js';
import { makeClub } from '../src/assets/js/ClubFactory.js';
import { simulateInstant } from '../src/assets/js/MatchSim.js';
import * as CFG from '../src/assets/js/Config.js';

let nextId = 1;
// A player at a chosen age/potential. By default skill sits exactly on its age
// curve (target), so convergence is zero and the performance push is isolated.
function devPlayer(over = {}) {
  const age = over.age ?? 28;
  const optimalAge = over.optimalAge ?? 28;
  const potential = over.potential ?? 60;
  const onCurve = Math.floor(potential * Math.pow(CFG.AGE_FACTOR, Math.abs(age - optimalAge)));
  const skill = over.skill ?? onCurve;
  return {
    id: over.id ?? nextId++,
    age, optimalAge, potential, drawnPotential: over.drawnPotential ?? potential,
    skill, skillExact: skill,
    positions: { position: over.position ?? 'ST' },
    skills: over.skills ?? { goalkeeping: 0, defense: 0, progression: Math.round(skill * 0.3), shot: Math.round(skill * 0.7) },
  };
}

// Runs `weeks` of development; `rating` (if given) marks the player as having
// played each week, otherwise he's a bench/training week.
function runWeeks(player, weeks, rating) {
  for (let i = 0; i < weeks; i++) developPlayers([player], rating == null ? {} : { [player.id]: rating });
  return player;
}

describe('developPlayers', () => {
  it('raises skill for a striker rating above his role baseline', () => {
    const p = devPlayer({ position: 'ST' });
    const start = p.skill;
    runWeeks(p, 34, CFG.DEV_BASELINE.ATT + 1.5);
    expect(p.skill).toBeGreaterThan(start);
  });

  it('lowers skill for a striker rating below his role baseline', () => {
    const p = devPlayer({ position: 'ST' });
    const start = p.skill;
    runWeeks(p, 34, CFG.DEV_BASELINE.ATT - 1.5);
    expect(p.skill).toBeLessThan(start);
  });

  it('leaves an on-curve player who rates exactly his baseline unchanged', () => {
    const p = devPlayer({ position: 'ST' });
    const start = p.skill;
    runWeeks(p, 34, CFG.DEV_BASELINE.ATT);
    expect(p.skill).toBe(start);
    expect(p.potential).toBeCloseTo(p.drawnPotential, 5);
  });

  it('develops a benched player less than one who plays', () => {
    // Both start below their curve target, so convergence pulls them up.
    const played = devPlayer({ age: 22, optimalAge: 28, potential: 70, skill: 40, position: 'ST' });
    const benched = devPlayer({ age: 22, optimalAge: 28, potential: 70, skill: 40, position: 'ST' });
    runWeeks(played, 10, CFG.DEV_BASELINE.ATT);  // plays, rating = neutral (pure convergence at full weight)
    runWeeks(benched, 10);                        // never played (training weight)
    expect(played.skill).toBeGreaterThan(benched.skill);
    expect(benched.skill).toBeGreaterThan(40);    // but still developed
  });

  it('grows a young player toward his potential and declines an old one', () => {
    const young = devPlayer({ age: 20, optimalAge: 29, potential: 75, skill: 45 });
    const old = devPlayer({ age: 33, optimalAge: 28, potential: 75, skill: 60 });
    runWeeks(young, 40);
    runWeeks(old, 40);
    expect(young.skill).toBeGreaterThan(45);
    expect(young.skill).toBeLessThanOrEqual(projectedSkill(young, 0) + 1);
    expect(old.skill).toBeLessThan(60);
  });

  it('develops a young player faster than an older one from the same performance', () => {
    // Both start on their own age curve; only their age (vs optimalAge) differs.
    const young = devPlayer({ age: 20, optimalAge: 30, potential: 72, position: 'ST' });
    const old = devPlayer({ age: 30, optimalAge: 30, potential: 72, position: 'ST' });
    const youngStart = young.skill, oldStart = old.skill;
    const rating = CFG.DEV_BASELINE.ATT + 1.5;
    runWeeks(young, 30, rating);
    runWeeks(old, 30, rating);
    expect(young.skill - youngStart).toBeGreaterThan(old.skill - oldStart);
    // The youth bonus also lifts the ceiling more.
    expect(young.potential - 72).toBeGreaterThan(old.potential - 72);
  });

  it('drifts potential up on strong play and reverts it toward the drawn value', () => {
    const p = devPlayer({ position: 'ST' });
    runWeeks(p, 34, CFG.DEV_BASELINE.ATT + 2);   // a strong season
    expect(p.potential).toBeGreaterThan(p.drawnPotential);
    const peak = p.potential;
    runWeeks(p, 60, CFG.DEV_BASELINE.ATT);        // neutral play -> reversion pulls back
    expect(p.potential).toBeLessThan(peak);
    expect(p.potential).toBeGreaterThanOrEqual(p.drawnPotential - 0.001);
  });

  it('keeps skill and potential within [0, 100]', () => {
    const p = devPlayer({ age: 28, optimalAge: 28, potential: 99, skill: 99, position: 'ST' });
    runWeeks(p, 200, 10);  // way over baseline, capped internally
    expect(p.skill).toBeLessThanOrEqual(100);
    expect(p.potential).toBeLessThanOrEqual(100);
    expect(p.skill).toBeGreaterThanOrEqual(0);
  });

  it('is a safe no-op shape on an old save missing dev fields', () => {
    const legacy = {
      id: nextId++, age: 25, optimalAge: 28, potential: 55, skill: 50,
      positions: { position: 'CB' },
      skills: { goalkeeping: 0, defense: 40, progression: 10, shot: 0 },
      // no skillExact, no drawnPotential
    };
    expect(() => developPlayers([legacy], { [legacy.id]: 7 })).not.toThrow();
    expect(legacy.skillExact).not.toBeUndefined();
    expect(legacy.drawnPotential).toBe(55);
    expect(Number.isFinite(legacy.skill)).toBe(true);
  });
});

describe('developmentDelta', () => {
  it('measures change vs the season-start and join marks', () => {
    const p = { skill: 56, seasonStartSkill: 50, joinSkill: 48, skillLog: [] };
    expect(developmentDelta(p, 'season')).toBe(6);
    expect(developmentDelta(p, 'join')).toBe(8);
  });

  it('measures change over the last N weeks from the rolling log', () => {
    // Log holds one skill per past week, most recent last (= current skill).
    const p = { skill: 55, skillLog: [50, 51, 52, 53, 54, 55] };
    expect(developmentDelta(p, 'w5')).toBe(5);   // 55 now vs 50 five weeks ago
    expect(developmentDelta(p, 'w20')).toBe(5);  // fewer than 20 entries -> oldest (50)
  });

  it('reads as zero change with no signal or on old saves', () => {
    expect(developmentDelta({ skill: 50, skillLog: [] }, 'w5')).toBe(0);
    expect(developmentDelta({ skill: 50 }, 'season')).toBe(0); // no seasonStartSkill
    expect(developmentDelta({ skill: 50 }, 'join')).toBe(0);   // no joinSkill
    expect(developmentDelta({ skill: 50, seasonStartSkill: 50, skillLog: [] }, 'season')).toBe(0);
  });
});

describe('league development stability', () => {
  // Isolates the development balance: many seasons of real matches + weekly
  // development with a FIXED population (no aging/retirement, which the game has
  // no youth intake to replace). The per-role baselines should keep the league
  // mean skill from inflating or collapsing over time.
  it('keeps the league skill distribution stable over many seasons', () => {
    const flatten = lineup => Object.entries(lineup).flatMap(([pos, players]) =>
      players.filter(Boolean).map(player => ({ player, position: pos.toUpperCase() })));
    const clubs = Array.from({ length: 18 }, (_, i) => makeClub(i, `C${i}`));
    const allSkills = () => clubs.flatMap(c => c.players.map(p => p.skill));
    const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
    const p95 = a => [...a].sort((x, y) => x - y)[Math.floor(a.length * 0.95)];

    const startMean = mean(allSkills());
    const startP95 = p95(allSkills());

    const SEASONS = 20;
    for (let s = 0; s < SEASONS; s++) {
      // ~34 match weeks: pair clubs, rate them, develop with the ratings.
      for (let day = 0; day < 34; day++) {
        const order = clubs.map((_, i) => i).sort(() => Math.random() - 0.5);
        const ratings = {};
        for (let i = 0; i + 1 < order.length; i += 2) {
          const home = { xi: flatten(clubs[order[i]].formation.players), strength: clubs[order[i]].formation.skillSum };
          const away = { xi: flatten(clubs[order[i + 1]].formation.players), strength: clubs[order[i + 1]].formation.skillSum };
          Object.assign(ratings, simulateInstant(home, away).ratings);
        }
        for (const c of clubs) developPlayers(c.players, ratings);
      }
      // ~18 training weeks.
      for (let w = 0; w < 18; w++) for (const c of clubs) developPlayers(c.players, {});
    }

    const endMean = mean(allSkills());
    const endP95 = p95(allSkills());
    // No runaway drift in either direction over 20 seasons.
    expect(Math.abs(endMean - startMean)).toBeLessThan(4);
    expect(Math.abs(endP95 - startP95)).toBeLessThan(6);
  }, 30000);
});
