const Gal = require("../../structures/Galleries");

const init = async (msg) => {
  const embed = new Embed();

  const img = await Gal.randomOne("akerfeldt", true);
  const avgcolor = await require("../../utilities/Picto").avgColor(img);

  embed.image(img);
  embed.color(avgcolor);

  msg.channel.send({ embed }).then((m) => aker(m));
};

module.exports = {
  init,
  pub: true,
  cmd: "akerfeldt",
  perms: 3,
  cat: "donators",
  botPerms: ["embedLinks"],
  aliases: [],
};

async function aker(m) {
  switch (randomize(0, 3)) {
    case 0:
      break;
    case 1:
    case 2:
      return m.addReaction("a_de_akerfelt:468592458851418115");
    case 3:
      m.addReaction("🇸");
      m.addReaction("🇴");
      m.addReaction(_emoji("R").reaction);
      m.addReaction("🇷");
      m.addReaction("🅾");
      m.addReaction("🇼");
  }
}
