const init = async function (msg) {
  const Target = await PLX.getTarget(msg.args[0], msg.guild);

  const saltmoji = "<:salty:277280624900046849>";
  const r = randomize(1, 100);

  const vocab = $t("forFun.saltLVL", {
    lngs: msg.lang,
    target: Target.username,
    amount: Math.floor(r),
    // emoji: saltmoji,
  });
  msg.channel.send({
    embed: {
      description: `\u200b\n${vocab}`,
      color: 0xC03560,
      thumbnail: {
        url:
          "https://ih1.redbubble.net/image.350186888.7255/flat,50x50,075,f.png",
      },
      // author:{name:Target.tag,icon_url: Target.avatarURL}
    },
  });
};

module.exports = {
  init,
  pub: true,
  cmd: "salt",
  perms: 3,
  cat: "fun",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ["salty", "saltlevel"],
  scope: "requireTag",
};
