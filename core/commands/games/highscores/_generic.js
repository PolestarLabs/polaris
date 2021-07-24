const { standingsPrinter, defaultStandFun } = require("./_meta");

async function topGeneric(msg, args, telePass, rank) {
  const RANKS = await DB.rankings
    .find({
      type: {
        $in: [
          args[0] == "server" || !args[0] ? rank.group || rank : "",
          args[0] == "solo" || !args[0] ? rank.solo || rank : "",
        ],
      },
    })
    .sort({ points: -1 })
    .limit(10);

  const standings = await Promise.all(
    RANKS.map(async (item, i) => {
      return standingsPrinter(item, i, defaultStandFun);
    })
  );

  return msg.channel.send({
    content: `**High Scores for \`${rank.cmd || telePass}\`.**`,
    embed: {
      description: `\n${standings.join("\n")}.`,
    },
  });
}

module.exports = topGeneric;