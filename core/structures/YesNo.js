/**
 *
 * @param {import("eris").Message} promptMessage Message that will receive Yes/No reactions
 * @param {import("eris").Message} commandMessage Command Message send by the user
 * @param {function(<Cancel>,Message)|string} [yesFunction] Function to execute when YES is clicked
 * @param {function(Message)} [noFunction] Function to execute when NO is clicked
 * @param {function(Message)} [timeoutFunction] Function to execute when TIMEOUT
 * @param {Object} [options] Additional Options
 *
 * @param {Object<Embed>} [options.embed] Premade embed to be sent as response, defaults to whatever embed [promptMessage] already has
 * @param {boolean|false} [options.avoidEdit] Whether or not prevent editing of [promptMessage] by this method
 * @param {boolean|true} [options.clearReacts] Whether or not clear Yes/No reactions from [promptMessage]
 * @param {boolean|false} [options.deleteFields] Whether or not delete all Fields from the Embed.
 * @param {number|15000} [options.time] Timeout in milliseconds.
 * @param {Object} [options.strings] Footer Strings when yes/no/timeout
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
  const useButtons = typeof options?.useButtons === "boolean" ? options?.useButtons : true;
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

  let responses = [];

  if (useButtons) {
    await promptMessage.edit({
      content: promptMessage.content,
      components: [{type: 1, components: [
          { type: 2, style: 3, emoji: {id: _emoji('yep').id }, label: "Yep", custom_id: "yep" },
          { type: 2, style: 4, emoji: {id: _emoji('nope').id }, label: "Nope", custom_id: "nope" },
      ]}]      
    });
    responses = await promptMessage.awaitButtonClick({
      maxMatches: 1,
      authorOnly: options.approver || commandMessage.author.id,
      time,
    }).catch((err) => {
      console.error(err);
      return respondError();
    });
  }else{
    await promptMessage.addReaction(YA.r);
    promptMessage.addReaction(NA.r);
    responses = await promptMessage.awaitReactions({
      maxMatches: 1,
      authorOnly: options.approver || commandMessage.author.id,
      time,
    }).catch((err) => {
      console.error(err);
      return respondError();
    });
  }



  if (!responses?.length) return null;

  console.log({responses})

  if (
    (responses.length === 1 && responses[0]?.emoji?.id === NA.id) ||
    (responses[0].id === "nope") 
  ) {
    return cancellation();
  }

  if (
    (responses.length === 1 && responses[0]?.emoji?.id === YA.id) ||
    (responses[0].id === "yep") 
  ) {
    return respondPositive();
  }
  return null;



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
  function respondPositive(){
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

  function respondError(){
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
  }

};
