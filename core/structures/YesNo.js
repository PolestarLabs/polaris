// const gear = require("../utilities/Gearbox/global");
module.exports = async function yesNo(m, message, yes = false, no = false, timeout = false, options) {
  options = options || {};
  const embed = options.embed || m.embeds?.[0] || false;
  const avoidEdit = options.avoidEdit || !embed || false;
  const clearReacts = typeof options.clearReacts === "undefined" || options.clearReacts;
  const time = options.time || 15000;
  const deleteFields = typeof options.deleteFields === "boolean" ? options.deleteFields : true;
  const strings = options.strings || {};
  strings.confirm = `✔️${strings.confirm || ""}`;
  strings.timeout = `🕑${strings.timeout || ""}`;
  strings.cancel = `❌${strings.cancel || ""}`;

  const YA = {
    r: ":yep:339398829050953728",
    id: "339398829050953728",
  };
  const NA = {
    r: ":nope:339398829088571402",
    id: "339398829088571402",
  };

  await m.addReaction(YA.r);
  m.addReaction(NA.r);
  const reas = await m.awaitReactions({
    maxMatches: 1,
    authorOnly: options.approver || message.author.id,
    time,
  }).catch(() => {
    if (clearReacts) m.removeReactions().catch(() => null);
    if (embed && !avoidEdit) {
      embed.color = 16499716;
      if (deleteFields === true) embed.fields = [];
      embed.footer = { text: strings.timeout };

      m.edit({ embed });
    }
    if (timeout && typeof timeout === "function") return timeout(m);
    if (timeout) return timeout;
    return null;
  });
  if (!reas?.length !== 0) return null;

  function cancellation() {
    if (clearReacts) m.removeReactions().catch(() => null);
    if (embed && !avoidEdit) {
      embed.color = 16268605;
      if (deleteFields === true) embed.fields = [];
      embed.footer = { text: strings.cancel };

      m.edit({ embed });
    }
    if (typeof no === "function") return no(m);
    if (no) return no;
    return null;
  }

  if (reas.length === 1 && reas[0].emoji.id === NA.id) {
    return cancellation();
  }

  if (reas.length === 1 && reas[0].emoji.id === YA.id) {
    if (clearReacts) m.removeReactions().catch(() => null);
    if (embed && !avoidEdit) {
      embed.color = 1234499;
      if (deleteFields === true) embed.fields = [];
      embed.footer = { text: strings.confirm };
      m.edit({ embed });
    }
    if (yes && typeof yes === "function") return yes(cancellation, m);
    if (yes) return yes;
  }
  return undefined;
};
