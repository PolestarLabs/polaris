// TRANSLATE[epic=translations] flip

const init = async function (msg) {
  const P = { lngs: msg.lang, prefix: msg.prefix };

  const A = `${paths.CDN}/build/coins/befli_heads.gif`;
  const A1 = `${paths.CDN}/build/coins/befli_h_s.png`;
  const B = `${paths.CDN}/build/coins/befli_tails.gif`;
  const B1 = `${paths.CDN}/build/coins/befli_t_s.png`;
  const rand = randomize(1, 59);

  const res = rand % 2 === 0 ? A : B;
  const res2 = rand % 2 === 0 ? A1 : B1;
  const face = rand % 2 === 0 ? $t("terms.coinHeads") : $t("terms.coinTails");

  const embed = new Embed();
  embed.author(`${msg.author.tag} flips a coin...`, msg.author.avatarURL);
  embed.thumbnail(res);

  msg.channel.send({ embed }).then(async (x) => {
    embed.description = `... and landed **${face}**
        
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
  cat: "util",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: [],
};
