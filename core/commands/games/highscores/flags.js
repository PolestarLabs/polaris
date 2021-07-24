const { standingsPrinter } = require("./_meta");

  async function topFlags(msg, args) {
    const RANKS = await DB.rankings.find({ type: { $in: [args[0] == "server" || !args[0] ? "guessflag-server" : "", args[0] == "solo" || !args[0] ? "guessflag-solo" : ""] } }).sort({ points: -1 }).limit(10);
  
  
    const standFun = (item,i,subject) =>{
      return `\
      ${_emoji(`rank${i + 1}`)} \`\
  [${item.type.includes("solo") ? " SOLO " : "SERVER"}]\` \
  **${(subject.name || (`${subject.username}#${subject.discriminator}`)).slice(0, 25)}** \ 
  ${_emoji("__")}${_emoji("__")}  \
  Grade ${_emoji(`grade${item.data.grade}`)}\
  ${_emoji("__")}\
  \\🚩 **\`${(item.data.rounds ? item.data.rounds : item.data.flags).toString().padStart(3, " ")}\`** \
  ${_emoji("__")}\
  **\`${(`${item.points}`).padStart(6, " ")}\`**pts.  \
  \\⏱ ${item.data.time || "Time Attack"}\
  ${item.data.time ? "s :: Endless Mode" : ""}`;    
        }
  
  
    const standings = (await Promise.all(RANKS.map(async (item, i) => { return standingsPrinter(item,i,standFun) } ) ) );
  
    return msg.channel.send({
      content:`**High Scores for \`${"guessflag"}\`.**`,
      embed: {
        description: `\n${standings.join('\n')}`
      }
    });
    
  }
  
  module.exports = topFlags