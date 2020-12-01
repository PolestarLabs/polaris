const init = async function (msg) {
  const embed = new Embed();

  embed.image("https://thumbs.gfycat.com/UnpleasantIncompatibleGoosefish-max-1mb.gif");
  embed.color("#A08050");
  embed.description("Fala logo o que você quer de uma vez, **caralho**!");

  return { embed };
};

module.exports = {
  init,
  pub: false,
  cmd: "papaco",
  perms: 3,
  cat: "img",
  botPerms: ["attachFiles"],
  aliases: [],
};
