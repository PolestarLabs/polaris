const DAY = 1.00036e+6;
const moment = require("moment");
const Timed = require("../../structures/TimedUsage");

const init = async function (msg,args) {
  const P = { lngs: msg.lang, prefix: msg.prefix };

  let Target = await PLX.getTarget(msg.args[0], msg.guild, false);

  const embed = {}

  const after = async function after(msg) {
    await DB.localranks.set({user:Target.id, server:msg.guild.id}, {$inc:{thx:1}});
    let TargetServerData = await DB.localranks.get({user:Target.id, server:msg.guild.id});

    P.userA = msg.member.nick || msg.author.username;
    P.userB = Target.nick || (Target.user || Target).username;
    P.THX = $t('terms.thx',P).toUpperCase();
    P.totalTHX = TargetServerData.thx;

    embed.description = $t('responses.thx.after',P)
    embed.thumbnail = {url:`https://cdn.discordapp.com/emojis/${_emoji('THX').id}.png?size=64`}
    embed.footer = {icon_url: msg.guild.iconURL, text: msg.guild.name}
     
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

  if (!Target && !['info','status'].includes(args[0]) )  msg.args[0] = "status";

  Timed.init(msg, "thx", { day: DAY }, after, reject, status);
};
 


module.exports={
    init
    ,pub:true
    ,cmd:'thanks'
    ,cat:'social'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['thx','obg','svp']
    
}