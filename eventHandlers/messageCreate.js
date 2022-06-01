const meSubs = require("../core/subroutines/onEveryMessage.js");

module.exports = async (msg) => {
    
  if (msg.author.bot) return;
  if (!PLX.ready) { 
    //console.log("Message not Ready".red);
    //return; 
  }
  INSTR.inc(`messages`, [`user:${msg.author.id}`, `shard:${msg.guild?.shard?.id}`, `guild:${msg.guild?.id}`,`guild_name:${msg.guild?.id}` ] )

  // DEBUG -----------------------------------------------------



  if (PLX.refreshing) {
    delete require.cache[require.resolve("../core/structures/CommandPreprocessor.js")];
    delete require.cache[require.resolve("../core/subroutines/onEveryMessage.js")];
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
