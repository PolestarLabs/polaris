const init = async function (msg) {
  const P = { lngs: msg.lang, prefix: msg.prefix };

  const A = `${paths.CDN}/build/coins/befli_heads.gif`;
  const A1 = `${paths.CDN}/build/coins/befli_h_s.png`;
  const B = `${paths.CDN}/build/coins/befli_tails.gif`;
  const B1 = `${paths.CDN}/build/coins/befli_t_s.png`;
  const rand = randomize(1, 59);

  const res = rand % 2 === 0 ? A : B;
  const res2 = rand % 2 === 0 ? A1 : B1;
  const face = rand % 2 === 0 ? $t("terms.coinHeads", P) : $t("terms.coinTails", P);

  const embed = new Embed();
  P.player = msg.author.username;
  embed.author($t("games:coinflip.playerFlipsCoin", P), msg.author.avatarURL);
  embed.thumbnail(res);

  msg.channel.send({ embed }).then(async (x) => {
    P.coinFace = face;
    embed.description = `${$t("games:coinflip.andLanded", P)}
        
        \u200b`;
    embed.thumbnail.url = res2;
    await wait(5.5);
    x.edit({ embed });
  });
};
module.exports = {
  init,
  pub: true,
  cmd: "flip",
  perms: 3,
  cat: "utility",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: [],
};
