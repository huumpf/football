import { describe, it, expect } from 'vitest';
import { simulateLiveMatch } from './MatchSim.js';
import * as CFG from './Config.js';

let nextId = 1;

// Role-shaped skills so the duel engine sees a real keeper, back line and
// attack (a flat profile would over-convert). `s` is the base skill level.
const PROFILE = {
  GK: s => ({ goalkeeping: s, defense: 0, progression: 0, shot: 0 }),
  DEF: s => ({ goalkeeping: 0, defense: Math.round(s * 0.75), progression: Math.round(s * 0.25), shot: 0 }),
  MID: s => ({ goalkeeping: 0, defense: Math.round(s * 0.25), progression: Math.round(s * 0.5), shot: Math.round(s * 0.25) }),
  ATT: s => ({ goalkeeping: 0, defense: 0, progression: Math.round(s * 0.3), shot: Math.round(s * 0.7) }),
};

function entry(position, skill) {
  const profile = PROFILE[CFG.POSITION_ROLE[position]];
  return { player: { id: nextId++, lastName: `P${nextId}`, skills: profile(skill) }, position };
}

// A 4-3-3 line-up at a uniform skill level.
function makeXI(skill) {
  return ['GK', 'CB', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'ST', 'LF', 'RF']
    .map(pos => entry(pos, skill));
}

// `strength` drives the chance rate (share); the XI skill level drives the duel
// outcomes. Kept equal here so a higher strength means more chances, not better
// finishing — mirrors how a stronger side gets on the ball more.
function side(name, strength, skill = 50) {
  return { name, strength, xi: makeXI(skill) };
}

function average(runs, fn) {
  let total = 0;
  for (let i = 0; i < runs; i++) total += fn();
  return total / runs;
}

describe('simulateLiveMatch', () => {
  it('runs for 90 minutes plus 0..MATCH_MAX_STOPPAGE of stoppage', () => {
    for (let i = 0; i < 500; i++) {
      const { totalMinutes } = simulateLiveMatch(side('home', 50), side('away', 50));
      expect(totalMinutes).toBeGreaterThanOrEqual(90);
      expect(totalMinutes).toBeLessThanOrEqual(90 + CFG.MATCH_MAX_STOPPAGE);
    }
  });

  it('averages ~3 goals across evenly matched teams, split ~50/50', () => {
    const runs = 4000;
    let home = 0;
    let away = 0;
    for (let i = 0; i < runs; i++) {
      const m = simulateLiveMatch(side('home', 50), side('away', 50));
      home += m.homeGoals;
      away += m.awayGoals;
    }
    const total = (home + away) / runs;
    const homeShare = home / (home + away);
    expect(total).toBeGreaterThan(2.3);
    expect(total).toBeLessThan(3.9);
    expect(homeShare).toBeGreaterThan(0.4);
    expect(homeShare).toBeLessThan(0.6);
  });

  it('skews goals toward the stronger team', () => {
    const runs = 2000;
    const strong = average(runs, () => simulateLiveMatch(side('home', 80), side('away', 20)).homeGoals);
    const weak = average(runs, () => simulateLiveMatch(side('home', 80), side('away', 20)).awayGoals);
    expect(strong).toBeGreaterThan(2);
    expect(strong).toBeGreaterThan(weak * 5);
  });

  it('attributes every goal to a player on the scoring XI, scorer != assister', () => {
    for (let i = 0; i < 300; i++) {
      const home = side('home', 60);
      const away = side('away', 40);
      const { events } = simulateLiveMatch(home, away);
      for (const ev of events.filter(e => e.type === 'goal')) {
        const players = (ev.side === 'home' ? home.xi : away.xi).map(e => e.player);
        expect(players).toContain(ev.player);
        if (ev.assist) {
          expect(players).toContain(ev.assist);
          expect(ev.assist).not.toBe(ev.player);
        }
      }
    }
  });
});
