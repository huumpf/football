const Names = require('./Names.js');
const CFG = require('./Config.js');
const HLP = require('./Helpers.js');

export function makeDraftSet() {
  let draftSet = []
  for (let i = 0; i < CFG.DRAFT_PLAYERS_PER_PICK; i++) {
    let player = makePlayer();
    draftSet.push(player);
  }
  return draftSet;
}

function makePlayer() {
  let player = {
    firstName: String,
    lastName: String,
    age: Number,
    skill: Number,
    salary: Number,
    positions: Object,
    skills: Object,
  };

  // Name
  player.firstName = Names.firstNames[Math.floor(Math.random() * Names.firstNames.length)];
  player.lastName = Names.lastNames[Math.floor(Math.random() * Names.lastNames.length)];

  // Age
  player.age = Math.floor(Math.random() * 20) + 16;

  // Skill
  player.skill = Math.floor(HLP.getBiasedRnd(0, 100, CFG.DRAFT_AVG_POTENTIAL, 1, 0.7));

  // Salary
  player.salary = player.skill * 1000;

  // Skills
  let pos_vertical = Math.floor(Math.random() * 100);
  let pos_horizontal = Math.floor(Math.random() * 100);
  player.skills = get_skills(pos_horizontal, player.skill);
  player.positions = get_pos(player, pos_vertical, pos_horizontal);

  return player;
}

function get_skills(pos_horizontal, skill) {
  let skills = {
    goalkeeping: 0,
    defense: 0,
    progression: 0,
    shot: 0,
  };

  if (pos_horizontal <= CFG.POSITION_GK) {
    skills.goalkeeping = skill;
    return skills;
  } else if (pos_horizontal > CFG.POSITION_GK) {
    skills.defense = Math.floor(HLP.getBiasedRnd(0, skill, skill/3, 1, 0.5));
    if (skills.defense > skill / 2) {
      skills.progression = skill - skills.defense;
    } else {
      let rem = skill - skills.defense;
      skills.progression = Math.floor(HLP.getBiasedRnd(0, rem, rem/2, 1, 0.5));
      skills.shot = skill - skills.progression - skills.shot;
      if (skills.shot > skill / 2) {
        skills.progression += skills.defense;
        skills.defense = 0;
      }
    }
    return skills;
  }

}

function get_pos(player, pos_vertical, pos_horizontal) {

  let positions = { 
    position: "",
    gk:0, lb:0, lm:0, lf:0, cb:0, cdm:0, cm:0, cam:0, st:0, rb:0, rm:0, rf:0 
  };
  // Positions: Goalkeeper
  if (pos_horizontal <= CFG.POSITION_GK) {
    positions.position = "GK";
    positions.gk += player.skill;
    positions.sort = 0;
  }

  if (player.skills.goalkeeping === 0) {
    if (player.skills.defense !== 0 && player.skills.progression !== 0 && player.skills.shot !== 0 || player.skills.defense === 0 && player.skills.shot <= player.skills.progression) {
      if (pos_horizontal < CFG.POSITION_OFFSET_WING) {
        positions.position = "LM";
        positions.sort = 5;
        positions.lb += player.skills.defense;
        positions.lm += player.skills.progression;
        positions.lf += player.skills.shot;
      } else if (pos_horizontal > 100 - CFG.POSITION_OFFSET_WING) {
        positions.position = "RM";
        positions.sort = 6;
        positions.rb += player.skills.defense;
        positions.rm += player.skills.progression;
        positions.rf += player.skills.shot;
      } else if (pos_horizontal >= CFG.POSITION_OFFSET_WING && pos_horizontal <= 100 - CFG.POSITION_OFFSET_WING) {
        positions.position = "CM";
        positions.sort = 4;
        positions.cb += player.skills.defense;
        positions.cm += player.skills.progression;
        positions.st += player.skills.shot;
      }
    } else if (player.skills.shot === 0) {
      if (pos_horizontal < CFG.POSITION_OFFSET_WING) {
        positions.position = "LB";
        positions.sort = 2;
        positions.lb += player.skills.defense;
        positions.lm += player.skills.progression;
      } else if (pos_horizontal > 100 - CFG.POSITION_OFFSET_WING) {
        positions.position = "RB";
        positions.sort = 3;
        positions.rb += player.skills.defense;
        positions.rm += player.skills.progression;
      } else if (pos_horizontal >= CFG.POSITION_OFFSET_WING && pos_horizontal <= 100 - CFG.POSITION_OFFSET_WING) {
        positions.position = "CB";
        positions.sort = 1;
        positions.cb += player.skills.defense;
        positions.cm += player.skills.progression;
      }
    } else if (player.skills.defense === 0 && player.skills.shot > player.skills.progression) {
      if (pos_horizontal < CFG.POSITION_OFFSET_WING) {
        positions.position = "LF";
        positions.sort = 8;
        positions.lf += player.skills.shot;
        positions.lm += player.skills.progression;
      } else if (pos_horizontal > 100 - CFG.POSITION_OFFSET_WING) {
        positions.position = "RF";
        positions.sort = 9;
        positions.rf += player.skills.shot;
        positions.rm += player.skills.progression;
      } else {
        positions.position = "ST";
        positions.sort = 7;
        positions.st += player.skills.shot;
        positions.cm += player.skills.progression;
      }
    }
  }

  return positions;
}