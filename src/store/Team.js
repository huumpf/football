import * as HLP from '@/assets/js/Helpers.js';
import * as CFG from '@/assets/js/Config.js';

export const teamModule = {
  state: {
    players: [],
    positionCount: { gk: 0, cb: 0, cdm: 0, cm: 0, cam: 0, st: 0, lb: 0, lm: 0, lf: 0, rb: 0, rm: 0, rf: 0, },
  },

  getters: {
    // Every formation with its optimal player assignment. Cached by Vuex, so
    // the (Hungarian) assignment runs once per squad change instead of once
    // per component that needs it.
    formationsWithPlayers(state) {
      return HLP.getFormationsWithPlayers(state.players);
    },
    // The strongest formation; ties keep the later entry, matching
    // HLP.getRecommendedFormation.
    recommendedFormation(state, getters) {
      const formations = getters.formationsWithPlayers;
      return formations.reduce((best, f) => (f.skillSum >= best.skillSum ? f : best), formations[0]);
    },
  },

  mutations: {
    ADD_TO_TEAM(state, player) {
      state.players.push(player);
      state.positionCount = getTeamPositionCount(state.players);
      state.players.sort((a, b) => a.positionSort - b.positionSort || b.skill - a.skill);
    },
    REMOVE_FROM_TEAM(state, playerId) {
      state.players = state.players.filter(p => p.id !== playerId);
      state.positionCount = getTeamPositionCount(state.players);
    },
    // Season change: every player ages a year; players past the age limit
    // end their career and leave the squad.
    AGE_TEAM(state) {
      for (const player of state.players) HLP.agePlayer(player);
      state.players = state.players.filter(p => p.age <= CFG.PLAYER_AGE_MAX);
      state.positionCount = getTeamPositionCount(state.players);
    },
  },

  actions: {
    addPlayerToTeam({ commit }, player) {
      commit('ADD_TO_TEAM', player);
    },
  },
}

function getTeamPositionCount(players) {
  let positions = {
    gk: 0, cb: 0, cdm: 0, cm: 0, cam: 0, st: 0, lb: 0, lm: 0, lf: 0, rb: 0, rm: 0, rf: 0,
  }

  for (let player of players) {
    for (const pos of player.positions) {
      const key = pos.toLowerCase();
      if (key in positions) positions[key] += 1;
    }
  }

  return positions;
}
