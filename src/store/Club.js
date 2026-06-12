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
    // week 52 a new season starts.
    advanceWeek({ commit, dispatch, state }) {
      dispatch('playMatchday');
      dispatch('refreshAiListings');
      dispatch('runAiTransfers');
      if (state.week >= CFG.SEASON_WEEKS) {
        dispatch('startNewSeason');
      } else {
        commit('ADVANCE_WEEK');
      }
    },

    // Closes the season: every player ages a year (the AI clubs re-pick their
    // formation, the own club's recommendedFormation getter follows the squad
    // anyway), the market drops listings of retired players, and the next
    // season starts with a fresh schedule and a cleared table.
    startNewSeason({ commit, rootState }) {
      commit('AGE_TEAM');
      commit('AGE_CLUBS');
      const activeIds = new Set([
        ...rootState.team.players.map(p => p.id),
        ...rootState.league.clubs.flatMap(c => c.players.map(p => p.id)),
      ]);
      commit('PRUNE_LISTINGS', activeIds);
      commit('START_NEW_SEASON');
      commit('MAKE_SCHEDULE');
    },
  },
}
