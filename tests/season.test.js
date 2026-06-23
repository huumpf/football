import { describe, it, expect } from 'vitest';
import { createStore } from 'vuex';
import { clubModule } from '../src/store/Club.js';
import { teamModule } from '../src/store/Team.js';
import { leagueModule } from '../src/store/League.js';
import { transferMarketModule } from '../src/store/TransferMarket.js';
import * as CFG from '../src/assets/js/Config.js';
import * as HLP from '../src/assets/js/Helpers.js';

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

// A minimal player for the aging tests: skill derived from the development
// curve like PlayerFactory does, with a stat profile summing to the skill.
function stubPlayer(id, age, { potential = 60, optimalAge = 28 } = {}) {
  const skill = Math.floor(potential * Math.pow(CFG.AGE_FACTOR, Math.abs(age - optimalAge)));
  return {
    id,
    firstName: 'Test',
    lastName: `Player ${id}`,
    age,
    potential,
    optimalAge,
    greed: 1,
    skill,
    positions: { position: 'CB', sort: 1, primary: ['CB'], secondary: [] },
    skills: { goalkeeping: 0, defense: skill - 20, progression: 20, shot: 0 },
    salary: 0,
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

describe('staggered aging & retirement', () => {
  it('ages a player only on his birthday week, leaving others untouched', () => {
    const store = makeStore();
    const own = stubPlayer(100, 25); own.birthWeek = 3;
    const notYet = stubPlayer(101, 25); notYet.birthWeek = 4;
    const ai = stubPlayer(102, 30); ai.birthWeek = 3;
    store.state.team.players = [own, notYet];
    store.state.league.clubs[0].players = [ai];
    store.state.club.week = 3;

    store.dispatch('advanceWeek'); // completes week 3

    expect(own.age).toBe(26);
    expect(ai.age).toBe(31);
    expect(notYet.age).toBe(25); // his birthday is week 4
  });

  it('keeps an over-age player through the season, then retires him at the rollover', () => {
    const store = makeStore();
    const retiringOwn = stubPlayer(100, CFG.PLAYER_AGE_MAX); retiringOwn.birthWeek = 5;
    const stayingOwn = stubPlayer(101, 28); stayingOwn.birthWeek = 5;
    store.state.team.players = [retiringOwn, stayingOwn];
    const club = store.state.league.clubs[0];
    const retiringAi = stubPlayer(102, CFG.PLAYER_AGE_MAX); retiringAi.birthWeek = 5;
    const stayingAi = stubPlayer(103, 22); stayingAi.birthWeek = 5;
    club.players = [retiringAi, stayingAi];
    store.state.transferMarket.listings = [
      { playerId: retiringOwn.id, sellerClubId: null, price: HLP.marketValue(retiringOwn) },
    ];

    // Birthday in week 5: he turns 35 but plays on — no mid-season retirement.
    store.state.club.week = 5;
    store.dispatch('advanceWeek');
    expect(retiringOwn.age).toBe(CFG.PLAYER_AGE_MAX + 1);
    expect(store.state.team.players.map(p => p.id)).toContain(100);
    expect(club.players.map(p => p.id)).toContain(102);

    // Season rollover: now the over-age players retire and their listings drop.
    store.state.club.week = CFG.SEASON_WEEKS;
    store.dispatch('advanceWeek');
    expect(store.state.team.players.map(p => p.id)).toEqual([stayingOwn.id]);
    expect(club.players.map(p => p.id)).toEqual([stayingAi.id]);
    expect(store.state.transferMarket.listings
      .some(l => l.playerId === retiringOwn.id)).toBe(false);
  });
});

describe('season ratings', () => {
  it('folds a matchday\'s ratings into each player\'s season log', () => {
    const store = makeStore();
    const own = stubPlayer(100, 25);
    const ai = stubPlayer(101, 27);
    store.state.team.players = [own];
    store.state.league.clubs[0].players = [ai];

    store.commit('APPLY_RATINGS', { ratings: { 100: 7.0, 101: 6.0 } });
    expect(own.season).toEqual({ games: 1, ratingSum: 7.0 });
    expect(ai.season).toEqual({ games: 1, ratingSum: 6.0 });

    store.commit('APPLY_RATINGS', { ratings: { 100: 8.0 } });
    expect(own.season).toEqual({ games: 2, ratingSum: 15.0 });
    expect(HLP.seasonAvgRating(own)).toBeCloseTo(7.5);
    // A player who didn't feature this round keeps last round's log.
    expect(ai.season).toEqual({ games: 1, ratingSum: 6.0 });
  });

  it('carries the watched match ratings through playPlayerMatchday', () => {
    const store = makeStore();
    const own = stubPlayer(100, 25);
    const opp = stubPlayer(200, 26);
    store.state.team.players = [own];
    store.state.league.clubs[0].players = [opp];
    store.state.club.week = CFG.FIRST_HALF_START_WEEK;

    store.dispatch('playPlayerMatchday', {
      homeGoals: 2, awayGoals: 1, ratings: { 100: 7.5, 200: 5.5 },
    });

    expect(own.season).toEqual({ games: 1, ratingSum: 7.5 });
    expect(opp.season).toEqual({ games: 1, ratingSum: 5.5 });
    expect(store.state.league.results[0].length).toBe(9);
  });

  it('resets every season log at the season change', () => {
    const store = makeStore();
    const own = stubPlayer(100, 25);
    const ai = stubPlayer(101, 27);
    own.season = { games: 3, ratingSum: 21 };
    ai.season = { games: 2, ratingSum: 13 };
    store.state.team.players = [own];
    store.state.league.clubs[0].players = [ai];
    store.state.club.week = CFG.SEASON_WEEKS;

    store.dispatch('advanceWeek');

    expect(own.season).toEqual({ games: 0, ratingSum: 0 });
    expect(ai.season).toEqual({ games: 0, ratingSum: 0 });
  });
});

describe('squad skill-change tracking', () => {
  it('captures joinSkill and a fresh log when a player joins the club', () => {
    const store = makeStore();
    const p = stubPlayer(200, 24);
    p.joinSkill = 5; p.skillLog = [1, 2, 3]; // stale values, should be reset on join

    store.dispatch('addPlayerToTeam', p);

    expect(p.joinSkill).toBe(p.skill);
    expect(p.skillLog).toEqual([]);
  });

  it('logs one weekly skill per DEVELOP_WEEK and caps the history', () => {
    const store = makeStore();
    const p = stubPlayer(201, 24);
    store.state.team.players = [p];

    for (let i = 0; i < CFG.DEV_HISTORY_WEEKS + 5; i++) store.commit('DEVELOP_WEEK', { ratings: {} });

    expect(p.skillLog.length).toBe(CFG.DEV_HISTORY_WEEKS);
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
