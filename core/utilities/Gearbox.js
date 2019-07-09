const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const Eris = require('eris');
const MersenneTwister = require('./MersenneTwister');
const generator = new MersenneTwister();
const DB = require("../database/db_ops");

if (Eris.Embed){
  Eris.Embed.prototype.setDescription = Eris.Embed.prototype.description;
  Eris.Embed.prototype.addField = Eris.Embed.prototype.field;
}

module.exports = {
  nope: ":nope:339398829088571402",
  reload: function(){delete require.cache[require.resolve('./Gearbox')]},
  
  invisibar : "\u200b\u2003\u200b\u2003\u200b\u2003\u200b\u2003\u200b\u2003\u200b\u2003\u200b\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003",

  getTarget: function getTarget(msg,argPos=0,self=true,soft=false){

    if(msg.mentions.length>0) return msg.mentions[0];

    if(!msg.args[argPos]) return self ? msg.author : null;
    let ID = msg.args[argPos].replace(/[^0-9]{16,19}$/g,'');
    let user = POLLUX.users.find(usr=> usr.id === ID )

    if (!user) {
      user = msg.guild.members.find(mbr =>
          mbr.username.toLowerCase() == msg.args[argPos].toLowerCase() ||
          (mbr.nick||"").toLowerCase() == msg.args[argPos].toLowerCase() 
        ) ||
        msg.guild.members.find(mbr =>
          soft && (mbr.nick && mbr.nick.toLowerCase().includes(msg.args[argPos].toLowerCase()))
        ) ||
        msg.guild.members.find(mbr =>
          soft && mbr.username.toLowerCase().includes(msg.args[argPos].toLowerCase())
        ) ||
        msg.guild.members.find(mbr =>
          soft && mbr.user.tag.toLowerCase().includes(msg.args[argPos].toLowerCase())
        );
 
      if (!user && self == true) user = msg.author;
    }
    if(!user) return null;
    DB.users.new(user.user||user);
    return user.user || user;
  },

  Embed: Eris.Embed,
  RichEmbed: this.Embed,
  randomize: function randomize(min, max,seed=Date.now()) {
    let RAND = generator.random(seed);
    return Math.floor(RAND * (max - min + 1) + min);
  },

  wait: function wait(time){
      time = typeof time == 'number' ? time : 1000;
      return new Promise(resolve => {
          setTimeout(() => {
            resolve(true);
          },
          time*1000||1000);
      });
    },

  miliarize: function miliarize(numstring,strict,char="."){
      try{
        if (typeof numstring == "number"){
            numstring = numstring.toString() || "0";
        };
        numstring = numstring.split('.')[0]
        let numstringExtra = numstring.split('.')[1]||"";
        if(numstringExtra.length > 1)numstringExtra = " ."+ numstringExtra;
        else numstringExtra = "";

        if(numstring.length < 4)return numstring;
        //-- -- -- -- --
        let stashe = numstring.replace(/\B(?=(\d{3})+(?!\d))/g, char).toString();
        // Gibe precision pls
        if(strict){
            let stash = stashe
            if(strict==='soft'){     
              stash = stashe.split(char)       
        switch(stash.length){
            case 1:
                return stash+numstringExtra;
            case 2:
                if(stash[1]!="000") break;
                return stash[0]+numstringExtra+"K";
            case 3:
                if(stash[2]!="000") break;
                return stash[0]+char+stash[1][0]+stash[1][1]+numstringExtra+"Mi";
            case 4:
                if(stash[3]!="000") break;
                return stash[0]+char+stash[1][0]+stash[1][1]+numstringExtra+"Bi";
             }
            return stashe+numstringExtra;
          } 
          return stash;
        };
        // Precision is not a concern
        stash = stashe.split(char)
        switch(stash.length){
            case 1:
                return stash.join(" ");
            case 2:
                if(stash[0].length<=1) break;
                return stash[0]+"K";
            case 3:
                return stash[0]+"Mi";
            case 4:
                return stash[0]+"Bi";
             }
         return stashe+numstringExtra;
    }catch(err){
      return "---"
    }
    },
  shuffle:  function shuffle(array) {
        //console.warn("Deprecation warning: This is a Legacy Function")
        var currentIndex = array.length,
            temporaryValue, randomIndex;
        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    },
capitalize: function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
},
count: function count(array,what){
    let it=0; //go
    array.forEach(i=> i===what?it++:false);
    return it;
},

autoHelper: function autoHelper(trigger,options){
    let message, P, M, key, cmd, opt;
    if(options&&typeof options=='object'){
      message = options.message || options.msg;
      M=message.content;
      P = {lngs:message.lang};
      key = options.opt;
      cmd=  options.cmd;
      opt=  options.opt;
      aliases=  options.aliases;
    };

    if (    trigger.includes(message.content.split(/ +/)[1])
        ||  message.content.split(/ +/)[1]=="?"
        ||  message.content.split(/ +/)[1]=="help"
        || (message.content.split(/ +/).length==1&&trigger.includes('noargs'))
        ||  trigger==='force'
       ){
      //this.usage(cmd,message,opt,aliases);
      let usage = require("../structures/UsageHelper.js");
      usage.run(cmd, message, opt);
      return true;
    }else{
      return false;
    }
  },
  usage: function usage(cmd, m, third) {
    delete require.cache[require.resolve("../structures/UsageHelper.js")];
    let usage = require("../structures/UsageHelper.js");
    usage.run(cmd, m, third);
  },

 resolveFile: function(resource) {
  if (Buffer.isBuffer(resource)) return Promise.resolve(resource);
 
  if (typeof resource === 'string') {
    if (/^https?:\/\//.test(resource)) {
      return fetch(resource).then(res => res.buffer());
    } else {
      return new Promise((resolve, reject) => {
        const file = path.resolve(resource);
        fs.stat(file, (err, stats) => {
          if (err) return reject(err);
          if (!stats || !stats.isFile()) return reject('[FILE NOT FOUND] '.red+ file);
          fs.readFile(file, (err2, data) => {
            if (err2) reject(err2);
            else resolve(data);
          });
          return null;
        });
      });
    }
  } else if (typeof resource.pipe === 'function') {
    return new Promise((resolve, reject) => {
      const buffers = [];
      resource.once('error', reject);
      resource.on('data', data => buffers.push(data));
      resource.once('end', () => resolve(Buffer.concat(buffers)));
    });
  }
  return Promise.reject(new TypeError('REQ_RESOURCE_TYPE'));
},

  file: function(file,name){    
      let finalFile = file instanceof Buffer ?  file :  fs.readFileSync(file);
      let ts = Date.now();
      if(typeof name === 'string') name = name;
      else if(typeof file === 'string') path.basename(file)
      else ts+".png";
      let fileObject= {        
        file:finalFile,
        name
      }
      return fileObject;
  },
  //Get IMG from Channel MSGs
  getChannelImg: async function getChannelImg(message,nopool) {
    if((message.args&&message.args[0]||"").startsWith("http")) return message.args[0];
    if (message.attachments[0]) return message.attachments[0].url;
    let sevmesgs = message.channel.messages;

    if(nopool)return false;

    const messpool = sevmesgs.filter(mes => {
        if (mes.attachments && mes.attachments.length>0) {
          if (mes.attachments[0].url) {
            return true
          }
        }
        if (mes.embeds && mes.embeds.length>0) {
          if (mes.embeds[0].type === 'image' && mes.embeds[0].url) {
            return true
          }
        }
    });

    if ((messpool||[]).length>0) return (
        messpool[messpool.length-1].attachments[0]||
        messpool[messpool.length-1].embeds[0]
        ).url;
    else return false;
  },
  modPass: function modPass(member,extra,sData=false){
    if(sData){
        if(sData.modules.MODROLE){
            if(member.hasRole(sData.modules.MODROLE)) return true;
        }
    };
    if(member.permission.has('manageGuild')||member.permission.has('administrator')){
        return true;
    }
   if(member.permission.has(extra)) return true;

   return false;

  },
    gamechange: function gamechange(gamein = false,status="online") {  
                delete require.cache[require.resolve(`../../resources/lists/playing.js`)];
                let gamelist = require("../../resources/lists/playing.js");
                let max = gamelist.games.length-1
                let rand = this.randomize(0, max)
                let gm = gamein ? gamein : gamelist.games[rand];
                return POLLUX.editStatus(status,{name:gm[0], type:gm[1] })
    },
    getMessage:    function getMessage(msg, ID) {
            return new Promise(async (resolve, reject) => {
                    if (ID) {
                            msg.channel.getMessage(ID).then(resolve).catch(err => {
                                    msg.guild.channels.forEach(c => {
                                            if (!c.getMessage) return;
                                            c.getMessage(ID).then(x => {
                                                    if (x) resolve(x);
                                            }).catch(err => "ok");
                                    });
                            });
                    } else {
                            msg.channel.getMessages(1, msg.id).then(me => resolve(me[0])).catch(reject);
                    }
            });
    }
    
}
