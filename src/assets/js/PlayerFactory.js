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

  // Position & skills: the primary position is drawn from weighted chances
  // (base weight + formation-slot frequency), then the skill is split into a
  // stat profile fitting that position.
  let position = draw_position();
  player.skills = get_skills(position, player.skill);
  player.positions = get_pos(position, player);

  // Additional positions (primary/secondary) the player can play.
  assign_extra_positions(player.positions);

  // Salary
  player.salary = Math.round(player.skill * CFG.PLAYER_SALARY_FACTOR * player.greed) / 1000;
  player.salary = Math.round(player.salary.toFixed(2) * 10000);
  player.salary = Math.round(player.salary * position_salary_factor(player.positions));

  return player;

}

// Draws the primary position: each position's chance is proportional to
// POSITION_BASE_WEIGHT plus how often it appears across all formation slots.
function draw_position() {
  const entries = Object.entries(CFG.POSITION_FREQUENCIES);
  let roll = Math.random() * entries.reduce((sum, [, frequency]) => sum + CFG.POSITION_BASE_WEIGHT + frequency, 0);
  for (const [position, frequency] of entries) {
    roll -= CFG.POSITION_BASE_WEIGHT + frequency;
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

// List sort order per position (GK first, forwards last).
const POSITION_SORT = {
  GK: 0, CB: 1, LB: 2, RB: 3, CDM: 4, CM: 5,
  CAM: 6, LM: 7, RM: 8, ST: 9, LF: 10, RF: 11,
};

// Splits the total skill into a stat profile fitting the position: the
// position's main stat takes a randomised share, the rest goes to the
// supporting stats. Defenders have no shot, forwards no defense.
function get_skills(position, skill) {
  let skills = {
    goalkeeping: 0,
    defense: 0,
    progression: 0,
    shot: 0,
  };
  const share = (min, max) => Math.round(skill * (Math.random() * (max - min) + min));

  switch (position) {
    case "GK":
      skills.goalkeeping = skill;
      break;
    case "CB": case "LB": case "RB":
      skills.defense = share(0.6, 0.85);
      skills.progression = skill - skills.defense;
      break;
    case "ST": case "LF": case "RF":
      skills.shot = share(0.6, 0.85);
      skills.progression = skill - skills.shot;
      break;
    case "CDM":
      skills.progression = share(0.35, 0.5);
      skills.defense = Math.round((skill - skills.progression) * (Math.random() * 0.2 + 0.7));
      skills.shot = skill - skills.progression - skills.defense;
      break;
    case "CAM":
      skills.progression = share(0.35, 0.5);
      skills.shot = Math.round((skill - skills.progression) * (Math.random() * 0.2 + 0.7));
      skills.defense = skill - skills.progression - skills.shot;
      break;
    case "CM": case "LM": case "RM":
      skills.progression = share(0.4, 0.6);
      skills.defense = Math.round((skill - skills.progression) * Math.random());
      skills.shot = skill - skills.progression - skills.defense;
      break;
  }

  return skills;
}

function get_pos(position, player) {
  let positions = {
    position,
    sort: POSITION_SORT[position],
    gk:0, lb:0, lm:0, lf:0, cb:0, cdm:0, cm:0, cam:0, st:0, rb:0, rm:0, rf:0
  };
  positions[position.toLowerCase()] = player.skill;
  return positions;
}