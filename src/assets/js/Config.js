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
export const POSITION_OFFSET_WING = 30;
export const POSITION_GK = 13;
export const PLAYER_SALARY_FACTOR = 36;

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