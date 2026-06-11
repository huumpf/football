import { makeClubName } from '@/assets/js/ClubFactory.js';
import * as CFG from '@/assets/js/Config.js';

export const clubModule = {
  state: {
    name: makeClubName(),
    money: CFG.CLUB_STARTING_MONEY,
  },

  mutations: {
    PAY(state, amount) {
      state.money -= amount;
    }
  },

  actions: {
    pay({ commit }, amount) {
      commit('PAY', amount);
    }
  },
}
