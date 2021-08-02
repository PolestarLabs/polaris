const { GuildChannel, TextChannel, ThreadChannel } = require("eris");
const {lootbox: Drops} = require("./boxDrops");
const localLevelUp = require("./localLevelUp.js");
const globalLevelUp = require("./globalLevelUp.js");
const customResponses = require("./customResponses.js");

const { Bucket } = require("eris");
const levelUpQUeue = new Bucket( PLX.guilds.size, 60e3, { latencyRef: { latency: 30e3 } });


const levelChecks = async (msg) => {
  if (msg.author.bot) return;
  if (msg.guild.id === "110373943822540800") return;

  if (levelUpQUeue.tokens < levelUpQUeue.tokenLimit) return;

  levelUpQUeue.queue( async () => {
    DB.servers.findOne({ id: msg.guild.id }).cache().then(x=> msg.guild.serverData = x);
    if (servData.modules.LVUP === true && msg.channel instanceof TextChannel) {
      setImmediate( ()=> globalLevelUp(msg,userData) );
    }
  });
  
  let servData = msg.guild.serverData;
  if (!servData) return;
 
  setImmediate( ()=> localLevelUp(servData,msg) );
 
}

module.exports = async (msg) => {
  if (!msg.guild) return;
  if (msg.type !== 0) return;
  if (!(msg.channel instanceof GuildChannel)) return;
  if (msg.channel instanceof ThreadChannel) return;
  

  if (msg.guild.imagetracker && !msg.channel.nsfw) {
    const hasImageURL = msg.content.match(/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png)/g);
    if (msg.attachments?.[0] || hasImageURL) {
      /* Do Stuff when there is image */
    }
  }

  PLX.execQueue = PLX.execQueue.filter((itm) => itm?.constructor === Promise && itm.isFulfilled() !== true);
  PLX.execQueue.push(Drops(msg));
  levelChecks(msg); 
  
};
