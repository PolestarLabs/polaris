// const i18node = require("../../utils/i18node");
// const $t = i18node.getT();

exports.run = function run(cat, msg, perms) {
  if (!msg.channel.permissionsOf(PLX.user.id).has("sendMessages") || !msg.channel.permissionsOf(PLX.user.id).has("readMessageHistory")) {
    return "error";// 'error chan permis catchcheck'
  }

  if (typeof perms === "object") {
    let check1;
    const permsPass = [];
    Object.keys(perms).forEach((i) => {
      let level, perm;
      if (perms[i].includes(':')) {
        [level, perm] = perms[i].split(':');
      } else {
        perm = perms[i]
      }
      if (level === 'guild') {
        //
      }

      console.log({ perm, permsi: perms[i] })
      const hasChannelPermissions = msg.channel.permissionsOf(PLX.user.id).has(perm);
      const hasGuildPermissions = msg.guild.member(PLX.user.id).hasPermission(perm);

      if (!hasChannelPermissions && !hasGuildPermissions) {
        permsPass.push(_emoji("nope"));
        check1 = "error1";
      } else if (!hasGuildPermissions && level === 'guild') {
        permsPass.push(_emoji("nope"));
        check1 = "error1";
      } else {
        permsPass.push(_emoji("yep"));
      }
    });

    if (check1 == "error1") {
      msg.addReaction(_emoji("nope")).catch((err) => null);
      msg.channel.send(`${$t("error.iNeedThesePerms", { lngs: msg.lang })
        }\n${perms.map((p, i) => permsPass[i] + p).join("\n")
        }`).catch((err) => null);
    }

    if (check1) return check1;
  }

  if (["img", "social", "cosmetics"].includes(cat)) {
    if (!msg.channel.permissionsOf(PLX.user.id).has("attachFiles")) {
      msg.addReaction(":nope:339398829088571402");
      msg.channel.send(`${$t("error.iNeedThesePerms", { lngs: msg.lang })}
• \`ATTACH_FILES\`
`);
      return "error2";
    }
  }
  return "ok";
};
