// const gear = require("../utilities/Gearbox/global");
module.exports = async function yesNo(promptMessage, commandMessage, yesFunction = false, noFunction = false, timeoutFunction = false, options) {
  options = options || {};
  const embed = options.embed || promptMessage.embeds?.[0] || false;
  const avoidEdit = options.avoidEdit || !embed || false;
  const clearReacts = typeof options.clearReacts === "undefined" || options.clearReacts;
  const time = options.time || 15000;
  const deleteFields = typeof options.deleteFields === "boolean" ? options.deleteFields : true;
  const strings = options.strings || {};
  strings.confirm = `✔️${strings.confirm || ""}`;
  strings.timeout = `🕑${strings.timeout || ""}`;
  strings.cancel = `❌${strings.cancel || ""}`;

  const YA = {
    r: _emoji('yep').reaction,
    id: _emoji('yep').id
  };
  const NA = {
    r: _emoji('nope').reaction,
    id: _emoji('nope').id
  };

  await promptMessage.addReaction(YA.r);
  promptMessage.addReaction(NA.r);

  const reas = await promptMessage.awaitReactions({
    maxMatches: 1,
    authorOnly: options.approver || commandMessage.author.id,
    time,
  }).catch((err) => {
    console.error(err)
    if (clearReacts) promptMessage.removeReactions().catch(() => null);
    if (embed && !avoidEdit) {
      embed.color = 16499716;
      if (deleteFields === true) embed.fields = [];
      embed.footer = { text: strings.timeout };

      promptMessage.edit({ embed });
    }
    if (timeoutFunction && typeof timeoutFunction === "function") return timeoutFunction(promptMessage);
    if (timeoutFunction) return timeoutFunction;
    return null;
  });
   
  if (!reas?.length) return null;
 
  function cancellation() {
    if (clearReacts) promptMessage.removeReactions().catch(() => null);
    if (embed && !avoidEdit) {
      embed.color = 16268605;
      if (deleteFields === true) embed.fields = [];
      embed.footer = { text: strings.cancel };

      promptMessage.edit({ embed });
    }
    if (typeof noFunction === "function") return noFunction(promptMessage);
    if (noFunction) return noFunction;
    return null;
  }

  if (reas.length === 1 && reas[0].emoji.id === NA.id) {
    return cancellation();
  }

  if (reas.length === 1 && reas[0].emoji.id === YA.id) {
    if (clearReacts) promptMessage.removeReactions().catch(() => null);
    if (embed && !avoidEdit) {
      embed.color = 1234499;
      if (deleteFields === true) embed.fields = [];
      embed.footer = { text: strings.confirm };
      promptMessage.edit({ embed });
    }
    if (yesFunction && typeof yesFunction === "function") return yesFunction(cancellation, promptMessage);
    if (yesFunction) return yesFunction;
  }
  return undefined;
};
