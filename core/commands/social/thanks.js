const { autoSubs: topAutoSubs } = require("./top.js");

const DAY = 3.6e+6;
const moment = require("moment");
const Timed = require("../../structures/TimedUsage");

const init = async function (msg, args) {
  const P = { lngs: msg.lang, prefix: msg.prefix };

  const Target = await PLX.getTarget(msg.args[0], msg.guild, false);
  if (Target && Target.id === msg.author.id) return `${_emoji("nope")} ${$t("responses.thx.noself",P)}`;

  const embed = {};

  const after = async function after(msg) {
    await DB.localranks.set({ user: Target.id, server: msg.guild.id }, { $inc: { thx: 1 } });
    const TargetServerData = await DB.localranks.get({ user: Target.id, server: msg.guild.id });

    P.userA = msg.member.nick || msg.author.username;
    P.userB = Target.nick || (Target.user || Target).username;
    P.THX = $t("terms.thx", P).toUpperCase();
    P.totalTHX = TargetServerData.thx;

    embed.description = $t("responses.thx.after", P);
    embed.thumbnail = { url: `https://cdn.discordapp.com/emojis/${_emoji("THX").id}.png?size=64` };
    embed.footer = { icon_url: msg.guild.iconURL, text: msg.guild.name };

    msg.channel.send({ embed });
  };

  const reject = function (msg, timer, r) {
    P.remaining = moment.utc(r).fromNow(true);
    P.command = msg.prefix + msg.command.label;
    const dailyNope = $t("responses.timers_generic.cooldown", P);
    const embed = new Embed();
    embed.setColor("#e35555");
    embed.description(_emoji("nope") + dailyNope);
    return msg.channel.send({ embed });
  };

  const status = async function (msg, timer) {
    const userDaily = await timer.userData(msg.author);
    const dailyAvailable = await timer.dailyAvailable(msg.author);
    P.remaining = moment.utc(userDaily.last).add(timer.day, "milliseconds").fromNow(true);
    P.command = msg.prefix + msg.command.label;
    const remainingEmbed = {};
    remainingEmbed.color = 0x3b9ea5;
    remainingEmbed.description = `
    ${_emoji("THX")} ${dailyAvailable ? _emoji("online") + $t("responses.timers_generic.check_yes", P) : _emoji("dnd") + $t("responses.timers_generic.check_no", P)} 
    `;

    return msg.channel.send({ embed: remainingEmbed });
  };

  if (!Target && !["info", "status"].includes(args[0])) msg.args[0] = "status";

  Timed.init(msg, "thx", { day: DAY }, after, reject, status);
};

const topAutoSub = topAutoSubs.find((a) => a.label == "thanks");
topAutoSub.label = "top";

const YesNo = require("../../structures/YesNo.js");

module.exports = {
  init,
  pub: true,
  cmd: "thanks",
  cat: "social",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ["thx", "obg", "svp"],
  autoSubs: [
    topAutoSub,
    {
      label: "clear",
      gen: async (msg, args) => {
        const ServerDATA = await DB.servers.get(msg.guild.id);
        const modPass = PLX.modPass(msg.member, "manageServer", ServerDATA);

        const P = { lngs: msg.lang };

        if (!modPass) return $t("responses.errors.denied", P);
        const Target = await PLX.getTarget(msg.args[0] || msg.author, msg.guild);
        if (!Target) return $t("responses.errors.target404", P);
        P.user = `<@${Target.id}>`;
        const embed = {
          description: $t("responses.thx.wipe", P),
          color: 0xEE5522,
        };
        const prompt = await msg.channel.send({ embed });

        YesNo(prompt, msg, false, false, false, { embed }).then(async (res) => {
          console.log(res);
          if (res === true) {
            await DB.localranks.set({ user: Target.id, server: msg.guild.id }, { thx: 0 }).catch((err) => {
              console.error(err);
              msg.channel.send("Oop! Something went wrong!");
            });
          }
        });
      },
      options: {
        aliases: ["wipe", "reset"],
        invalidUsageMessage: (msg) => { PLX.autoHelper("force", { msg, cmd: "thanks", opt: "social" }); },
      },
    },
  ],
};
