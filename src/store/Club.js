export const clubModule = {
  namspaced: true,

  state: {
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