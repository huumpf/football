import * as Names from './Names.js';
import * as CFG from './Config.js';
import * as HLP from './Helpers.js';

let nextPlayerId = 1;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function makeDraftSet() {
  let draftSet = []
  for (let i = 0; i < CFG.DRAFT_PLAYERS_PER_PICK; i++) {
    let player = makePlayer();
    draftSet.push(player);
  }
  return draftSet;
}

export function makePlayer() {
  const potential = HLP.getBiasedRnd(0, 100, CFG.DRAFT_AVG_POTENTIAL, 1, 0.7);
  const age = randomInt(CFG.PLAYER_AGE_MIN, CFG.PLAYER_AGE_MAX);
  const optimalAge = randomInt(CFG.PLAYER_OPTAGE_MIN, CFG.PLAYER_OPTAGE_MAX);

  // Skill: potential decayed by AGE_FACTOR per year of distance to the optimal age.
  const skill = Math.floor(potential * Math.pow(CFG.AGE_FACTOR, Math.abs(age - optimalAge)));

  // Greed: a flat per-player pay modifier, independent of skill.
  const greed = 1 + (Math.random() * 2 - 1) * CFG.PLAYER_GREED_SPREAD;

  // Position & skills: the position is drawn from weighted chances
  // (base weight + formation-slot frequency), then the skill is split into a
  // stat profile fitting that position.
  const position = drawPosition();
  const positions = rollPositions(position);

  // Salary: superlinear in skill (stars demand disproportionate pay), scaled
  // by greed and the second-position surcharge.
  const baseSalary = CFG.SALARY_BASE * Math.pow(skill / CFG.DRAFT_AVG_POTENTIAL, CFG.SALARY_EXPONENT);
  const salary = Math.round(baseSalary * greed * positionSalaryFactor(positions) / CFG.SALARY_ROUND_STEP) * CFG.SALARY_ROUND_STEP;

  return {
    id: nextPlayerId++,
    firstName: randomItem(Names.firstNames),
    lastName: randomItem(Names.lastNames),
    age,
    potential,
    optimalAge,
    greed,
    skill,
    positions,
    positionSort: POSITION_SORT[position],
    skills: getSkills(position, skill),
    salary,
  };
}

// Draws the position: each position's chance is proportional to
// POSITION_BASE_WEIGHT plus how often it appears across all formation slots.
function drawPosition() {
  const entries = Object.entries(CFG.POSITION_FREQUENCIES);
  let roll = Math.random() * entries.reduce((sum, [, frequency]) => sum + CFG.POSITION_BASE_WEIGHT + frequency, 0);
  for (const [position, frequency] of entries) {
    roll -= CFG.POSITION_BASE_WEIGHT + frequency;
    if (roll < 0) return position;
  }
  return entries[entries.length - 1][0];
}

// The positions a player can play: the original position, plus a single roll
// for a second one drawn from the original's alternatives.
function rollPositions(original) {
  const pool = CFG.POSITION_ALTERNATIVES[original] || [];
  const positions = [original];
  if (pool.length > 0 && Math.random() < CFG.SECOND_POSITION_CHANCE) {
    positions.push(randomItem(pool));
  }
  return positions;
}

// Salary multiplier from positions: a second position adds 15-25 %.
function positionSalaryFactor(positions) {
  if (positions.length < 2) return 1;
  return 1 + Math.random()
    * (CFG.SECOND_POSITION_SALARY_MAX - CFG.SECOND_POSITION_SALARY_MIN)
    + CFG.SECOND_POSITION_SALARY_MIN;
}

// List sort order per position (GK first, forwards last).
const POSITION_SORT = {
  GK: 0, CB: 1, LB: 2, RB: 3, CDM: 4, CM: 5,
  CAM: 6, LM: 7, RM: 8, ST: 9, LF: 10, RF: 11,
};

// Splits the total skill into a stat profile fitting the position: the
// position's main stat takes a randomised share, the rest goes to the
// supporting stats. Defenders have no shot, forwards no defense.
function getSkills(position, skill) {
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
