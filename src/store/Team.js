export const teamModule = {
  state: {
    players: [],
    positionCount: { gk: 0, cb: 0, cdm: 0, cm: 0, cam: 0, st: 0, lb: 0, lm: 0, lf: 0, rb: 0, rm: 0, rf: 0, },
  },

  mutations: {
    ADD_TO_TEAM(state, player) {
      state.players.push(player);
      state.positionCount = getTeamPositionCount(state.players);
      state.players.sort((a, b) => a.positions.sort - b.positions.sort || b.skill - a.skill);
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
