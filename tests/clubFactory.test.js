import { describe, it, expect } from 'vitest';
import { makeClub, makeClubName, makeClubNames } from '../src/assets/js/ClubFactory.js';
import { cityNames } from '../src/assets/js/Names.js';
import * as CFG from '../src/assets/js/Config.js';

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
  });
});
