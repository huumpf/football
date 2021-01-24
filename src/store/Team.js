export const teamModule = {
  namspaced: true,

  state: {
    players: [],
    positionStats: { gk: 0, cb: 0, cdm: 0, cm: 0, cam: 0, st: 0, lb: 0, lm: 0, lf: 0, rb: 0, rm: 0, rf: 0 },
    positionCount: { gk: 0, cb: 0, cdm: 0, cm: 0, cam: 0, st: 0, lb: 0, lm: 0, lf: 0, rb: 0, rm: 0, rf: 0 },
    skillCount: { goalkeeping: 0, defense: 0, progression: 0, shot: 0, },
  },

  mutations: {
    ADD_TO_TEAM(state, player) {
      state.players.push(player);
      state.positionStats = getTeamPositionStats(state.players);
      state.positionCount = getTeamPositionCount(state.players);
      state.skillCount = getTeamSkillsCount(state.players);
      state.players.sort((a, b) => a.positions.sort - b.positions.sort || b.skill - a.skill);
    },
  },

  actions: {
    addPlayerToTeam({ commit }, player) {
      commit('ADD_TO_TEAM', player);
    },
  },

  getters: {
    
  },
}

function getTeamSkillsCount(players) {

  let skills = {
    goalkeeping: 0,
    defense: 0,
    progression: 0,
    shot: 0,
  }

  for (let i=0; i < players.length; i++) {
    skills.goalkeeping += players[i].skills.goalkeeping;
    skills.defense += players[i].skills.defense;
    skills.progression += players[i].skills.progression;
    skills.shot += players[i].skills.shot;
  }
  return skills;
}

function getTeamPositionStats(players) {
  let positions = {
    gk: 0, cb: 0, cm: 0, st: 0, lb: 0, lm: 0, lf: 0, rb: 0, rm: 0,rf: 0,
  }

  for (let player of players) {
    positions.gk += player.positions.gk;
    positions.rb += player.positions.rb;
    positions.rm += player.positions.rm;
    positions.rf += player.positions.rf;
    positions.cb += player.positions.cb;
    positions.cm += player.positions.cm;
    positions.st += player.positions.st;
    positions.lb += player.positions.lb;
    positions.lm += player.positions.lm;
    positions.lf += player.positions.lf;
  }

  return positions;
}

function getTeamPositionCount(players) {
  let positions = {
    gk: 0, cb: 0, cm: 0, st: 0, lb: 0, lm: 0, lf: 0, rb: 0, rm: 0,rf: 0,
  }

  for (let player of players) {
    switch (player.positions.position) {
      case "GK": positions.gk += 1; break;
      case "RB": positions.rb += 1; break;
      case "RM": positions.rm += 1; break;
      case "RF": positions.rf += 1; break;
      case "LB": positions.lb += 1; break;
      case "LM": positions.lm += 1; break;
      case "LF": positions.lf += 1; break;
      case "CB": positions.cb += 1; break;
      case "CDM": positions.cm += 1; break;
      case "CM": positions.cm += 1; break;
      case "CAM": positions.cm += 1; break;
      case "ST": positions.st += 1; break;
    }
  }

  return positions;
}
