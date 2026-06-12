import { makeClubName } from '@/assets/js/ClubFactory.js';
import * as CFG from '@/assets/js/Config.js';

export const clubModule = {
  state: {
    name: makeClubName(),
    money: CFG.CLUB_STARTING_MONEY,
    week: 1,
  },

  mutations: {
    PAY(state, amount) {
      state.money -= amount;
    },
    ADVANCE_WEEK(state) {
      state.week += 1;
    }
  },

  actions: {
    pay({ commit }, amount) {
      commit('PAY', amount);
    },
    advanceWeek({ commit }) {
      commit('ADVANCE_WEEK');
    }
  },
}
