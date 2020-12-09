// TRANSLATE[epic=translations] paidroles

const init = async (msg, args) => {
  const subcommand = args[0];

  if (!Number(args[2])) {
    args = [args[0], args[1], 0, args[2], args[3], args[4]];
  }

  const arg1 = args[1]; // price
  const arg2 = args[2]; // temp
  const arg3 = args[3]; // short
  const arg4 = args[4]; // role

  const serverData = await DB.servers.get(msg.guild.id, { "modules.MODROLE": 1 });
  if (!PLX.modPass(msg.member, "manageRoles", serverData)) return msg.addReaction(nope).then(() => null);

  const rolefind = (x) => (msg.guild.roles.find((rl) => args.slice(x).join(" ").toLowerCase() === rl.name.toLowerCase()) || msg.guild.roles.find((rl) => rl.id === msg.roleMentions[0]) || msg.guild.roles.find((rl) => rl.id === arg4) || msg.guild.roles.find((rl) => rl.name.toLowerCase().startsWith(args.slice(x).join(" ").toLowerCase())));

  const roleMarket = await DB.paidroles.find({ server: msg.guild.id }).lean().exec();

  if (subcommand === "add") {
    const targetRole = rolefind(4);
    const temp = ((Number(arg2) || 0) * 60000) || null;

    if (!targetRole) return "Role not found";
    const short = arg3 || role.name.split(" ")[0].toLowerCase();
    if (roleMarket.find((entry) => entry.role === targetRole.id)) return "Role already here";
    await DB.paidroles.new({
      server: msg.guild.id, role: targetRole.id, price: Number(arg1) || 1000, short, temp,
    });
    return {
      embed: {
        description: `New Paid Role Registered! <@&${targetRole.id}> for **${arg1 || 1000}**${_emoji("RBN")}
                Use \`${msg.prefix}brl ${short}\` to assign it! ${temp ? `This role will expire in ${temp / 60000} minutes.` : ""}`,
      },
    };
  }

  if ( args[0] === "list") {
    return {
      embed: {
        description: roleMarket.map((role,i) => `\`#${i}\` <@&${role.role}> : **${role.price}**${_emoji("RBN")} \`${msg.prefix}brl ${role.short}\` | ${role.temp ? `${role.temp / 60000}min` : ""} `).join("\n")
        +"\n Use `"+msg.prefix+"paidroles remove [#]` to delete one.",
      },
    };
  }

  if ( args[0] === "remove") {
    let target = roleMarket[args[1]];
    if (!target) return $t('responses.errors.nosuchrole');
     await DB.paidroles.remove({role:target.role});
     return {
      embed:{
        description: `Role <@&${target.role}> has been deleted from Paid Roles list`
      }
    }
  }

  if(!args[0]){
    msg.channel.send(`\`${msg.prefix}paidroles add [Price (RBN)] [Time (Minutes)] [Shortcut] [@Role]\``)
  }

};

module.exports = {
  init,
  pub: true,
  cmd: "paidroles",
  perms: 3,
  cat: "utility",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ["paidrole"],
};
