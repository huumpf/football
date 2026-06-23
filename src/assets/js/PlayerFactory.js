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
  // The calendar week (1..SEASON_WEEKS) the player has his birthday — he ages
  // one year on that week, so the league's players age staggered, not all at once.
  const birthWeek = randomInt(1, CFG.SEASON_WEEKS);

  // Skill: potential decayed by AGE_FACTOR per year of distance to the optimal age.
  const skill = Math.floor(potential * Math.pow(CFG.AGE_FACTOR, Math.abs(age - optimalAge)));

  // Greed: a flat per-player pay modifier, independent of skill.
  const greed = 1 + (Math.random() * 2 - 1) * CFG.PLAYER_GREED_SPREAD;

  // Stamina: the conditioning ceiling drawn for this player's age. Fitness (his
  // current condition) starts full and drains/recovers from here on.
  const stamina = HLP.rollStamina(age);

  // Position & skills: the primary position is drawn from weighted chances
  // (base weight + formation-slot frequency), then the skill is split into a
  // stat profile fitting that position.
  const position = drawPosition();
  const positions = getPositions(position);

  // Additional positions (primary/secondary) the player can play.
  assignExtraPositions(positions);

  // Salary: superlinear in skill (stars demand disproportionate pay), scaled
  // by greed and the extra-position surcharges.
  const baseSalary = CFG.SALARY_BASE * Math.pow(skill / CFG.DRAFT_AVG_POTENTIAL, CFG.SALARY_EXPONENT);
  const salary = Math.round(baseSalary * greed * positionSalaryFactor(positions) / CFG.SALARY_ROUND_STEP) * CFG.SALARY_ROUND_STEP;

  return {
    id: nextPlayerId++,
    firstName: randomItem(Names.firstNames),
    lastName: randomItem(Names.lastNames),
    age,
    birthWeek,
    potential,
    // The potential the player was drawn with; development drifts `potential`
    // away from it and reverts gently back toward it, bounding league drift.
    drawnPotential: potential,
    optimalAge,
    greed,
    // Conditioning ceiling (the "stamina" attribute) and current condition;
    // a player starts fully fresh and fitness drains in matches, recovering
    // weekly toward stamina.
    stamina,
    fitness: CFG.STAMINA_MAX,
    skill,
    // The exact (fractional) skill that continuous weekly development accumulates
    // into; `skill` is its rounded mirror, read everywhere else.
    skillExact: skill,
    // Skill at the start of the current season, snapshot for the UI's season
    // development delta; reset at every season change.
    seasonStartSkill: skill,
    // Skill when the player joined the manager's club (set on ADD_TO_TEAM), and a
    // rolling weekly skill log — both feed the squad list's skill-change column.
    joinSkill: skill,
    skillLog: [],
    positions,
    skills: getSkills(position, skill),
    salary,
    // Per-season match-rating log; feeds the displayed season average note.
    // Reset at every season change.
    season: { games: 0, ratingSum: 0 },
  };
}

// Draws the primary position: each position's chance is proportional to
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

// Rolls for extra positions and records them on `positions` as `primary` and
// `secondary` arrays. The original position is kept as the first primary.
function assignExtraPositions(positions) {
  const original = positions.position;
  const pool = [...(CFG.POSITION_ALTERNATIVES[original] || [])];
  const primary = [original];
  const secondary = [];

  const take = () => pool.splice(Math.floor(Math.random() * pool.length), 1)[0];

  // Two 25% rolls for secondary positions, stopping at the position max.
  for (let i = 0; i < CFG.SECONDARY_POSITION_ROLLS; i++) {
    if (pool.length === 0) break;
    if (primary.length + secondary.length >= CFG.MAX_TOTAL_POSITIONS) break;
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
function positionSalaryFactor(positions) {
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

function getPositions(position) {
  return {
    position,
    sort: POSITION_SORT[position],
  };
}
