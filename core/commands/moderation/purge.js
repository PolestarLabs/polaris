// TRANSLATE[epic=translations] purge

const init = async function (msg) {
  const P = { lngs: msg.lang, prefix: msg.prefix };
  
  let purgeFilter = msg.args[0];

  const ServerDATA = await DB.servers.get(msg.guild.id);
  const modPass = PLX.modPass(msg.member, "manageMessages", ServerDATA);
  if (!modPass && msg.author.id !== "253600545972027394") {
    return msg.reply($t("responses.errors.insuperms", P)).catch(console.error);
  }

  let filter; let censor; let Target; let endMessage; let revFil;
  if (purgeFilter === "reverse_filter" || purgeFilter === "!") {
    revFil = true;
    msg.args.shift();
    purgeFilter = msg.args[0]
  }

  if (purgeFilter.length < 5 && !isNaN(parseInt(purgeFilter, 10))) return `It looks like you meant to just clear messages. Use \`${msg.prefix}clear ${purgeFilter}\` instead.`;

  if (purgeFilter === "bots") {
    filter = (mes) => mes.author.bot;
    count = msg.args[1] || 100;
    endMessage = `${revFil ? "Filtered" : "Purged %X"} messages from Bots`;
  } else if (purgeFilter === "content") {
    censor = msg.args.slice(1).join(" ");
    count = msg.args[1] || 250;
    endMessage = `${revFil ? "Filtered" : "Purged %X"} messages including *\`${censor}\`*`;
    filter = (mes) => mes.content.includes(censor);
  } else if (purgeFilter === "images") {
    censor = msg.args.slice(1).join(" ");
    count = msg.args[1] || 100;
    endMessage = `${revFil ? "Filtered" : "Purged %X"} messages including Images`;
    filter = (mes) => {
      if (mes.attachments && mes.attachments.length > 0) {
        if (mes.attachments[0].url) {
          return true;
        }
      }
      if (mes.embeds && mes.embeds.length > 0) {
        if (mes.embeds[0].type === "image" && mes.embeds[0].url) {
          return true;
        }
      }
    };
  } else if (purgeFilter === "images") {
    censor = msg.args.slice(1).join(" ");
    count = msg.args[1] || 100;
    endMessage = "Purged %X messages **not** including any images";
    filter = (mes) => {
      if (mes.attachments && mes.attachments.length > 0) {
        if (mes.attachments[0].url) {
          return false;
        }
      }
      if (mes.embeds && mes.embeds.length > 0) {
        if (mes.embeds[0].type === "image" && mes.embeds[0].url) {
          return false;
        }
      }
      return true;
    };
  } else if (purgeFilter === "links") {
    censor = msg.args.slice(1).join(" ");
    count = msg.args[1] || 100;
    endMessage = `${revFil ? "Filtered" : "Purged %X"} messages including Links`;
    filter = (mes) => mes.content.includes("http");
  } else {
    Target = await PLX.getTarget(purgeFilter, msg.guild);
    if (!Target) return msg.channel.send($t("responses.errors.kin404", P));
    count = parseInt(msg.args[1]) || 100;
    endMessage = `${revFil ? "Filtered" : "Purged %X"} messages from user ${Target.tag}`;
    filter = (mes) => mes.author.id === Target.id;
  }

  let newFilter;
  if (revFil) {
    newFilter = function (x) {
      return !filter(x);
    };
  } else {
    newFilter = filter;
  }

  msg.channel.send("Deleting messages...");
  msg.channel.purge(count, newFilter, msg.id).then((x) => {
    console.log(x);
    msg.channel.send(endMessage.replace("%X", x));
  });
};
module.exports = {
  init,
  pub: true,
  cmd: "purge",
  argsRequired: true,
  perms: 3,
  cat: "mod",
  botPerms: ["manageMessages"],
  aliases: ["prune"],
};
