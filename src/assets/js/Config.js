import formationData from '../data/formations.json';

export const DRAFT_PLAYERS_PER_PICK = 3;
export const DRAFT_COUNT = 20;

// Player Stats
export const DRAFT_AVG_POTENTIAL = 50;
export const PLAYER_AGE_MIN = 16;
export const PLAYER_AGE_MAX = 34;
export const PLAYER_OPTAGE_MIN = 28;
export const PLAYER_OPTAGE_MAX = 31;
export const PLAYER_GREED_DIFFERENCE = .8;
export const AGE_FACTOR = .95;

// Player Positions
export const PLAYER_SALARY_FACTOR = 36;

// A player's primary position is drawn with a chance proportional to
// POSITION_BASE_WEIGHT plus the position's frequency across all formation
// slots, so common lineup positions (CB) come up about four times as often
// as rare ones (LF) while every position stays in supply.
export const POSITION_BASE_WEIGHT = 10;
export const POSITION_FREQUENCIES = {
  GK: 15, CB: 35, CM: 28, ST: 22, LB: 12, RB: 12,
  LM: 10, RM: 10, CAM: 9, CDM: 8, LF: 2, RF: 2,
};

// Multiple positions per player
export const MAX_TOTAL_POSITIONS = 3;
export const SECONDARY_POSITION_ROLLS = 2;
export const SECONDARY_POSITION_CHANCE = 0.25;
export const EXTRA_PRIMARY_CHANCE = 0.15;
// Skill penalty applied when a player is played on a secondary position.
export const SECONDARY_POSITION_PENALTY = 0.25;
// Salary surcharges per extra position (random within each range).
export const EXTRA_PRIMARY_SALARY_MIN = 0.15;
export const EXTRA_PRIMARY_SALARY_MAX = 0.25;
export const SECONDARY_SALARY_MIN = 0.10;
export const SECONDARY_SALARY_MAX = 0.20;

// Positions a player can additionally learn, keyed by their original position.
// Used for both extra primary and secondary positions. GK learns none.
export const POSITION_ALTERNATIVES = {
  GK: [],
  LB: ["RB", "LM", "CB"],
  RB: ["LB", "RM", "CB"],
  CB: ["RB", "LB", "CDM"],
  CDM: ["CB", "CM"],
  CM: ["CDM", "CAM"],
  CAM: ["ST", "CM"],
  LM: ["LB", "LF", "CM"],
  RM: ["RB", "RF", "CM"],
  LF: ["LM", "ST"],
  RF: ["RM", "ST"],
  ST: ["CAM", "LF", "RF"],
};

// AI clubs in the league (player's club makes it 18).
export const CLUBS_PER_LEAGUE = 17;

// Club finances
export const CLUB_STARTING_MONEY = 600000;

// A club may not sell below this squad size (starting XI plus 5 bench).
export const MIN_SQUAD_SIZE = 16;

// Market value: blend of current skill and the projected skill a few years
// ahead (same idea as AI draft picks), raised to an exponent so stars cost
// disproportionately more. MV_BASE is the value of an average player
// (skill blend = DRAFT_AVG_POTENTIAL); values round to MV_ROUND_STEP.
export const MV_FUTURE_WEIGHT = 0.3;
export const MV_HORIZON_YEARS = 4;
export const MV_BASE = 100000;
export const MV_EXPONENT = 2.5;
export const MV_ROUND_STEP = 5000;

// Transfer listings an AI club puts up at most.
export const AI_LISTINGS_MAX = 3;

// AI draft picks: value blends current skill with the projected skill a few
// years ahead, so younger players win ties against declining ones.
export const AI_PICK_FUTURE_WEIGHT = 0.3;
export const AI_PICK_HORIZON_YEARS = 4;

// Formations are defined in src/assets/data/formations.json: per slot a
// position plus its relative pitch coordinate (x = sideline to sideline,
// y = own goal to opposing goal). Derive the per-position slot counts the
// assignment logic works with; keep the raw slot list as `layout` for the UI.
export const formations = formationData.formations.map(f => {
  const positions = {};
  for (const slot of f.positions) {
    const key = slot.position.toLowerCase();
    positions[key] = (positions[key] || 0) + 1;
  }
  return { name: f.name, positions, layout: f.positions };
});