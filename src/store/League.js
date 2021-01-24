const clubFactory = require('@/assets/js/ClubFactory.js');
const CFG = require('@/assets/js/Config.js');

export const leagueModule = {
  namspaced: true,

  state: {
    clubs: [],
  },

  mutations: {
    MAKE_LEAGUE(state) {
      for (let i = 0; i < CFG.CLUBS_PER_LEAGUE; i++) {
        state.clubs.push(clubFactory.makeClub());
      }
      state.clubs.sort((a,b) => b.formation.skillSum - a.formation.skillSum);
      for (let club of state.clubs) {
        console.log(`${club.name} ${club.formation.skillSum}`);
      }
    }
  },

  actions: {
    makeLeague({ commit }) {
      commit('MAKE_LEAGUE');
    }
  },

  modules: {}
}