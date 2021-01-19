// TRANSLATE[epic=translations] highscores

const init = async function (msg, args, telePass) {
  if (telePass == "flags") return topFlags(msg, args);
  if (telePass == "gtf") return topFlags(msg, args);
};

async function topFlags(msg, args) {
  const RANKS = await DB.rankings.find({ type: { $in: [args[0] == "server" || !args[0] ? "guessflag-server" : "", args[0] == "solo" || !args[0] ? "guessflag-solo" : ""] } }).sort({ points: -1 }).limit(10);

  const standings = (await Promise.all(RANKS.map(async (item, i) => {
    let subject;
    if (item.type.includes("solo")) subject = await PLX.resolveUser(item.id);
    else subject = await PLX.getRESTGuild(item.id);

    return `\
${_emoji(`rank${i + 1}`)} \`\
[${item.type.includes("solo") ? " SOLO " : "SERVER"}]\` \
**${subject.name || (`${subject.username}#${subject.discriminator}`)}** \ 
${_emoji("__")}${_emoji("__")}  \
Grade ${_emoji(`grade${item.data.grade}`)}\
${_emoji("__")}\
\\🚩 **\`${(item.data.rounds ? item.data.rounds : item.data.flags).toString().padStart(3, " ")}\`** \
${_emoji("__")}\
**\`${(`${item.points}`).padStart(6, " ")}\`**pts.  \
\\⏱ ${item.data.time || "Time Attack"}\
${item.data.time ? "s :: Endless Mode" : ""}`;
  }))).join("\n");
  //* *\`${((subject.name||(`${subject.username}#${subject.discriminator}`)) +'').padEnd(40,"-")}\`** \

  msg.channel.send(`**High Scores for \`guessflag\`.**\n\n${standings}`);
}

module.exports = {
  init,
  pub: true,
  cmd: "highscores",
  cat: "games",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ["hiscores", "hsc"],
  autoSubs: [
    {
      label: "flags",
      gen: topFlags,
      options: {
        aliases: ["guessflag"],
        // invalidUsageMessage: (msg) => { PLX.autoHelper("force", { msg, cmd: "commend", opt: "social" }); },
      },
    },
  ],
};
