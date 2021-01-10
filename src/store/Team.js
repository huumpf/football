export const teamModule = {
  namspaced: true,

  state: {
    players: [],
    positionCount: { gk: 0, cb: 0, cdm: 0, cm: 0, cam: 0, st: 0, lb: 0, lm: 0, lf: 0, rb: 0, rm: 0,rf: 0, },
    skillCount: { goalkeeping: 0, defense: 0, progression: 0, shot: 0, },
  },

  mutations: {
    ADD_TO_TEAM(state, player) {
      state.players.push(player);
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

  modules: {
    
  }
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

function getTeamPositionCount(players) {
  let positions = {
    gk: 0, cb: 0, cm: 0, st: 0, lb: 0, lm: 0, lf: 0, rb: 0, rm: 0,rf: 0,
  }

  for (let i=0; i < players.length; i++) {
    positions.gk += players[i].positions.gk;
    positions.rb += players[i].positions.rb;
    positions.rm += players[i].positions.rm;
    positions.rf += players[i].positions.rf;
    positions.cb += players[i].positions.cb;
    positions.cm += players[i].positions.cm;
    positions.st += players[i].positions.st;
    positions.lb += players[i].positions.lb;
    positions.lm += players[i].positions.lm;
    positions.lf += players[i].positions.lf;
  }

  return positions;
}