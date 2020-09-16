const init = async (msg, args) => {
  if (PLX.user.id !== "354285599588483082") return;

  if (args[0] === "rbn") {
    const AMT = Number(args[1]) || 0;
    DB.users.set(msg.author.id, { $inc: { "modules.rubines": AMT } }).then(() => {
      msg.channel.send(`OK[${AMT} RBN]`);
    });
  }
  if (args[0] === "sph") {
    const AMT = Number(args[1]) || 0;
    DB.users.set(msg.author.id, { $inc: { "modules.sapphires": AMT } }).then(() => {
      msg.channel.send(`OK[${AMT} SPH]`);
    });
  }
  if (args[0] === "jde") {
    const AMT = Number(args[1]) || 0;
    DB.users.set(msg.author.id, { $inc: { "modules.jades": AMT } }).then(() => {
      msg.channel.send(`OK[${AMT} JDE]`);
    });
  }
  if (args[0] === "box") {
    const AMT = Number(args[1]) || 0;
    const TYP = (args[2] || "C").toUpperCase();

    DB.users.findOne({ id: msg.author.id }).then((x) => {
      x.addItem(`lootbox_${TYP}_O`, AMT).then(() => {
        msg.channel.send(`OK[${AMT} Box ${TYP}]`);
      });
    });
  }
  if (args[0] === "item") {
    const AMT = Number(args[2]) || 0;
    const ITM = (args[1] || "fork");

    DB.users.findOne({ id: msg.author.id }).then((x) => {
      x.addItem(ITM, AMT || 0).then(() => {
        msg.channel.send(`OK[${AMT} Box ${TYP}]`);
      });
    });
  }
};
module.exports = {
  init,
  pub: false,
  cmd: "debug",
  cat: "beta",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ["dbg"],
};
