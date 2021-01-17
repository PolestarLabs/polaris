// TRANSLATE[epic=translations] ?? transaction lookup

const init = async (msg, args) => {
  const { Embed } = require("eris");
  const embed = new Embed();
  const filterid = args[0];
  const log = await DB.audits.get({ transactionId: filterid });
  if (!log) return msg.addReaction(_emoji("nope").reaction);
  let curr;
  switch (log.currency) {
    case "RBN":
      curr = "rubine";
      break;
    case "JDE":
      curr = "jade";
      break;
    case "SPH":
      curr = "sapphire";
      break;
    default:
      curr = "cash";
  }

  const transactionUser = log.from === "271394014358405121"
    ? (await DB.users.get({ id: log.to }))?.meta
    : (await DB.users.getFull({ id: log.from }))?.meta;
  embed.author = {
    name: transactionUser.tag,
    icon_url: `${paths.CDN}/images/${curr || "x"}.png`,
    url: `${paths.DASH}/profile/${log.from}`,
  };

  embed.color = log.transaction === "+" ? 0x60c143 : 0xe23232;
  if (log.to === "PAYPAL") embed.color = 0x0079c1;
  embed.description(`
  **Transaction Info:**`);
  embed.fields = [];
  embed.fields.push({
    name: "Amount",
    value: `**${miliarize(log.amt, true)}** ${log.currency}`,
    inline: true,
  });
  embed.fields.push({
    name: "Type",
    value: `\`${log.type}\``,
    inline: true,
  });
  if (log.to != "271394014358405121" && log.from != "271394014358405121") {
    const ouser = (await DB.userDB.findOne({ id: log.to }))?.meta || log.to;
    embed.fields.push({
      name: "Recipient",
      value: `${ouser.tag || ""} \`${log.to}\``,
      inline: true,
    });
  }
  if (log.details) {
    embed.fields.push({
      name: "Details",
      value: `\`\`\`\n${log.details.info}\`\`\``,
      inline: true,
    });
  }
  if (log.details?.state) {
    embed.fields.push({
      name: "State",
      value: log.details.state === "approved" ? _emoji("yep") : _emoji("nope"),
      inline: true,
    });
  }
  if (log.type?.includes("give")) {
    embed.field(
      log.transaction === "+" ? "FROM" : "TO",
      `**${transactionUser.tag}** \`${log.to}\``,
      true,
    );
  }

  embed.thumbnail = { url: transactionUser.avatarURL || transactionUser.avatar };
  const ts = new Date(log.timestamp);
  embed.timestamp = ts;
  embed.footer = { text: log.transactionId };

  msg.channel.send({ embed });
};

module.exports = {
  init,
  pub: false,
  cmd: "transactionlookup",
  perms: 3,
  cat: "infra",
  aliases: ["tlookup"],
};
