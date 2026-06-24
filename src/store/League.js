import * as clubFactory from '@/assets/js/ClubFactory.js';
import * as CFG from '@/assets/js/Config.js';
import * as HLP from '@/assets/js/Helpers.js';
import * as SCHED from '@/assets/js/Schedule.js';
import { simulateMatch, simulateInstant } from '@/assets/js/MatchSim.js';
import { generateCrest } from '@/assets/js/CrestFactory.js';

// Line-up entry helpers shared by the match-side builder. Each entry is
// { player, position }: `position` is the slot the player fills (the XI) or
// their own primary (the bench), and rows are ordered GK-first to strikers.
const byPosition = entries => entries.sort((a, b) => a.player.positions.sort - b.player.positions.sort);
const flattenLineup = lineup =>
  Object.entries(lineup).flatMap(([pos, players]) =>
    players.filter(Boolean).map(player => ({ player, position: pos.toUpperCase() }))
  );
const benchRows = players =>
  byPosition(players.map(player => ({ player, position: player.positions.position })));

// Builds the own club's fielded side from its saved active sheet: the manager's
// lineup with injured players dropped and every resulting empty slot backfilled
// by the best available (non-injured) bench/reserve player, so a fixture is never
// silently a man down. With no injuries this reproduces the saved lineup exactly.
function fieldOwnSide(sheet) {
  const placed = [];
  const placedIds = new Set();
  const holes = [];
  for (const [pos, slots] of Object.entries(sheet.lineup)) {
    const POS = pos.toUpperCase();
    for (const player of slots) {
      if (player && !HLP.isInjured(player)) {
        placed.push({ player, position: POS });
        placedIds.add(player.id);
      } else {
        holes.push(POS);
      }
    }
  }
  const available = [...sheet.bench, ...sheet.reserve]
    .filter(p => p && !HLP.isInjured(p) && !placedIds.has(p.id));
  for (const POS of holes) {
    let best = null, bestSkill = 0, bestIdx = -1;
    available.forEach((p, i) => {
      const s = HLP.effectiveSkill(p, POS);
      if (s > bestSkill) { bestSkill = s; best = p; bestIdx = i; }
    });
    if (best) {
      placed.push({ player: best, position: POS });
      placedIds.add(best.id);
      available.splice(bestIdx, 1);
    }
  }
  const bench = sheet.bench.filter(p => p && !HLP.isInjured(p) && !placedIds.has(p.id));
  const strength = placed.reduce((sum, e) => sum + HLP.effectiveSkill(e.player, e.position), 0);
  return { xi: byPosition(placed), bench: benchRows(bench), strength };
}

// Stamps a matchday's freshly-collected injuries (id -> { name, recovery_weeks,
// weeks }) with the club's current week (the recovery clock) before they're
// committed onto players. elapsed starts at 0; updateFitness counts it up.
function stampInjuries(injuries, club) {
  const abs = HLP.absoluteWeek(club.season, club.week);
  for (const id in injuries) {
    injuries[id] = { ...injuries[id], elapsed: 0, injuredAtAbsWeek: abs };
  }
}

// Plays one fixture: the duel engine when both sides field a line-up (so per-
// player ratings and injuries come out), falling back to the strength-only Poisson
// roll if a side has no usable XI. Returns { homeGoals, awayGoals, ratings, injuries }.
function playFixture(home, away) {
  if (home.xi.length && away.xi.length) return simulateInstant(home, away);
  return { ...simulateMatch(home.strength, away.strength), ratings: {}, injuries: {} };
}

export const leagueModule = {
  state: {
    clubs: [],
    // The season's schedule: 34 matchdays of 9 matches, each a { home, away }
    // pair of club ids (null = the player's club).
    fixtures: [],
    // Played matchdays: results[matchday] is the fixtures row enriched with
    // homeGoals/awayGoals. Indexes beyond the current matchday are unset.
    results: [],
  },

  getters: {
    // Resolve a club's crest descriptor by standings/fixture id (null = the
    // player's own club). Used wherever a club is shown with its badge.
    crestById: (state, getters, rootState) => id =>
      id === null ? rootState.club.crest : (state.clubs.find(c => c.id === id)?.crest ?? null),

    // The league table for all 18 clubs, aggregated from the played results:
    // points (3/1/0), goal difference and goals scored decide the order, team
    // strength breaks remaining ties (and orders the table before matchday 1).
    standings(state, getters, rootState) {
      const entries = [
        ...state.clubs.map(club => ({
          id: club.id,
          name: club.name,
          skill: club.formation.skillSum,
          own: false,
        })),
        {
          id: null,
          name: rootState.club.name,
          skill: getters.activeFormationSkill,
          own: true,
        },
      ].map(entry => ({
        ...entry,
        played: 0, won: 0, drawn: 0, lost: 0,
        goalsFor: 0, goalsAgainst: 0, points: 0,
      }));

      const byId = new Map(entries.map(entry => [entry.id, entry]));
      for (const matchday of state.results) {
        for (const match of matchday) {
          const home = byId.get(match.home);
          const away = byId.get(match.away);
          home.played++;
          away.played++;
          home.goalsFor += match.homeGoals;
          home.goalsAgainst += match.awayGoals;
          away.goalsFor += match.awayGoals;
          away.goalsAgainst += match.homeGoals;
          if (match.homeGoals > match.awayGoals) {
            home.won++;
            away.lost++;
            home.points += 3;
          } else if (match.homeGoals < match.awayGoals) {
            away.won++;
            home.lost++;
            away.points += 3;
          } else {
            home.drawn++;
            away.drawn++;
            home.points += 1;
            away.points += 1;
          }
        }
      }

      return entries.sort((a, b) =>
        b.points - a.points
        || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst)
        || b.goalsFor - a.goalsFor
        || b.skill - a.skill
      );
    },

    // Resolves any club id (null = the player's own club) into a match side:
    // { id, name, xi:[{player,position}], bench, strength }, ordered by position.
    // The own club fields its saved active formation (auto optimum as a fallback
    // before the sheets exist); an AI club fields its weekly-generated sheet. The
    // bench is the matchday subs (greyed in the sidebar); the reserve is dropped.
    matchSideById: (state, getters, rootState) => id => {
      if (id === null) {
        const name = rootState.club.name;
        const sheet = rootState.team.formations[rootState.team.activeFormation];
        if (sheet) {
          // Field the saved sheet with injured players dropped and holes backfilled.
          return { id, name, ...fieldOwnSide(sheet) };
        }
        // Defensive fallback before the sheets are initialised: auto optimum.
        const formation = getters.recommendedFormation;
        const xi = byPosition(flattenLineup(formation.players));
        const xiIds = new Set(xi.map(e => e.player.id));
        const bench = HLP.selectBench(
          rootState.team.players.filter(p => !xiIds.has(p.id)),
          formation.positions,
          CFG.BENCH_SIZE,
        );
        return { id, name, xi, bench: benchRows(bench), strength: formation.skillSum };
      }

      // An AI club fields its weekly-generated sheet.
      const club = state.clubs.find(c => c.id === id);
      const xi = byPosition(flattenLineup(club.formation.players));
      let bench = club.bench;
      if (!bench) {
        const xiIds = new Set(xi.map(e => e.player.id));
        bench = HLP.selectBench(
          club.players.filter(p => !xiIds.has(p.id)),
          club.formation.positions,
          CFG.BENCH_SIZE,
        );
      }
      return { id, name: club.name, xi, bench: benchRows(bench), strength: club.formation.skillSum };
    },

    // The player's match for the current week, resolved for the match screen.
    // Null when this week has no matchday or it has already been played.
    currentMatch(state, getters, rootState) {
      const matchday = SCHED.matchdayForWeek(rootState.club.week);
      if (matchday === null || !state.fixtures[matchday] || state.results[matchday]) return null;

      const fixture = state.fixtures[matchday].find(m => m.home === null || m.away === null);
      if (!fixture) return null;

      return {
        matchday,
        home: getters.matchSideById(fixture.home),
        away: getters.matchSideById(fixture.away),
      };
    },
  },

  mutations: {
    // `used` carries crest de-dup state (patterns drawn without replacement,
    // monogram initials made unique) shared with the player's club, so the
    // whole 18-club league stays mutually distinguishable.
    MAKE_LEAGUE(state, { reservedNames, used }) {
      const names = clubFactory.makeClubNames(CFG.CLUBS_PER_LEAGUE, reservedNames);
      state.clubs = [];
      for (let i = 0; i < CFG.CLUBS_PER_LEAGUE; i++) {
        const club = clubFactory.makeClub(i, names[i]);
        club.crest = generateCrest(names[i], used);
        state.clubs.push(club);
      }
    },

    // Draws a fresh schedule for all 18 clubs and clears the played results;
    // runs when the league is made and again at every season change.
    MAKE_SCHEDULE(state) {
      state.fixtures = SCHED.makeFixtures([null, ...state.clubs.map(c => c.id)]);
      state.results = [];
    },

    RECORD_MATCHDAY(state, { matchday, results }) {
      state.results[matchday] = results;
    },

    // Folds a matchday's per-player ratings into every AI club player's season
    // log. The team module defines the same mutation for the own squad, so a
    // single commit('APPLY_RATINGS') covers the whole league.
    APPLY_RATINGS(state, { ratings }) {
      for (const club of state.clubs) HLP.applySeasonRatings(club.players, ratings);
    },

    // Stamps a matchday's injuries onto every AI club. The team module defines the
    // same mutation for the own squad, so one commit('APPLY_INJURIES') covers the
    // league. AI injured players are dropped from the XI on the next weekly
    // REGENERATE_AI_FORMATIONS (aiSelectionSkill returns 0 for them).
    APPLY_INJURIES(state, { injuries }) {
      for (const club of state.clubs) HLP.applyInjuries(club.players, injuries);
    },

    // One week of development for every AI club squad (full squad, not just the
    // XI). The team module defines the same mutation for the own squad, so a
    // single commit('DEVELOP_WEEK') develops the whole league identically.
    DEVELOP_WEEK(state, { ratings, drains }) {
      for (const club of state.clubs) HLP.developPlayers(club.players, ratings, drains);
    },

    // Birthdays for the given week: AI players born this week age a year. Aging
    // is staggered, but a player who passes the age limit keeps playing until the
    // season ends (retirement happens at the rollover, see RETIRE_AGED).
    AGE_BIRTHDAYS(state, { week }) {
      for (const club of state.clubs) {
        for (const player of club.players) {
          if ((player.birthWeek ?? 1) === week) HLP.agePlayer(player);
        }
      }
    },

    // Season change: AI players past the age limit retire and the affected clubs
    // re-pick their formation. Done once at the rollover so a player who turns 35
    // mid-season still finishes the season.
    RETIRE_AGED(state) {
      for (const club of state.clubs) {
        const before = club.players.length;
        club.players = club.players.filter(p => p.age <= CFG.PLAYER_AGE_MAX);
        if (club.players.length !== before) club.formation = HLP.getRecommendedFormation(club.players);
      }
    },

    // Season change: reset every AI player's season note log and snapshot the
    // skill they start the new season with (for the UI development delta). Aging
    // is staggered on birthdays; retirement is RETIRE_AGED, also at the rollover.
    RESET_SEASON_STATS(state) {
      for (const club of state.clubs) {
        for (const player of club.players) {
          player.season = { games: 0, ratingSum: 0 };
          player.seasonStartSkill = player.skill;
          // An injured player keeps recovering across the rollover (the weekly
          // tick keeps him pinned until the injury clears) — don't reset to full.
          if (!player.injury) player.fitness = CFG.STAMINA_MAX;
        }
      }
    },

    // A club sells a player off the market: the player leaves the squad, the
    // fee arrives, and the club re-picks its strongest formation.
    SELL_PLAYER(state, { clubId, playerId, price }) {
      const club = state.clubs.find(c => c.id === clubId);
      club.players = club.players.filter(p => p.id !== playerId);
      club.money += price;
      club.formation = HLP.getRecommendedFormation(club.players);
    },

    // The mirror image: a club signs a player off the market, the fee leaves,
    // and the club re-picks its strongest formation.
    BUY_PLAYER(state, { clubId, player, price }) {
      const club = state.clubs.find(c => c.id === clubId);
      club.players.push(player);
      club.money -= price;
      club.formation = HLP.getRecommendedFormation(club.players);
    },

    // Regenerates each AI club's full matchday sheet from its current squad: the
    // strongest formation plus a positionally aware bench and the reserve. Player
    // selection is fitness-aware (aiSelectionSkill), so a tired player is rotated
    // out for a fresher one and recovers on the bench — the AI's rest mechanic.
    REGENERATE_AI_FORMATIONS(state) {
      for (const club of state.clubs) {
        const { formation, bench, reserve } = HLP.buildClubSheet(club.players, CFG.BENCH_SIZE, HLP.aiSelectionSkill);
        club.formation = formation;
        club.bench = bench;
        club.reserve = reserve;
      }
    },
  },

  actions: {
    makeLeague({ commit, dispatch, rootState }) {
      // One shared de-dup pool: the player's crest is drawn first, then the 17
      // AI clubs continue from the same pool inside MAKE_LEAGUE.
      const used = { fields: new Set(), initials: new Set() };
      commit('SET_CREST', generateCrest(rootState.club.name, used));
      commit('MAKE_LEAGUE', { reservedNames: [rootState.club.name], used });
      commit('MAKE_SCHEDULE');
      dispatch('regenerateAiFormations');
      dispatch('refreshAiListings');
    },

    // Rebuilds every AI club's matchday sheet (formation + bench + reserve) from
    // its current squad. Run at league creation and after the weekly transfer
    // round so the sheet a match shows reflects the post-transfer squad.
    regenerateAiFormations({ commit }) {
      commit('REGENERATE_AI_FORMATIONS');
    },

    // Simulates the current week's matchday, if the week has one, a schedule
    // exists (the league is only made once the draft is visited) and it has not
    // been played yet. Every fixture runs the per-player duel engine; the
    // resulting ratings are folded into every player's season log.
    playMatchday({ commit, state, getters, rootState }) {
      const matchday = SCHED.matchdayForWeek(rootState.club.week);
      if (matchday === null || !state.fixtures[matchday] || state.results[matchday]) return {};

      const ratings = {};
      const injuries = {};
      const drains = {};
      const results = state.fixtures[matchday].map(({ home, away }) => {
        const outcome = playFixture(getters.matchSideById(home), getters.matchSideById(away));
        Object.assign(ratings, outcome.ratings);
        Object.assign(injuries, outcome.injuries || {});
        Object.assign(drains, outcome.drain || {});
        return { home, away, homeGoals: outcome.homeGoals, awayGoals: outcome.awayGoals };
      });
      stampInjuries(injuries, rootState.club);
      commit('RECORD_MATCHDAY', { matchday, results });
      commit('APPLY_RATINGS', { ratings });
      commit('DEVELOP_WEEK', { ratings, drains });
      // Injuries are stamped after development so the injuring week pins the
      // player's fitness (overriding that week's match drain) and his recovery
      // clock starts next week; injured players are then moved to the reserve.
      commit('APPLY_INJURIES', { injuries });
      commit('MOVE_INJURED_TO_RESERVE');
      return ratings;
    },

    // Records the matchday around the match the manager just watched: the
    // player's fixture takes the live score, ratings and injuries, the other 8 are
    // instant-simulated. Same guard as playMatchday so a replay is ignored.
    playPlayerMatchday({ commit, state, getters, rootState }, live) {
      const matchday = SCHED.matchdayForWeek(rootState.club.week);
      if (matchday === null || !state.fixtures[matchday] || state.results[matchday]) return {};

      const ratings = {};
      const injuries = {};
      const drains = {};
      const results = state.fixtures[matchday].map(({ home, away }) => {
        if (home === null || away === null) {
          Object.assign(ratings, live.ratings || {});
          Object.assign(injuries, live.injuries || {});
          Object.assign(drains, live.drain || {});
          return { home, away, homeGoals: live.homeGoals, awayGoals: live.awayGoals };
        }
        const outcome = playFixture(getters.matchSideById(home), getters.matchSideById(away));
        Object.assign(ratings, outcome.ratings);
        Object.assign(injuries, outcome.injuries || {});
        Object.assign(drains, outcome.drain || {});
        return { home, away, homeGoals: outcome.homeGoals, awayGoals: outcome.awayGoals };
      });
      stampInjuries(injuries, rootState.club);
      commit('RECORD_MATCHDAY', { matchday, results });
      commit('APPLY_RATINGS', { ratings });
      commit('DEVELOP_WEEK', { ratings, drains });
      commit('APPLY_INJURIES', { injuries });
      commit('MOVE_INJURED_TO_RESERVE');
      return ratings;
    },
  },
}
