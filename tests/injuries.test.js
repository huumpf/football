import { describe, it, expect } from 'vitest';
import {
  updateFitness,
  isInjured,
  aiSelectionSkill,
  applyInjuries,
  absoluteWeek,
  injuryTimingLabel,
  injuryDurationLabel,
  buildClubSheet,
} from '../src/assets/js/Helpers.js';
import { makePlayer } from '../src/assets/js/PlayerFactory.js';
import { simulateLiveMatch, simulateInstant, injuriesFromTimeline } from '../src/assets/js/MatchSim.js';
import * as CFG from '../src/assets/js/Config.js';

describe('makePlayer injury attributes', () => {
  it('gives every player a hidden injuryProneness in [0,1], biased low, and no injury', () => {
    let sum = 0;
    for (let i = 0; i < 4000; i++) {
      const p = makePlayer();
      expect(p.injuryProneness).toBeGreaterThanOrEqual(0);
      expect(p.injuryProneness).toBeLessThanOrEqual(1);
      expect(p.injury).toBeNull();
      sum += p.injuryProneness;
    }
    // Skewed toward 0 (Math.random()**2 has mean 1/3), so well below the 0.5 midpoint.
    expect(sum / 4000).toBeLessThan(0.42);
  });
});

describe('updateFitness recovery for an injured player', () => {
  const injured = (weeks, elapsed = 0) => ({
    stamina: 88, fitness: CFG.INJURY_FITNESS_INJURED,
    injury: { name: 'Hamstring injury', recovery_weeks: '3-8', weeks, elapsed, injuredAtAbsWeek: 5 },
  });

  it('pins fitness low and counts elapsed up while recovering', () => {
    const p = injured(3);
    updateFitness(p, false);
    expect(p.injury.elapsed).toBe(1);
    expect(p.fitness).toBe(CFG.INJURY_FITNESS_INJURED);
    expect(p.injury).not.toBeNull();
  });

  it('takes no match drain even when the player is marked as having played', () => {
    const p = injured(3);
    updateFitness(p, true);
    expect(p.fitness).toBe(CFG.INJURY_FITNESS_INJURED); // not 20 - FITNESS_MATCH_DRAIN
  });

  it('clears the injury and restores partial fitness once the duration elapses', () => {
    const p = injured(2, 1); // one week already recovered
    updateFitness(p, false);  // -> elapsed 2 == weeks
    expect(p.injury).toBeNull();
    expect(p.fitness).toBe(CFG.INJURY_FITNESS_RECOVERED);
  });

  it('a one-week injury clears on the next recovery tick', () => {
    const p = injured(1);
    updateFitness(p, false);
    expect(p.injury).toBeNull();
    expect(p.fitness).toBe(CFG.INJURY_FITNESS_RECOVERED);
  });
});

describe('isInjured / aiSelectionSkill', () => {
  it('isInjured reflects the injury field', () => {
    expect(isInjured({ injury: { name: 'x' } })).toBe(true);
    expect(isInjured({ injury: null })).toBe(false);
    expect(isInjured({})).toBe(false);
  });

  it('aiSelectionSkill returns 0 for an injured player so he is never selected', () => {
    const base = { skill: 80, fitness: 90, stamina: 100, positions: { position: 'ST', primary: ['ST'], secondary: [] } };
    expect(aiSelectionSkill(base, 'ST')).toBeGreaterThan(0);
    expect(aiSelectionSkill({ ...base, injury: { name: 'x', weeks: 4 } }, 'ST')).toBe(0);
  });

  it('buildClubSheet keeps an injured star out of the XI', () => {
    const mk = (id, pos, skill, injury = null) => ({
      id, skill, fitness: 100, stamina: 100, injury,
      positions: { position: pos, primary: [pos], secondary: [], sort: 0 },
    });
    const squad = [
      mk(1, 'GK', 60), mk(2, 'LB', 60), mk(3, 'CB', 60), mk(4, 'CB', 60), mk(5, 'RB', 60),
      mk(6, 'LM', 60), mk(7, 'CM', 60), mk(8, 'CM', 60), mk(9, 'RM', 60),
      mk(10, 'ST', 90, { name: 'ACL tear', weeks: 30 }), // best striker but injured
      mk(11, 'ST', 64), mk(12, 'ST', 62),
    ];
    const ids = new Set(Object.values(buildClubSheet(squad, CFG.BENCH_SIZE, aiSelectionSkill).formation.players).flat().map(p => p.id));
    expect(ids.has(10)).toBe(false);
  });
});

describe('applyInjuries', () => {
  it('writes the injury onto matching players and pins their fitness', () => {
    const players = [{ id: 1, fitness: 80, injury: null }, { id: 2, fitness: 80, injury: null }];
    applyInjuries(players, { 1: { name: 'Concussion', recovery_weeks: '1-4', weeks: 2, elapsed: 0, injuredAtAbsWeek: 10 } });
    expect(players[0].injury.name).toBe('Concussion');
    expect(players[0].fitness).toBe(CFG.INJURY_FITNESS_INJURED);
    expect(players[1].injury).toBeNull(); // untouched
    expect(players[1].fitness).toBe(80);
  });
});

describe('injury tooltip helpers', () => {
  it('absoluteWeek is monotonic across seasons', () => {
    expect(absoluteWeek(1, 5)).toBe(5);
    expect(absoluteWeek(2, 1)).toBe(CFG.SEASON_WEEKS + 1);
  });

  it('injuryTimingLabel reads Today / N weeks ago, even over a season boundary', () => {
    const club = { season: 1, week: 20 };
    expect(injuryTimingLabel({ injury: { injuredAtAbsWeek: absoluteWeek(1, 20) } }, club)).toBe('Today');
    expect(injuryTimingLabel({ injury: { injuredAtAbsWeek: absoluteWeek(1, 19) } }, club)).toBe('1 week ago');
    expect(injuryTimingLabel({ injury: { injuredAtAbsWeek: absoluteWeek(1, 17) } }, club)).toBe('3 weeks ago');
    // Injured season 1 week 51, now season 2 week 1 -> 2 weeks.
    expect(injuryTimingLabel({ injury: { injuredAtAbsWeek: absoluteWeek(1, CFG.SEASON_WEEKS - 1) } }, { season: 2, week: 1 })).toBe('2 weeks ago');
  });

  it('injuryDurationLabel shows the vague range, never the exact rolled weeks', () => {
    const label = injuryDurationLabel({ injury: { name: 'Hamstring injury', recovery_weeks: '3-8', weeks: 5 } });
    expect(label).toBe('typical duration: 3-8 weeks');
    expect(label).not.toContain('5');
  });
});

describe('injuries in the live match engine', () => {
  let nextId = 1;
  const PROFILE = {
    GK: s => ({ goalkeeping: s, defense: 0, progression: 0, shot: 0 }),
    DEF: s => ({ goalkeeping: 0, defense: Math.round(s * 0.75), progression: Math.round(s * 0.25), shot: 0 }),
    MID: s => ({ goalkeeping: 0, defense: Math.round(s * 0.25), progression: Math.round(s * 0.5), shot: Math.round(s * 0.25) }),
    ATT: s => ({ goalkeeping: 0, defense: 0, progression: Math.round(s * 0.3), shot: Math.round(s * 0.7) }),
  };
  function side(proneness, fitness) {
    const xi = ['GK', 'CB', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'ST', 'LF', 'RF'].map(pos => ({
      player: { id: nextId++, lastName: `P${nextId}`, fitness, stamina: 100, injuryProneness: proneness, skills: PROFILE[CFG.POSITION_ROLE[pos]](55) },
      position: pos,
    }));
    return { strength: 55 * 11, xi, bench: [] };
  }

  it('never injures proneness-0 players', () => {
    let injuries = 0;
    for (let i = 0; i < 300; i++) {
      const tl = simulateLiveMatch(side(0, 60), side(0, 60));
      injuries += tl.events.filter(e => e.type === 'injury').length;
    }
    expect(injuries).toBe(0);
  });

  it('injures highly-prone, low-fitness players, with valid pool data and the player leaving the pitch', () => {
    const names = new Set(CFG.INJURIES.map(i => i.name));
    let injuries = 0;
    for (let i = 0; i < 300; i++) {
      const tl = simulateLiveMatch(side(1, 25), side(1, 25));
      for (const ev of tl.events.filter(e => e.type === 'injury')) {
        injuries++;
        const inj = CFG.INJURIES.find(x => x.name === ev.injury.name);
        expect(names.has(ev.injury.name)).toBe(true);
        expect(ev.injury.weeks).toBeGreaterThanOrEqual(inj.minWeeks);
        expect(ev.injury.weeks).toBeLessThanOrEqual(inj.maxWeeks);
        // The injured player must not score/assist/duel after the injury minute.
        const after = tl.contribs.filter(c => c.playerId === ev.player.id && c.minute > ev.minute);
        expect(after).toHaveLength(0);
      }
    }
    expect(injuries).toBeGreaterThan(0);
  });

  it('injuriesFromTimeline and simulateInstant expose injuries keyed by player id', () => {
    for (let i = 0; i < 50; i++) {
      const tl = simulateLiveMatch(side(1, 20), side(1, 20));
      const map = injuriesFromTimeline(tl);
      for (const ev of tl.events.filter(e => e.type === 'injury')) {
        expect(map[ev.player.id]).toEqual(ev.injury);
      }
    }
    const instant = simulateInstant(side(1, 20), side(1, 20));
    expect(instant.injuries).toBeTypeOf('object');
  });
});
