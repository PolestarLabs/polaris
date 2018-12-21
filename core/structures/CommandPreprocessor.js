const fs = require('fs');
const i18node = require(appRoot+'/utils/i18node');
const cfg = require(appRoot+'/config.json');


exports.run = async (message,payload) => {


  
  
  let bot = POLLUX
   let Database_bot = "x"//await gear.userDB.findOne({id:bot.user.id});
   let servData = payload.servData;
   let userData = payload.userData;
   let chanData = payload.chanData;
   let targData = payload.targData;
   
   
   let forbiddens = ((chanData||{}).modules||{}).DISABLED||[];
   
  const _commandMetadata = determine(message)
  const _MODULE = _commandMetadata.module;
  
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
    if (checkUse(_commandMetadata, {chanData,servData}, message)!==true){
      return; // Insert Warning here;
    }
    return message.channel.send({file: _commandMetadata.reaction});
  }
  //===================================

  if (forbiddens) {
    if (forbiddens.includes(_MODULE)) {
      return message.reply("Module Disabled")
    }
  };



  let $t = i18node.getT();
  switch (checkUse(_commandMetadata, {chanData,servData}, message)) {
    case "NONSFW":
      message.reply($t('CMD.not-a-NSFW-channel', {
        lngs: message.lang
      }))
      break;

    case "DISABLED":
      if (servData.disaReply!=false) {
        message.reply($t('CMD.disabledModule', {
          lngs: message.lang,
          module: message.content.substr(message.prefix.length).split(' ')[0]
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

function determine(msg) {
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

        let aliases = require("./Aliases")//JSON.parse(fs.readFileSync("./core/aliases.json", 'utf8'));

        let command;
        if (aliases[query]) command = aliases[query].toLowerCase();
        else command = query.toLowerCase();

        let path = ""
        let files = fs.readdirSync(appRoot + "/core/commands")

        for (i = 0; i < files.length; i++) {
            let filedir = appRoot + "/core/commands/" + files[i]

            let morefiles = fs.readdirSync(filedir  )
            if (morefiles.indexOf(command + ".js") > -1) {


                let pathTo = filedir + "/" + command + ".js";
                let comm = require(pathTo)

                    comm.path= pathTo
                    comm.module = files[i]
                    comm.reaction = false
               return comm
            }
        }
        return false

    }
function checkUse(DTMN, DB, msg) {

        try {
            let commandFile = require(DTMN.path);
            switch (true) {
              case !msg.channel.nsfw && commandFile.cat.toLowerCase() == "nsfw" :
                    return "NONSFW";
                    break;
                //case  DB.chanData.modules.DISABLED.includes(commandFile.cat):
                //case  DB.chanData.modules.DISABLED.includes(DTMN.module):
                case  false://DB.chanData.modules.DISABLED.includes(commandFile.cmd):
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
            return false;
            console.error((err.stack).blue);
        }
    }
async function commandRun(command, message, final_payload) {

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
   message.author.ratelimit.queue(f=>{});
   message.author.ratelimitHour.queue(f=>{});
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
    let perms = command.botperms
    if (perms){
      delete require.cache[require.resolve('./PermsCheck.js')];
      let permchk = require('./PermsCheck.js').run(command.cat, message, perms)
      if (permchk !== 'ok') return console.error(permchk);
    }
  }

  //Refresh Command
  delete require.cache[require.resolve(command.path)];
  //const minibuster =require('./minibuster.js');
  const commandRoutine = require('../subroutines/onEveryCommand');
  await message.channel.sendTyping();
   await Promise.all([
      commandRoutine.updateMeta(message,command),
      commandRoutine.saveStatistics(message,command),
      commandRoutine.administrateExp(message.author.id,command),
      commandRoutine.commLog(message,command),
      command.init(message)
    ]);


  message       = null;
  final_payload = null;
  command       = null;

  return true;

}

