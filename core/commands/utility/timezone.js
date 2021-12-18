const tzData = require("../../../resources/tzData.json");

function capt(phrase) {
  return phrase
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function defaultFormat(timeZone, locale) {
  return new Date().toLocaleString(
    locale,
    {
      timeZone,
      hour: "numeric",
      minute: "numeric",
    },
  );
}

const timeRegex = /([0-2]?[0-9])(?:(?::|(?: ?h(?:ours? )? ?))(?:and )?([0-5]?[0-9]|60)? ?(?:m(?:in(?:utes?)?)?)?)? ?(pm|am)?/i;

function lookupTzBy(keys, tz, array = false) {
  for (const key of keys) {
    const result = tzData.find((item) => {
      const value = item[key];
      return array ? value?.includes(tz) : value === tz;
    });

    if (result) {
      return result.timezone;
    }
  }
  return null;
}

function findTz(zoneName) {
  const searchKeys = [
    "timezone",
    "country",
    "iso2",
  ];

  const result = lookupTzBy(searchKeys, zoneName);

  if (result) {
    return result;
  }

  const searchKeysArray = [
    "provinces",
    "cities",
  ];

  const resultArray = lookupTzBy(searchKeysArray, zoneName, true);
  if (resultArray) {
    return resultArray;
  }

  return null;
}

/**
 * Gets the timezone offest in milliseconds.
 */
function getTimezoneOffset(timeZone) {
  const date = new Date();
  const toTzDate = new Date(date.toLocaleString("en-US", {
    timeZone,
  }));
  return date.getTime() - toTzDate.getTime();
}

function convertToTz(time, timeZone, offset = 0) {
  return new Date(new Date(time.getTime() + offset)
    .toLocaleString("en-US", {
      timeZone,
    }));
}

function parseTime(match, locale, userTz, anotherTz) {
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

  const format = parsedPeriod ? "numeric" : "2-digit";

  const userTime = new Date();
  userTime.setHours(hourInt);
  userTime.setMinutes(minuteInt);

  const offset = getTimezoneOffset(userTz);

  const anotherTime = convertToTz(userTime, anotherTz, offset);

  const opts = {
    hour: format,
    minute: format,
    hour12: Boolean(parsedPeriod),
  };

  const userTimeText = userTime.toLocaleString(locale, opts);

  const anotherTimeText = anotherTime.toLocaleString(locale, opts);

  return [ userTimeText, anotherTimeText ];
}

const init = async (msg, args) => {
  const locale = msg.lang[0] || "en-US";

  const sendMe = (targetData) => {
    if (targetData.timezone == null) {
      msg.channel.send("You haven't set your timezone.");
      return;
    }

    msg.channel.send(`Your timezone is ${capt(targetData.timezone)}`);
  };

  switch (args[0]) {
    case "me": {
      const targetData = await DB.userDB.get(msg.author.id);
      sendMe(targetData);
      break;
    }

    case "set": {
      const zoneName = args.splice(1).join(" ");
      const tz = findTz(zoneName);

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
        const match = args.slice(1).join(" ")
          .match(timeRegex);

        const targetData = await DB.userDB.get(target.id);

        if (targetData.id === msg.author.id) {
          sendMe(targetData);
          return;
        }

        if (!targetData.timezone) {
          msg.channel.send(`**${targetData.tag}** hasn't set their timezone.`);
          return;
        }

        if (!match) {
          msg.channel.send(`**${targetData.tag}**'s timezone is **${capt(targetData.timezone)}**.`);
          return;
        }

        const userData = await DB.userDB.get(msg.author.id);

        const [ userTime, anotherTime ] = parseTime(match, locale, userData.timezone, targetData.timezone);

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

        msg.channel.send(`It's **${defaultFormat(tz, locale)}** in **${capt(zoneName)}**.`);
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

      const [ userTime, anotherTime ] = parseTime(match, locale, userData.timezone, timezone);

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
