import { describe, it, expect } from 'vitest';
import { makeClub, makeClubName, makeClubNames, selectListingCandidates } from '../src/assets/js/ClubFactory.js';
import { cityNames } from '../src/assets/js/Names.js';
import * as CFG from '../src/assets/js/Config.js';

// Minimal player fixture matching the shape PlayerFactory produces.
let nextId = 1;
function player(skill, primary, secondary = []) {
  return {
    id: nextId++,
    skill,
    positions: { position: primary[0], primary, secondary },
  };
}

// A club playing 4-4-2 with the given starters ({ pos: [players] }) and bench.
function club442(starters, bench) {
  return {
    players: [...Object.values(starters).flat(), ...bench],
    formation: {
      name: '4-4-2',
      positions: { gk: 1, cb: 2, lb: 1, rb: 1, cm: 2, lm: 1, rm: 1, st: 2 },
      players: starters,
    },
  };
}

// Full 4-4-2 starting XI at the given skill.
function starters442(skill) {
  return {
    gk: [player(skill, ['GK'])],
    cb: [player(skill, ['CB']), player(skill, ['CB'])],
    lb: [player(skill, ['LB'])],
    rb: [player(skill, ['RB'])],
    cm: [player(skill, ['CM']), player(skill, ['CM'])],
    lm: [player(skill, ['LM'])],
    rm: [player(skill, ['RM'])],
    st: [player(skill, ['ST']), player(skill, ['ST'])],
  };
}

describe('makeClubName', () => {
  it('starts with a known city', () => {
    for (let i = 0; i < 50; i++) {
      const name = makeClubName();
      expect(cityNames.some(city => name === city || name.startsWith(city + ' '))).toBe(true);
    }
  });
});

describe('makeClubNames', () => {
  it('returns the requested number of names built on distinct cities', () => {
    const names = makeClubNames(CFG.CLUBS_PER_LEAGUE);
    expect(names.length).toBe(CFG.CLUBS_PER_LEAGUE);
    expect(new Set(names).size).toBe(names.length);
  });

  it('excludes cities already used by a reserved name', () => {
    const reservedCity = cityNames[0];
    const names = makeClubNames(CFG.CLUBS_PER_LEAGUE, [reservedCity + ' United']);
    for (const name of names) {
      expect(name.startsWith(reservedCity)).toBe(false);
    }
  });
});

describe('makeClub', () => {
  it('drafts a full squad and picks a formation', () => {
    const club = makeClub(0, 'Testville');
    expect(club.players.length).toBe(CFG.DRAFT_COUNT);
    expect(club.formation.skillSum).toBeGreaterThan(0);
    expect(club.name).toBe('Testville');
    expect(club.money).toBe(CFG.CLUB_STARTING_MONEY);
  });
});

describe('selectListingCandidates', () => {
  it('always offers a player who fits no formation slot at all', () => {
    const misfit = player(70, ['LF'], ['RF']); // 4-4-2 has no LF/RF slots
    const club = club442(starters442(60), [misfit]);
    for (let i = 0; i < 10; i++) {
      expect(selectListingCandidates(club)).toContain(misfit);
    }
  });

  it('offers nothing when every bench player is a needed backup', () => {
    const bench = [player(50, ['ST']), player(40, ['GK']), player(50, ['CB'])];
    const club = club442(starters442(60), bench);
    expect(selectListingCandidates(club)).toEqual([]);
  });

  it('offers a player buried behind starters and a better backup', () => {
    const backup = player(70, ['CB']); // behind the starters only: kept
    const buried = player(60, ['CB']); // behind starters and the backup: surplus
    const club = club442(starters442(80), [backup, buried]);
    expect(selectListingCandidates(club)).toEqual([buried]);
  });

  it('caps the offers at AI_LISTINGS_MAX', () => {
    const misfits = [];
    for (let i = 0; i < CFG.AI_LISTINGS_MAX + 2; i++) misfits.push(player(50, ['LF']));
    const club = club442(starters442(60), misfits);
    const offered = selectListingCandidates(club);
    expect(offered.length).toBe(CFG.AI_LISTINGS_MAX);
    for (const p of offered) expect(misfits).toContain(p);
  });
});
