// const DB = require('../database/db_ops');
module.exports = {

  async updateMeta(msg) {
    DB.userDB.updateMeta(msg.author);
    if (msg.guild) DB.serverDB.updateMeta(msg.guild);
    return null;
  },

  async commLog(message) {
    const commandname = message.content.substr(message.prefix.length).split(/ +/)[0];

    if (!message.author.id === process.env.WATCHCMD || process.env.WATCHCMD === "all") {
      console.log(`SHARD ${(process.env.SHARD).black.bgYellow}${(`  --== ${commandname.toUpperCase()} ==--   `
        + ` || ${message.guild.name} || ${message.author.tag}  ${message.author.id}`).bgMagenta}`);
      console.log(` \x1b[37;1;91m |${message.content}| \x1b[0m ${new Date()}`);
      console.log(`${message.guild.id} S || C ${message.channel.id}`);
    }
  },
  async administrateExp(usID, command) {
    const EXP = command.exp || 1;
    return DB.users.updateOne({ id: usID }, { $inc: { "modules.exp": EXP } }, { upsert: false }).lean().exec();
  },

  async saveStatistics(message, command) {
    // STATISTICS COLLECTION

    Promise.all([
      DB.globalDB.set({
        $inc: {
          [`data.statistics.commandUsage.CMD.${command.cmd}`]: 1,
          [`data.statistics.commandUsage.CAT.${(command.cat || "UNKNOWN").replace("$", "cash")}`]: 1,
        },
      }),
      DB.control.set(message.author.id, {
        $inc: {
          [`data.statistics.commandUsage.CMD.${command.cmd}`]: 1,
          "data.statistics.commandUsage.TOTAL": 1,
          [`data.statistics.commandUsage.CAT.${(command.cat || "UNKNOWN").replace("$", "cash")}`]: 1,
        },
      }),
      (async () => {
        if (message.guild) {
          DB.serverDB.set(message.guild.id, {
            $inc: {
              [`modules.statistics.commandUsage.CMD.${command.cmd}`]: 1,
              "modules.statistics.commandUsage.TOTAL": 1,
              [`modules.statistics.commandUsage.CAT.${(command.cat || "UNKNOWN").replace("$", "cash")}`]: 1,
            },
          });
        }
      })(),
    ]);
  },
};
