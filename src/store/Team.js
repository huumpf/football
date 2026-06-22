import * as HLP from '@/assets/js/Helpers.js';
import * as CFG from '@/assets/js/Config.js';

export const teamModule = {
  state: {
    players: [],
    positionCount: { gk: 0, cb: 0, cdm: 0, cm: 0, cam: 0, st: 0, lb: 0, lm: 0, lf: 0, rb: 0, rm: 0, rf: 0, },
    // The saved team sheet per formation: name -> { lineup:{pos:[player|null]},
    // bench:[player], reserve:[player] } over the same player objects as
    // `players`. Filled once after the draft (INIT_FORMATIONS) and edited by the
    // Team view from then on; reconciled against the squad on every roster change.
    formations: {},
    // Name of the current default formation — the one played in matches.
    activeFormation: null,
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
    // The skill the club actually fields: the saved active formation's lineup.
    // Falls back to the auto optimum before the sheets are initialised.
    activeFormationSkill(state, getters) {
      const sheet = state.formations[state.activeFormation];
      return sheet ? HLP.lineupSkill(sheet.lineup) : getters.recommendedFormation.skillSum;
    },
  },

  mutations: {
    ADD_TO_TEAM(state, player) {
      state.players.push(player);
      state.positionCount = getTeamPositionCount(state.players);
      state.players.sort((a, b) => a.positions.sort - b.positions.sort || b.skill - a.skill);
      // A new signing joins every saved sheet's reserve (reconcile appends
      // squad players that sit in no bucket).
      reconcileFormations(state);
    },
    REMOVE_FROM_TEAM(state, playerId) {
      state.players = state.players.filter(p => p.id !== playerId);
      state.positionCount = getTeamPositionCount(state.players);
      // Scrub the departed player from every saved sheet (a vacated pitch slot
      // is left empty for the manager to fill).
      reconcileFormations(state);
    },
    // Season change: every player ages a year; players past the age limit
    // end their career and leave the squad.
    AGE_TEAM(state) {
      for (const player of state.players) HLP.agePlayer(player);
      state.players = state.players.filter(p => p.age <= CFG.PLAYER_AGE_MAX);
      state.positionCount = getTeamPositionCount(state.players);
      reconcileFormations(state);
    },

    // Fills every formation with a saved team sheet from the current squad and
    // sets the strongest as the default. Guarded so it runs once (after the
    // draft); later squad changes are folded in by reconcileFormations instead.
    INIT_FORMATIONS(state) {
      if (Object.keys(state.formations).length || !state.players.length) return;
      const { sheets, defaultName } = HLP.buildFormationSheets(state.players, CFG.BENCH_SIZE);
      state.formations = sheets;
      state.activeFormation = defaultName;
    },
    // Switching the formation dropdown picks the new default to play.
    SET_ACTIVE_FORMATION(state, name) {
      state.activeFormation = name;
    },
    // Persists the Team view's edited buckets for one formation.
    SET_FORMATION_SHEET(state, { name, lineup, bench, reserve }) {
      state.formations[name] = { lineup, bench, reserve };
    },
  },

  actions: {
    addPlayerToTeam({ commit }, player) {
      commit('ADD_TO_TEAM', player);
    },
    initFormations({ commit }) {
      commit('INIT_FORMATIONS');
    },
  },
}

// Realigns every saved sheet with the current squad. No-op until the sheets are
// initialised (e.g. during the draft, before INIT_FORMATIONS).
function reconcileFormations(state) {
  if (!Object.keys(state.formations).length) return;
  for (const name of Object.keys(state.formations)) {
    state.formations[name] = HLP.reconcileSheet(state.formations[name], state.players);
  }
}

function getTeamPositionCount(players) {
  let positions = {
    gk: 0, cb: 0, cdm: 0, cm: 0, cam: 0, st: 0, lb: 0, lm: 0, lf: 0, rb: 0, rm: 0, rf: 0,
  }

  for (let player of players) {
    const playable = [
      ...(player.positions.primary || [player.positions.position]),
      ...(player.positions.secondary || []),
    ];
    for (const pos of playable) {
      const key = pos.toLowerCase();
      if (key in positions) positions[key] += 1;
    }
  }

  return positions;
}
