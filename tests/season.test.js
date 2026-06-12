import { describe, it, expect } from 'vitest';
import { createStore } from 'vuex';
import { clubModule } from '../src/store/Club.js';
import { teamModule } from '../src/store/Team.js';
import { leagueModule } from '../src/store/League.js';
import { transferMarketModule } from '../src/store/TransferMarket.js';
import * as CFG from '../src/assets/js/Config.js';

// A minimal AI club: playMatchday and the standings only need an id, a name
// and the formation's total skill.
function stubClub(id, skill) {
  return {
    id,
    name: `Club ${id}`,
    players: [],
    money: 0,
    formation: { skillSum: skill, positions: {}, players: {} },
  };
}

// The module state objects are shared module-level singletons, so every test
// builds a store and resets the state it touches.
function makeStore() {
  const store = createStore({
    modules: {
      club: clubModule,
      team: teamModule,
      league: leagueModule,
      transferMarket: transferMarketModule,
    },
  });
  store.state.club.season = 1;
  store.state.club.week = 1;
  store.state.team.players = [];
  store.state.transferMarket.listings = [];
  store.state.league.clubs = Array.from(
    { length: CFG.CLUBS_PER_LEAGUE },
    (_, i) => stubClub(i, 500 + i)
  );
  store.commit('MAKE_SCHEDULE');
  return store;
}

describe('advanceWeek', () => {
  it('moves time forward without playing in a match-free week', () => {
    const store = makeStore();

    store.dispatch('advanceWeek');

    expect(store.state.club.week).toBe(2);
    expect(store.state.club.season).toBe(1);
    expect(store.state.league.results.length).toBe(0);
  });

  it('plays the matchday when leaving a match week', () => {
    const store = makeStore();
    store.state.club.week = CFG.FIRST_HALF_START_WEEK;

    store.dispatch('advanceWeek');

    expect(store.state.club.week).toBe(CFG.FIRST_HALF_START_WEEK + 1);
    const results = store.state.league.results[0];
    expect(results.length).toBe(9);
    for (const match of results) {
      expect(Number.isInteger(match.homeGoals)).toBe(true);
      expect(Number.isInteger(match.awayGoals)).toBe(true);
    }
    for (const entry of store.getters.standings) {
      expect(entry.played).toBe(1);
    }
  });

  it('skips the matchday when no schedule exists yet', () => {
    const store = makeStore();
    store.state.league.fixtures = [];
    store.state.club.week = CFG.FIRST_HALF_START_WEEK;

    store.dispatch('advanceWeek');

    expect(store.state.club.week).toBe(CFG.FIRST_HALF_START_WEEK + 1);
    expect(store.state.league.results.length).toBe(0);
  });

  it('does not replay an already played matchday', () => {
    const store = makeStore();
    store.state.club.week = CFG.FIRST_HALF_START_WEEK;

    store.dispatch('playMatchday');
    const results = store.state.league.results[0];
    store.dispatch('playMatchday');

    expect(store.state.league.results[0]).toBe(results);
  });

  it('starts a new season with a fresh schedule after week 52', () => {
    const store = makeStore();
    store.state.club.week = CFG.SEASON_WEEKS;
    store.commit('RECORD_MATCHDAY', {
      matchday: 0,
      results: [{ home: 0, away: 1, homeGoals: 1, awayGoals: 0 }],
    });

    store.dispatch('advanceWeek');

    expect(store.state.club.season).toBe(2);
    expect(store.state.club.week).toBe(1);
    expect(store.state.league.results.length).toBe(0);
    expect(store.state.league.fixtures.length).toBe(2 * CFG.MATCHDAYS_PER_HALF);
  });
});

describe('standings', () => {
  it('aggregates points and goals from the results', () => {
    const store = makeStore();
    store.commit('RECORD_MATCHDAY', {
      matchday: 0,
      results: [
        { home: 0, away: 1, homeGoals: 2, awayGoals: 1 },
        { home: 2, away: 3, homeGoals: 1, awayGoals: 1 },
      ],
    });

    const standings = store.getters.standings;
    const entry = id => standings.find(e => e.id === id);

    expect(entry(0)).toMatchObject({
      played: 1, won: 1, drawn: 0, lost: 0,
      goalsFor: 2, goalsAgainst: 1, points: 3,
    });
    expect(entry(1)).toMatchObject({ played: 1, lost: 1, points: 0 });
    expect(entry(2)).toMatchObject({ played: 1, drawn: 1, points: 1 });

    // The winner leads the table despite having the lowest team skill.
    expect(standings[0].id).toBe(0);
  });

  it('orders clubs without results by team strength', () => {
    const store = makeStore();

    const standings = store.getters.standings;

    // Stub skills rise with the id, so the strongest AI club (id 16) leads
    // and the player's empty team (skill 0) comes last.
    expect(standings[0].id).toBe(16);
    expect(standings[standings.length - 1].own).toBe(true);
  });
});
