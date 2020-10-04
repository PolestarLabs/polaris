const gear = require("../../gearbox.js");
const paths = require("../../paths.json");
const moment = require("moment");
const rq = require('request');
//const locale = require('../../../utils/multilang_b');
//const mm = locale.getT();

const EV = require('./clockwork/halloween.js');

const cmd = 'dig';

const init = async function (message) {

  const P = {
    lngs: message.lang
  }
  let lang = message.lang[0]
  if (lang == 'cz') lang = 'cs';
  moment.locale(lang);

  const v = {
    last: "<:shovel:504412718871085077> "+mm('events:halloween18.dig.lastTomb', P),
    next: "<:grave:465902357465661442> " +mm('events:halloween18.dig.moreTombs', P),
  }



  const Author = message.author

  if (Author.dailing === true) return message.channel.send("There's already a dig request going on!");

  //const STREAK_EXPIRE = 1.296e+8*2
  const DAY = 2.16e+7  

  const now = Date.now();
  const USERDATA = await gear.userDB.findOne({
    id: Author.id
  });

  const eventData = await EV.userData(Author);
  const userDaily = USERDATA.eventDaily || 1;
  const dailyAvailable = now - userDaily >= DAY;



  const embed = new gear.RichEmbed;
  embed.setColor("#d83668");


  if (message.content.endsWith('info')) {
    let embe2 = new gear.RichEmbed;
    embe2.setColor('#e35555')
    embe2.setDescription(
 "**"+v.last+"** "+moment.utc(userDaily).fromNow()+"\n"+
v.next+" "+ moment.utc(userDaily).add((DAY/1000/60/60),'hours').fromNow() 
  )
    return message.channel.send({
      embed: embe2
    });
  }

  if(!USERDATA.modules.inventory.includes("shovel")&&!USERDATA.modules.inventory.includes("excavator")){
    
    P.SHOVEL_LINK = `**[<:shovel:504412718871085077> ${mm("events:halloween18.dig.shovel",P)}](https://pollux.amarok.kr/crafting#shovel "Pollux Website: Crafting Guide")**`
    embed.setDescription(":no_entry_sign: "+mm("events:halloween18.dig.needShovel",P))
    
    return message.reply({embed});
  }
  
  
  

  if (!dailyAvailable && Author.id != "88120564400553984z") {

    let r = userDaily + DAY;
    P.Xtime = moment.utc(r).fromNow(true)
    let dailyNope = mm('events:halloween18.dig.cooldown', P);
    message.reply(gear.emoji('nope') + dailyNope);
    let embe2 = new gear.RichEmbed;
    embe2.setColor('#e35555');
    embe2.setDescription(`
${gear.emoji('time')   } **${v.last}** ${ moment.utc(userDaily).fromNow()}
    `);

     message.channel.send({
      embed: embe2
    });
    shovelocalypse();
    return;

  };

  await gear.userDB.set(Author.id, {
    $set: {
      "eventDaily": now
    }
  });
  
  if(USERDATA.modules.inventory.includes("excavator")){
   await gear.userDB.updateOne({id:Author.id},{$inc:{"eventDaily":+(DAY/6*4),"eventData.halloween18.caskets":2}}).lean().exec();
  const gotCasket = "You excavated 2 Caskets! Next Excavation will be available in 10 hours!"
  message.channel.send(gotCasket);
  
  }else{
   await gear.userDB.updateOne({id:Author.id},{$inc:{"eventData.halloween18.caskets":1}}).lean().exec();
  const gotCasket = "<:shovel:504412718871085077> "+ mm("events:halloween18.caskets.gotCasket",P)
  message.channel.send(gotCasket);
    
  }
  
  
shovelocalypse();




async function shovelocalypse(){
  
  if(USERDATA.modules.inventory.includes("excavator")){
    
     
  if( gear.randomize(0,100)==13){    
    await gear.userDB.updateOne({id:Author.id,"modules.inventory":"excavator"},{$set:{"modules.inventory.$":"broken_excavator"}}).lean().exec();
    message.channel.send("Something went wrong... Your excavator poofed! :( ");
  }
    
    return;
  };
  
  if( gear.randomize(0,20)==4){    
    await gear.userDB.updateOne({id:Author.id,"modules.inventory":"shovel"},{$set:{"modules.inventory.$":null}}).lean().exec();
    await gear.userDB.updateOne({id:Author.id},{$pull:{"modules.inventory":null}}).lean().exec();
    message.channel.send( gear.mmrand('responses.verbose.interjections.ohmy_negative', mm, P)+ mm("events:halloween18.dig.shovelbroke",P));
  }

}



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