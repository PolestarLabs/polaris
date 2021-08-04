const meSubs = require("../core/subroutines/onEveryMessage.js");

module.exports = async (msg) => {
    
  if (msg.author.bot) return;
  if (!PLX.ready) { 
    console.log("Message not Ready".red);
    return; 
  }
  INSTR.inc(`messages`, [`shard:${msg.guild?.shard?.id}`, `guild:${msg.guild?.id}` ] )

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
    let evaled;
    try {
      evaled = await eval(msg.content.replace("eval ", ""));
    } catch (error) {
      evaled = error.message;
    }
    if (typeof evaled !== "string") evaled = require("util").inspect(evaled);
    msg.channel.createMessage(evaled.substr(0, 1975));
  }

  //-----------------------------------------------------------

  meSubs(msg);
};
