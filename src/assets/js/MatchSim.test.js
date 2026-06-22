import { describe, it, expect } from 'vitest';
import { simulateLiveMatch } from './MatchSim.js';
import * as CFG from './Config.js';

// A minimal player: only the fields the live simulation reads (id + shot for
// the scorer pick, progression for the assist pick).
function makePlayer(id, shot = 50, progression = 50) {
  return { id, firstName: 'F', lastName: `P${id}`, skills: { goalkeeping: 10, defense: 40, progression, shot } };
}

function makeXI(prefix) {
  return Array.from({ length: 11 }, (_, i) => makePlayer(prefix * 100 + i));
}

function side(name, strength) {
  return { name, strength, xi: makeXI(name.length) };
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
    expect(total).toBeGreaterThan(2.5);
    expect(total).toBeLessThan(3.7);
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
      for (const ev of events) {
        const xi = ev.side === 'home' ? home.xi : away.xi;
        expect(xi).toContain(ev.scorer);
        if (ev.assist) {
          expect(xi).toContain(ev.assist);
          expect(ev.assist).not.toBe(ev.scorer);
        }
      }
    }
  });
});
