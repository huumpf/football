import formationData from '../data/formations.json';

export const DRAFT_PLAYERS_PER_PICK = 3;
export const DRAFT_COUNT = 25;
// How many times the draft options can be rerolled across the whole draft.
export const DRAFT_REROLLS = 3;

// Player Stats
export const DRAFT_AVG_POTENTIAL = 50;
export const PLAYER_AGE_MIN = 16;
export const PLAYER_AGE_MAX = 34;
export const PLAYER_OPTAGE_MIN = 28;
export const PLAYER_OPTAGE_MAX = 31;
export const AGE_FACTOR = .95;

// Salary: SALARY_BASE is the pay of an average player (skill =
// DRAFT_AVG_POTENTIAL), raised superlinearly so stars demand disproportionate
// pay — flatter than MV_EXPONENT, so salaries spread less than prices. Greed
// is a flat per-player modifier of 1 ± PLAYER_GREED_SPREAD on top.
export const SALARY_BASE = 18000;
export const SALARY_EXPONENT = 1.8;
export const PLAYER_GREED_SPREAD = 0.15;
export const SALARY_ROUND_STEP = 100;

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
export const MAX_TOTAL_POSITIONS = 2;
export const SECONDARY_POSITION_ROLLS = 2;
export const SECONDARY_POSITION_CHANCE = 0.25;
export const EXTRA_PRIMARY_CHANCE = 0.15;
// Skill penalty applied when a player is played on a secondary position.
export const SECONDARY_POSITION_PENALTY = 0.15;
// Skill penalty when a player is forced onto a position they can't play at all.
// The team-page lineup editor lets you drag any player onto any slot; a wholly
// foreign role costs half their skill (the optimal auto-assignment still treats
// such a pairing as ineligible — see effectiveSkill vs fieldSkill).
export const OUT_OF_POSITION_PENALTY = 0.5;
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

// Season structure: 52 weeks per season. The 18 clubs play a double round
// robin (34 matchdays): the first half runs week 11-27, the second half
// mirrors it week 35-51 with home advantage swapped. All other weeks are
// match-free; week 52 closes the season.
export const SEASON_WEEKS = 52;
export const MATCHDAYS_PER_HALF = CLUBS_PER_LEAGUE; // 18 teams -> 17 rounds
export const FIRST_HALF_START_WEEK = 11;
export const SECOND_HALF_START_WEEK = 35;

// Match simulation: the expected goals of a match are split between the two
// teams by their share of total strength. The exponent stretches the share,
// so a modest skill gap still favours the stronger team noticeably. Used by
// the instant simulateMatch (the other 8 matches of a watched matchday).
export const MATCH_AVG_GOALS = 2.8;
export const MATCH_SKILL_EXPONENT = 4;

// Live match (the one the manager watches): each minute every team rolls once
// for a goal. Evenly matched, a team's per-minute chance is GOAL_CHANCE_PER_MINUTE
// (1/60 -> ~1.5 goals over 90'); the strength share (same exponent as above)
// shifts it toward the stronger side. Stoppage adds 0..MATCH_MAX_STOPPAGE
// minutes, rolled per match. A goal carries an assist GOAL_ASSIST_CHANCE of the
// time (else a solo goal).
export const GOAL_CHANCE_PER_MINUTE = 1 / 60;
export const MATCH_MAX_STOPPAGE = 6;
export const GOAL_ASSIST_CHANCE = 0.75;

// Live player match ratings (goals-only): everyone on the pitch starts at
// MATCH_RATING_BASE; a goal adds MATCH_RATING_GOAL to the scorer and
// MATCH_RATING_ASSIST to the assister. Clamped to 1..10.
export const MATCH_RATING_BASE = 6;
export const MATCH_RATING_GOAL = 1;
export const MATCH_RATING_ASSIST = 0.5;

// Playback speed: real milliseconds per simulated minute (~11s for a full match).
export const MATCH_TICK_MS = 120;

// Club finances
export const CLUB_STARTING_MONEY = 600000;

// A club may not sell below this squad size (starting XI plus 5 bench).
export const MIN_SQUAD_SIZE = 16;

// Matchday bench capacity: everyone outside the XI and the bench sits in the
// (unbounded) reserve. Shared by the team-page editor, the auto-filled team
// sheets and the AI sheet generation so the editor and the match agree.
export const BENCH_SIZE = 9;

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

// AI buying: each week every AI club may sign at most one listed player, and
// only one who beats the club's best player on his position by at least this
// margin (in skill points, on the draft value blend).
export const AI_BUY_MIN_IMPROVEMENT = 5;

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