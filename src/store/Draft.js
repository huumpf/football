const PlayerFactory = require('@/assets/js/PlayerFactory.js');
const CFG = require('@/assets/js/Config.js');

export const draftModule = {
  namspaced: true,

  state: {
    activeDraftSet: [],
    draftAmount: CFG.DRAFT_COUNT,
  },

  mutations: {
    MAKE_DRAFT_SET(state) {
      state.activeDraftSet = PlayerFactory.makeDraftSet();
      console.log(state.activeDraftSet);
    }
  },

  actions: {
    makeDraftSet({ commit }) {
      commit('MAKE_DRAFT_SET');
    }
  },

  modules: {}
}