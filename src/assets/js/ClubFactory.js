import * as Names from './Names.js';
import * as PlayerFactory from './PlayerFactory.js';
import * as HLP from './Helpers.js';
import * as CFG from './Config.js';

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

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
    money: CFG.CLUB_STARTING_MONEY,
    formation: HLP.getRecommendedFormation(players),
  };
}

// Players an AI club offers on the transfer market, picked from the bench by
// depth chart: a player who can't fill any slot of the club's formation at all
// (e.g. a pure LF/RF in a 4-4-2) is always offered; otherwise a player is
// surplus when on every position he can play, all slots are taken by better
// players and at least one better backup remains beyond them. The most deeply
// buried surplus players are offered first, capped at AI_LISTINGS_MAX.
export function selectListingCandidates(club) {
  const starters = new Set(Object.values(club.formation.players).flat());
  const bench = club.players.filter(p => !starters.has(p));

  const useless = [];
  const surplus = [];
  for (const player of bench) {
    const playable = [
      ...(player.positions.primary || [player.positions.position]),
      ...(player.positions.secondary || []),
    ].filter(pos => club.formation.positions[pos.toLowerCase()]);

    if (playable.length === 0) {
      useless.push(player);
      continue;
    }

    // Per position: players better than him there, minus the formation slots.
    // >= 1 everywhere means starters and at least one better backup block him.
    const depth = Math.min(...playable.map(pos => {
      const own = HLP.effectiveSkill(player, pos);
      const better = club.players
        .filter(p => p !== player && HLP.effectiveSkill(p, pos) > own).length;
      return better - club.formation.positions[pos.toLowerCase()];
    }));
    if (depth >= 1) surplus.push({ player, depth });
  }

  surplus.sort((a, b) => b.depth - a.depth);
  const count = Math.min(
    CFG.AI_LISTINGS_MAX,
    Math.max(useless.length, randomInt(1, CFG.AI_LISTINGS_MAX))
  );
  return [...useless, ...surplus.map(s => s.player)].slice(0, count);
}

const CLUB_NAME_ADDITION_CHANCE = 0.2;

// A club name is a city, sometimes with an addition ("United", "City", …).
function withRandomAddition(city) {
  if (Math.random() < CLUB_NAME_ADDITION_CHANCE) {
    return city + " " + Names.clubNameAdditions[Math.floor(Math.random() * Names.clubNameAdditions.length)];
  }
  return city;
}

// Single club name from a random city (used for the player's own club).
export function makeClubName() {
  return withRandomAddition(Names.cityNames[Math.floor(Math.random() * Names.cityNames.length)]);
}

// Unique club names: cities are drawn without replacement, and any city that
// already appears in a reserved name (the player's club) is excluded.
export function makeClubNames(count, reservedNames = []) {
  const pool = Names.cityNames.filter(
    city => !reservedNames.some(reserved => reserved.startsWith(city))
  );
  const names = [];
  for (let i = 0; i < count; i++) {
    names.push(withRandomAddition(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]));
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
