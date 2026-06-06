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

export const CLUBS_PER_LEAGUE = 8;

export const formations = [
  {
    name: "5-4-1",
    positions: {
      gk: 1,
      lb: 1,
      cb: 3,
      rb: 1,
      lm: 1,
      cm: 2,
      rm: 1,
      lf: 0,
      st: 1,
      rf: 0,
    }
  },{
    name: "4-5-1",
    positions: {
      gk: 1,
      lb: 1,
      cb: 2,
      rb: 1,
      lm: 1,
      cm: 3,
      rm: 1,
      lf: 0,
      st: 1,
      rf: 0,
    }
  },{
    name: "4-4-2",
    positions: {
      gk: 1,
      lb: 1,
      cb: 2,
      rb: 1,
      lm: 1,
      cm: 2,
      rm: 1,
      lf: 0,
      st: 2,
      rf: 0,
    }
  },{
    name: "4-3-3",
    positions: {
      gk: 1,
      lb: 1,
      cb: 2,
      rb: 1,
      lm: 1,
      cm: 1,
      rm: 1,
      lf: 1,
      st: 1,
      rf: 1,
    }
  },{
    name: "4-1-2-1-2",
    positions: {
      gk: 1,
      lb: 1,
      cb: 2,
      rb: 1,
      cdm: 1,
      lm: 1,
      cm: 0,
      rm: 1,
      cam: 1,
      lf: 0,
      st: 2,
      rf: 0,
    }
  },{
    name: "4-2-3-1",
    positions: {
      gk: 1,
      lb: 1,
      cb: 2,
      rb: 1,
      cdm: 2,
      lm: 1,
      cm: 0,
      rm: 1,
      cam: 1,
      lf: 0,
      st: 1,
      rf: 0,
    }
  },
]