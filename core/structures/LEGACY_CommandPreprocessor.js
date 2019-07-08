const {readdir} = require('fs');
const readDirAsync = Promise.promisify(readdir);
const cfg = require(appRoot+'/config.json');
const Aliases =  require("./Aliases")

module.exports = async (message,payload) => {


 
  
   let bot = POLLUX
   let Database_bot = {}//await gear.userDB.findOne({id:bot.user.id});
   let servData = payload.servData;
   let userData = payload.userData;
   let chanData = payload.chanData;
   let targData = payload.targData;
   
   
   let forbiddens = message.guild.DISABLED||[];
   //let forbiddens = message.channel.DISABLED||[];
   
  const _commandMetadata = await determine(message);
  const _MODULE = _commandMetadata.module;
  const _COMMAND = _commandMetadata.cmd;
  
   if(_MODULE == "_botOwner"){
     if (message.author.id !== cfg.owner) return message.addReaction('nope:339398829088571402')
   }
   if(_MODULE == "_botStaff"){
      if (message.author.id !== cfg.owner && !cfg.admins.includes(message.author.id)) return message.addReaction('nope:339398829088571402')
    }
    
    //console.log(_commandMetadata)
    
    if(!_commandMetadata) return; // No Command Metadata Found

  //Global Reactions===================
  if(_commandMetadata.reaction){
    if (forbiddens.includes(_MODULE)) return; // Module Blocked
    // is Usable in Channel/Server ?
    if (checkUse(_commandMetadata, forbiddens, message)!==true){
      return; // Insert Warning here;
    }
    return message.channel.send({file: _commandMetadata.reaction});
  }
  //===================================

  if (forbiddens) {
    if (forbiddens.includes(_MODULE) && message.guild.respondDisabled) {
      return message.reply("Module Disabled")
    }
    if (forbiddens.includes(_COMMAND) && message.guild.respondDisabled) {
     // return message.reply("Command Disabled")
    }
  };




  switch (checkUse(_commandMetadata, forbiddens, message)) {
    case "NONSFW":
      message.reply($t('CMD.not-a-NSFW-channel', {
        lngs: message.lang
      }))
      break;

    case "DISABLED":
      if (message.guild.respondDisabled!=false) {
        message.reply($t('CMD.disabledModule', {
          lngs: message.lang,
          module: "`"+_COMMAND+"`"
        }))
      }
      break;

    case "NO ELEVATION":
      message.reply($t('CMD.insuperms', {
        lngs: message.lang,
        prefix: message.prefix
      }))
      break;

    case false:
      return null;
      break;
    case true:
      let final_payload = {
        Database_bot,
        servData,
        userData,
        chanData,
        targData
      };
      return commandRun(_commandMetadata, message, final_payload); //aqui nóis vai!
      break;
  }

}

async function determine(msg) {
        let query = msg.content.substr(msg.prefix.length).split(' ')[0];

        let imgreactions = []//require("./imgreactions.js").out;

        if(imgreactions[query]){
          let rea
          if(imgreactions[query].constructor == Array){
            rea = imgreactions[query][0] // [gear.randomize(0,imgreactions[query].length-1)];
          }else{
            rea = imgreactions[query]
          }
            return {
                reaction: rea,
                path: null,
                module: "img",
                cat: "instant"
            }
        }
        

        let aliases = Aliases();//JSON.parse(fs.readFileSync("./core/aliases.json", 'utf8'));

        let command;
        if (aliases[query]) command = aliases[query].toLowerCase();
        else command = query.toLowerCase();

        let modules = await readDirAsync(appRoot + "/core/commands");

        modules.find(async folder=>{

          let filedir = appRoot + "/core/commands/" + folder;
          let commands = await readDirAsync(filedir);
          
          if (commands.includes(command + ".js") || commands.includes(command) ) {
            let pathTo = filedir + "/" + command;
            let comm = require(pathTo);
                comm.path= pathTo
                comm.module = folder
                comm.reaction = false
                comm.cmd = command
                return comm
            }
        });

        //class Command 



        return false

    }
function checkUse(DTMN, fbd, msg) {
        try {
            let commandFile = require(DTMN.path);
            switch (true) {
              case !msg.channel.nsfw && commandFile.cat.toLowerCase() == "nsfw" :
                    return "NONSFW";
                    break;
                //case  DB.chanData.modules.DISABLED.includes(commandFile.cat):
                //case  DB.chanData.modules.DISABLED.includes(DTMN.module):
                case  fbd.includes(commandFile.cmd):
                    return "DISABLED";
                    break;
                case msg.author.PLXpems > commandFile.perms:
                    return "NO ELEVATION";
                    break;
                default:
                    return true;
                    break;
            }
        } catch (err) {
          console.error((err.stack).blue);
          return false;
        }
    }
async function commandRun(command, message, final_payload) {
console.log(command)
console.log(message.author.tag)
    //COMMAND COOLDOWN

   const {Bucket} = require('eris');
   if(!message.author.ratelimit) {
    message.author.ratelimit = new Bucket(11,15000,{latency:1552});
   }
   if(!message.author.ratelimitHour) {
    message.author.ratelimitHour = new Bucket(150,3600000,{latency:500});
   }
   let ratelimit = message.author.ratelimit;
   let ratelimitDay = message.author.ratelimitHour;
   message.author.ratelimitHour.queue(f=>null);
   message.author.ratelimit.queue(f=>null);
   if (ratelimitDay.tokens == ratelimitDay.tokenLimit) {
     message.reply(":hourglass_flowing_sand: You reached the limit of hourly commands, please come back in one hour.");
     return null;
   }
   if (ratelimit.tokens == ratelimit.tokenLimit) {
    message.reply(":hourglass_flowing_sand: Pls slow down!").then(m => m.deleteAfter(5552));
    return null;
   }

   //Set Command-Usable Params
   message.args = message.content.substr(message.prefix.length).split(/ +/).slice(1);
   message.quoteArgs = (message.cleanContent.match(/".*"/)||[null])[0]
   if (message.quoteArgs) message.quoteArgs = message.quoteArgs.replace(/"/g,""); 

   message.lang = [(final_payload.chanData||{}).LANGUAGE || ((final_payload.svData||{}).modules||{}).LANGUAGE || 'en', 'dev'];
   message.obtainTarget= arg => {
      let fromMentionOrID = POLLUX.users.find(u=>u.id==arg.replace(/[^0-9]/g,''));
      if(fromMentionOrID) return fromMentionOrID;
      return message.guild.members.find(mem=>{
         if ([mem.username.toLowerCase(),(mem.nick||"\u200b").toLowerCase()].includes(arg.toLowerCase()))return true;
         if (mem.username.toLowerCase().startsWith(arg.toLowerCase()) || (mem.nick||"\u200b").toLowerCase().startsWith(arg.toLowerCase()))return true;
         return false;
      })
   };

  if (command.cat) {
    let perms = command.botPerms
    if (perms){
      delete require.cache[require.resolve('./PermsCheck.js')];
      let permchk = require('./PermsCheck.js').run(command.cat, message, perms)
      if (permchk !== 'ok') return console.error(permchk);
    }
  }

  //Refresh Command
  delete require.cache[require.resolve(command.path)];
  //const minibuster =require('./minibuster.js');

  if(global.piggyback && message.author.id!=="88120564400553984") return; 

  const commandRoutine = require('../subroutines/onEveryCommand');
  await message.channel.sendTyping();
  if(command.ratelimit){
    if(!message.author.ratelimitCMD || !message.author.ratelimitCMD[command.cmd]) {
      message.author.ratelimitCMD ? null : message.author.ratelimitCMD = {};
      message.author.ratelimitCMD[command.cmd] = new Bucket(command.ratelimit.times ,command.ratelimit.hours * 3600000,{latency:60000});
    } 
    message.author.ratelimitCMD[command.cmd].queue(f=>null);
    let ratelimit = message.author.ratelimitCMD[command.cmd];
    if (ratelimit.tokens == ratelimit.tokenLimit) {
      message.reply(":hourglass_flowing_sand: `Command ratelimit reached!`").then(m => m.deleteAfter(5552));
      return null;
    }
  }
  await Promise.all([
      commandRoutine.updateMeta(message,command),
      commandRoutine.saveStatistics(message,command),
      commandRoutine.administrateExp(message.author.id,command),
      commandRoutine.commLog(message,command),
      command.init(message)
    ]).catch(er=>{
      console.error(er)
    });


  message       = null;
  final_payload = null;
  command       = null;

  return true;

}

