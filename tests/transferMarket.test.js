import { describe, it, expect } from 'vitest';
import { createStore } from 'vuex';
import { clubModule } from '../src/store/Club.js';
import { teamModule } from '../src/store/Team.js';
import { leagueModule } from '../src/store/League.js';
import { transferMarketModule } from '../src/store/TransferMarket.js';
import { marketValue } from '../src/assets/js/Helpers.js';
import * as CFG from '../src/assets/js/Config.js';

let nextId = 1;
function player(skill, positions) {
  return {
    id: nextId++,
    firstName: 'Test',
    lastName: `Player ${nextId}`,
    skill,
    potential: skill,
    age: 24,
    optimalAge: 28,
    positions,
    positionSort: 0,
    salary: 10000,
  };
}

// An AI club playing 4-4-2 with the given starters ({ pos: [players] }) and bench.
function aiClub(id, starters, bench) {
  return {
    id,
    name: `Club ${id}`,
    money: CFG.CLUB_STARTING_MONEY,
    players: [...Object.values(starters).flat(), ...bench],
    formation: {
      name: '4-4-2',
      positions: { gk: 1, cb: 2, lb: 1, rb: 1, cm: 2, lm: 1, rm: 1, st: 2 },
      players: starters,
    },
  };
}

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

// Bench fillers that are neither useless nor surplus in a 4-4-2 (worse than
// the starting CBs, so nothing blocks them twice over): they pad an AI squad
// above MIN_SQUAD_SIZE without showing up as listing candidates.
function fillers(count) {
  return Array.from({ length: count }, () => player(40, ['CB']));
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
  store.state.club.money = CFG.CLUB_STARTING_MONEY;
  store.state.team.players = [];
  store.state.league.clubs = [];
  store.state.transferMarket.listings = [];
  return store;
}

function teamOfSize(store, size) {
  for (let i = 0; i < size; i++) {
    store.commit('ADD_TO_TEAM', player(50, ['CM']));
  }
}

describe('refreshAiListings', () => {
  it('lists AI surplus players at their market value', () => {
    const store = makeStore();
    const misfit = player(70, ['LF', 'RF']); // no slot in a 4-4-2
    store.state.league.clubs = [aiClub(0, starters442(60), [misfit, ...fillers(5)])];

    store.dispatch('refreshAiListings');

    expect(store.state.transferMarket.listings).toEqual([
      { playerId: misfit.id, sellerClubId: 0, price: marketValue(misfit) },
    ]);
  });
});

describe('listPlayer / unlistPlayer', () => {
  it('lists own players down to the minimum squad size, then refuses', () => {
    const store = makeStore();
    teamOfSize(store, CFG.MIN_SQUAD_SIZE + 2);
    const [p1, p2, p3] = store.state.team.players;

    store.dispatch('listPlayer', p1);
    store.dispatch('listPlayer', p2);
    store.dispatch('listPlayer', p3); // would allow dropping below the minimum

    expect(store.state.transferMarket.listings.length).toBe(2);
    expect(store.getters.listedPlayerIds.has(p3.id)).toBe(false);
    expect(store.getters.canListPlayer).toBe(false);
  });

  it('ignores listing the same player twice', () => {
    const store = makeStore();
    teamOfSize(store, CFG.MIN_SQUAD_SIZE + 2);
    const p1 = store.state.team.players[0];

    store.dispatch('listPlayer', p1);
    store.dispatch('listPlayer', p1);

    expect(store.state.transferMarket.listings.length).toBe(1);
  });

  it('unlists a listed player', () => {
    const store = makeStore();
    teamOfSize(store, CFG.MIN_SQUAD_SIZE + 2);
    const p1 = store.state.team.players[0];

    store.dispatch('listPlayer', p1);
    store.dispatch('unlistPlayer', p1);

    expect(store.state.transferMarket.listings).toEqual([]);
  });
});

describe('buyPlayer', () => {
  function marketWithMisfit(store) {
    const misfit = player(70, ['LF', 'RF']);
    store.state.league.clubs = [aiClub(0, starters442(60), [misfit, ...fillers(5)])];
    store.dispatch('refreshAiListings');
    return { misfit, listing: store.state.transferMarket.listings[0] };
  }

  it('moves the player and the fee, and removes the listing', () => {
    const store = makeStore();
    const { misfit, listing } = marketWithMisfit(store);
    const club = store.state.league.clubs[0];

    store.dispatch('buyPlayer', listing);

    expect(store.state.club.money).toBe(CFG.CLUB_STARTING_MONEY - listing.price);
    expect(club.money).toBe(CFG.CLUB_STARTING_MONEY + listing.price);
    // Compare by id: Vuex wraps state in reactive proxies, so references differ.
    expect(store.state.team.players.map(p => p.id)).toContain(misfit.id);
    expect(club.players.map(p => p.id)).not.toContain(misfit.id);
    expect(club.formation.skillSum).toBeGreaterThan(0); // re-picked after the sale
    expect(store.state.transferMarket.listings).toEqual([]);
  });

  it('refuses when the money does not suffice', () => {
    const store = makeStore();
    const { misfit, listing } = marketWithMisfit(store);
    store.state.club.money = listing.price - 1;

    store.dispatch('buyPlayer', listing);

    expect(store.state.team.players.map(p => p.id)).not.toContain(misfit.id);
    expect(store.state.club.money).toBe(listing.price - 1);
    expect(store.state.transferMarket.listings.length).toBe(1);
  });

  it('refuses to buy an own listing', () => {
    const store = makeStore();
    teamOfSize(store, CFG.MIN_SQUAD_SIZE + 2);
    const p1 = store.state.team.players[0];
    store.dispatch('listPlayer', p1);
    const listing = store.state.transferMarket.listings[0];

    store.dispatch('buyPlayer', listing);

    expect(store.state.club.money).toBe(CFG.CLUB_STARTING_MONEY);
    expect(store.state.transferMarket.listings.length).toBe(1);
  });
});
