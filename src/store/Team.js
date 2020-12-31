export const teamModule = {
  namspaced: true,

  state: {
    players: [],
  },

  mutations: {
    ADD_TO_TEAM(state, player) {
      state.players.push(player);
    }
  },

  actions: {
    addPlayerToTeam({ commit }, player) {
      commit('ADD_TO_TEAM', player);
    }
  },

  modules: {
    
  }
  
}