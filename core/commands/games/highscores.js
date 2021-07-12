// TRANSLATE[epic=translations] highscores

const init = async function (msg, args, telePass) {
  if (telePass == "hangmaid") return topGeneric(msg, args,{command:'hangmaid',group:'hangmaid-group',solo:'hangmaid-solo'});
  if (telePass == "flags") return topFlags(msg, args);
  if (telePass == "gtf") return topFlags(msg, args);


  return {
    embed: {
      title: "**Here are the currently available Highscores Tables:**",
      description: `
      • \`${msg.prefix}highscores flags\` - for the \`${msg.prefix}guessflag\` minigame.
      • ~~\`${msg.prefix}highscores hangmaid\` - for the \`${msg.prefix}hangmaid\` minigame.~~ (SOON™)
      `
    }
  }

};

async function topFlags(msg, args) {
  const RANKS = await DB.rankings.find({ type: { $in: [args[0] == "server" || !args[0] ? "guessflag-server" : "", args[0] == "solo" || !args[0] ? "guessflag-solo" : ""] } }).sort({ points: -1 }).limit(10);

  const standings = (await Promise.all(RANKS.map(async (item, i) => {
    if (i === 5) return '';
    let subject;
    if (item.type.includes("solo")) subject = await PLX.resolveUser(item.id);
    else subject = await PLX.getRESTGuild(item.id).catch(err => ({ name: "Unknown Server" }));

    //FIXME[epic=flicky] Fix response design: current solution constantly hits max chars
    return `\
${_emoji(`rank${i + 1}`)} \`\
[${item.type.includes("solo") ? " SOLO " : "SERVER"}]\` \
**${(subject.name || (`${subject.username}#${subject.discriminator}`)).slice(0, 25)}** \ 
${_emoji("__")}${_emoji("__")}  \
Grade ${_emoji(`grade${item.data.grade}`)}\
${''/*_emoji("__")*/}\
\\🚩 **\`${(item.data.rounds ? item.data.rounds : item.data.flags).toString().padStart(3, " ")}\`** \
${_emoji("__")}\
**\`${(`${item.points}`).padStart(6, " ")}\`**pts.  \
\\⏱ ${item.data.time || "Time Attack"}\
${item.data.time ? "s :: Endless Mode" : ""}`;
  })));
  //* *\`${((subject.name||(`${subject.username}#${subject.discriminator}`)) +'').padEnd(40,"-")}\`** \

  const standings1 = standings.slice(0,5).join('\n');
  const standings2 = standings.slice(5).join('\n');
  msg.channel.send(`**High Scores for \`guessflag\`.**\n\n${standings1}`);
  msg.channel.send(`\n${standings2}`);
  return;
}



async function topGeneric(msg, args, rank) {
  const RANKS = await DB.rankings.find({ type: { $in: [args[0] == "server" || !args[0] ? rank.group||rank : "", args[0] == "solo" || !args[0] ? rank.solo||rank : ""] } }).sort({ points: -1 }).limit(10);

  const standings = (await Promise.all(RANKS.map(async (item, i) => {
    if (i === 5) return '';
    let subject;
    if (item.type.includes("solo")) subject = await PLX.resolveUser(item.id);
    else subject = await PLX.getRESTGuild(item.id).catch(err => ({ name: "Unknown Server" }));

    //FIXME[epic=flicky] Fix response design: current solution constantly hits max chars
    return `\
${_emoji(`rank${i + 1}`)} \`\
[${item.type.includes("solo") ? " SOLO " : "SERVER"}]\` \
**${(subject.name || (`${subject.username}#${subject.discriminator}`)).slice(0, 25)}** \ 
${_emoji("__")}${_emoji("__")}  \
Grade ${_emoji(`grade${item.data.grade}`)}\
${''/*_emoji("__")*/}\
\\🚩 **\`${(item.data.rounds ? item.data.rounds : item.data.flags).toString().padStart(3, " ")}\`** \
${_emoji("__")}\
**\`${(`${item.points}`).padStart(6, " ")}\`**pts.  \
\\⏱ ${item.data.time || "Time Attack"}\
${item.data.time ? "s :: Endless Mode" : ""}`;
  })));
  //* *\`${((subject.name||(`${subject.username}#${subject.discriminator}`)) +'').padEnd(40,"-")}\`** \

  const standings1 = standings.slice(0,5).join('\n');
  const standings2 = standings.slice(5).join('\n');
  msg.channel.send(`**High Scores for \`${rank.cmd || rank}\`.**\n\n${standings1}`);
  msg.channel.send(`\n${standings2}`);
  return;
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
      label: "flags", gen: topFlags, options: {
        aliases: ["guessflag"],
        // invalidUsageMessage: (msg) => { PLX.autoHelper("force", { msg, cmd: "commend", opt: "social" }); },
      },
    },
    {
      label: "hm", gen: topGeneric, options: {
        aliases: ["hangmaid"],
        // invalidUsageMessage: (msg) => { PLX.autoHelper("force", { msg, cmd: "commend", opt: "social" }); },
      },
    },
  ],
};
