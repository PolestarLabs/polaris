
const BOMB = _emoji("swp_bomb").no_space

const init = async function (msg) {
  const P = { lngs: msg.lang, prefix: msg.prefix };
  if (PLX.autoHelper([$t("helpkey", P)], { cmd: this.cmd, msg, opt: this.cat })) return;

  minesTot = parseInt(msg.args[1]) || 10;
  SQ = parseInt(msg.args[0]) || 8;
  const arrGrid = [...Array(SQ)].map((e) => Array(SQ));
  let ir = 0;
  while (minesTot > 0) {
    for (let i = 0; i < SQ; i++) {
      for (let j = 0; j < SQ; j++) {
        let rand = randomize(0, SQ + 5);
        if (minesTot <= 0) rand = 0;
        if (arrGrid[i][j] == `||${ BOMB }||`) continue;
        arrGrid[i][j] = (rand == 1 ? `||${ BOMB }||` : `||:zero:||`);
        if (rand == 1) minesTot--;
      }
    }
    ir++;
  }

  for (i = 0; i < SQ; i++) {
    for (j = 0; j < SQ; j++) {
      if (arrGrid[i][j] == `||${ BOMB }||`) continue;
      let around = 0;
      if ((arrGrid[i] || [])[j - 1] == `||${ BOMB }||`) around++; // N
      if ((arrGrid[i] || [])[j + 1] == `||${ BOMB }||`) around++; // S

      if ((arrGrid[i - 1] || [])[j] == `||${ BOMB }||`) around++; // W
      if ((arrGrid[i + 1] || [])[j] == `||${ BOMB }||`) around++; // E

      if ((arrGrid[i - 1] || [])[j - 1] == `||${ BOMB }||`) around++; // NW
      if ((arrGrid[i - 1] || [])[j + 1] == `||${ BOMB }||`) around++; // SW

      if ((arrGrid[i + 1] || [])[j - 1] == `||${ BOMB }||`) around++; // NE
      if ((arrGrid[i + 1] || [])[j + 1] == `||${ BOMB }||`) around++; // sE

      switch (around) {
        case 1:
          arrGrid[i][j] = `||${_emoji("swp_1").no_space}||`;
          break;
        case 2:
          arrGrid[i][j] = `||${_emoji("swp_2").no_space}||`;
          break;
        case 3:
          arrGrid[i][j] = `||${_emoji("swp_3").no_space}||`;
          break;
        case 4:
          arrGrid[i][j] = `||${_emoji("swp_4").no_space}||`;
          break;
        case 5:
          arrGrid[i][j] = `||${_emoji("swp_5").no_space}||`;
          break;
        case 6:
          arrGrid[i][j] = `||${_emoji("swp_6").no_space}||`;
          break;
        case 7:
          arrGrid[i][j] = `||${_emoji("swp_7").no_space}||`;
          break;
        case 8:
          arrGrid[i][j] = `||${_emoji("swp_8").no_space}||`;
          break;
        default:
          arrGrid[i][j] = `||${_emoji("swp_0").no_space}||`;
          break;
      }
    }
  }
  for (i in arrGrid) {
    arrGrid[i] = arrGrid[i].join("\u200b");
  }

  msg.channel.send(arrGrid.join("\n"));
};
module.exports = {
  init,
  pub: true,
  cmd: "minesweeper",
  perms: 3,
  cat: "games",
  botPerms: [],
  aliases: ["mswp", "mines"],
};
