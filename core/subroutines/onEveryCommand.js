const DB = require('../database/db_ops');
module.exports = {

  updateMeta: async function (msg,command){
    await DB.userDB.updateMeta(msg.author);
    await DB.serverDB.updateMeta(msg.guild);
    return null;
  },

  commLog: async function (message,command){
     let commandname = message.content.substr(message.prefix.length).split(/ +/)[0];

    if (!message.author.id == process.env.WATCHCMD || process.env.WATCHCMD == "all") {
      console.log("SHARD " + (process.env.SHARD).black.bgYellow + ("  --== " + commandname.toUpperCase() + " ==--   " + " || " + message.guild.name + " || " + message.author.tag + "  " + message.author.id).bgMagenta)
      console.log(" \x1b[37;1;91m |" + message.content + "| \x1b[0m " + (new Date()))
      console.log(message.guild.id + " S || C " + message.channel.id)
    }

  },
  administrateExp: async function (usID,command){

    let EXP = command.exp || 1;
    return DB.users.set(usID,{$inc:{'modules.exp':EXP}});

  },

  saveStatistics: async function (message,command){

      //STATISTICS COLLECTION

    Promise.all([
      DB.globalDB.set({
        $inc: {
              ['data.statistics.commandUsage.CMD.' + command.cmd]: 1,
              ['data.statistics.commandUsage.CAT.' + command.cat.replace('$', 'cash')]: 1
        }
      }),
      DB.userDB.set(message.author.id, {
        $inc: {
              ['modules.statistics.commandUsage.CMD.' + command.cmd]: 1,
              ['modules.statistics.commandUsage.TOTAL']: 1,
              ['modules.statistics.commandUsage.CAT.' + command.cat.replace('$', 'cash')]: 1
        }
      }),
      DB.serverDB.set(message.guild.id, {
        $inc: {
              ['modules.statistics.commandUsage.CMD.' + command.cmd]: 1,
              ['modules.statistics.commandUsage.TOTAL']: 1,
              ['modules.statistics.commandUsage.CAT.' + command.cat.replace('$', 'cash')]: 1
        }
      })]);


  }
}
