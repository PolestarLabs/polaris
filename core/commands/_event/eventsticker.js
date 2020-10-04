const EventData = require('../../archetypes/Events.js');
const EV = EventData.event_details; 


init = async function (msg) {
  

  let embed = {}

  embed.title = "Buy event Sticker"
  embed.description = "Would you like to buy this Sticker for <:candy1:366437119658557440> **800 Candy**?"
  embed.color = 0xc553e0;
  embed.image = {url: "https://pollux.amarok.kr/build/nox500.png" };
  
  msg.channel.send({embed}).then(async m=>{
    m.addReaction(_emoji('yep').reaction);
    m.addReaction(_emoji('nope').reaction);
    
    const res = await m.awaitReactions(re=>  re.userID == msg.author.id,{maxMatches:1,time:10000});
    
    if(res.size === 0) return msg.channel.send(_emoji('nope')+" `TIMEOUT`");
    
    if (res[0].emoji.name == "yep"){
      
     const USERDATA = await DB.users.findOne({
       id: msg.author.id
     },{'modules.stickerInventory':1,eventData:1,eventGoodie:1});
     const eventData = await EV.userData(msg.author);
      
        if(USERDATA.modules.stickerInventory.includes("nox250")){
          return  msg.reply(_emoji('nope')+"Oopsie... I think you already have this!");
        }
      if(eventData.candy >= 800 ){
        await DB.users.set(msg.author.id,{$inc:{'eventData.halloween18.candy':-800},$addToSet:{'modules.stickerInventory':'nox250'}});
        msg.reply(_emoji('yep')+"All set! Equip this sticker at the **Dashboard** (https://pollux.amarok.kr/dashboard)");
        
      }else{
        msg.reply(_emoji('nope')+"Oops... You can't afford it. You have only "+eventData.candy+" Candy...")
      }
      
    }
    if (res[0].emoji.name == "nope"){
      return msg.channel.send(_emoji('nope')+" `CANCEL`");
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