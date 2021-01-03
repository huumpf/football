const Names = require('./Names.js');
const CFG = require('./Config.js');

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
    pos_horizontal: String,
    pos_vertical: Number,
    positions: Object,
    skills: Object,
  };

  // Name
  player.firstName = Names.firstNames[Math.floor(Math.random() * Names.firstNames.length)];
  player.lastName = Names.lastNames[Math.floor(Math.random() * Names.lastNames.length)];

  // Age
  player.age = Math.floor(Math.random() * 20) + 16;

  // Skill
  player.skill = Math.floor(Math.random() * 50) + 30;

  // Salary
  player.salary = player.skill * 1000;

  // Positions: Initial Roll
  let pos_vertical = Math.floor(Math.random() * 100);
  let pos_horizontal = Math.floor(Math.random() * 100);

  player.skills = get_skills(pos_vertical, player.skill);

  // Positions: Goalkeeper
  if (pos_vertical <= CFG.POSITION_GK) { 
    player.positions.position = "GK";
  // Positions: LEFT
  } else if (pos_vertical > CFG.POSITION_GK && pos_horizontal < CFG.POSITION_OFFSET_WING) {
    player.positions.position = "L";
  // Positions: RIGHT
  } else if (pos_vertical > CFG.POSITION_GK && pos_horizontal > 100 - CFG.POSITION_OFFSET_WING) {
    player.positions.position = "R";
  // Positions: CENTER
  } else if (pos_vertical > CFG.POSITION_GK && pos_horizontal < CFG.POSITION_OFFSET_WING && pos_horizontal > 100 - CFG.POSITION_OFFSET_WING) {
    player.positions.position = "C";
  }
  
  player.positions = get_pos(pos_vertical, pos_horizontal);

console.log(player);

  return player;
}

function get_skills(pos_vertical, skill) {
  let skills = {
    goalkeeping: 0,
    defense: 0,
    progression: 0,
    shot: 0,
  };

  if (pos_vertical <= CFG.POSITION_GK) {
    skills.goalkeeping = skill;
  } else {
    skills.defense = Math.floor(Math.random() * skill * 0.8);
    if (skills.defense > skill / 2) {
      skills.progression = skill - skills.defense;
    } else {
      let rem = skill - skills.defense;
      skills.progression = Math.floor(Math.random() * rem);
      skills.shot = skill - skills.progression - skills.shot;
      if (skills.shot > skill / 2) {
        skills.progression += skills.defense;
        skills.defense = 0;
      }
    }
  }

  return skills;
}

function get_pos(vert, hor) {

  let positions = { 
    position: String,
    gk:0, lb:0, lm:0, lf:0, cb:0, cdm:0, cm:0, cam:0, st:0, rb:0, rm:0, rf:0 
  };

  if (vert <= CFG.POSITION_GK) {
    positions.position = "GK";
    positions.gk = 1;
  } else {
    // Left side
    if (hor < CFG.POSITION_OFFSET_WING && vert <= CFG.POSITION_WB) {
      positions.position = "LB";
      positions.gk = 1;
    } else if (hor < CFG.POSITION_OFFSET_WING && vert > CFG.POSITION_WB && vert <= CFG.POSITION_WC) {
      positions.position = "LM";
      positions.lb = 1;
    } else if (hor < CFG.POSITION_OFFSET_WING && vert > CFG.POSITION_WC && vert <= CFG.POSITION_WA) {
      positions.position = "LF";
      positions.lf = 1;
    }
    // Right side
    else if (hor > 100 - CFG.POSITION_OFFSET_WING && vert <= CFG.POSITION_WB) {
      positions.position = "RB";
      positions.rb = 1;
    } else if (hor > 100 - CFG.POSITION_OFFSET_WING && vert > CFG.POSITION_WB && vert <= CFG.POSITION_WC) {
      positions.position = "RM";
      positions.rm = 1;
    } else if (hor > 100 - CFG.POSITION_OFFSET_WING && vert > CFG.POSITION_WC && vert <= CFG.POSITION_WA) {
      positions.position = "RF";
      positions.rf = 1;
    }
    // Center
    else if (hor >= CFG.POSITION_OFFSET_WING && hor <= 100 - CFG.POSITION_OFFSET_WING && vert <= CFG.POSITION_CB) {
      positions.position = "CB";
      positions.cb = 1;
    } else if (hor >= CFG.POSITION_OFFSET_WING && hor <= 100 - CFG.POSITION_OFFSET_WING && vert > CFG.POSITION_CB && vert <= CFG.POSITION_CDM) {
      positions.position = "CDM";
      positions.cdm = 1;
    } else if (hor >= CFG.POSITION_OFFSET_WING && hor <= 100 - CFG.POSITION_OFFSET_WING && vert > CFG.POSITION_CDM && vert <= CFG.POSITION_CM) {
      positions.position = "CM";
      positions.cm = 1;
    } else if (hor >= CFG.POSITION_OFFSET_WING && hor <= 100 - CFG.POSITION_OFFSET_WING && vert > CFG.POSITION_CM && vert <= CFG.POSITION_CAM) {
      positions.position = "CAM";
      positions.cam = 1;
    } else if (hor >= CFG.POSITION_OFFSET_WING && hor <= 100 - CFG.POSITION_OFFSET_WING && vert > CFG.POSITION_CAM && vert <= CFG.POSITION_ST) {
      positions.position = "ST";
      positions.st = 1;
    }
  }

  return positions;
}