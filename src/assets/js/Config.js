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
  },
]