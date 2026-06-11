import * as HLP from '@/assets/js/Helpers.js';
import * as CFG from '@/assets/js/Config.js';
import { selectListingCandidates } from '@/assets/js/ClubFactory.js';

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
  },

  actions: {
    // (Re)builds the AI side of the market; runs whenever the league is made.
    seedListings({ commit, rootState }) {
      const listings = [];
      for (const club of rootState.league.clubs) {
        for (const player of selectListingCandidates(club)) {
          listings.push({
            playerId: player.id,
            sellerClubId: club.id,
            price: HLP.marketValue(player),
          });
        }
      }
      commit('SET_LISTINGS', listings);
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
