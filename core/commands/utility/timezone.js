const m = require('moment-timezone')
const ct = require('city-timezones')

const init = async function (msg, args) {
  switch (args[0]) {
    case 'me':
      const TargetData = await DB.userDB.get(msg.author.id)
      if (TargetData.timezone === "") return msg.channel.send('You haven\'t set your timezone.')
      msg.channel.send(`It's **${m.tz(TargetData.timezone).format('hh:mma')}** where you live.`)
      break

    case 'set':
      const zoneName = args.splice(1).join(' ')
      const tz = ct.lookupViaCity(zoneName)[0]?.timezone || m.tz.zone(zoneName)?.name
      if (!tz) return msg.channel.send('Couldn\'t find that place.')
      await DB.userDB.set(msg.author.id, { $set: { "timezone": tz } })
      msg.channel.send(`I've set your timezone to **${capt(zoneName)}**.`)
      break

    default:
      const Target = await PLX.getTarget(args[0])
      if (Target) {
        const TargetData = await DB.userDB.get(Target.id)
        if (TargetData.timezone === "") return msg.channel.send(`*${Target.tag}* hasn't set their timezone.`)
        msg.channel.send(`It's **${m.tz(TargetData.timezone).format('hh:mma')}** where **${TargetData.tag}** lives.`)
      } else {
        const zoneName = args.join(' ')
        const tz = ct.lookupViaCity(zoneName)[0]?.timezone || m.tz.zone(zoneName)?.name
        if (!tz) return msg.channel.send('Couldn\'t find that place.')
        msg.channel.send(`It's **${m.tz(tz).format('hh:mma')}** in **${capt(args.join(' '))}**.`)
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

const capt = (phrase) => {
  return phrase
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
