import * as clubFactory from '@/assets/js/ClubFactory.js';
import * as CFG from '@/assets/js/Config.js';

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
    }
  },

  actions: {
    makeLeague({ commit, rootState }) {
      commit('MAKE_LEAGUE', [rootState.club.name]);
    }
  },

  modules: {}
}
