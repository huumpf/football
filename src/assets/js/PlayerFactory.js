const Names = require('./Names.js');
const CFG = require('./Config.js');

export function makeDraftSet() {
  let draftSet = []
  for (let i = 0; i < CFG.DRAFT_PLAYERS_PER_PICK; i++) {
    let player = makePlayer();
    draftSet.push(player);
  }
  return draftSet;
}

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

  // Position
  player.pos_vertical = Math.floor(Math.random() * 100);
  player.pos_horizontal = Math.floor(Math.random() * 100);
  player.position = get_pos(player.pos_vertical, player.pos_horizontal);

  return player;
}

function get_pos(vert, hor) {

  let position = "";

  if (vert <= CFG.POSITION_GK) {
    position = "GK";
    return position;
  }

  if (hor <= 0 + CFG.POSITION_OFFSET_WING) {
    position = "L";
  } else if (hor > 100 - CFG.POSITION_OFFSET_WING) {
    position = "R";
  } else {
    position = "C";
  }

  if (position == "C") {
    if (vert > CFG.POSITION_GK && vert <= CFG.POSITION_CB) {
      position += "B";
    } else if (vert > CFG.POSITION_CB && vert <= CFG.POSITION_CDM) {
      position += "DM";
    } else if (vert > CFG.POSITION_CDM && vert <= CFG.POSITION_CM) {
      position += "M";
    } else if (vert > CFG.POSITION_CM && vert <= CFG.POSITION_CAM) {
      position += "AM";
    } else if (vert > CFG.POSITION_CAM && vert <= CFG.POSITION_ST) {
      position = "ST";
    }
  } else {
    if (vert > CFG.POSITION_GK && vert <= CFG.POSITION_WB) {
      position += "B";
    } else if (vert > CFG.POSITION_WB && vert <= CFG.POSITION_WC) {
      position += "M";
    } else if (vert > CFG.POSITION_WC && vert <= CFG.POSITION_WA) {
      position += "F";
    }
  }
  return position;
}