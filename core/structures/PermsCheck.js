// const i18node = require("../../utils/i18node");
// const $t = i18node.getT();

exports.run = function run(cat, msg, perms) {
  msg.channel.createMessage("I'm running in PermsCheck")
  if (!msg.channel.permissionsOf(PLX.user.id).has("sendMessages")) {
    return "error";// 'error chan permis catchcheck'
  }
  msg.channel.createMessage("bot has send messages")
  if (typeof perms === "object") {
    let check1;
    Object.keys(perms).forEach((i) => {
      if (!msg.channel.permissionsOf(PLX.user.id).has(perms[i])) {
        try {
          msg.addReaction(":nope:339398829088571402");
          msg.channel.send(`${$t("error.iNeedThesePerms", { lngs: msg.lang })}
${`• ${perms.join("\n• ")}`}
`);
        } catch (e) {} // eslint-disable-line no-empty
        check1 = "error1";
      }
    });
    if (check1) return check1;
  }
  msg.channel.createMessage("bot has specified perms")

  if (["img", "social", "cosmetics"].includes(cat)) {
    if (!msg.channel.permissionsOf(PLX.user.id).has("attachFiles")) {
      msg.addReaction(":nope:339398829088571402");
      msg.channel.send(`${$t("error.iNeedThesePerms", { lngs: msg.lang })}
• \`ATTACH_FILES\`
`);
      return "error2";
    }
    msg.channel.createMessage("bot has perms for category")
  }
  msg.channel.createMessage("bot has all perms")
  return "ok";
};
