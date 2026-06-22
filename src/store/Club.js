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
    // The normal week tick (match-free weeks, and the fallback path): the
    // current week's matchday is instant-played if any, then the calendar moves
    // on. On a week the manager watches their match, the match screen drives
    // finishMatch instead, so playMatchday no-ops here.
    advanceWeek({ dispatch }) {
      dispatch('playMatchday');
      dispatch('advanceCalendar');
    },

    // Closes out the watched match: the live score is recorded into the
    // matchday (the other 8 fixtures instant-simulated), then the calendar
    // moves on exactly as a normal week would.
    finishMatch({ dispatch }, liveResult) {
      dispatch('playPlayerMatchday', liveResult);
      dispatch('advanceCalendar');
    },

    // The weekly tail shared by advanceWeek and finishMatch: the transfer market
    // gets its round (fresh AI listings, one buy opportunity per AI club), then
    // time moves on. After week 52 a new season starts.
    advanceCalendar({ commit, dispatch, state }) {
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
