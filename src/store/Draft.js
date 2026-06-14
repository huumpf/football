import * as PlayerFactory from '@/assets/js/PlayerFactory.js';
import * as CFG from '@/assets/js/Config.js';

export const draftModule = {
  state: {
    activeDraftSet: [],
    // Shared pool of rerolls for the whole draft, spent via the Reroll button.
    rerollsRemaining: CFG.DRAFT_REROLLS,
  },

  mutations: {
    MAKE_DRAFT_SET(state) {
      state.activeDraftSet = PlayerFactory.makeDraftSet();
    },
    USE_REROLL(state) {
      state.rerollsRemaining -= 1;
    },
  },

  actions: {
    makeDraftSet({ commit }) {
      commit('MAKE_DRAFT_SET');
    },
    // Replace the current options with a fresh set, spending one reroll.
    reroll({ commit, state }) {
      if (state.rerollsRemaining <= 0) return;
      commit('USE_REROLL');
      commit('MAKE_DRAFT_SET');
    },
  },
}
