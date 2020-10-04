const paths = require("../../paths.json");
const gear = require('../../gearbox.js')
const Canvas = require("canvas");
//const locale = require('../../../utils/multilang_b'); 
//const mm = locale.getT();

const EV = require('./clockwork/halloween.js');

const init= async function run(msg) {
 

 const USERDATA = await gear.userDB.findOne({id:msg.author.id}).lean().exec();
    const eventData = await EV.userData(msg.author);

const P = {lngs : msg.lang , prefix : msg.prefix}
  
const pricetab = {
  
  acCask: {r:3800 , c:800 },
acDoll: {r:6000 , c:200 },
acToken: {r:85 , c:1 }
  
}
 
    
 
  let increment;

  const Channel = msg.channel
  
  const textIntro= mm('events:halloween18.noctix.greet',P)
  const itemlist= mm('events:halloween18.noctix.list',P)
  
  const rejecc=mm('events:halloween18.noctix.cancel',P)
  const timeout= mm('events:halloween18.noctix.timeout',P)
  const timeout_followup=mm('events:halloween18.noctix.timeout2',P)
  //const timeout_followup2= mm('events:halloween18.noctix.list',P)
  const howMany= mm('events:halloween18.noctix.howMany',P)
  const noCashR=mm('events:halloween18.noctix.noCashR',P)
  const noCashC=mm('events:halloween18.noctix.noCashC',P)
 
  const completeC=mm('events:halloween18.noctix.completeC',P)
  const completeR=mm('events:halloween18.noctix.completeR',P)
  
  const acs={ acCask:mm('events:halloween18.noctix.acCask',P),
   acDoll:mm('events:halloween18.noctix.acDoll',P),
   acToken:mm('events:halloween18.noctix.acToken',P) }

  
  
  const embed = new gear.RichEmbed();
  //embed.setAuthor("🎃 Pollux Halloween Event",null,"https://pollux.amarok.kr/events/halloween18")
  embed.setColor("#b9223f")
  embed.setFooter(msg.author.tag,msg.author.displayAvatarURL())
  //let iter = (msg.guild.dDATA.event||{}).iterations||0
  //let rate = "Lootbox droprate for "+msg.guild.name+":\u2003[ "+(100+iter)+"% ]\u2003("+((iter)/312).toFixed(4)+"% per Message)"
  
  //embed.setFooter(rate)
  
  Channel.createWebhook("Noctix - Underworld Gravekeeper", {avatar:"https://pollux.amarok.kr/build/event/halloween18/noctixroun4.png",reason:"EVENT"}).then(async wh=>{
    
    await page1(embed,wh);



  
      
     // return wh.delete();
      
  
    
  async function tokensDialog(wh,curr){
    
    return wh.send(howMany).then(async m=>{
      const res =        await msg.channel.awaitMessages(msg2=>msg2.author.id==msg.author.id && msg2.content.match(/[0-9]+$/),{max:1,time:10000});
        if (res.size===0) return wh.send(rejecc);
        let amount_w = Math.abs(parseInt(res.first().content) ||0);
        
        let multi = curr=="rubines" ? 85 : 1;
        let total = amount_w * multi;
        let checkAgainst = curr=="rubines" ? USERDATA.modules.rubines : eventData.candy;
      
        if( checkAgainst < total){
          return wh.send((curr=="rubines" ? noCashR : noCashC));
        }
      
        if(curr == "rubines"){
          await gear.audit(msg.author.id,pricetab.acDoll.r,"event-gravekeeper(TOKENS)","RBN","-");
          await gear.userDB.set(msg.author.id,{$inc:{"modules.rubines":-total}});
           await gear.wait(1);
          wh.send(completeR);
        }else if (curr == "candy"){
          await gear.userDB.set(msg.author.id,{$inc:{"eventData.halloween18.candy":-total}});
           await gear.wait(1);
          wh.send(completeC);
        }
        await gear.userDB.set(msg.author.id,{$inc:{eventGoodie:amount_w}});
        return false;
      
    
    });
    
  }
    
  async function processItem(item,wh){
    
    let text = acs[item];
    wh.send(text).then(async m=>{
      
       await m.react(":candy1:366437119658557440");
       await m.react(":rubine:367128893372760064");
      
      const reas = await m.awaitReactions(rea=>rea.users.has(msg.author.id),{max:1,time:10000});
        if(reas.size == 0 ) {
             wh.send(rejecc);
            return wh.delete();
          }
      if(reas.first().emoji.name=="candy1"){
        let afford = eventData.candy > pricetab[item].c
        if(afford){
          if(item == "acToken"){
            await tokensDialog(wh,"candy");
            return wh.delete();
          }
          if(item == "acDoll"){
            await gear.userDB.set(msg.author.id,{$set:{"eventData.halloween18.dailysec":0},
                                                 $inc:{"eventData.halloween18.candy":-pricetab.acDoll.c}});
            await gear.wait(1);
            await wh.send(completeC);
            wh.delete();
            return true;
          }
          if(item == "acCask"){
            await gear.userDB.set(msg.author.id,{ $inc:{"eventData.halloween18.caskets":1,
                                                        "eventData.halloween18.candy":-pricetab.acCask.c}});
            await gear.wait(1);
            await wh.send(completeC);
            wh.delete();
            return true;
          }
        }else{
          await wh.send(noCashC);
          return wh.delete();
        }
        
      }
      if(reas.first().emoji.name=="rubine"){
        let afford = USERDATA.modules.rubines > pricetab[item].r
        if(afford){
          if(item == "acToken"){
            await tokensDialog(wh,"rubines");
            return wh.delete();
          }
          if(item == "acDoll"){
            await gear.audit(msg.author.id,pricetab.acDoll.r,"event-gravekeeper(DOLL)","RBN","-");
            await gear.userDB.set(msg.author.id,{$set:{"eventData.halloween18.dailysec":0},
                                                 $inc:{"modules.rubines":-pricetab.acDoll.r}});
            await wh.send(completeR);
            wh.delete();
            return true;
          }
          if(item == "acCask"){
            await gear.audit(msg.author.id,pricetab.acCask.r,"event-gravekeeper(CASKET)","RBN","-");
            await gear.userDB.set(msg.author.id,{ $inc:{"eventData.halloween18.caskets":1,
                                                        "modules.rubines":-pricetab.acCask.r}});
            await wh.send(completeR);
            wh.delete();
            return true;
          }
        }else{
          await wh.send(noCashR);
          return wh.delete();
        }
        
      }
      
    })
    
  }
  
  
  
  async function page1(embed,wh,m2){
    if(m2)m2.delete();
    embed.description = textIntro;
    embed.setImage('http://pollux.amarok.kr/build/event/halloween18/menu.png');
    let m = await wh.send(embed);
    
    
    await m.react(":casket:506921217391853568");
    await m.react("🎎");
    await m.react(":eventToken:506921849972850729");
    await m.react("❓");
    
      const reas = await m.awaitReactions(rea=>rea.users.has(msg.author.id),{max:1,time:10000});
       
     embed.setImage('http://pollux.amarok.kr/build/event/halloween18/menu2bottom.png');
            
          if(reas.size == 0 ) {
              msg.channel.send(timeout);
            await gear.wait(2);
             await wh.send(timeout_followup);
            return wh.delete();
          }
          if(reas.first().emoji.name=="casket"){
            await processItem("acCask",wh);
            //return wh.delete()
          }
          if(reas.first().emoji.name=="🎎"){
            await processItem("acDoll",wh);
            //return wh.delete()
          }
          if(reas.first().emoji.name=="eventToken"){
            await processItem("acToken",wh);
            //return wh.delete()
          }
          if(reas.first().emoji.name=="❓"){
            return  page2(embed,wh,m);
            
          }

  }
   
  
  async function page2(embed,wh,m2){
    if(m2)m2.delete();
     embed.description = itemlist;
     embed.setImage('http://pollux.amarok.kr/build/event/halloween18/menu2bottom.png');
      let m =await wh.send(embed);
      m.react("↩")
      m.react(gear.nope.r)
          const reas = await m.awaitReactions(rea=>rea.users.has(msg.author.id),{max:1,time:20000});
          if(reas.size == 0 ) {
             msg.channel.send("`TIMEOUT`");
            return wh.delete();
          } 
          if(reas.first().emoji.name=="nope"){
             msg.channel.send("`CANCEL`");
            return wh.delete();
          }
          if(reas.first().emoji.name=="↩"){
             return page1(embed,wh,m);
            
          }
  }
  
  
  
  });
  
}//end block
  


  
module.exports = {
    pub: true,
    cmd: "gravekeeper",
    perms: 3,
    init: init,
    cat: 'event',
    exp: 100,
    botperms:["MANAGE_WEBHOOKS","EMBED_LINKS","ATTACH_FILES"],
    cool:5000
};
