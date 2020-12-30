const Names = require('./Names.js');
const CFG = require('./Config.js');

function makePlayer() {
  let player = {};

  // Name
  player.firstName = Names.firstNames[Math.floor(Math.random() * Names.firstNames.length)];
  player.lastName = Names.lastNames[Math.floor(Math.random() * Names.lastNames.length)];

  // Age
  player.age = Math.floor(Math.random() * 20) + 16;

  // Skill
  player.skill = Math.floor(Math.random() * 50) + 30;

  // Salary
  player.salary = player.skill * 1000;

  return player;
}

export function makeDraftSet() {
  let draftSet = []
  for (let i = 0; i < CFG.DRAFT_PLAYERS_PER_PICK; i++) {
    let player = makePlayer();
    draftSet.push(player);
  }
  return draftSet;
}