// const gear = require('../../utilities/Gearbox');
// const DB = require('../../database/db_ops');
const Gal = require("../../structures/Galleries");

const init = async function (msg) {
  const P = { lngs: msg.lang, prefix: msg.prefix };
  

  let Target = await PLX.resolveMember(msg.guild, msg.args[0]);
  if (msg.author.id === Target.id) return msg.channel.createMessage("[REQUIRES_TRANSLATION_STRING] SELF_USER");

  const serverData = await DB.servers.get(msg.guild.id);
  P.imsorry = rand$t("responses.verbose.interjections.gomenasai");
  if (!PLX.modPass(msg.member, "banMembers", serverData)) return msg.channel.send($t("responses.errors.insuperms", P));

  if (!msg.args[0]) {
    return msg.channel.send($t("responses.errors.kinNone", P));
  }
  if (!Target) {
    return msg.channel.send($t("responses.errors.kin404", P));
  }
  if (Target.id === msg.author.id) {
    return msg.channel.send($t("responses.errors.cantKickSelf", P));
  }
  if (!Target.kickable) {
    return msg.channel.send($t("responses.errors.cantKickHim", P));
  }

  let clear = 0;
  let soft = false;
  let isFalse = false;

  function isParam(arg) {
    if (arg === "-purge" || arg === "-p") {
      clear = 7;
      msg.args.splice(1, 1);
      return true;
    }
    if (arg === "-soft" || arg === "-s") {
      soft = true;
      msg.args.splice(1, 1);
      return true;
    }
    if (arg === "-false" || arg === "-f") {
      isFalse = true;
      msg.args.splice(1, 1);
      return true;
    }
    return false;
  }

  while (isParam(msg.args[1]));

  if (isFalse) return console.log("false ban");

  P.user = Target.user.tag;
  const embed = new Embed();
  // embed.author = $('interface.kickban.kickingUser',P);
  embed.author(`🔨 Banning user [${P.user}]`, Target.user.avatarURL); // TODO translate
  embed.footer(msg.author.tag, msg.author.avatarURL);
  embed.timestamp(new Date());
  embed.color = 0x36393f;
  embed.thumbnail(await Gal.randomOne("kick", true));
  embed.description = _emoji("loading") + rand$t("responses.verbose.jas", P);

  let reason;
  let pre_msg;
  if (msg.args.length === 1) {
    embed.description = `*\`\`\`${$t("interface.kickban.waitingForReason", P)}\`\`\`*`;
    pre_msg = await msg.channel.send({ content: _emoji("loading") + $t("interface.kickban.includeReason", P), embed });
    const resp = await msg.channel.awaitMessages((msg2) => msg2.author.id === msg.author.id,
      { maxMatches: 1, time: 30e3 });

    reason = (resp[0]?.content) || false;
  } else {
    reason = msg.args.slice(1).join(" ");
  }

  if (!reason) {
    embed.color = 0xee1225;
    embed.description = "";
    if (pre_msg) {
      embed.description = `\u200b\n${$t("interface.kickban.noReason", P)}\n\u200b`;
      pre_msg.edit({
        content: `~~${$t("interface.kickban.includeReason", P)}~~`,
        embed,
      });
    } else {
      msg.channel.send($t("interface.kickban.noReason", P));
    }
    return null;
  } if (reason && reason === "cancel") {
    embed.color = 0xee1225;
    if (!pre_msg) return null;
    embed.description = `\u200b\n${$t("interface.kickban.cancelled", P)}\n\u200b`;
    pre_msg.edit({
      content: `~~${$t("interface.kickban.includeReason", P)}~~`,
      embed,
    });
    return;
  }
 
  if (!pre_msg) {
    pre_msg = await msg.channel.send({ embed });
  }


  const post_reason = (`${reason}\n  - MOD: ${msg.author.tag}`)
  const sanitize = x=> x.replace(/[\u{0080}-\u{FFFF}]/gu,"?");

  const postban = async (banned)=>{
    console.log('postban')
    await wait(1);
    console.log('wawa')
    if (soft) {
      PLX.unbean(msg.guild.id, Target.id, "SOFTBAN REMOVAL");
    }
    embed.color = 0xDD8A55;
    embed.description = `${_emoji("yep")}  ${$t(`interface.kickban.${soft ? "userSoftBanned" : "userBanned"}`, P)} ${rand$t("interface.kickban.banFlavs", P)}\n\`\`\` ${reason} \`\`\``;
    if (pre_msg) {
      pre_msg.edit({ content: "", embed });
    } else {
      msg.channel.send({ embed });
    }

    userBanned = null;
    Target = null;
  }

  PLX.bean(msg.guild.id, Target.id, clear, post_reason).then( postban )
  .catch((err) => {
    console.log(err)
    PLX.banGuildMember(msg.guild.id, Target.id, clear, "ERROR PARSING REASON - Usually due to special characters")
      .then(postban)
      .catch(err=>{
        msg.channel.send($t("interface.kickban.userKickError", P)); 
        console.error(err);
    })
  });
};

module.exports = {
  init,
  pub: true,
  cmd: "ban",
  argsRequired: true,
  perms: 2,
  cat: "mod",
  botPerms: ["banMembers"],
  aliases: [],
  argsRequired: true,
};
