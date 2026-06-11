import { makeClubName } from '@/assets/js/ClubFactory.js';

export const clubModule = {
  state: {
    name: makeClubName(),
    money: 300000,
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
