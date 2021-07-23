const topGeneric = require("./_generic.js");
const topFlags = require("./flags.js");

// TRANSLATE[epic=translations] highscores

const init = async function (msg, args, telePass, telePassArgs) {
  if (telePass == "hangmaid") return topGeneric(msg, args, telePassArgs, {
    cmd: "hangmaid",
    group: "hangmaid-server",
    solo: "hangmaid-solo",
  });
  if (telePass == "flags") return topFlags(msg, args);
  if (telePass == "gtf") return topFlags(msg, args);

  return {
    embed: {
      title: "**Here are the currently available Highscores Tables:**",
      description: `
        • \`${msg.prefix}highscores flags\` - for the \`${msg.prefix}guessflag\` minigame.
        • \`${msg.prefix}highscores hangmaid\` - for the \`${msg.prefix}hangmaid\` minigame.
        `,
    },
  };
};

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
    {
      label: "hm",
      gen: (a, b, c) =>
        topGeneric(a, b, c, {
          cmd: "hangmaid",
          group: "hangmaid-server",
          solo: "hangmaid-solo",
        }),
      options: {
        aliases: ["hangmaid"],
        // invalidUsageMessage: (msg) => { PLX.autoHelper("force", { msg, cmd: "commend", opt: "social" }); },
      },
    },
  ],
};
