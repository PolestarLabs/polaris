const meSubs = require("../core/subroutines/onEveryMessage.js");

module.exports = async (msg) => {
  if (msg.author.bot) return;
  if (!PLX.ready) { console.log("Message not Ready".red); return; }

  // DEBUG -----------------------------------------------------

  if (PLX.refreshing) {
    delete require.cache[require.resolve("../core/structures/CommandPreprocessor.js")];
    delete require.cache[require.resolve("../core/subroutines/onEveryMessage.js")];
  }

  if (PLX.tapping && !global.piggyback) {
    const PEV = PLX.tapping;
    if ([msg.channel.id, msg.guild.id, msg.author.id, "all"].includes(PEV) || PLX.beta) {
      console.log(
        msg.author.tag.blue + `(${msg.author.id})\n    `.gray,
        `${msg.content.inverse}\n`,
        `    @ ${(`#${msg.channel.name}`).yellow}(${msg.channel.id}) `,
        `> ${(msg.guild.name).bgBlue}(${msg.guild.id}) `, `\n${"--------".gray}`,
      );
    }
  }

  if (msg.content.startsWith("eval ") && ["88120564400553984", "253600545972027394", "124989722668957700"].includes(msg.author.id)) {
    msg.channel.createMessage(require("util").inspect((async () => {
      try {
        return await eval(msg.content.replace("eval ", ""));
      } catch (error) {
        return error.stack;
      }
    })()).substr(0, 1975));
  }

  //-----------------------------------------------------------

  meSubs(msg);
};
