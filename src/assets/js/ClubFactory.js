import * as Names from './Names.js';
import * as PlayerFactory from './PlayerFactory.js';
import * as HLP from './Helpers.js';
import * as CFG from './Config.js';

// Builds an AI club by simulating the same draft the player goes through:
// DRAFT_COUNT rounds, each picking one player from a best-of-3 set. The squad
// therefore draws from the same distribution as the player's, which keeps the
// league strength comparable without explicit calibration.
export function makeClub(id, name) {
  const players = [];
  for (let round = 0; round < CFG.DRAFT_COUNT; round++) {
    const draftSet = PlayerFactory.makeDraftSet();
    players.push(pickPlayer(draftSet, players, round));
  }

  return {
    id,
    name,
    players,
    formation: HLP.getRecommendedFormation(players),
  };
}

// Unique club names: cities are drawn without replacement, and any city that
// already appears in a reserved name (the player's club) is excluded.
export function makeClubNames(count, reservedNames = []) {
  const pool = Names.cityNames.filter(
    city => !reservedNames.some(reserved => reserved.startsWith(city))
  );
  const names = [];
  for (let i = 0; i < count; i++) {
    let name = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    if (Math.random() < 0.2) { name += " " + Names.clubNameAdditions[Math.floor(Math.random() * Names.clubNameAdditions.length)] }
    names.push(name);
  }
  return names;
}

// What a candidate is worth to an AI club: mostly today's skill, partly where
// the development curve takes them (favours young players over declining ones).
function pickValue(player) {
  return (1 - CFG.AI_PICK_FUTURE_WEIGHT) * player.skill
    + CFG.AI_PICK_FUTURE_WEIGHT * HLP.projectedSkill(player, CFG.AI_PICK_HORIZON_YEARS);
}

// Picks one of the 3 candidates. Early rounds simply chase the most valuable
// player; with each round the bonus for filling a weak or empty position grows,
// so gaps get plugged towards the end of the draft.
function pickPlayer(candidates, squad, round) {
  const needWeight = round / (CFG.DRAFT_COUNT - 1);

  let best = null;
  let bestScore = -Infinity;
  for (const candidate of candidates) {
    const value = pickValue(candidate);
    const position = candidate.positions.position;
    const coveredSkill = Math.max(0, ...squad.map(p => HLP.effectiveSkill(p, position)));
    const need = Math.max(0, value - coveredSkill);
    const score = value + needWeight * need;
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best;
}
