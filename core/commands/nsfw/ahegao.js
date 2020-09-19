const Gal = require("../../structures/Galleries");

const init = async function (msg) {
  if (!msg.channel.nsfw) return $t("responses.errors.not-a-NSFW-channel", { lngs: msg.lang });
  const embed = new Embed();

  const img = await Gal.randomOne("ahegao", true);

  embed.image(img);
  embed.color("#FFFFFF");
  // embed.description(":coffee: **Coffee time!**");

  msg.channel.send({ embed });
};

module.exports = {
  init,
  pub: true,
  cmd: "ahegao",
  perms: 3,
  cat: "nsfw",
  botPerms: ["embedLinks"],
  aliases: [],
};
