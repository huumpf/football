import * as Names from './Names.js';
import * as CFG from './Config.js';
import * as HLP from './Helpers.js';

export function makeDraftSet() {
  let draftSet = []
  for (let i = 0; i < CFG.DRAFT_PLAYERS_PER_PICK; i++) {
    let player = makePlayer();
    draftSet.push(player);
  }
  return draftSet;
}

export function makePlayer() {
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

  // Skills & position: with POSITION_FREQUENCY_CHANCE the primary position is
  // drawn from the formation-slot frequencies and the roll repeats until it
  // lands there; otherwise a single plain roll stands.
  let targetPosition = Math.random() < CFG.POSITION_FREQUENCY_CHANCE ? draw_weighted_position() : null;
  let attempts = 0;
  do {
    let pos_vertical = Math.floor(Math.random() * 100);
    let pos_horizontal = Math.floor(Math.random() * 100);
    player.skills = get_skills(pos_horizontal, player.skill);
    player.positions = get_pos(player, pos_vertical, pos_horizontal);
  } while (targetPosition && player.positions.position !== targetPosition && ++attempts < 1000);

  // Additional positions (primary/secondary) the player can play.
  assign_extra_positions(player.positions);

  // Salary
  player.salary = Math.round(player.skill * CFG.PLAYER_SALARY_FACTOR * player.greed) / 1000;
  player.salary = Math.round(player.salary.toFixed(2) * 10000);
  player.salary = Math.round(player.salary * position_salary_factor(player.positions));

  return player;

}

// Draws a position from the formation-slot frequencies, so common positions
// (CB, CM, ST) come up more often than rare ones (LF, RF).
function draw_weighted_position() {
  const entries = Object.entries(CFG.POSITION_FREQUENCIES);
  let roll = Math.random() * entries.reduce((sum, [, weight]) => sum + weight, 0);
  for (const [position, weight] of entries) {
    roll -= weight;
    if (roll < 0) return position;
  }
  return entries[entries.length - 1][0];
}

// Rolls for extra positions and records them on `positions` as `primary` and
// `secondary` arrays. The original position is kept as the first primary.
function assign_extra_positions(positions) {
  const original = positions.position;
  const pool = [...(CFG.POSITION_ALTERNATIVES[original] || [])];
  const primary = [original];
  const secondary = [];

  const take = () => pool.splice(Math.floor(Math.random() * pool.length), 1)[0];

  // Two 25% rolls for secondary positions.
  for (let i = 0; i < CFG.SECONDARY_POSITION_ROLLS; i++) {
    if (pool.length === 0) break;
    if (Math.random() < CFG.SECONDARY_POSITION_CHANCE) secondary.push(take());
  }

  // If not already at the max, a single 15% roll for a second primary position.
  if (primary.length + secondary.length < CFG.MAX_TOTAL_POSITIONS && pool.length > 0) {
    if (Math.random() < CFG.EXTRA_PRIMARY_CHANCE) primary.push(take());
  }

  positions.primary = primary;
  positions.secondary = secondary;
}

// Salary multiplier from extra positions: each additional primary adds 15-25 %,
// each secondary adds 10-20 %.
function position_salary_factor(positions) {
  let factor = 1;
  const rnd = (min, max) => Math.random() * (max - min) + min;
  for (let i = 1; i < positions.primary.length; i++) {
    factor += rnd(CFG.EXTRA_PRIMARY_SALARY_MIN, CFG.EXTRA_PRIMARY_SALARY_MAX);
  }
  for (let i = 0; i < positions.secondary.length; i++) {
    factor += rnd(CFG.SECONDARY_SALARY_MIN, CFG.SECONDARY_SALARY_MAX);
  }
  return factor;
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
        positions.st += player.skills.shot;
        if (player.skills.progression / player.skills.defense <= 1.3 && player.skills.progression / player.skills.shot >= 1.3) {
          positions.position = "CDM";
          positions.sort = 4;
          positions.cdm += player.skills.progression;
        } else if (player.skills.progression / player.skills.shot <= 1.3 && player.skills.progression / player.skills.defense >= 1.3) {
          positions.position = "CAM";
          positions.sort = 6;
          positions.cam += player.skills.progression;
        } else {
          positions.position = "CM";
          positions.sort = 5;
          positions.cm += player.skills.progression;
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