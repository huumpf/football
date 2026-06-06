export const teamModule = {
  state: {
    players: [],
    positionStats: { gk: 0, cb: 0, cdm: 0, cm: 0, cam: 0, st: 0, lb: 0, lm: 0, lf: 0, rb: 0, rm: 0,rf: 0, },
    positionCount: { gk: 0, cb: 0, cdm: 0, cm: 0, cam: 0, st: 0, lb: 0, lm: 0, lf: 0, rb: 0, rm: 0,rf: 0, },
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

function getTeamPositionStats(players) {
  let positions = {
    gk: 0, cb: 0, cdm: 0, cm: 0, cam: 0, st: 0, lb: 0, lm: 0, lf: 0, rb: 0, rm: 0,rf: 0,
  }

  for (let player of players) {
    positions.gk += player.positions.gk;
    positions.rb += player.positions.rb;
    positions.rm += player.positions.rm;
    positions.rf += player.positions.rf;
    positions.cb += player.positions.cb;
    positions.cdm += player.positions.cdm;
    positions.cm += player.positions.cm;
    positions.cam += player.positions.cam;
    positions.st += player.positions.st;
    positions.lb += player.positions.lb;
    positions.lm += player.positions.lm;
    positions.lf += player.positions.lf;
  }

  return positions;
}

function getTeamPositionCount(players) {
  let positions = {
    gk: 0, cb: 0, cdm: 0, cm: 0, cam: 0, st: 0, lb: 0, lm: 0, lf: 0, rb: 0, rm: 0,rf: 0,
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