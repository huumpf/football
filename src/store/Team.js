export const teamModule = {
  namspaced: true,

  state: {
    players: [],
    positionCount: { gk: 0, cb: 0, cdm: 0, cm: 0, cam: 0, st: 0, lb: 0, lm: 0, lf: 0, rb: 0, rm: 0,rf: 0, },
  },

  mutations: {
    ADD_TO_TEAM(state, player) {
      state.players.push(player);
      state.positionCount = _getTeamPositionCount(state.players);
    },
  },

  actions: {
    addPlayerToTeam({ commit }, player) {
      commit('ADD_TO_TEAM', player);
    },
  },

  modules: {
    
  }
}

function _getTeamPositionCount(players) {
  let positions = {
    gk: 0, cb: 0, cdm: 0, cm: 0, cam: 0, st: 0, lb: 0, lm: 0, lf: 0, rb: 0, rm: 0,rf: 0,
  }

  for (let i=0; i < players.length; i++) {
    switch (players[i].position) {
      case "GK": positions.gk += 1; break;
      case "CB": positions.cb += 1; break;
      case "CDM": positions.cdm += 1; break;
      case "CM": positions.cm += 1; break;
      case "CAM": positions.cam += 1; break;
      case "ST": positions.st += 1; break;
      case "LB": positions.lb += 1; break;
      case "LM": positions.lm += 1; break;
      case "LF": positions.lf += 1; break;
      case "RB": positions.rb += 1; break;
      case "RM": positions.rm += 1; break;
      case "RF": positions.rf += 1; break;
    }
  }

  return positions;
}