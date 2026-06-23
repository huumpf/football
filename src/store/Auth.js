import { api } from '@/assets/js/api.js';

// Who is logged in. Namespaced so its mutations stay clear of the game modules
// (and so persistence can skip auth/* mutations when deciding to autosave).
export const authModule = {
  namespaced: true,

  state: {
    user: null,
  },

  getters: {
    isAuthenticated: (state) => !!state.user,
  },

  mutations: {
    SET_USER(state, user) {
      state.user = user;
    },
  },

  actions: {
    async fetchMe({ commit }) {
      const { user } = await api.me();
      commit('SET_USER', user);
      return user;
    },
    async register({ commit }, { email, password }) {
      const { user } = await api.register(email, password);
      commit('SET_USER', user);
      return user;
    },
    async login({ commit }, { email, password }) {
      const { user } = await api.login(email, password);
      commit('SET_USER', user);
      return user;
    },
    async logout({ commit }) {
      await api.logout();
      commit('SET_USER', null);
    },
  },
};
