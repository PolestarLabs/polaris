const chrono = require("chrono-node");
const format = require("date-fns/format");
const formatDistanceToNow = require("date-fns/formatDistanceToNow")

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
          name: `<:future:446901833642934274> ${format(r.expires, "dd/MM/yyyy - HH:mm:ss O")}`, // NOTE The "O" is reference to GMT timezone
          value: `\\🗓️ *${r.name.trim()}*\n\\📌 ${r.channel === "dm" ? "DM" : `<#${r.channel}>`}`,
          inline: false,
        })),
        // footer: { text: "All times are in UTC" },
      },
    };
  }

  if ((args[0] === "delete" || args[0] === "remove") && args.length < 3) {
    if (userReminders.length < 1) return { embed: { description: ` ${_emoji("nope")} **${$t("interface.reminders.noneToDelete", P)}**`, color: 0xcc2233 } };

    let index = (userReminders.length || 1) - 1;
    if (Number(args[1])) index = (parseInt(args[1]) || 1) - 1;
    const targetReminder = userReminders[index];
    await DB.feed.deleteOne({ _id: targetReminder._id });
    // Sidecar and bot do not talk with each other
    //clearTimeout(PLX.reminderTimers.get(targetReminder._id));
    //PLX.reminderTimers.delete(targetReminder._id);

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

  const options = { forwardDate: true, startOfDay: 9, useShorts: true };
  const from = new Date(msg.createdAt);

  /** @type {import('chrono-node').ParsedResult[]} */
  let chronoResult;
  let reminder;

  if (input.includes(" | ")) {
    const temp = input.split(" | ");
    chronoResult = parser.parse(temp.pop(), from, options);
    reminder = temp.join(" | ");
  } else {
    chronoResult = parser.parse(input, from, options);
  }

  if (chronoResult.length < 1) return $t("interface.reminders.errorWhen", P);

  if (!reminder) reminder = input.replace(chronoResult[0].text, "").trim();

  const timestamp = chronoResult[0].start.date();
  if (timestamp < from) return $t("interface.reminders.errorTARDIS", P);
  if (timestamp.getTime() < from.getTime() + 60e3) return $t("interface.reminders.errorTooShort")

  await DB.feed.new({
    url: msg.author.id, type: "reminder", name: reminder, expires: timestamp, repeat: 0, channel: destination || "dm",
  });

  P.time = formatDistanceToNow(timestamp);
  P.channel = `<#${destination}>`;
  P.location = destination ? $t("interface.reminders.reminderChannel", P) : $t("interface.reminders.reminderDMs", P);

  if (!reminder) return $t("interface.reminders.reminderOk_empty", P);

  P.appointment = `\`${reminder}\``;
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
