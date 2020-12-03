// const gear = require('../../utilities/Gearbox');
// const DB = require('../../database/db_ops');
const moment = require("moment");
const ECO = require("../../archetypes/Economy");
const Timed = require("../../structures/TimedUsage");

const init = async (msg) => {
  const P = { lngs: msg.lang, prefix: msg.prefix };

  const AMOUNT = Math.abs(parseInt(msg.args[0])) || 0;
  const TARGET = await PLX.getTarget(msg.args[1], msg.guild);
  if (!TARGET) {
    PLX.autoHelper("force", { cmd: this.cmd, msg, opt: this.cat });
    return null;
  }
  if (msg.author.id === TARGET.id) return msg.channel.createMessage("[REQUIRES_TRANSLATION_STRING] SELF_USER");
  if (TARGET.id === PLX.user.id) return msg.channel.createMessage("[REQUIRES_TRANSLATION_STRING] BOT_USER");

  const [USERDATA, TARGETDATA] = await Promise.all([
    DB.users.get(msg.author.id),
    DB.users.get(TARGET.id),
  ]);

  if (USERDATA.modules.RBN < TARGETDATA.modules.RBN) {
  //      return msg.reply("you cannot send Rubines to an account with a higher balance.");
  }
  if (AMOUNT > 2500) {
    return msg.reply("you cannot send more than 2500 Rubines at a time.");
  }
  if (AMOUNT === USERDATA.modules.RBN) {
    return msg.reply("you cannot send all of your Rubines at once.");
  }

  // ======================================================================
  const v = {
    last: $t("interface.daily.lastdly", P),
    next: $t("interface.daily.next", P),
  };

  const reject = (message, Daily, r) => {
    P.remaining = moment.utc(r).fromNow(true);
    const dailyNope = $t("responses.give.cooldown", P);
    const embed = new Embed();
    embed.setColor("#e35555");
    embed.description = _emoji("nope") + dailyNope;
    return message.channel.send({ embed });
  };
  const info = async (message, Daily) => {
    const { last } = await Daily.userData(message.author);
    const dailyAvailable = await Daily.dailyAvailable(message.author);

    const embe2 = new Embed();
    embe2.setColor("#e35555");
    embe2.description = `
    ${_emoji("time")} ${_emoji("offline")} **${v.last}** ${moment.utc(last).fromNow()}
    ${_emoji("future")} ${dailyAvailable ? _emoji("online") : _emoji("dnd")} **${v.next}** ${moment.utc(last).add(4, "hours").fromNow()}
      `;
    return message.channel.send({ embed: embe2 });
  };

  const precheck = async (message) => {
    if (await ECO.checkFunds(message.author.id, AMOUNT)) return true;
    P.number = USERDATA.modules.RBN;
    message.channel.send($t("responses.generic.noFundsBalance", P));
    return false;
  };
  const after = (message) => {
    ECO.pay(message.author.id, AMOUNT * 0.05, "Rubine Transfer Fee", "RBN");
    ECO.transfer(message.author.id, TARGET.id, Math.ceil(AMOUNT * 0.95), "Rubine Transfer", "RBN").then((payload) => {
      embed = new Embed();
      embed.thumbnail(TARGET.avatarURL);
      embed.footer(message.author.tag, message.author.avatarURL);
      embed.image("https://cdn.discordapp.com/attachments/488142034776096772/586549151206998057/transfer.gif");
      embed.description = `
            
            **${message.author.username}** transferred **${AMOUNT}**${_emoji("RBN")} to **${TARGET.username}**
            ${$t("terms.TransactionFee")}: **${Math.floor(AMOUNT * 0.05)}${_emoji("RBN")}**
            ${$t("terms.TransactionID")}: \`${payload.transactionId}\`
            
            `;
      message.channel.send({ embed });
    });
  };

  return Timed.init(msg, "transfer_rbn", { day: (4 * 60 * 60 * 1000) }, after, reject, info, precheck);
};

module.exports = {
  init,
  pub: true,
  argsRequired: true,
  cmd: "transfer",
  perms: 3,
  cat: "economy",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ["give"],
  teleSubs: [
    { label: "box", path: "economy/givebox" },
  ],
};
