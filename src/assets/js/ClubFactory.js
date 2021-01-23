const Names = require('./Names.js');
const PlayerFactory = require('./PlayerFactory.js');
// const CFG = require('./Config.js');
const HLP = require('./Helpers.js');

export function makeClub() {
  let club = {
    name: String,
    players: [],
    formation: Object,
  }

  club.name = Names.cityNames[Math.floor(Math.random() * Names.cityNames.length)];
  if (Math.random() < 0.2) { club.name += " " + Names.clubNameAdditions[Math.floor(Math.random() * Names.clubNameAdditions.length)] }
  
  for (let i = 0; i < 30; i++) {
    club.players.push(PlayerFactory.makePlayer());
  }

  club.formation = HLP.getRecommendedFormation(club.players);

  return club;
}