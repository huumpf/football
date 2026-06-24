import formationData from '../data/formations.json';
import injuryData from '../data/injuries.json';

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

// --- Continuous player development (applied every week) -----------------
// Each week a player's skill chases its natural age-curve value (projectedSkill,
// the "target"); match weeks add a performance push, and the potential (ceiling)
// drifts slowly. See HLP.developPlayers. Steps are tiny because they apply ~52x
// per season (34 match weeks + ~18 training weeks).
//
// DEV_BASELINE is the empirical mean match rating per role, measured from a
// no-development league sim (overall ~6.27, attackers ~6.71 vs defenders ~6.10).
// Performance is `rating - DEV_BASELINE[role]`, so the push is league-wide
// zero-sum and the flat 6.0 baseline's positive/attacking bias is removed.
export const DEV_BASELINE = { GK: 6.15, DEF: 6.10, MID: 6.28, ATT: 6.71 };
export const DEV_CONVERGE = 0.05;        // fraction of the gap to target closed per week (natural growth)
export const DEV_PERF_RATE = 0.10;       // skill push per (rating point over baseline) on a match week
export const DEV_PERF_CAP = 2.0;         // clamp rating-baseline to +/- this
export const DEV_TRAIN_WEIGHT = 0.3;     // convergence weight for bench/reserve (no minutes)
export const DEV_POT_RATE = 0.045;       // potential drift per (rating point over baseline) on a match week
export const DEV_POT_REVERSION = 0.012;  // weekly pull of potential back toward its drawn value
// Younger players learn more from playing: the performance push and potential
// drift are scaled by 1 + DEV_YOUTH_BONUS * max(0, (optimalAge - age) / 12), so a
// teenager gains up to ~+50-60% per good game, a peak/declining player gets none.
export const DEV_YOUTH_BONUS = 0.5;

// Skill-change column in the squad list: the timeframe the change is measured
// over, chosen from the list header's flyout. "Last N weeks" reads a rolling
// per-player weekly skill log (kept DEV_HISTORY_WEEKS long, the longest window);
// "This season" and "Since joining" read the seasonStartSkill / joinSkill marks.
export const DEV_TIMEFRAMES = [
  { key: 'w5', label: 'Last 5 weeks', weeks: 5 },
  { key: 'w10', label: 'Last 10 weeks', weeks: 10 },
  { key: 'w20', label: 'Last 20 weeks', weeks: 20 },
  { key: 'season', label: 'This season' },
  { key: 'join', label: 'Since joining my club' },
];
export const DEV_HISTORY_WEEKS = 20;
export const DEV_DEFAULT_TIMEFRAME = 'season';

// --- Player stamina & fitness -------------------------------------------
// `stamina` is a player's conditioning ceiling (the corridor-drawn attribute);
// `fitness` is his current condition (0..stamina), shown as the row's ring. A
// full match drains fitness; every week it recovers a fraction of the gap back
// up toward `stamina`. The balance (regen vs drain) is tuned so a well-
// conditioned player sustains a match a week while a poorly-conditioned or old
// one must be rested to recover. Older players draw a lower ceiling.
export const STAMINA_MAX = 100;          // hard ceiling for stamina and fitness
export const STAMINA_MEAN = 88;          // mean conditioning ceiling at the prime age
export const STAMINA_SPREAD = 0.13;      // ±13% cross-player divergence (~26% extreme-to-extreme)
export const STAMINA_MIN_ROLL = 50;      // floor for the rolled ceiling
export const STAMINA_PRIME_AGE = 24;     // no age penalty up to this age
export const STAMINA_AGE_PENALTY = 1.2;  // ceiling points lost per year past the prime age
// Every player starts each season at full fitness (STAMINA_MAX) and holds it
// through the match-free pre-season. A full match then drains FITNESS_MATCH_DRAIN
// and each week he recovers FITNESS_REGEN_RATE of the gap back up toward his
// ceiling. So once matches begin a weekly starter settles at
// stamina - FITNESS_MATCH_DRAIN: young/strong players sit in the yellow band
// (sustainable), older/weaker ones sink into the red and must be rested.
export const FITNESS_MATCH_DRAIN = 30;   // fitness a full match costs a starter
export const FITNESS_REGEN_RATE = 0.5;   // fraction of the gap to the ceiling recovered each week
// Performance malus: at/above FITNESS_PERF_FULL a player is at full strength; it
// scales his effective skill down linearly to FITNESS_PERF_MIN at zero fitness.
// Kept below the weekly-starter equilibrium band so a fresh player is unpenalised
// and an in-rotation one only mildly so, while a red (overplayed) one is hit hard.
export const FITNESS_PERF_FULL = 72;
export const FITNESS_PERF_MIN = 0.6;
// Ring colour tiers (fitness, 0..100): >= GOOD green, >= OK yellow, else red.
export const FITNESS_TIER_GOOD = 85;
export const FITNESS_TIER_OK = 40;

// --- Injuries -----------------------------------------------------------
// Every minute each on-pitch player rolls for an injury at probability
//   p = INJURY_BASE_RATE * injuryProneness * (1 + INJURY_FATIGUE_WEIGHT * (1 - fitness/STAMINA_MAX))
// so the base 0.05%/minute is personalised by the player's hidden
// `injuryProneness` (0 = resistant .. 1 = glass-cannon, drawn biased-low) and
// amplified as his current fitness drops (a tired player gets hurt more often).
// On a hit an injury is drawn from the pool weighted by `likelihood`, with a
// hidden exact duration rolled inside its recovery_weeks range, and the player
// is substituted off (see the substitution block). While injured a player can't
// play, sits pinned at INJURY_FITNESS_INJURED, and recovers each week; once the
// drawn weeks elapse the injury clears and fitness is restored to
// INJURY_FITNESS_RECOVERED (rest restores more than match play). Injury counts
// are linear in INJURY_BASE_RATE — the single knob to dial the whole league's
// injury frequency up or down.
export const INJURY_BASE_RATE = 0.0005;   // base per-minute, per-player hazard
export const INJURY_FATIGUE_WEIGHT = 1.5; // extra risk at zero fitness (1 + this = max multiplier)
export const INJURY_PRONENESS_SKEW = 2;   // exponent on a uniform draw -> proneness biased toward 0
export const INJURY_FITNESS_INJURED = 20; // fitness an injured player is pinned at each week
export const INJURY_FITNESS_RECOVERED = 50; // fitness restored when the injury clears

// The injury pool (src/assets/data/injuries.json) pre-parsed: the "X-Y"
// recovery_weeks string is kept verbatim for the (vague) tooltip and also split
// into the integer bounds the hidden duration is drawn within. The summed
// likelihood is the denominator for the weighted pick.
export const INJURIES = injuryData.injuries.map(entry => {
  const [min, max] = entry.recovery_weeks.split('-').map(Number);
  return {
    name: entry.name,
    recovery_weeks: entry.recovery_weeks,
    minWeeks: min,
    maxWeeks: max,
    likelihood: entry.likelihood,
  };
});
export const INJURY_LIKELIHOOD_TOTAL = INJURIES.reduce((sum, e) => sum + e.likelihood, 0);

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
// teams by their share of total strength. The exponent stretches the share, so
// a modest skill gap still favours the stronger team noticeably. The share maths
// drive both the fallback Poisson simulateMatch and the live duel engine's
// per-minute chance rate.
export const MATCH_AVG_GOALS = 2.8;
export const MATCH_SKILL_EXPONENT = 4;

// Live match (the one the manager watches): played minute by minute by the duel
// engine below. Stoppage adds 0..MATCH_MAX_STOPPAGE minutes, rolled per match. A
// goal carries an assist GOAL_ASSIST_CHANCE of the time (else a solo goal).
export const MATCH_MAX_STOPPAGE = 6;
export const GOAL_ASSIST_CHANCE = 0.75;

// --- Live match engine: per-minute duels --------------------------------
// Each minute every team rolls (at CHANCE_PER_MINUTE, scaled by its strength
// share like the goal chance used to be) for a goal-scoring chance. A chance is
// a duel: an attacker (weighted by shot+progression) takes on a defender of the
// opposing side and their keeper. The chance converts to a goal with
//   pGoal = CONVERSION_BASE * O^k / (O^k + D^k)
// where O is the attacker's offence, D the defender's defence plus the keeper's
// goalkeeping scaled by GK_DUEL_FACTOR, and k = DUEL_EXPONENT. A non-goal is
// split into a keeper save or a defender block. Weaker defenders are targeted
// more often (see the engine), so fielding a strong striker against a weak
// centre-back yields more goals and shifts both players' ratings.
export const CHANCE_PER_MINUTE = 1 / 13;
export const DUEL_EXPONENT = 1.7;
export const GK_DUEL_FACTOR = 0.5;
export const CONVERSION_BASE = 0.9;
// An attacker's offence and a defender's defence for the duel maths: shot leads,
// progression helps a little.
export const ATTACK_PROGRESSION_WEIGHT = 0.4;

// Cards: each minute a team may concede a foul (FOUL_CHANCE_PER_MINUTE); the
// fouling player (weighted toward defenders/midfielders) is booked. A fraction
// of bookings are straight/second-yellow reds (YELLOW_TO_RED_FRACTION). A red
// removes the player from the pitch (no further positive contributions) and
// multiplies that side's effective strength by RED_CARD_STRENGTH_FACTOR for the
// rest of the match, so the team creates fewer chances and concedes more.
export const FOUL_CHANCE_PER_MINUTE = 1 / 45;
export const YELLOW_TO_RED_FRACTION = 0.12;
export const RED_CARD_STRENGTH_FACTOR = 0.8;

// --- Substitutions ------------------------------------------------------
// Each minute, after the duel and card rolls, every side may open a sub
// window. The chance is ~0 in the first half and ramps up from minute
// SUB_FIRST_HALF_CUTOFF: p(minute) = SUB_RAMP_BASE + SUB_RAMP_SLOPE * t^SUB_RAMP_CURVE
// with t the second-half progress, so subs cluster in the closing stages. A
// window is gated by a SUB_MIN_GAP cooldown, at most SUB_MAX_WINDOWS windows and
// SUB_MAX_PLAYERS players per side. A window swaps out 1..N players (size drawn
// from a geometric decay so one is likeliest, five rarest). The players taken
// off are those with the highest "sub-off desirability": a weighted blend of low
// fitness, low skill, a strong bench replacement waiting, and poor form so far
// this match (a cheap running proxy from the duel contributions). Each is
// replaced by the best positional fit left on the bench. Tuned for ~2-3 voluntary
// subs per side per match. A forced injury substitution consumes a window and a
// player from these same budgets (it is a real sub); when the budgets or the
// bench are exhausted an injured player simply leaves (a man down, like a red).
export const SUB_FIRST_HALF_CUTOFF = 45;  // no voluntary sub window at/before this minute
export const SUB_RAMP_BASE = 0.016;       // window chance just after half-time
export const SUB_RAMP_SLOPE = 0.065;      // additional chance scaled by second-half progress
export const SUB_RAMP_CURVE = 1.5;        // >1 pushes voluntary subs toward the late game
export const SUB_MIN_GAP = 5;             // minimum minutes between a side's windows
export const SUB_MAX_WINDOWS = 3;         // max sub windows per side (incl. forced)
export const SUB_MAX_PLAYERS = 5;         // max players subbed per side (incl. forced)
export const SUB_SIZE_DECAY = 0.33;       // geometric decay for the per-window size (1 likeliest)
// Sub-off desirability = weighted sum of four 0..1 deficits, each normalised by a
// reference. A starter is only eligible to come off above SUB_MIN_SCORE, so a
// fresh, well-performing XI is left alone even when a window opens.
export const SUB_FIT_REF = 72;            // fitness at/above which the fitness deficit is 0 (= FITNESS_PERF_FULL)
export const SUB_SKILL_REF = 70;          // skill scale normalising the skill / upgrade deficits
export const SUB_PERF_SCALE = 1.5;        // running-form scale turning negative form into a 0..1 deficit
export const SUB_W_FIT = 1.0;             // weight: low fitness
export const SUB_W_UPGRADE = 0.8;         // weight: a clearly better bench replacement is ready
export const SUB_W_PERF = 0.5;            // weight: poor form this match
export const SUB_W_SKILL = 0.3;           // weight: low skill
export const SUB_MIN_SCORE = 0.12;        // minimum desirability for a starter to be subbed off

// --- Live player match ratings ------------------------------------------
// Everyone on the pitch starts at MATCH_RATING_BASE. The duel outcomes, goals,
// cards and the running scoreline move each player's rating up and down; the
// weights below are per role (a position maps to a role via POSITION_ROLE) so a
// keeper's clean sheet and saves matter while a striker lives off goals. The
// final rating is BASE + sum(weight * count) + result modifier, clamped to 1..10.
export const MATCH_RATING_BASE = 6;

// Position -> role bucket used to pick the rating weight set.
export const POSITION_ROLE = {
  GK: 'GK',
  CB: 'DEF', LB: 'DEF', RB: 'DEF',
  CDM: 'MID', CM: 'MID', CAM: 'MID', LM: 'MID', RM: 'MID',
  ST: 'ATT', LF: 'ATT', RF: 'ATT',
};

// Per-role rating weights. Keys:
//  goal/assist        - attacking returns
//  shot               - a chance taken that didn't score (small credit for danger)
//  save               - a chance the keeper stopped
//  duelWon/duelLost   - the duel's defender blocked it / was beaten
//  concededPerGoal    - team-wide penalty per goal conceded (keepers/defenders)
//  cleanSheet         - bonus when the side concedes nothing
//  yellow/red         - card penalties
export const RATING_WEIGHTS = {
  GK:  { goal: 1.0, assist: 0.6, shot: 0.0,  save: 0.22, duelWon: 0.0,  duelLost: 0.0,   concededPerGoal: -0.40, cleanSheet: 1.4, yellow: -0.5, red: -2.0 },
  DEF: { goal: 1.2, assist: 0.7, shot: 0.05, save: 0.0,  duelWon: 0.22, duelLost: -0.20, concededPerGoal: -0.15, cleanSheet: 1.1, yellow: -0.5, red: -2.0 },
  MID: { goal: 1.0, assist: 0.6, shot: 0.10, save: 0.0,  duelWon: 0.12, duelLost: -0.10, concededPerGoal: -0.05, cleanSheet: 0.4, yellow: -0.5, red: -2.0 },
  ATT: { goal: 1.0, assist: 0.5, shot: 0.18, save: 0.0,  duelWon: 0.08, duelLost: -0.04, concededPerGoal: 0.0,   cleanSheet: 0.1, yellow: -0.5, red: -2.0 },
};

// Team-wide scoreline modifier added to every player: the goal difference (at
// the minute being rated) times RESULT_PER_GOAL_DIFF, clamped to +/-RESULT_MAX.
// Lets ratings drift up when ahead and dip when behind.
export const RESULT_PER_GOAL_DIFF = 0.2;
export const RESULT_MAX = 0.7;

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