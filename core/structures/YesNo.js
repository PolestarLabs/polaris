/**
 *
 * @param {Object} promptMessage Message that will receive Yes/No reactions
 * @param {Object} commandMessage Command Message send by the user
 * @param {function(<Cancel>,Message)|string} [yesFunction] Function to execute when YES is clicked
 * @param {function(Message)} [noFunction] Function to execute when NO is clicked
 * @param {function(Message)} [timeoutFunction] Function to execute when TIMEOUT
 * @param {Object} [options] Additional Options
 *
 * @param {Object<Embed>} options.embed Premade embed to be sent as response, defaults to whatever embed [promptMessage] already has
 * @param {boolean|false} [options.avoidEdit] Whether or not prevent editing of [promptMessage] by this method
 * @param {boolean|true} [options.clearReacts] Whether or not clear Yes/No reactions from [promptMessage]
 * @param {boolean|false} [options.deleteFields] Whether or not delete all Fields from the Embed.
 * @param {number|15000} [options.time] Timeout in milliseconds.
 * @param {Object} options.strings Footer Strings when yes/no/timeout
 * @param {string|"✔️"} [options.strings.confirm]
 * @param {string|"❌"} [options.strings.cancel]
 * @param {string|"🕑"} [options.strings.timeout]
 *
 * @returns {Promise<(boolean|null)>}  TRUE if YES | FALSE if NO | NULL if TIMEOUT
 *
 */

module.exports = async function yesNo(promptMessage, commandMessage, yesFunction = false, noFunction = false, timeoutFunction = false, options) {
  options = options || {};
  const embed = options.embed || promptMessage.embeds?.[0] || false;
  const avoidEdit = options.avoidEdit || !embed || false;
  const clearReacts = typeof options.clearReacts === "undefined" || options.clearReacts;
  const time = options.time || 15000;
  const deleteFields = typeof options.deleteFields === "boolean" ? options.deleteFields : true;
  const strings = options.strings || {};
  strings.confirm = `✔️${strings.confirm || ""}`;
  strings.cancel = `❌${strings.cancel || ""}`;
  strings.timeout = `🕑${strings.timeout || ""}`;

  const YA = {
    r: _emoji("yep").reaction,
    id: _emoji("yep").id,
  };
  const NA = {
    r: _emoji("nope").reaction,
    id: _emoji("nope").id,
  };

  await promptMessage.addReaction(YA.r);
  promptMessage.addReaction(NA.r);

  const reas = await promptMessage.awaitReactions({
    maxMatches: 1,
    authorOnly: options.approver || commandMessage.author.id,
    time,
  }).catch((err) => {
    console.error(err);
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
    if (!noFunction) return false;
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
    if (!yesFunction) return true;
  }
  return null;
};
