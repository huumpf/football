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
    // Squad list's skill-change column timeframe (a DEV_TIMEFRAMES key).
    devTimeframe: CFG.DEV_DEFAULT_TIMEFRAME,
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
      // Mark where the player's tenure at this club starts, for the "since
      // joining" change and a fresh weekly log (pre-join weeks weren't tracked).
      player.joinSkill = player.skill;
      player.skillLog = [];
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
    // Folds a matchday's per-player ratings into the own squad's season logs.
    // The league module defines the same mutation for the AI clubs, so one
    // commit('APPLY_RATINGS') covers the whole league (modules aren't namespaced).
    APPLY_RATINGS(state, { ratings }) {
      HLP.applySeasonRatings(state.players, ratings);
    },

    // Stamps a matchday's injuries onto the own squad. League defines the same
    // mutation for AI clubs, so one commit('APPLY_INJURIES') covers the league.
    APPLY_INJURIES(state, { injuries }) {
      HLP.applyInjuries(state.players, injuries);
    },

    // After a matchday, pull every injured player out of the saved sheets (vacate
    // his pitch slot, drop him from the bench) and into the reserve — an injured
    // player can no longer play. The vacated slot is left for the manager to fill;
    // the match-side builder backfills it so a fixture is never a man down.
    MOVE_INJURED_TO_RESERVE(state) {
      for (const sheet of Object.values(state.formations)) {
        const reserveIds = new Set(sheet.reserve.map(p => p.id));
        const banish = (player) => {
          if (!reserveIds.has(player.id)) { sheet.reserve.push(player); reserveIds.add(player.id); }
        };
        for (const pos of Object.keys(sheet.lineup)) {
          sheet.lineup[pos] = sheet.lineup[pos].map(p => {
            if (p && HLP.isInjured(p)) { banish(p); return null; }
            return p;
          });
        }
        sheet.bench = sheet.bench.filter(p => {
          if (p && HLP.isInjured(p)) { banish(p); return false; }
          return true;
        });
      }
    },

    // One week of development for the own squad (full squad; bench/reserve at a
    // reduced training weight). League defines the same mutation for AI clubs.
    // After developing, each player's weekly skill is logged (capped) so the
    // squad list can show the change over the last N weeks.
    DEVELOP_WEEK(state, { ratings }) {
      HLP.developPlayers(state.players, ratings);
      for (const player of state.players) {
        if (!player.skillLog) player.skillLog = [];
        player.skillLog.push(player.skill);
        if (player.skillLog.length > CFG.DEV_HISTORY_WEEKS) player.skillLog.shift();
      }
    },

    // Persists the squad list's skill-change timeframe (a DEV_TIMEFRAMES key).
    SET_DEV_TIMEFRAME(state, timeframe) {
      state.devTimeframe = timeframe;
    },

    // Birthdays for the given week: own players born this week age a year. Aging
    // is staggered, but a player who passes the age limit keeps playing until the
    // season ends (retirement happens at the rollover, see RETIRE_AGED).
    AGE_BIRTHDAYS(state, { week }) {
      for (const player of state.players) {
        if ((player.birthWeek ?? 1) === week) HLP.agePlayer(player);
      }
    },

    // Season change: players past the age limit end their career and leave the
    // squad, with the sheets reconciled. Done once at the rollover so a player
    // who turns 35 mid-season still finishes the season.
    RETIRE_AGED(state) {
      const before = state.players.length;
      state.players = state.players.filter(p => p.age <= CFG.PLAYER_AGE_MAX);
      if (state.players.length !== before) {
        state.positionCount = getTeamPositionCount(state.players);
        reconcileFormations(state);
      }
    },

    // Season change: reset the own squad's season note logs, snapshot the skill
    // each player starts the season with (for the UI development delta), and
    // restore everyone to full fitness — every season starts fresh. Aging is
    // staggered on birthdays; retirement is RETIRE_AGED, also here.
    RESET_SEASON_STATS(state) {
      for (const player of state.players) {
        player.season = { games: 0, ratingSum: 0 };
        player.seasonStartSkill = player.skill;
        // An injured player keeps recovering across the rollover — don't reset him
        // to full; the weekly tick keeps him pinned until the injury clears.
        if (!player.injury) player.fitness = CFG.STAMINA_MAX;
      }
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
    // Re-link the saved formation sheets to the canonical `players` objects. A
    // save round-trip (JSON) splits team.players and the sheets into separate
    // objects sharing only ids, so per-player state written to team.players
    // (fitness, injuries) wouldn't reach the line-up the match and squad screens
    // read. reconcileSheet rebuilds each sheet from the current players by id,
    // restoring shared identity without disturbing the arrangement. Run on load.
    RECONCILE_FORMATIONS(state) {
      reconcileFormations(state);
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
