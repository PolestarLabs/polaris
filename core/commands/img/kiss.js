const init = async (msg) => {
  delete require.cache[require.resolve("../../structures/Galleries")];
  const Gal = require("../../structures/Galleries");

  // HELP TRIGGER
  const P = { lngs: msg.lang };
  const helpkey = $t("helpkey", P);
  if (
    msg.content.split(" ")[1] === helpkey
    || msg.content.split(" ")[1] === "?"
    || msg.content.split(" ")[1] === "help"
  ) {
    return PLX.usage(cmd, msg, this.cat);
  }
  //------------

  const embed = new Embed();
  let Target;
  let filter;
  let variation = "_";

  if (["bb", "gg", "bg", "gb"].includes(msg.args[0])) {
    filter = msg.args[0];
    Target = await PLX.getTarget(msg.args[1], msg.guild);
  } else {
    Target = await PLX.getTarget(msg.args[0], msg.guild);
    if (["bb", "gg", "bg", "gb"].includes(msg.args[1])) filter = msg.args[1];
  }

  P.user = msg.author.username;
  P.victim = Target?.username || false;
  console.log(Target);

  if (randomize(1, 100) === 100) {
    const pic = await Gal.filteredOne("kiss", "slap");
    const avgcolor = await require("../../utilities/Picto").avgColor(pic);

    embed.description = `:broken_heart: ${$t("responses.forFun.kissFail", P)}`;
    embed.image(pic);
    embed.color(avgcolor);
    return msg.channel.send({ embed });
  }

  embed.description = `:hearts: ${
    Target
      ? $t("responses.forFun.kissed", P)
      : $t("responses.forFun.kissedNone", P)}`;
  if (Target?.id === msg.author.id) embed.description = `:hearts: ${$t("responses.forFun.kissedSelf", P)}`;

  if (Target) {
    var USERDATA = await DB.users.getFull({ id: msg.author.id });
    var marriedtarget = USERDATA.featuredMarriage ?  await DB.relationships.get({ _id: USERDATA.featuredMarriage }) : null;
  }

  if (marriedtarget) {
    const noise = randomize(0, 50);
    let pris = randomize(1, 0);
    pris === 1 ? (pris = randomize(1, 0)) : false;
    variation = USERDATA.lovepoints < 50 + noise ? "couple" : "wet";
    if (randomize(0, 5) === 1) variation = "cute";
    await DB.relationships.set({_id:marriedtarget._id},{$inc:{lovepoints:pris}});
  }
  if (randomize(0, 5) === 1) variation = "couple";
  if (randomize(0, 10) === 1) variation = "wet";
  console.log(`${msg.args[0] || "_"}.${variation}`);
  const kissImg = await Gal.filteredOne(
    "kiss",
    `${filter || "_"}.${variation}`,
  );
  const avgcolor = await require("../../utilities/Picto").avgColor(kissImg);

  embed.image(kissImg);
  embed.color(avgcolor);

  msg.channel.send({ embed });
};

module.exports = {
  init,
  pub: true,
  cmd: "kiss",
  perms: 3,
  cat: "img",
  botPerms: ["embedLinks"],
  aliases: [],
};
