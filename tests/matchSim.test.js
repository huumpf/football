import { describe, it, expect } from 'vitest';
import { simulateMatch, simulateLiveMatch, computeRatings, simulateInstant } from '../src/assets/js/MatchSim.js';
import * as CFG from '../src/assets/js/Config.js';

let nextId = 1;
const PROFILE = {
  GK: s => ({ goalkeeping: s, defense: 0, progression: 0, shot: 0 }),
  DEF: s => ({ goalkeeping: 0, defense: Math.round(s * 0.75), progression: Math.round(s * 0.25), shot: 0 }),
  MID: s => ({ goalkeeping: 0, defense: Math.round(s * 0.25), progression: Math.round(s * 0.5), shot: Math.round(s * 0.25) }),
  ATT: s => ({ goalkeeping: 0, defense: 0, progression: Math.round(s * 0.3), shot: Math.round(s * 0.7) }),
};
function entry(position, skill) {
  return { player: { id: nextId++, lastName: `P${nextId}`, skills: PROFILE[CFG.POSITION_ROLE[position]](skill) }, position };
}
// A 4-3-3 at base skill; `overrides` sets a specific slot's skill (e.g. {ST: 90}).
function side(strength, skill = 50, overrides = {}) {
  const xi = ['GK', 'CB', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'ST', 'LF', 'RF']
    .map(pos => entry(pos, overrides[pos] ?? skill));
  return { strength, xi };
}
const find = (s, pos) => s.xi.find(e => e.position === pos).player.id;

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

describe('computeRatings', () => {
  it('keeps every starter in [1, 10]', () => {
    for (let i = 0; i < 200; i++) {
      const home = side(60, 55), away = side(40, 50, { CB: 30 });
      const tl = simulateLiveMatch(home, away);
      const ratings = computeRatings(tl, home, away);
      const all = [...home.xi, ...away.xi];
      expect(Object.keys(ratings).length).toBe(all.length);
      for (const e of all) {
        expect(ratings[e.player.id]).toBeGreaterThanOrEqual(1);
        expect(ratings[e.player.id]).toBeLessThanOrEqual(10);
      }
    }
  });

  it('lets the keeper and defenders earn high ratings in a winning clean sheet', () => {
    const runs = 400;
    let gkSum = 0, cbSum = 0, gkMax = 0, cbMax = 0;
    for (let i = 0; i < runs; i++) {
      const home = side(72, 70), away = side(30, 35);
      const tl = simulateLiveMatch(home, away);
      const r = computeRatings(tl, home, away);
      const gk = r[find(home, 'GK')], cb = r[find(home, 'CB')];
      gkSum += gk; cbSum += cb;
      gkMax = Math.max(gkMax, gk); cbMax = Math.max(cbMax, cb);
    }
    // The dominant side's keeper and defenders sit clearly above the base...
    expect(gkSum / runs).toBeGreaterThan(6);
    expect(cbSum / runs).toBeGreaterThan(6);
    // ...and can reach genuinely good marks, not just the old flat 6.0.
    expect(gkMax).toBeGreaterThanOrEqual(8);
    expect(cbMax).toBeGreaterThanOrEqual(7.5);
  });

  it('folds the finished match identically at full time and at +infinity', () => {
    for (let i = 0; i < 50; i++) {
      const home = side(55), away = side(50);
      const tl = simulateLiveMatch(home, away);
      expect(computeRatings(tl, home, away, tl.totalMinutes))
        .toEqual(computeRatings(tl, home, away, Infinity));
    }
  });

  it('penalises cards: yellow drops the rating, red drops it further', () => {
    const home = side(50), away = side(50);
    const [clean, booked, sentOff] = home.xi;
    const tl = { totalMinutes: 90, homeGoals: 0, awayGoals: 0, contribs: [], events: [
      { minute: 20, type: 'yellow', side: 'home', player: booked.player },
      { minute: 30, type: 'red', side: 'home', player: sentOff.player },
    ] };
    const r = computeRatings(tl, home, away);
    expect(r[booked.player.id]).toBeLessThan(r[clean.player.id]);
    expect(r[sentOff.player.id]).toBeLessThan(r[booked.player.id]);
  });
});

describe('the duel matchup', () => {
  it('rewards a strong striker against a weak centre-back (more goals, higher rating)', () => {
    const runs = 800;
    const measure = (homeOverrides, awayOverrides) => {
      let goals = 0, stRating = 0;
      for (let i = 0; i < runs; i++) {
        const home = side(55, 55, homeOverrides), away = side(55, 55, awayOverrides);
        const tl = simulateLiveMatch(home, away);
        goals += tl.homeGoals;
        stRating += computeRatings(tl, home, away)[find(home, 'ST')];
      }
      return { goals: goals / runs, stRating: stRating / runs };
    };
    const strong = measure({ ST: 90 }, { CB: 30 }); // great ST vs poor CB
    const mirror = measure({ ST: 30 }, { CB: 90 }); // poor ST vs great CB
    expect(strong.goals).toBeGreaterThan(mirror.goals + 0.5);
    expect(strong.stRating).toBeGreaterThan(mirror.stRating + 0.5);
  });
});

describe('cards in the live engine', () => {
  it('produces yellows and reds, and a sent-off player earns nothing afterwards', () => {
    let yellows = 0, reds = 0;
    for (let i = 0; i < 600; i++) {
      const home = side(55), away = side(55);
      const tl = simulateLiveMatch(home, away);
      for (const ev of tl.events) {
        if (ev.type === 'yellow') yellows++;
        if (ev.type === 'red') {
          reds++;
          // No contribution for this player after the red — they left the pitch.
          const after = tl.contribs.filter(c => c.playerId === ev.player.id && c.minute > ev.minute);
          expect(after).toHaveLength(0);
        }
      }
    }
    expect(yellows).toBeGreaterThan(0);
    expect(reds).toBeGreaterThan(0);
  });

  it('hands a real disadvantage to a team reduced by an early red card', () => {
    const runs = 8000;
    let redFor = 0, redGF = 0, redGA = 0;
    let okN = 0, okGF = 0, okGA = 0;
    for (let i = 0; i < runs; i++) {
      const home = side(50), away = side(50);
      const tl = simulateLiveMatch(home, away);
      const homeRedEarly = tl.events.some(e => e.type === 'red' && e.side === 'home' && e.minute <= 45);
      const homeRedAny = tl.events.some(e => e.type === 'red' && e.side === 'home');
      if (homeRedEarly) { redFor += tl.homeGoals; redGA += tl.awayGoals; redGF++; }
      else if (!homeRedAny) { okGF += tl.homeGoals; okGA += tl.awayGoals; okN++; }
    }
    // After an early red the team scores fewer and concedes more than a side
    // that played the match with eleven.
    expect(redFor / redGF).toBeLessThan(okGF / okN);
    expect(redGA / redGF).toBeGreaterThan(okGA / okN);
  });
});

describe('simulateInstant', () => {
  it('returns a score with ratings for every player', () => {
    const home = side(55), away = side(50);
    const { homeGoals, awayGoals, ratings } = simulateInstant(home, away);
    expect(Number.isInteger(homeGoals)).toBe(true);
    expect(Number.isInteger(awayGoals)).toBe(true);
    expect(Object.keys(ratings)).toHaveLength(home.xi.length + away.xi.length);
  });
});
