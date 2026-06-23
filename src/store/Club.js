import { makeClubName } from '@/assets/js/ClubFactory.js';
import * as CFG from '@/assets/js/Config.js';
import * as SCHED from '@/assets/js/Schedule.js';

export const clubModule = {
  state: {
    name: makeClubName(),
    // Procedural crest descriptor, generated once at league creation.
    crest: null,
    money: CFG.CLUB_STARTING_MONEY,
    season: 1,
    week: 1,
  },

  mutations: {
    SET_CREST(state, crest) {
      state.crest = crest;
    },
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

    // The weekly tail shared by advanceWeek and finishMatch. Development runs
    // every week: on a match week the matchday actions already committed
    // DEVELOP_WEEK with the real ratings, so here we only develop the
    // training-only (match-free) weeks; birthdays (aging) are processed every
    // week. Then the transfer round runs and time moves on (a new season after
    // week 52).
    advanceCalendar({ commit, dispatch, state, rootState }) {
      const matchday = SCHED.matchdayForWeek(state.week);
      const playedThisWeek = matchday !== null && rootState.league.results[matchday];
      if (!playedThisWeek) commit('DEVELOP_WEEK', { ratings: {} });

      commit('AGE_BIRTHDAYS', { week: state.week });

      dispatch('refreshAiListings');
      dispatch('runAiTransfers');
      if (state.week >= CFG.SEASON_WEEKS) {
        dispatch('startNewSeason');
      } else {
        commit('ADVANCE_WEEK');
      }
      // Re-roll every AI club's sheet now that the transfer round (and any
      // retirements) are done, so next matchday plays the current squads.
      dispatch('regenerateAiFormations');
    },

    // Closes the season: players past the age limit retire (kept until the
    // rollover so they finish the season), the market drops their listings, then
    // season logs reset and a fresh schedule/cleared table starts. Aging itself
    // is staggered across birthdays during the season.
    startNewSeason({ commit, rootState }) {
      commit('RETIRE_AGED');
      const activeIds = new Set([
        ...rootState.team.players.map(p => p.id),
        ...rootState.league.clubs.flatMap(c => c.players.map(p => p.id)),
      ]);
      commit('PRUNE_LISTINGS', activeIds);
      commit('RESET_SEASON_STATS');
      commit('START_NEW_SEASON');
      commit('MAKE_SCHEDULE');
    },
  },
}
