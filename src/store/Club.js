import { makeClubName } from '@/assets/js/ClubFactory.js';
import * as CFG from '@/assets/js/Config.js';

export const clubModule = {
  state: {
    name: makeClubName(),
    money: CFG.CLUB_STARTING_MONEY,
    season: 1,
    week: 1,
  },

  mutations: {
    PAY(state, amount) {
      state.money -= amount;
    },
    RECEIVE(state, amount) {
      state.money += amount;
    },
    ADVANCE_WEEK(state) {
      state.week += 1;
    },
    START_NEW_SEASON(state) {
      state.season += 1;
      state.week = 1;
    },
  },

  actions: {
    pay({ commit }, amount) {
      commit('PAY', amount);
    },
    // The game's main tick: the current week's matchday (if any) is played
    // first, then the transfer market gets its weekly round (fresh AI
    // listings, one buy opportunity per AI club), then time moves on. After
    // week 52 a new season starts with a fresh schedule and a cleared table.
    advanceWeek({ commit, dispatch, state }) {
      dispatch('playMatchday');
      dispatch('refreshAiListings');
      dispatch('runAiTransfers');
      if (state.week >= CFG.SEASON_WEEKS) {
        commit('START_NEW_SEASON');
        commit('MAKE_SCHEDULE');
      } else {
        commit('ADVANCE_WEEK');
      }
    },
  },
}
