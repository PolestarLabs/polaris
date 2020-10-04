const gear = require("../../gearbox.js");
const paths = require("../../paths.json");
const moment = require("moment");
const rq = require('request');
//const locale = require('../../../utils/multilang_b');
//const mm = locale.getT();

const EV = require('./clockwork/halloween.js');

const cmd = 'spook';

const init = async function (message) {

  const P = {
    lngs: message.lang
  }
  let lang = message.lang[0]
  if (lang == 'cz') lang = 'cs';
  moment.locale(lang);

  const v = {
    last: mm('daily.lastdly', P),
    next: mm('daily.next', P),
    streakcurr: mm('daily.streakcurr', P),
    expirestr: mm('daily.expirestr', P),
  }




  const Author = message.author

  if (Author.dailing === true) return message.channel.send("Spooky.");

  //const STREAK_EXPIRE = 1.296e+8*2
  const DAY = 2.16e+7  

  const now = Date.now();
  let USERDATA = await gear.userDB.findOne({
    id: Author.id
  });

  let eventData = await EV.userData(Author);
  
  const userDaily = ((USERDATA.eventData||{}).halloween18||{}).dailysec || 1;
  
  const dailyAvailable = now - userDaily >= DAY;



  const embed = new gear.RichEmbed;
  embed.setColor("#d83668");


 

  if (!dailyAvailable && Author.id != "88120564400553984zz") {

    let r = userDaily + DAY;
    P.Xhours = moment.utc(r).fromNow(true)
    let dailyNope = mm('events:halloween18.spook.cooldown', P);
    message.reply(gear.emoji('nope') + dailyNope+"\n Or get a decoy doll from the Gravekeeper! ");
    let embe2 = new gear.RichEmbed;
    embe2.setColor('#e35555');
    embe2.setDescription(`
${gear.emoji('time')   } **${v.last}** ${ moment.utc(userDaily).fromNow()}
${gear.emoji('expired')} **${v.expirestr}** ${moment.utc(userDaily+STREAK_EXPIRE).fromNow() }
    `);

     message.channel.send({
      embed: embe2
    });

    return;

  };

  
let rand = gear.randomize(1,20);
   


  
  
  
  
  let equipH = (eventData.inventory||[]).find(x=>x.id == eventData.head)||{};
  let equipB = (eventData.inventory||[]).find(x=>x.id == eventData.body)||{};
  let equipF = (eventData.inventory||[]).find(x=>x.id == eventData.legs)||{};
 
  let setBonus = 0
  let equippeds = (eventData.inventory||[]).filter(itm=>[equipH.id,equipB.id,equipF.id].includes(itm.id)).map(x=>x.spook||0)
  let equippeds2 = (eventData.inventory||[]).filter(itm=>[equipH.id,equipB.id,equipF.id].includes(itm.id)).map(x=>x.aspectBonus||0)
  equippeds.push(0)
  equippeds2.push(0)
  let aspectBonus = equippeds2.reduce((a,b)=>a+b);
  if(equipH.costume == equipB.costume && equipB.costume == equipF.costume && equipH.costume != null ) setBonus = Math.floor(aspectBonus/3)+10;
  
  let totalSpook =  equippeds.length > 0 ? setBonus + equippeds.reduce((a,b)=>a+b)+aspectBonus : 0
  
  
  let noise = gear.randomize(-10,+10);
  let candyDrop = totalSpook + noise;
  candyDrop = candyDrop < 0 ? 1 : candyDrop;
  
  
   if (totalSpook<5){
     
     return message.reply(mm('events:halloween18.spook.advisor',P))
     
   }
  
  
  let spookText = mm("events:halloween18.spook.spookintro",P)
  let BOO = mm("events:halloween18.spook.BOO",P)+"\n"
  P.count = "<:candy1:366437119658557440> "+ candyDrop
  let spookText2 = mm("events:halloween18.spook.followup",P)
  embed.description = spookText
  
  let rfc={C:0.185,U:0.25,R:0.5,SR:0.75,UR:1,XR:0.8}
  let rfac=[rfc[equipH.rarity],rfc[equipB.rarity],rfc[equipF.rarity]]
  
  await gear.userDB.set(Author.id, {
    $set: {
      "eventData.halloween18.dailysec": now
    },
    $inc:{
       "eventData.halloween18.candy": candyDrop,
      
    }
  });
  

    await gear.userDB.updateOne({
      id: Author.id,
      "eventData.halloween18.inventory.id": equipH.id
    }, {
      $inc: {
        "eventData.halloween18.inventory.$.spook": -Math.abs(Math.ceil(1+noise * rfac[0]||5)),
        "eventData.halloween18.inventory.$.uses": 1
      }
    });



    await gear.userDB.updateOne({
      id: Author.id,
      "eventData.halloween18.inventory.id": equipB.id
    }, {
      $inc: {
        "eventData.halloween18.inventory.$.spook": -Math.abs(Math.ceil(1+noise * rfac[1]||5)),
        "eventData.halloween18.inventory.$.uses": 1
      }
    });

    await gear.userDB.updateOne({
      id: Author.id,
      "eventData.halloween18.inventory.id": equipF.id
    }, {
      $inc: {
        "eventData.halloween18.inventory.$.spook": -Math.abs(Math.ceil(1+noise * rfac[2]||5)),
        "eventData.halloween18.inventory.$.uses": 1
      }
    });
  
  
  embed.setFooter(Author.tag,Author.displayAvatarURL())

  message.channel.send({embed}).then(async mes=>{
    await gear.wait(2);
    embed.setThumbnail("https://pollux.amarok.kr/build/event/halloween18/spoop/scare%20("+rand+").gif")

    embed.description = spookText+BOO
    mes.edit({embed})
    await gear.wait(2);
    embed.description = spookText+BOO+spookText2
    mes.edit({embed})
  })
  
  
}

module.exports = {
  pub: true,
  cmd: cmd,
  perms: 3,
  botperms: ["EMBED_LINKS", "SEND_MESSAGES", "ATTACH_FILES"],
  init: init,
  cat: 'event',
  exp: 15,
  cool: 1000
};