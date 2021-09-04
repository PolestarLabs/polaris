const m = require("moment-timezone");
const ct = require("city-timezones");

const capt = (phrase) => phrase
  .toLowerCase()
  .split(" ")
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(" ");

const formatDate = (timezone) => m.tz(timezone).format("hh:mma");

const init = async (msg, args) => {
  switch (args[0]) {
    case "me": {
      const targetData = await DB.userDB.get(msg.author.id);

      if (targetData.timezone === "") {
        msg.channel.send("You haven't set your timezone.");
        return;
      }

      msg.channel.send(`It's **${formatDate(targetData.timezone)}** where you live.`);
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

        if (targetData.timezone == null) {
          msg.channel.send(`*${target.tag}* hasn't set their timezone.`);
          return;
        }

        msg.channel.send(`It's **${formatDate(targetData.timezone)}** where **${targetData.tag}** lives.`);
      } else {
        const zoneName = args.join(" ");
        const tz = ct.lookupViaCity(zoneName)[0]?.timezone || m.tz.zone(zoneName)?.name;

        if (!tz) {
          msg.channel.send("Couldn't find that place.");
          return;
        }

        msg.channel.send(`It's **${formatDate(tz)}** in **${capt(zoneName)}**.`);
      }
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
