import * as HLP from '@/assets/js/Helpers.js';
import * as CFG from '@/assets/js/Config.js';
import { selectListingCandidates, pickTransferBuy } from '@/assets/js/ClubFactory.js';

export const transferMarketModule = {
  state: {
    // { playerId, sellerClubId, price } — sellerClubId null = the own club.
    // A listing is only a marker; the player stays in the seller's squad
    // until somebody buys.
    listings: [],
  },

  getters: {
    listedPlayerIds(state) {
      return new Set(state.listings.map(l => l.playerId));
    },

    // Listings enriched for display: the player object and the seller's name.
    marketListings(state, getters, rootState) {
      return state.listings.map(listing => {
        const own = listing.sellerClubId === null;
        const club = own ? null : rootState.league.clubs.find(c => c.id === listing.sellerClubId);
        const players = own ? rootState.team.players : club.players;
        return {
          ...listing,
          own,
          clubName: own ? rootState.club.name : club.name,
          player: players.find(p => p.id === listing.playerId),
        };
      });
    },

    // Whether the own club may offer one more player: even if every offered
    // player sells, the squad must not drop below the minimum size.
    canListPlayer(state, getters, rootState) {
      const ownListings = state.listings.filter(l => l.sellerClubId === null).length;
      return rootState.team.players.length - ownListings - 1 >= CFG.MIN_SQUAD_SIZE;
    },
  },

  mutations: {
    SET_LISTINGS(state, listings) {
      state.listings = listings;
    },
    ADD_LISTING(state, listing) {
      state.listings.push(listing);
    },
    REMOVE_LISTING(state, playerId) {
      state.listings = state.listings.filter(l => l.playerId !== playerId);
    },
    // Drops every listing (own ones included) whose player is no longer in
    // any squad, e.g. after careers end at the season change.
    PRUNE_LISTINGS(state, activePlayerIds) {
      state.listings = state.listings.filter(l => activePlayerIds.has(l.playerId));
    },
  },

  actions: {
    // (Re)builds the AI side of the market; runs when the league is made and
    // again on every week tick. Own listings survive a refresh, and an AI
    // club only offers as many players as it could lose without dropping
    // below the minimum squad size.
    refreshAiListings({ commit, state, rootState }) {
      const listings = state.listings.filter(l => l.sellerClubId === null);
      for (const club of rootState.league.clubs) {
        const spare = Math.max(0, club.players.length - CFG.MIN_SQUAD_SIZE);
        for (const player of selectListingCandidates(club).slice(0, spare)) {
          listings.push({
            playerId: player.id,
            sellerClubId: club.id,
            price: HLP.marketValue(player),
          });
        }
      }
      commit('SET_LISTINGS', listings);
    },

    // Weekly AI buy round, dispatched from advanceWeek: every AI club may
    // sign at most one listed player (pickTransferBuy decides which, if any).
    // v1 conflict resolution: clubs act strictly one after another in reverse
    // table order (bottom club first), so two clubs never compete for the
    // same player and no randomness is involved — meant to be replaced by a
    // proper bidding/negotiation system later.
    runAiTransfers({ commit, state, rootState, rootGetters }) {
      const order = [...rootGetters.standings].reverse();
      for (const entry of order) {
        if (entry.own) continue;
        const club = rootState.league.clubs.find(c => c.id === entry.id);

        const offers = state.listings
          .filter(l => l.sellerClubId !== club.id)
          .map(l => ({
            ...l,
            player: l.sellerClubId === null
              ? rootState.team.players.find(p => p.id === l.playerId)
              : rootState.league.clubs
                  .find(c => c.id === l.sellerClubId)
                  .players.find(p => p.id === l.playerId),
          }));
        const buy = pickTransferBuy(club, offers);
        if (!buy) continue;

        if (buy.sellerClubId === null) {
          commit('REMOVE_FROM_TEAM', buy.playerId);
          commit('RECEIVE', buy.price);
        } else {
          commit('SELL_PLAYER', { clubId: buy.sellerClubId, playerId: buy.playerId, price: buy.price });
        }
        commit('BUY_PLAYER', { clubId: club.id, player: buy.player, price: buy.price });
        commit('REMOVE_LISTING', buy.playerId);
      }
    },

    listPlayer({ commit, getters }, player) {
      if (!getters.canListPlayer || getters.listedPlayerIds.has(player.id)) return;
      commit('ADD_LISTING', {
        playerId: player.id,
        sellerClubId: null,
        price: HLP.marketValue(player),
      });
    },

    unlistPlayer({ commit }, player) {
      commit('REMOVE_LISTING', player.id);
    },

    // Instant buy from an AI club: the fee swaps sides, the player switches
    // squads, the listing disappears.
    buyPlayer({ commit, state, rootState }, listing) {
      const current = state.listings.find(l => l.playerId === listing.playerId);
      if (!current || current.sellerClubId === null) return;
      if (rootState.club.money < current.price) return;

      const club = rootState.league.clubs.find(c => c.id === current.sellerClubId);
      const player = club.players.find(p => p.id === current.playerId);

      commit('PAY', current.price);
      commit('SELL_PLAYER', { clubId: club.id, playerId: player.id, price: current.price });
      commit('ADD_TO_TEAM', player);
      commit('REMOVE_LISTING', player.id);
    },
  },
}
