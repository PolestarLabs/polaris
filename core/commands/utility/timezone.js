const m = require("moment-timezone");
const ct = require("city-timezones");

const capt = (phrase) => phrase
  .toLowerCase()
  .split(" ")
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(" ");

const defaultFormat = (timezone) => m.tz(timezone).format("hh:mma");

const timeRegex = /([0-2]?[0-9])(?:(?::|(?: ?h(?:ours? )? ?))(?:and )?([0-5]?[0-9]|60)? ?(?:m(?:in(?:utes?)?)?)?)? ?(pm|am)?/i;

function findTz(zoneName) {
  return ct.lookupViaCity(zoneName)[0]?.timezone || m.tz.zone(zoneName)?.name;
}

function parseTime(match, userTz, anotherTz) {
  const [ , hour, minute, period ] = match;

  let hourInt = parseInt(hour);
  const minuteInt = parseInt(minute);

  let parsedPeriod = period;
  if (minute != null && minuteInt == null) {
    parsedPeriod = minute;
  }

  if (parsedPeriod && parsedPeriod.toLowerCase() === "pm") {
    if (hourInt >= 12) {
      hourInt -= 12;
    }
    if (hourInt !== 12) {
      hourInt += 12;
    }
  }

  const format = parsedPeriod ? "hh:mma" : "HH:mm";

  const userTime = m.tz({ hour: hourInt, minute: minuteInt }, userTz);
  const userTimeText = userTime.format(format);
  const anotherTime = userTime.tz(anotherTz).format(format);

  return [ userTimeText, anotherTime ];
}

const init = async (msg, args) => {
  const sendMe = (targetData) => {
    if (targetData.timezone == null) {
      msg.channel.send("You haven't set your timezone.");
      return;
    }

    msg.channel.send(`It's **${defaultFormat(targetData.timezone)}** where you live.`);
  };

  switch (args[0]) {
    case "me": {
      const targetData = await DB.userDB.get(msg.author.id);
      sendMe(targetData);
      break;
    }

    case "set": {
      const zoneName = args.splice(1).join(" ");
      const tz = ct.lookupViaCity(zoneName)[0]?.timezone || m.tz.zone(zoneName)?.name;

      if (!tz) {
        msg.channel.send("Couldn't find that place.");
        return;
      }

      await DB.userDB.set(msg.author.id, { $set: { timezone: tz } });
      msg.channel.send(`I've set your timezone to **${capt(zoneName)}**.`);
      break;
    }

    default: {
      const target = await PLX.getTarget(args[0]);
      if (target) {
        const targetData = await DB.userDB.get(target.id);
        if (targetData.id === msg.author.id) {
          sendMe(targetData);
          return;
        }
        const match = args.slice(1).join(" ")
          .match(timeRegex);

        if (match == null) {
          msg.channel.send(`It's **${defaultFormat(targetData.timezone)}** where **${targetData.tag}** lives.`);
          return;
        }

        const userData = await DB.userDB.get(msg.author.id);

        const [ userTime, anotherTime ] = parseTime(match, userData.timezone, targetData.timezone);

        msg.channel.send(`It's **${anotherTime}** where **${targetData.tag}** lives when it's **${userTime}** in your timezone.`);

        return;
      }
      const zoneName = args.join(" ");

      const match = timeRegex.exec(zoneName);

      if (!match) {
        const tz = findTz(zoneName);

        if (!tz) {
          msg.channel.send("Couldn't find that place.");
          return;
        }

        msg.channel.send(`It's **${defaultFormat(tz)}** in **${capt(zoneName)}**.`);
        return;
      }

      const userData = await DB.userDB.get(msg.author.id);

      if (userData.timezone == null) {
        msg.channel.send("You haven't set your timezone.");
        return;
      }

      const timezoneText = zoneName.substring(0, match.index).trim();
      const timezone = findTz(timezoneText);

      if (!timezone) {
        msg.channel.send("Couldn't find that place.");
        return;
      }

      const [ userTime, anotherTime ] = parseTime(match, userData.timezone, timezone);

      msg.channel.send(`It's **${anotherTime}** in **${capt(timezoneText)}** when it's **${userTime}** in your timezone.`);
    }
  }
};

module.exports = {
  init,
  pub: true,
  cmd: "timezone",
  perms: 0,
  cat: "utility",
  botPerms: ["embedLinks"],
  aliases: ["tz"],
};
