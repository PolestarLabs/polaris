const init = async function (msg) {
  const embed = new Embed();

  embed.image("https://media.discordapp.net/attachments/277391864552882176/674322352997400587/131.png");
  embed.color("#F03050");
  embed.description("One moment of silence for their deceased brain...");

  return { embed };
};

module.exports = {
  init,
  pub: false,
  cmd: "ripbrain",
  perms: 3,
  cat: "img",
  botPerms: ["attachFiles"],
  aliases: [],
};
