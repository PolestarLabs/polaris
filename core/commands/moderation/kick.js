// const gear = require('../../utilities/Gearbox');
// const DB = require('../../database/db_ops');
const Gal = require("../../structures/Galleries");

const init = async function (msg) {
  const P = { lngs: msg.lang, prefix: msg.prefix };

  const serverData = await DB.servers.get(msg.guild.id);
  P.imsorry = rand$t("responses.verbose.interjections.gomenasai");
  if (!PLX.modPass(msg.member, "kickMembers", serverData)) return msg.channel.send($t("responses.errors.insuperms", P));

  if (!msg.args[0]) {
    return msg.channel.send($t("responses.errors.kinNone", P));
  }

  let Target;
  try {
    Target = await PLX.resolveMember(msg.guild, msg.args[0]);
  } catch (e) {
    return msg.channel.send($t("responses.errors.kin404", P));
  }

  if (Target.id === msg.author.id) {
    return msg.channel.send($t("responses.errors.cantKickSelf", P));
  }
  if (!Target.kickable) {
    return msg.channel.send($t("responses.errors.cantKickHim", P));
  }

  const embed = new Embed();
  P.user = Target.user.tag;
  // embed.author = $('interface.kickban.kickingUser',P);
  embed.author(`👢 Kicking user [${P.user}]`, Target.user.avatarURL);
  embed.footer(msg.author.tag, msg.author.avatarURL);
  embed.timestamp(new Date());
  embed.color = 0x36393f;
  embed.thumbnail(await Gal.randomOne("kick", true).catch((e) => null));
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

  const post_reason = `${reason} [MOD: ${msg.author.tag} `;

  PLX.kickGuildMember(msg.guild.id, Target.id, post_reason).then(async (m) => {
    embed.color = 0x3355EE;
    embed.description = `${_emoji("yep")}  ${$t("interface.kickban.userKicked", P)}\n${rand$t("interface.kickban.kickFlavs", P)}\n\`\`\` ${reason} \`\`\``;
    if (pre_msg) {
      await wait(1);
      pre_msg.edit({ content: "", embed });
    } else {
      msg.channel.send({ embed });
    }
  }).catch((err) => {
    msg.channel.send($t("interface.kickban.userKickError", P));
    console.error(err);
  });
};
module.exports = {
  init,
  pub: false,
  cmd: "kick",
  perms: 2,
  cat: "moderation",
  botPerms: ["kickMembers"],
  aliases: [],
};
