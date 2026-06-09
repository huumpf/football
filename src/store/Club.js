import * as Names from '@/assets/js/Names.js';

function makeClubName() {
  let name = Names.cityNames[Math.floor(Math.random() * Names.cityNames.length)];
  if (Math.random() < 0.2) { name += " " + Names.clubNameAdditions[Math.floor(Math.random() * Names.clubNameAdditions.length)] }
  return name;
}

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

  modules: {}
}