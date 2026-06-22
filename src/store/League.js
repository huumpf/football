import * as clubFactory from '@/assets/js/ClubFactory.js';
import * as CFG from '@/assets/js/Config.js';
import * as HLP from '@/assets/js/Helpers.js';
import * as SCHED from '@/assets/js/Schedule.js';
import { simulateMatch } from '@/assets/js/MatchSim.js';

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
          skill: getters.recommendedFormation.skillSum,
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

    // The player's match for the current week, resolved for the match screen:
    // both sides as { id, name, xi, bench, strength } (id null = player's club),
    // ordered by position. Null when this week has no matchday or it has already
    // been played. The XI and bench are split from each squad by the strongest
    // formation, the same line-up the result is rolled from.
    currentMatch(state, getters, rootState) {
      const matchday = SCHED.matchdayForWeek(rootState.club.week);
      if (matchday === null || !state.fixtures[matchday] || state.results[matchday]) return null;

      const fixture = state.fixtures[matchday].find(m => m.home === null || m.away === null);
      if (!fixture) return null;

      // Each line-up entry is { player, position }: position is the slot the
      // player fills (the XI) or their own primary (the bench). Both are ordered
      // by position so the lists read GK first down to the strikers.
      const byPosition = entries => entries.sort((a, b) => a.player.positions.sort - b.player.positions.sort);
      const resolveSide = id => {
        const club = id === null ? null : state.clubs.find(c => c.id === id);
        const name = club ? club.name : rootState.club.name;
        const formation = club ? club.formation : getters.recommendedFormation;
        const squad = club ? club.players : rootState.team.players;

        const xi = byPosition(
          Object.entries(formation.players).flatMap(([pos, players]) =>
            players.map(player => ({ player, position: pos.toUpperCase() }))
          )
        );
        const xiIds = new Set(xi.map(e => e.player.id));
        const bench = byPosition(
          squad
            .filter(p => !xiIds.has(p.id))
            .map(player => ({ player, position: player.positions.position }))
        );
        return { id, name, xi, bench, strength: formation.skillSum };
      };

      return {
        matchday,
        home: resolveSide(fixture.home),
        away: resolveSide(fixture.away),
      };
    },
  },

  mutations: {
    MAKE_LEAGUE(state, reservedNames) {
      const names = clubFactory.makeClubNames(CFG.CLUBS_PER_LEAGUE, reservedNames);
      state.clubs = [];
      for (let i = 0; i < CFG.CLUBS_PER_LEAGUE; i++) {
        state.clubs.push(clubFactory.makeClub(i, names[i]));
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

    // Season change: every AI club's players age a year, players past the age
    // limit retire, and the club re-picks its strongest formation. Careers may
    // shrink a squad below MIN_SQUAD_SIZE — the minimum only blocks sales.
    AGE_CLUBS(state) {
      for (const club of state.clubs) {
        for (const player of club.players) HLP.agePlayer(player);
        club.players = club.players.filter(p => p.age <= CFG.PLAYER_AGE_MAX);
        club.formation = HLP.getRecommendedFormation(club.players);
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
  },

  actions: {
    makeLeague({ commit, dispatch, rootState }) {
      commit('MAKE_LEAGUE', [rootState.club.name]);
      commit('MAKE_SCHEDULE');
      dispatch('refreshAiListings');
    },

    // Simulates the current week's matchday, if the week has one, a schedule
    // exists (the league is only made once the draft is visited) and it has
    // not been played yet. Every club enters with its strongest formation's
    // total skill.
    playMatchday({ commit, state, getters, rootState }) {
      const matchday = SCHED.matchdayForWeek(rootState.club.week);
      if (matchday === null || !state.fixtures[matchday] || state.results[matchday]) return;

      const strengthOf = id => id === null
        ? getters.recommendedFormation.skillSum
        : state.clubs.find(c => c.id === id).formation.skillSum;

      const results = state.fixtures[matchday].map(({ home, away }) => ({
        home,
        away,
        ...simulateMatch(strengthOf(home), strengthOf(away)),
      }));
      commit('RECORD_MATCHDAY', { matchday, results });
    },

    // Records the matchday around the match the manager just watched: the
    // player's fixture takes the live score, the other 8 are instant-simulated
    // as usual. Same guard as playMatchday so a replayed matchday is ignored.
    playPlayerMatchday({ commit, state, getters, rootState }, live) {
      const matchday = SCHED.matchdayForWeek(rootState.club.week);
      if (matchday === null || !state.fixtures[matchday] || state.results[matchday]) return;

      const strengthOf = id => id === null
        ? getters.recommendedFormation.skillSum
        : state.clubs.find(c => c.id === id).formation.skillSum;

      const results = state.fixtures[matchday].map(({ home, away }) => {
        if (home === null || away === null) {
          return { home, away, homeGoals: live.homeGoals, awayGoals: live.awayGoals };
        }
        return { home, away, ...simulateMatch(strengthOf(home), strengthOf(away)) };
      });
      commit('RECORD_MATCHDAY', { matchday, results });
    },
  },
}
