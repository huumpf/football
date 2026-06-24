import { describe, it, expect } from 'vitest';
import { simulateLiveMatch, computeRatings } from '../src/assets/js/MatchSim.js';
import * as CFG from '../src/assets/js/Config.js';

let nextId = 1;
const PROFILE = {
  GK: s => ({ goalkeeping: s, defense: 0, progression: 0, shot: 0 }),
  DEF: s => ({ goalkeeping: 0, defense: Math.round(s * 0.75), progression: Math.round(s * 0.25), shot: 0 }),
  MID: s => ({ goalkeeping: 0, defense: Math.round(s * 0.25), progression: Math.round(s * 0.5), shot: Math.round(s * 0.25) }),
  ATT: s => ({ goalkeeping: 0, defense: 0, progression: Math.round(s * 0.3), shot: Math.round(s * 0.7) }),
};
const XI_POS = ['GK', 'CB', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'ST', 'LF', 'RF'];
const BENCH_POS = ['GK', 'CB', 'LB', 'CM', 'CM', 'RM', 'ST', 'ST', 'CB'];

function entry(pos, skill, fitness, proneness) {
  return {
    player: {
      id: nextId++, lastName: `P${nextId}`, skill, fitness, stamina: 100, injuryProneness: proneness,
      positions: { position: pos, primary: [pos], secondary: [], sort: 0 },
      skills: PROFILE[CFG.POSITION_ROLE[pos]](skill),
    },
    position: pos,
  };
}

// A fielded side with a 9-player bench. `proneness` 0 isolates voluntary subs.
function side(fitness = 62, proneness = 0) {
  return {
    strength: 55 * 11,
    xi: XI_POS.map(p => entry(p, 55, fitness, proneness)),
    bench: BENCH_POS.map(p => entry(p, 55, fitness, proneness)),
  };
}

// Group a timeline's sub events by side.
function subsBySide(tl) {
  const out = { home: [], away: [] };
  for (const ev of tl.events) if (ev.type === 'sub') out[ev.side].push(ev);
  return out;
}

describe('substitutions in the live engine', () => {
  it('never makes a voluntary substitution in the first half', () => {
    for (let i = 0; i < 600; i++) {
      const tl = simulateLiveMatch(side(), side());
      for (const ev of tl.events) {
        if (ev.type === 'sub' && !ev.forced) expect(ev.minute).toBeGreaterThan(CFG.SUB_FIRST_HALF_CUTOFF);
      }
    }
  });

  it('respects the 5-player and 3-window caps and the 5-minute cooldown per side', () => {
    for (let i = 0; i < 800; i++) {
      const tl = simulateLiveMatch(side(), side());
      const grouped = subsBySide(tl);
      for (const sideKey of ['home', 'away']) {
        const evs = grouped[sideKey];
        expect(evs.length).toBeLessThanOrEqual(CFG.SUB_MAX_PLAYERS);
        const windows = [...new Set(evs.map(e => e.minute))].sort((a, b) => a - b);
        expect(windows.length).toBeLessThanOrEqual(CFG.SUB_MAX_WINDOWS);
        for (let w = 1; w < windows.length; w++) {
          expect(windows[w] - windows[w - 1]).toBeGreaterThanOrEqual(CFG.SUB_MIN_GAP);
        }
      }
    }
  });

  it('never voluntarily substitutes the goalkeeper, and subs on a bench player', () => {
    let voluntary = 0;
    for (let i = 0; i < 800; i++) {
      const home = side();
      const away = side();
      const benchIds = new Set([...home.bench, ...away.bench].map(b => b.player.id));
      const tl = simulateLiveMatch(home, away);
      for (const ev of tl.events) {
        if (ev.type !== 'sub' || ev.forced) continue;
        voluntary++;
        expect(ev.position).not.toBe('GK');
        expect(benchIds.has(ev.playerIn.id)).toBe(true); // came off the bench
      }
    }
    expect(voluntary).toBeGreaterThan(0);
  });

  it('averages roughly 2-3 voluntary subs per side, with real variance', () => {
    let total = 0;
    const seen = new Set();
    const runs = 2000;
    for (let i = 0; i < runs; i++) {
      const grouped = subsBySide(simulateLiveMatch(side(), side()));
      for (const k of ['home', 'away']) {
        total += grouped[k].length;
        seen.add(grouped[k].length);
      }
    }
    const perSide = total / (2 * runs);
    expect(perSide).toBeGreaterThan(1.8);
    expect(perSide).toBeLessThan(3.2);
    expect(seen.has(0)).toBe(true); // some matches see no subs
    expect([...seen].some(n => n >= 4)).toBe(true); // and some see many
  });

  it('forces a substitution when a player is injured, replacing him from the bench', () => {
    let forced = 0;
    for (let i = 0; i < 500; i++) {
      const home = side(20, 1); // highly prone, low fitness -> injuries
      const away = side(20, 1);
      const benchIds = new Set([...home.bench, ...away.bench].map(b => b.player.id));
      const tl = simulateLiveMatch(home, away);
      for (const ev of tl.events) {
        if (ev.type === 'sub' && ev.forced) {
          forced++;
          expect(benchIds.has(ev.playerIn.id)).toBe(true);
        }
      }
    }
    expect(forced).toBeGreaterThan(0);
  });
});

describe('computeRatings with substitutes', () => {
  function plainSide() {
    return { strength: 55 * 11, xi: XI_POS.map(p => entry(p, 55, 100, 0)), bench: [] };
  }

  it('rates a substitute who came on but not an unused bench player', () => {
    const home = plainSide();
    const away = plainSide();
    const offPlayer = home.xi[10].player; // an RF
    const onPlayer = { id: 999001, lastName: 'SubOn', skills: PROFILE.ATT(55) };
    const benchOnly = { id: 999002, lastName: 'BenchOnly', skills: PROFILE.ATT(55) };
    const tl = {
      totalMinutes: 90, homeGoals: 0, awayGoals: 0,
      contribs: [{ minute: 75, playerId: 999001, kind: 'shot' }],
      events: [{ minute: 70, type: 'sub', side: 'home', player: offPlayer, playerIn: onPlayer, position: 'RF', forced: false }],
    };
    const r = computeRatings(tl, home, away);
    expect(r[999001]).toBeGreaterThanOrEqual(1);   // subbed-on player is rated
    expect(r[offPlayer.id]).toBeGreaterThanOrEqual(1); // subbed-off starter keeps a rating
    expect(r[999002]).toBeUndefined();             // a never-used bench player is not rated
  });

  it('does not rate a substitute before his entry minute (live reveal)', () => {
    const home = plainSide();
    const away = plainSide();
    const onPlayer = { id: 999003, lastName: 'LateSub', skills: PROFILE.ATT(55) };
    const tl = {
      totalMinutes: 90, homeGoals: 0, awayGoals: 0, contribs: [],
      events: [{ minute: 70, type: 'sub', side: 'home', player: home.xi[9].player, playerIn: onPlayer, position: 'LF', forced: false }],
    };
    expect(computeRatings(tl, home, away, 50)[999003]).toBeUndefined(); // not on yet at minute 50
    expect(computeRatings(tl, home, away, 80)[999003]).toBeGreaterThanOrEqual(1); // on by minute 80
  });
});
