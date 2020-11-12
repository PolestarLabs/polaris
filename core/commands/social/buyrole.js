const ECO = require("../../archetypes/Economy.js");

const init = async (msg, args) => {
  const roleMarket = await DB.paidroles.find({ server: msg.guild.id }).lean().exec();

  if (args.length === 0 || args[1] === "list") {
    return {
      embed: {

        description: roleMarket.map((role) => `<@&${role.role}> : **${role.price}**${_emoji("RBN")} \`${msg.prefix}brl ${role.short}\` | ${role.temp ? `${role.temp / 60000}min` : ""} `).join("\n"),
      },
    };
  }

  const userData = await DB.users.get(msg.author.id);

  const finder = (args[0] || "").toLowerCase();

  const pRole = roleMarket.find((entry) => finder.includes(entry.short));

  if (!pRole) return "Role not found!";
  if (msg.member.hasRole(pRole.role)) return "Role already assigned!";

  if (userData.modules.RBN < pRole.price) return "Insufficient funds!";

  if (pRole.temp) {
    DB.temproles.add({
      S: msg.guild.id, U: msg.author.id, E: Date.now() + pRole.temp, R: pRole.role,
    });
  }

  await msg.member.addRole(pRole.role, "Purchased Role");
  await ECO.pay(msg.author, pRole.price, `Role Purchase at ${msg.guild.name}`);

  msg.channel.send({
    embed: {
      description: `<@${msg.author.id}> purchased <@&${pRole.role}> for **${pRole.price}**${_emoji("RBN")}
            ${pRole.temp ? `This role will expire in ${pRole.temp / 60000} minutes.` : ""}`,
    },
  });// .then(ms2=> wait(10).then(x=>ms2.delete()) );
};
module.exports = {
  init,
  pub: true,
  cmd: "buyrole",
  perms: 3,
  cat: "social",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ["brl"],
};
