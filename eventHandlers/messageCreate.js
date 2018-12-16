const meSubs = require('../core/subroutines/onEveryMessage.js');
const {BLACKLIST,YELLOWLIST,REDLIST} = require(paths.UTILS+'banLists.js');
const DB = require (appRoot + "/core/database/db_ops")
 
exports.run = async function (msg) {

  if(msg.author.bot) return;
  
  //DEBUG -----------------------------------------------------
  
  if(POLLUX.refreshing || POLLUX.beta){
     delete require.cache[require.resolve('../core/structures/CommandPreprocessor.js')]
     delete require.cache[require.resolve('../core/subroutines/onEveryMessage.js')]
  }
  
  if(POLLUX.tapping || POLLUX.beta){
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
  msg.author.id !== "163200584189476865"
  )return;


  let   USER   = msg.author,
        SERVER = msg.guild,
        CHANNEL= msg.channel;
        //TARGET = msg.mentions[0];


  if (!SERVER) return; //DM Stuff?
  if (BLACKLIST.includes(USER.id)) return; 
  if (YELLOWLIST.includes(CHANNEL.id)) return; 
  if (REDLIST.includes(SERVER.ownerID.id)||REDLIST.includes(SERVER.id)) return; 


  let _chanData = dataChecks('channel',CHANNEL),
      _servData = dataChecks('server',SERVER),
      _userData = dataChecks('user',USER);

  let garbageC = () => {
    _chanData = null
    _servData = null
    _userData = null
    USER      = null
    SERVER    = null
    CHANNEL   = null
  };
    
 _chanData = await _chanData;
 if ( !_chanData || (_chanData.ignored === true && !msg.content.includes("unignore")) ) return void garbageC();
  
 _servData = await _servData;
 if ( !(_servData) ) return void garbageC();
  
 _userData = await _userData;
 if ( !(_userData) ) return void garbageC();  
  

  if (typeof (_servData.modules.PREFIX) !== 'undefined' && _servData.modules.PREFIX !== '') {    
    if(msg.content.startsWith(_servData.modules.PREFIX)) msg.prefix = _servData.modules.PREFIX;
  }
  if (_servData.globalPrefix!==false){
    if(msg.content.startsWith("p2!")) msg.prefix = "p!2";
  };
  if(msg.content.startsWith("plx!")) msg.prefix = "plx2!";
  if(msg.content.startsWith("<@"+POLLUX.user.id+"> ")) msg.prefix = "<@"+POLLUX.user.id+"> ";
  
  // ALPHA
  if(POLLUX.user.id == "354285599588483082"){
    if(msg.content.startsWith("=")) msg.prefix = "=";
    else if(msg.content.startsWith("plx!")) msg.prefix = "plx!";
    else return;
  }
  
  if (msg.prefix) {
    if ((await _userData).blacklisted && _userData.blacklisted!=="") {
      msg.addReaction(":BLACKLISTED_USER:406192511070240780");
      return void garbageC();
    }
    if(SERVER.members.filter(memb=>REDLIST.includes(memb.id)).size>0) return msg.reply("This server is Suspended. Please Contact Support");

    require('../core/structures/CommandPreprocessor.js').run(msg, {});
    
  }else{
    meSubs.run(msg);
  };
  
}

async function dataChecks(type,ent){
    return new Promise(async resolve =>{
      if(type==="user"){
        DB.users.findOne({id:ent.id}, {id:1,blacklisted:1} ).then(user=>{
          if(!user) return resolve(DB.users.new(ent));
          return resolve(user);
        });
      };
      if(type==="server"){
        DB.servers.findOne({id:ent.id}, {id:1,'modules.PREFIX':1,'modules.LANGUAGE':1} ).then(server=>{
          if(!server) return resolve(DB.servers.new(ent));
          return resolve(server);
        });
      };
      if(type==="channel"){
        DB.channels.findOne({id:ent.id}, {id:1,ignored:1,LANGUAGE:1} ).then(channel=>{
          if(!channel) return resolve(DB.channels.new(ent));
          return resolve(channel);
        });
      }; 
    });
};
//