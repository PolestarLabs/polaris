const YesNo = require("../../core/structures/YesNo.js");

exports.run = (msg, args, userData, itemDetails) => new Promise(async (resolve) => {
  const TARGET = args[0] || "daily";

  const destinationCounter = userData.counters?.[TARGET];

  if (!destinationCounter || !destinationCounter.streak) return msg.channel.send("You do not have a streak here to be fixed.");
  if ((destinationCounter.lastStreak || 0) <= destinationCounter.streak) return msg.channel.send("You cannot restore your streak to a number below your current one.");

  const promptMessage = await msg.channel.send({
    embed: {
      description: "Would you like to consume your Streakfix ?" + `
\`${TARGET}\` [${destinationCounter.streak}] >> [${destinationCounter.lastStreak}]        
        `,
    },
  });

  YesNo(promptMessage, msg,
    async (cancel, prompt) => {
      await DB.users.set(userData.id, { [`counters.${TARGET}.streak`]: destinationCounter.lastStreak });
      await (await DB.users.getFull(userData.id)).removeItem(userData.id, "streakfix", 1);

      resolve("OK");
    },
    () => {
      resolve("CANCEL");
    },
    (prompt) => {
      resolve("TIMEOUT");
    });
});
