import * as Names from './Names.js';
import * as PlayerFactory from './PlayerFactory.js';
import * as HLP from './Helpers.js';

export function makeClub() {

  let club = {
    name: String,
    players: Array,
    formation: Object,
  }

  club.name = Names.cityNames[Math.floor(Math.random() * Names.cityNames.length)];
  if (Math.random() < 0.2) { club.name += " " + Names.clubNameAdditions[Math.floor(Math.random() * Names.clubNameAdditions.length)] }
  
  club.players = [];
  for (let i = 0; i < 30; i++) {
    let player = PlayerFactory.makePlayer();
    club.players.push(player);
  }

  club.formation = HLP.getRecommendedFormation(club.players);

  return club;
}