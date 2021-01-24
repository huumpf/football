const Names = require('./Names.js');
const PlayerFactory = require('./PlayerFactory.js');

const getClubName = () => {
  const city = Names.cityNames[Math.floor(Math.random() * Names.cityNames.length)];
  const addition = Math.random() < 0.2
    ? Names.clubNameAdditions[Math.floor(Math.random() * Names.clubNameAdditions.length)]
    : '';

  return [city, addition].filter(s => s).join(' ');
};

const getClubPlayers = (amount) => (new Array(amount))
  .fill(null)
  .map(() => PlayerFactory.makePlayer());

export const makeClub = () => ({
  id: Math.random() + '',
  name: getClubName(),
  players: getClubPlayers(30),
});
