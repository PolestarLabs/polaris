const chrono = require("chrono-node");
const moment = require("moment");

const parser = new chrono.Chrono();
/*
parser.refiners.push({refine (text, results, opt) {
    if (opt.startOfDay) {
      results.forEach(result => {
        if (!result.start.isCertain('hour')) {
          result.start.imply('hour', opt.startOfDay)
          result.tags['StartOfWorkDayRefiner'] = true
        }
      })
    }
    return results
}})
*/

const init = async (msg, args) => {
  moment.locale(msg.lang[0] || "en");
  const userReminders = await DB.feed.find({ url: msg.author.id }).lean().exec();
  const P = { lngs: msg.lang };

  if (msg.content.split(" ")[0].includes("reminders") || (args[0] === "list" && args.length === 1)) {
    return {
      content: $t("interface.reminders.currentActive", P),
      embed: {
        author: {
          name: `${msg.author.username}'s Appointments`,
          icon_url: msg.author.avatarURL,
        },
        fields: userReminders.map((r) => ({
          name: `<:future:446901833642934274> ${moment.utc(r.expires).format("DD/MM/YYYY - HH:mm")} `,
          value: `\\🗓️ *${r.name.trim()}*\n\\📌 ${r.channel === "dm" ? "DM" : `<#${r.channel}>`}`,
          inline: false,
        })),
        footer: { text: "All times are in UTC" },
      },
    };
  }

  if ((args[0] === "delete" || args[0] === "remove") && args.length < 3) {
    if (userReminders.length < 1) return { embed: { description: ` ${_emoji("nope")} **${$t("interface.reminders.noneToDelete", P)}**`, color: 0xcc2233 } };

    let index = (userReminders.length || 1) - 1;
    if (Number(args[1])) index = (parseInt(args[1]) || 1) - 1;
    const targetReminder = userReminders[index];
    await DB.feed.deleteOne({ _id: targetReminder._id });

    return { embed: { description: ` ${_emoji("nope")} **${$t("interface.generic.deleted", P)}** *${targetReminder.name}.*`, color: 0xcc2233 } };
  }

  if (userReminders.length > 10) {
    P.count = 10;
    return { embed: { description: `⚠ ${$t("interface.reminders.maxActive", P)}`, color: 0xcc8811 } };
  }

  /** @type {string} */
  let input = args.join(" ");
  let destination;

  if (input.includes(" -c ") || input.endsWith("-c")) {
    input = input.split(" -c ")[0];
    if (input.endsWith("-c")) input = input.substr(0, input.length - 3);
    destination = msg.channelMentions[msg.channelMentions.length - 1] || msg.channel.id;
  }

  let preInput = null;

  if (input.includes("|")) {
    preInput = input.split("|")[0];
    input = input.split("|").slice(1).join(" ").trim();
  }

  // const regex = /^@?([^\s]+)(?: to )?(.*)$/;

  const options = { forwardDate: true, startOfDay: 9 };
  const from = Date.now() - ((Date.now() + 30e3) % 60e3) + 60e3;

  const regex = /([0-9]+)(wk?s?)?(ds?)?(hr?s?)?(ms?)?(s)?/gm;
  let lastUnit;
  input = input.replace(regex, (full, $1, $2, $3, $4, $5, $6) => { // TODO[epic=bsian] clean this up
    if (lastUnit === " second") throw new Error("Unit exceeds seconds");
    console.log($1, $2, $3);
    if ($2) $2 = " week";
    if ($3) $3 = " day";
    if ($4) $4 = " hour";
    if ($5) $5 = " minute";
    if ($6) $6 = " second";
    let unit = $6 || $5 || $4 || $3 || $2;
    if (unit) lastUnit = unit;
    else {
      unit = lastUnit === " week"
        ? " day"
        : lastUnit === " day"
          ? " hour"
          : lastUnit === " hour"
            ? " minute"
            : lastUnit === " minute"
              ? " second"
              : " minute";
    }

    return $1 + unit;
  });

  let what = preInput || input;
  const when = parser.parse(input, from, options);

  if (when.length < 1) return $t("interface.reminders.errorWhen", P);

  const timestamp = when[0].start.date().getTime(); // + 3600000 * 3;

  if (timestamp < from) return $t("interface.reminders.errorTARDIS", P);

  when.forEach((w) => {
    what = what.replace(w.text, "");
  });
  what = what.trim();

  await DB.feed.new({
    url: msg.author.id, type: "reminder", name: preInput || what, expires: timestamp, repeat: 0, channel: destination || "dm",
  });

  P.appointment = `\`${preInput || what}\``;
  P.time = moment.utc(timestamp).calendar();
  P.channel = `<#${destination}>`;
  P.location = destination ? $t("interface.reminders.reminderChannel", P) : $t("interface.reminders.reminderDMs", P);

  return $t("interface.reminders.reminderOk", P);
};
module.exports = {
  init,
  pub: true,
  cmd: "reminder",
  argsRequired: true,
  perms: 3,
  cat: "utility",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ["remind", "rmd", "reminders", "remindme"],
};
