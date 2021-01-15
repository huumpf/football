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
    potential: Number,
    optimal_age: Number,
    greed: Number,
    skill: Number,
    positions: Object,
    skills: Object,
    salary: Number,
  };

  // Name
  player.firstName = Names.firstNames[Math.floor(Math.random() * Names.firstNames.length)];
  player.lastName = Names.lastNames[Math.floor(Math.random() * Names.lastNames.length)];

  // Potential
  player.potential = HLP.getBiasedRnd (0, 100, CFG.DRAFT_AVG_POTENTIAL, 1, 0.7);

  // Age
  player.age = Math.floor((Math.random() * (CFG.PLAYER_AGE_MAX - CFG.PLAYER_AGE_MIN)) + CFG.PLAYER_AGE_MIN);

  // Optimal Age
  player.optimal_age = Math.floor((Math.random() * (CFG.PLAYER_OPTAGE_MAX - CFG.PLAYER_OPTAGE_MIN)) + CFG.PLAYER_OPTAGE_MIN);

  // Skill
  let away_from_opt_age = Math.abs(player.age - player.optimal_age);
  player.skill = player.potential;
  for (let i=0; i < away_from_opt_age; i++) {
    player.skill = player.skill * CFG.AGE_FACTOR;
  }
  player.skill = Math.floor(player.skill);

  // Greed
  let skill_factor = Math.pow(player.skill / CFG.DRAFT_AVG_POTENTIAL, 2);
  player.greed = ((Math.random() * CFG.PLAYER_GREED_DIFFERENCE - CFG.PLAYER_GREED_DIFFERENCE/2) * skill_factor) + 1;

  // Skills
  let pos_vertical = Math.floor(Math.random() * 100);
  let pos_horizontal = Math.floor(Math.random() * 100);
  player.skills = get_skills(pos_horizontal, player.skill);
  player.positions = get_pos(player, pos_vertical, pos_horizontal);

  // Salary
  player.salary = Math.round(player.skill * CFG.PLAYER_SALARY_FACTOR * player.greed) / 1000;
  player.salary = Math.round(player.salary.toFixed(2) * 10000);

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
  } else {

    skills.defense = Math.floor(HLP.getBiasedRnd(0, skill, skill/3, 1, 0.7));
    skills.progression = Math.floor(HLP.getBiasedRnd(0, skill - skills.defense, (skill - skills.defense)/2, 1, 0.7));
    skills.shot = skill - skills.defense - skills.progression;

    if (skills.defense >= skills.progression && skills.defense >= skills.shot) {
      skills.defense += Math.round(skills.shot/3 * 2);
      skills.progression += Math.round(skills.shot/3);
      skills.shot = 0;
    } else if (skills.shot > skills.progression && skills.shot > skills.defense) {
      skills.shot += Math.round(skills.defense/3 * 2);
      skills.progression += Math.round(skills.defense/3);
      skills.defense = 0;
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
        positions.sort = 7;
        positions.lb += player.skills.defense;
        positions.lm += player.skills.progression;
        positions.lf += player.skills.shot;
      } else if (pos_horizontal > 100 - CFG.POSITION_OFFSET_WING) {
        positions.position = "RM";
        positions.sort = 8;
        positions.rb += player.skills.defense;
        positions.rm += player.skills.progression;
        positions.rf += player.skills.shot;
      } else if (pos_horizontal >= CFG.POSITION_OFFSET_WING && pos_horizontal <= 100 - CFG.POSITION_OFFSET_WING) {
        positions.cb += player.skills.defense;
        positions.cm += player.skills.progression;
        positions.st += player.skills.shot;
        if (player.skills.progression / player.skills.defense <= 1.3 && player.skills.progression / player.skills.shot >= 1.3) {
          positions.position = "CM"; // CDM
          positions.sort = 5; // 4 for CDM
        } else if (player.skills.progression / player.skills.shot <= 1.3 && player.skills.progression / player.skills.defense >= 1.3) {
          positions.position = "CM"; // CAM
          positions.sort = 5; // 6 for CAM
        } else {
          positions.position = "CM";
          positions.sort = 5;
        }
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
        positions.sort = 10;
        positions.lf += player.skills.shot;
        positions.lm += player.skills.progression;
      } else if (pos_horizontal > 100 - CFG.POSITION_OFFSET_WING) {
        positions.position = "RF";
        positions.sort = 11;
        positions.rf += player.skills.shot;
        positions.rm += player.skills.progression;
      } else {
        positions.position = "ST";
        positions.sort = 9;
        positions.st += player.skills.shot;
        positions.cm += player.skills.progression;
      }
    }
  }

  return positions;
}