const PlayerFactory = require('@/assets/js/PlayerFactory.js');

export const draftModule = {
  namspaced: true,

  state: {
    activeDraftSet: [],
  },

  mutations: {
    MAKE_DRAFT_SET(state) {
      state.activeDraftSet = PlayerFactory.makeDraftSet();
    }
  },

  actions: {
    makeDraftSet({ commit }) {
      commit('MAKE_DRAFT_SET');
    }
  },

  modules: {}
}