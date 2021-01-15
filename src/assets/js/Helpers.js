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
        }
      }
    }
  }
  return formations;
}

export function getRecommendedFormation (players) {
  
  let recommendedFormation = Object;
  let totalSkill = 0;

  const formations = getFormationsWithPlayers(players);
  console.log(formations);

  for (const formation of formations) {
    let sum = 0;
    
    for (const position in formation.players) {
      for (const player of position) {
        if (position[player]) {
          sum += position[player].skill;
        }
      }
    }

    if (sum >= totalSkill) {
      totalSkill = sum;
      recommendedFormation = formation;
    }
  }
  
  return recommendedFormation;
}