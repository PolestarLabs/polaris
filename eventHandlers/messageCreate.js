

//const meSubs = require('../core/subroutines/onEveryMessage.js');
//const {BLACKLIST,YELLOWLIST,REDLIST} = require(paths.UTILS+'banLists.js');
//const DB = require (appRoot + "/core/database/db_ops")
//const Preprocessor =   require('../core/structures/LEGACY_CommandPreprocessor.js/index.js');

module.exports = async function (msg) {


  return;// temp for command client

  if(msg.author.bot) return;
  if(!POLLUX.ready) return;
  
  //DEBUG -----------------------------------------------------
  
  if(POLLUX.refreshing || POLLUX.beta){
     delete require.cache[require.resolve('../core/structures/CommandPreprocessor.js')]
     delete require.cache[require.resolve('../core/subroutines/onEveryMessage.js')]
  }
  
  if( (POLLUX.tapping || POLLUX.beta) && !global.piggyback){
    let PEV =  POLLUX.tapping
    if([msg.channel.id,msg.guild.id,msg.author.id,"all"].includes(PEV) || POLLUX.beta)

      console.log(
        msg.author.tag.blue+`(${msg.author.id})\n    `.gray,
        msg.content.inverse+"\n",
        `    @ ${("#"+msg.channel.name).yellow}(${msg.channel.id}) `,
        `> ${(msg.guild.name).bgBlue}(${msg.guild.id}) `, "\n"+"--------".gray
      );
  }
  
  //-----------------------------------------------------------
  

  
  if(
    POLLUX.user.id=="354285599588483082"&&
    msg.author.id !== "88120564400553984" &&
    msg.author.id !== "320351832268472320" &&
    msg.author.id !== "103727554644418560" && 
    msg.channel.id !== "488142183216709653" &&
    msg.author.id !== "200044537270370313" &&
    msg.author.id !== "163200584189476865"
    )
    return;
    
  if (!msg.guild) return; //DM Stuff?

  let _chanData = dataChecks('channel',msg.channel),
      _servData = dataChecks('server',msg.guild);
  let cacheUpdates = Promise.all([
    serverCacheUpdate  (_servData, msg.guild),
    channelCacheUpdate (_chanData, msg.channel)
  ]);
  
  let garbageC = () => {
    _chanData = null
    _servData = null
  };    

  if(
      ( POLLUX.blacklistedServers.includes(msg.guild.id) ) ||
      ( typeof msg.channel.ignored && msg.channel.ignored === true && !msg.content.includes("unignore")) 
    )
    return void garbageC();    

  commandResolve(msg,cacheUpdates,garbageC);

  
}
  
async function dataChecks(type,ent){
    return new Promise(async resolve =>{
      if(type==="user"){
        DB.users.findOne({id:ent.id}, {id:1,blacklisted:1} ).lean().exec().then(user=>{
          if(!user) return resolve(DB.users.new(ent));
          return resolve(user);
        });
      };
      if(type==="server"){
        DB.servers.findOne({id:ent.id}, {id:1,'modules.PREFIX':1,'modules.LANGUAGE':1 ,'modules.DISABLED':1,'modules.logging':1,'respondDisabled':1} ).lean().exec().then(server=>{
          if(!server) return resolve(DB.servers.new(ent));
          return resolve(server);
        });
      };
      if(type==="channel"){
        DB.channels.findOne({id:ent.id}, {id:1,ignored:1,LANGUAGE:1,'modules.DISABLED':1} ).then(channel=>{
          if(!channel) return resolve(DB.channels.new(ent));
          return resolve(channel);
        });
      }; 
    });
};
//
async function serverCacheUpdate(server,instance){
  server = await server;
  if(!server) return null;
  instance.prefix = server.modules.PREFIX     || '+'
  instance.language = server.modules.LANGUAGE || 'en'
  instance.globalPrefix = server.globalPrefix || false
  instance.DISABLED = server.modules.DISABLED || []
  instance.respondDisabled = server.respondDisabled || true
  instance.logging = server.logging || false
}

async function channelCacheUpdate(channel,instance){
  channel = await channel;
  if (!channel) return null;
  instance.language = channel.LANGUAGE || null;
  instance.ignored = channel.ignored || false;  
  instance.DISABLED = channel.modules.DISABLED || []
}

async function commandResolve(msg,cacheUpdates,garbageC){
  if(msg.content.startsWith("plx!")) msg.prefix = "plx!";
  if (msg.guild.globalPrefix !== false){
    if(msg.content.startsWith("p2!")) msg.prefix = "p2!";
  };
  if(msg.content.startsWith("<@"+POLLUX.user.id+"> ")) msg.prefix = "<@"+POLLUX.user.id+"> ";
  if(!msg.prefix && !msg.guild.prefix) await cacheUpdates;      
  if(msg.guild.prefix && msg.content.startsWith(msg.guild.prefix)) msg.prefix = msg.guild.prefix;

  if(POLLUX.user.id == "354285599588483082"){
    if(msg.content.startsWith("=")) msg.prefix = "=";
    if(msg.content.startsWith("+")) return;
  }

  if (msg.prefix) {
    if (POLLUX.blacklistedUsers.includes(msg.author.id) ) {
      msg.addReaction(":BLACKLISTED_USER:406192511070240780");
      return void garbageC();
    }
    Preprocessor(msg, {}).catch(e=>null);
    
  }else{
    meSubs(msg);
  };
}