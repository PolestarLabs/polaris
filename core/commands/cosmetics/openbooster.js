const newEmoji = _emoji`new`;

const init = async (msg) => {
  const P = { lngs: msg.lang };

  const [userData, stickerData, boosterData] = await Promise.all([
    DB.users.getFull({ id: msg.author.id }),
    DB.cosmetics.find({ type: "sticker" }),
    DB.items.find({ type: "boosterpack" }),
  ]);
  const collection = msg.args[0];

  // if(userData.amtItem(collection) < 1) return msg.channel.send($t('interface.booster.'));

  function getRandomSticker(col, exc) {
    const pile = shuffle(stickerData.filter((stk) => stk.series_id === col && stk.id !== exc));
    return pile[randomize(0, pile.length - 1)];
  }

  const stk1 = getRandomSticker(collection);
  if (!stk1) return "Collection does not exist!";
  const stk2 = getRandomSticker(collection, stk1.id);
  const stk1new = !userData.modules.stickerInventory.includes(stk1.id);
  const stk2new = !userData.modules.stickerInventory.includes(stk2.id);

  const embed = new Embed();

  const thisPack = boosterData.find((b) => b.id === `${collection}_booster`);
  P.boostername = thisPack.name;
  P.dashboard = `[${$t("terms.dashboard", P)}](${paths.DASH}/dashboard#/stickers)`;
  embed.author($t("interface.booster.title", P));
  embed.color = 0x36393f;
  embed.description = `${"------------------------------------------------\n"
  + `${stk1new ? newEmoji : ":record_button:"} ${_emoji(stk1.rarity)}  ${stk1.name}\n`
  + `${stk2new ? newEmoji : ":record_button:"} ${_emoji(stk2.rarity)}  ${stk2.name}\n`
  + "------------------------------------------------\n"}${
    $t("interface.booster.checkStickersAt", P)}`;

  embed.image(`${paths.GENERATORS}/boosterpack/${collection}/${stk1.id}/${stk2.id}/booster.png?anew=${stk1new}&bnew=${stk2new}`);
  embed.thumbnail(`${paths.CDN}/build/boosters/showcase/${collection}.png`);
  embed.footer(msg.author.tag, msg.author.avatarURL);

  await Promise.all([
    DB.users.set(userData.id, { $addToSet: { "modules.stickerInventory": { $each: [stk1.id, stk2.id] } } }),
    userData.removeItem(thisPack.id),
  ]);
  return msg.channel.send({ embed });
};

module.exports = {
  init,
  pub: false,
  argsRequired: true,
  cmd: "openbooster",
  perms: 3,
  cat: "cosmetics",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: [],
};
