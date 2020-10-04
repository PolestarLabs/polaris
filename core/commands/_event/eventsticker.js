const gear = require("../../gearbox.js");
const paths = require("../../paths.json");
const moment = require("moment");
const rq = require('request');
//const locale = require('../../../utils/multilang_b');
//const mm = locale.getT();

var init = async function (message, userDB, DB) {
  

  let embed = new gear.RichEmbed;

  embed.setTitle("Buy event Sticker")
  embed.setDescription("Would you like to buy this Sticker for <:candy1:366437119658557440> **800 Candy**?")
  embed.setColor( "#c553e0");
  embed.setImage( "https://pollux.amarok.kr/build/nox500.png");
  
  message.channel.send({embed}).then(async m=>{
    m.react(gear.yep.r);
    m.react(gear.nope.r);
    
    const res = await m.awaitReactions(re=>re.users.has(message.author.id),{max:1,time:10000});
    
    if(res.size === 0) return message.channel.send(gear.emoji('nope')+" `TIMEOUT`");
    
    if (res.first().emoji.name == "yep"){
      
     const EV = require('./clockwork/halloween.js');
     const USERDATA = await gear.userDB.findOne({
       id: message.author.id
     },{'modules.stickerInventory':1,eventData:1,eventGoodie:1});
     const eventData = await EV.userData(message.author);
      
        if(USERDATA.modules.stickerInventory.includes("nox250")){
          return  message.reply(gear.emoji('nope')+"Oopsie... I think you already have this!");
        }
      if(eventData.candy >= 800 ){
        await gear.userDB.set(message.author.id,{$inc:{'eventData.halloween18.candy':-800},$addToSet:{'modules.stickerInventory':'nox250'}});
        message.reply(gear.emoji('yep')+"All set! Equip this sticker at the **Dashboard** (https://pollux.amarok.kr/dashboard)");
        
      }else{
        message.reply(gear.emoji('nope')+"Oops... You can't afford it. You have only "+eventData.candy+" Candy...")
      }
      
    }
    if (res.first().emoji.name == "nope"){
      return message.channel.send(gear.emoji('nope')+" `CANCEL`");
    }
    
  })
  
}



module.exports = {
  pub: false,
  cmd: "eventsticker",
  perms: 3,
  init: init,
  cat: 'event'
   
};