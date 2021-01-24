import { makeClub } from '@/assets/js/ClubFactory.js';
const CFG = require('@/assets/js/Config.js');

export const leagueModule = {
  namspaced: true,

  state: {
    clubs: [],
  },

  mutations: {
    MAKE_LEAGUE(state, numberOfClubs) {
      state.clubs.length = 0;
      for (let i = 0; i < numberOfClubs; i++) {
        state.clubs.push(makeClub());
      }
    }
  },

  actions: {
    makeLeague({ commit }) {
      commit('MAKE_LEAGUE', CFG.CLUBS_PER_LEAGUE);
    }
  },

  getters: {
    clubById: (state) => (id) => state.find(club => club.id === id),
    clubFormations: (state, getters) => (id) => {
      const club = getters.clubById(id);

      // calculate all of the formations
      return [];
    },
    clubFormationsSorted: (state, getters) => (id) => getters.clubFormations(id).sort((a, b) => a.skillSum - b.skillSum),
    clubPreferredFormation: (state, getters) => (id) => getters.clubFormationsSorted(id)[0],
  },
}
