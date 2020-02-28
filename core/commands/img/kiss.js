const init = async function(msg) {
  delete require.cache[require.resolve("../../structures/Galleries")];
  const Gal = require("../../structures/Galleries");

  //HELP TRIGGER
  let P = { lngs: msg.lang };
  let helpkey = $t("helpkey", P);
  if (
    msg.content.split(" ")[1] == helpkey ||
    msg.content.split(" ")[1] == "?" ||
    msg.content.split(" ")[1] == "help"
  ) {
    return PLX.usage(cmd, msg, this.cat);
  }
  //------------

  const embed = new Embed();
  let Target,
    filter,
    variation = "_";

  if (["bb", "gg", "bg", "gb"].includes(msg.args[0])) {
    filter = msg.args[0];
    Target = PLX.getTarget(msg, 1, false);
  } else {
    Target = PLX.getTarget(msg, 0, false);
    if (["bb", "gg", "bg", "gb"].includes(msg.args[1]))   filter = msg.args[1];
  } 
  
  P.user = msg.author.username;
  P.victim = Target ? Target.username : false;
  console.log(Target);

  if (randomize(1, 100) === 100) {
    let pic = await Gal.filteredOne("kiss", "slap");
    let avgcolor = await require("../../utilities/Picto").avgColor(pic);

    embed.description = ":broken_heart: " + $t("responses.forFun.kissFail", P);
    embed.image(pic);
    embed.color(avgcolor);
    return msg.channel.send({ embed });
  }

  embed.description =
    ":hearts: " +
    (Target
      ? $t("responses.forFun.kissed", P)
      : $t("responses.forFun.kissedNone", P));
  if (Target && Target.id == msg.author.id)
    embed.description = ":hearts: " + $t("responses.forFun.kissedSelf", P);

  if (Target) {
    var USERDATA = await DB.users.getFull({ id: msg.author.id });
    var marriedtarget = USERDATA.married.find(us => us.id == Target.id);
  }

  if (marriedtarget) {
    let noise = randomize(0, 50);
    let pris = randomize(1, 0);
    pris == 1 ? (pris = randomize(1, 0)) : false;
    variation = USERDATA.lovepoints < 50 + noise ? "couple" : "wet";
    if (randomize(0, 5) == 1) variation = "cute";
    Promise.all([
      userDB.findOneAndUpdate(
        {
          id: message.author.id,
          "married.id": userB_meta.id
        },
        { $inc: { "modules.lovepoints": pris } }
      ),
      userDB.findOneAndUpdate(
        {
          id: userB_meta.id,
          "married.id": message.author.id
        },
        { $inc: { "modules.lovepoints": pris } }
      )
    ]);
  }
  if (randomize(0, 5) == 1) variation = "couple";
  if (randomize(0, 10) == 1) variation = "wet";
  console.log((msg.args[0] || "_") + "." + variation);
  let kissImg = await Gal.filteredOne(
    "kiss",
    (filter || "_") + "." + variation
  );
  let avgcolor = await require("../../utilities/Picto").avgColor(kissImg);

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
  aliases: []
};
