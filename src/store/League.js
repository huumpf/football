import * as clubFactory from '@/assets/js/ClubFactory.js';
import * as CFG from '@/assets/js/Config.js';
import * as HLP from '@/assets/js/Helpers.js';

export const leagueModule = {
  state: {
    clubs: [],
  },

  mutations: {
    MAKE_LEAGUE(state, reservedNames) {
      const names = clubFactory.makeClubNames(CFG.CLUBS_PER_LEAGUE, reservedNames);
      state.clubs = [];
      for (let i = 0; i < CFG.CLUBS_PER_LEAGUE; i++) {
        state.clubs.push(clubFactory.makeClub(i, names[i]));
      }
    },

    // A club sells a player off the market: the player leaves the squad, the
    // fee arrives, and the club re-picks its strongest formation.
    SELL_PLAYER(state, { clubId, playerId, price }) {
      const club = state.clubs.find(c => c.id === clubId);
      club.players = club.players.filter(p => p.id !== playerId);
      club.money += price;
      club.formation = HLP.getRecommendedFormation(club.players);
    },
  },

  actions: {
    makeLeague({ commit, dispatch, rootState }) {
      commit('MAKE_LEAGUE', [rootState.club.name]);
      dispatch('seedListings');
    }
  },
}
