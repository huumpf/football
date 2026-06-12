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

// An AI club playing 4-4-2 with the given starters ({ pos: [players] }) and
// bench. skillSum places the club in the standings before any match is played
// (higher = better table spot).
function aiClub(id, starters, bench, skillSum = 0) {
  return {
    id,
    name: `Club ${id}`,
    money: CFG.CLUB_STARTING_MONEY,
    players: [...Object.values(starters).flat(), ...bench],
    formation: {
      name: '4-4-2',
      positions: { gk: 1, cb: 2, lb: 1, rb: 1, cm: 2, lm: 1, rm: 1, st: 2 },
      players: starters,
      skillSum,
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

function listingFor(player, sellerClubId) {
  return { playerId: player.id, sellerClubId, price: marketValue(player) };
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
  store.state.club.season = 1;
  store.state.club.week = 1;
  store.state.team.players = [];
  store.state.league.clubs = [];
  store.state.league.results = [];
  store.state.transferMarket.listings = [];
  return store;
}

describe('runAiTransfers', () => {
  it('signs an affordable player who clearly improves the team', () => {
    const store = makeStore();
    const target = player(70, ['ST']);
    store.state.league.clubs = [
      aiClub(0, starters442(60), [target, ...fillers(5)], 700),
      aiClub(1, starters442(50), fillers(6), 500),
    ];
    store.state.transferMarket.listings = [listingFor(target, 0)];
    const price = marketValue(target);

    store.dispatch('runAiTransfers');

    const [seller, buyer] = store.state.league.clubs;
    expect(buyer.players.map(p => p.id)).toContain(target.id);
    expect(seller.players.map(p => p.id)).not.toContain(target.id);
    expect(buyer.money).toBe(CFG.CLUB_STARTING_MONEY - price);
    expect(seller.money).toBe(CFG.CLUB_STARTING_MONEY + price);
    // Both clubs re-picked their formation after the transfer.
    expect(buyer.formation.skillSum).toBeGreaterThan(0);
    expect(seller.formation.skillSum).toBeGreaterThan(0);
    expect(store.state.transferMarket.listings).toEqual([]);
  });

  it('rejects a player the club cannot afford', () => {
    const store = makeStore();
    const target = player(70, ['ST']);
    store.state.league.clubs = [
      aiClub(0, starters442(60), [target, ...fillers(5)], 700),
      aiClub(1, starters442(50), fillers(6), 500),
    ];
    store.state.transferMarket.listings = [listingFor(target, 0)];
    store.state.league.clubs[1].money = marketValue(target) - 1;

    store.dispatch('runAiTransfers');

    const [seller, buyer] = store.state.league.clubs;
    expect(buyer.players.map(p => p.id)).not.toContain(target.id);
    expect(buyer.money).toBe(marketValue(target) - 1);
    expect(seller.money).toBe(CFG.CLUB_STARTING_MONEY);
    expect(store.state.transferMarket.listings.length).toBe(1);
  });

  it('rejects a player who would not noticeably improve the team', () => {
    const store = makeStore();
    // Just below the improvement threshold over the buyer's 50-skill strikers.
    const target = player(50 + CFG.AI_BUY_MIN_IMPROVEMENT - 1, ['ST']);
    store.state.league.clubs = [
      aiClub(0, starters442(60), [target, ...fillers(5)], 700),
      aiClub(1, starters442(50), fillers(6), 500),
    ];
    store.state.transferMarket.listings = [listingFor(target, 0)];

    store.dispatch('runAiTransfers');

    const buyer = store.state.league.clubs[1];
    expect(buyer.players.map(p => p.id)).not.toContain(target.id);
    expect(buyer.money).toBe(CFG.CLUB_STARTING_MONEY);
    expect(store.state.transferMarket.listings.length).toBe(1);
  });

  it('lets the worse-placed club sign a contested player', () => {
    const store = makeStore();
    const target = player(70, ['ST']);
    store.state.league.clubs = [
      aiClub(0, starters442(60), [target, ...fillers(5)], 700),
      aiClub(1, starters442(50), fillers(6), 600), // better table spot
      aiClub(2, starters442(50), fillers(6), 500), // worse table spot
    ];
    store.state.transferMarket.listings = [listingFor(target, 0)];

    store.dispatch('runAiTransfers');

    const [, better, worse] = store.state.league.clubs;
    expect(worse.players.map(p => p.id)).toContain(target.id);
    expect(better.players.map(p => p.id)).not.toContain(target.id);
    expect(better.money).toBe(CFG.CLUB_STARTING_MONEY);
    expect(worse.money).toBe(CFG.CLUB_STARTING_MONEY - marketValue(target));
  });

  it('pays the fee to the own club when the AI signs its listed player', () => {
    const store = makeStore();
    for (let i = 0; i < CFG.MIN_SQUAD_SIZE; i++) {
      store.commit('ADD_TO_TEAM', player(50, ['CM']));
    }
    const target = player(70, ['ST']);
    store.commit('ADD_TO_TEAM', target);
    store.dispatch('listPlayer', target);
    store.state.league.clubs = [aiClub(0, starters442(50), fillers(6), 500)];
    const price = marketValue(target);

    store.dispatch('runAiTransfers');

    const buyer = store.state.league.clubs[0];
    expect(store.state.team.players.map(p => p.id)).not.toContain(target.id);
    expect(store.state.club.money).toBe(CFG.CLUB_STARTING_MONEY + price);
    expect(buyer.players.map(p => p.id)).toContain(target.id);
    expect(buyer.money).toBe(CFG.CLUB_STARTING_MONEY - price);
    expect(store.state.transferMarket.listings).toEqual([]);
  });
});

describe('refreshAiListings', () => {
  it('lists nobody for a club already at the minimum squad size', () => {
    const store = makeStore();
    const misfit = player(70, ['LF', 'RF']); // no slot in a 4-4-2
    store.state.league.clubs = [
      aiClub(0, starters442(60), [misfit, ...fillers(CFG.MIN_SQUAD_SIZE - 12)]),
    ];

    store.dispatch('refreshAiListings');

    expect(store.state.transferMarket.listings).toEqual([]);
  });

  it('keeps the own club listings across a refresh', () => {
    const store = makeStore();
    for (let i = 0; i < CFG.MIN_SQUAD_SIZE + 1; i++) {
      store.commit('ADD_TO_TEAM', player(50, ['CM']));
    }
    const own = store.state.team.players[0];
    store.dispatch('listPlayer', own);

    store.dispatch('refreshAiListings');

    expect(store.state.transferMarket.listings).toEqual([
      { playerId: own.id, sellerClubId: null, price: marketValue(own) },
    ]);
  });
});

describe('advanceWeek', () => {
  it('runs the weekly transfer round on the week tick', () => {
    const store = makeStore();
    const misfit = player(70, ['LF']); // always offered by the refresh
    store.state.league.clubs = [
      aiClub(0, starters442(60), [misfit, ...fillers(5)], 700),
      aiClub(1, starters442(50), fillers(6), 500),
    ];

    store.dispatch('advanceWeek');

    const [seller, buyer] = store.state.league.clubs;
    expect(store.state.club.week).toBe(2);
    expect(buyer.players.map(p => p.id)).toContain(misfit.id);
    expect(seller.money).toBe(CFG.CLUB_STARTING_MONEY + marketValue(misfit));
  });
});
