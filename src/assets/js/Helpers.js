export function moneyStr(amount) {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function getBiasedRnd (min, max, bias, influence, mixfactor) {
  let rnd = Math.random() * (max - min) + min;
  let mix = mixfactor * influence;
  return rnd * (1 - mix) + bias * mix;
}

export function remap(n, start1, stop1, start2, stop2, withinBounds) {
  var newval = ((n - start1)/(stop1 - start1)) * (stop2 - start2) + start2;
  if (!withinBounds) {
    return newval;
  }
  return this.constrain(newval, start2, stop2);
}

export function getFormationsWithPlayers (players) {
  const CFG = require('./Config.js');
  let formations = Array.from(CFG.formations);

  for (const formation of formations) {
    formation.players = { ...formation.positions };
    formation.skillSum = 0;

    for (let key in formation.players) {
      formation.players[key] = [];
    }
    for (const [position, count] of Object.entries(formation.positions)) {
      let playersOnThisPos = players.filter(player => player.positions.position === position.toUpperCase());
      if (playersOnThisPos.length > count) {
        playersOnThisPos.length = count;
      }
      if (playersOnThisPos.length > 0) {
        formation.players[position] = [];
        for (const player of playersOnThisPos) {
          formation.players[position].push(player);
          formation.skillSum += player.skill;
        }
      }
    }
  }
  return formations;
}

export function getRecommendedFormation (players) {
  
  const formations = getFormationsWithPlayers(players);
  let recommendedFormation = formations[0];

  for (const formation of formations) {
    if (formation.skillSum >= recommendedFormation.skillSum)
    recommendedFormation = formation;
  }
  
  return recommendedFormation;
}