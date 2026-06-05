import * as PlayerFactory from '@/assets/js/PlayerFactory.js';
import * as CFG from '@/assets/js/Config.js';

export const draftModule = {
  namspaced: true,

  state: {
    activeDraftSet: [],
    draftAmount: CFG.DRAFT_COUNT,
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