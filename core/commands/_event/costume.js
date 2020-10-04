const gear = require("../../gearbox.js");
const paths = require("../../paths.json");
const moment = require("moment");
const rq = require('request');
//const locale = require('../../../utils/multilang_b');
//const mm = locale.getT();

const EV = require('./clockwork/halloween.js');

const cmd = 'costume';

const init = async function (message) {

  const P = {
    lngs: message.lang
  }




  const Author = message.author
  const Target = message.mentions.users.first() || message.botUser.users.get((message.args[0] || "sic").replace(/[^0-9]/g,'')) || message.botUser.users.get((message.args[1]||"sic").replace(/[^0-9]/g,'')) ||Author;

  if (Author.dailing === true) return message.channel.send("There's already a collect request going on!");

  const USERDATA = await gear.userDB.findOne({
    id: Author.id
  });

  const eventData = await EV.userData(Target);

  
    if (message.args[0] == "equip"){
      if ( Number(message.args[1]) <= eventData.inventory.length ){
          if( message.author.trading ==true )return message.react(nope.r);

          let thisItem = eventData.inventory[Number(message.args[1])-1]
          let previousItem = eventData.inventory.find(x=>x.type===thisItem.type && x.equipped === true);
          if(previousItem){
            await gear.userDB.updateOne({id:Author.id,'eventData.halloween18.inventory.id':previousItem.id},{$set:{'eventData.halloween18.inventory.$.equipped':false}}).lean().exec();
          }
          await gear.userDB.updateOne({id:Author.id,'eventData.halloween18.inventory.id':thisItem.id},{$set:{'eventData.halloween18.inventory.$.equipped':true}}).lean().exec();
          await gear.userDB.updateOne({id:Author.id},{$set:{['eventData.halloween18.'+thisItem.type]:thisItem.id}}).lean().exec();
        
       return  message.react(gear.yep.r)

      }
    }  
  
    if (message.args[0] == "unequip"){
      if ( Number(message.args[1]) <= eventData.inventory.length ){

          let thisItem = eventData.inventory[Number(message.args[1])-1]
            await gear.userDB.updateOne({id:Author.id,'eventData.halloween18.inventory.id':thisItem.id},{$set:{'eventData.halloween18.inventory.$.equipped':false}}).lean().exec();   
          await gear.userDB.updateOne({id:Author.id},{$set:{['eventData.halloween18.'+thisItem.type]:null}}).lean().exec();
        
       return  message.react(gear.yep.r);

      }else if(["head","body","legs"].includes(message.args[1])){
        let thisItem = eventData.inventory.find(x=>x.id==eventData[message.args[1]] )
        message.reply("```"+JSON.stringify(thisItem)+"```")
        await gear.userDB.updateOne({id:Author.id,'eventData.halloween18.inventory.id':thisItem.id},{$set:{'eventData.halloween18.inventory.$.equipped':false}}).lean().exec();   
        await gear.userDB.updateOne({id:Author.id},{$set:{['eventData.halloween18.'+message.args[1]]:null}}).lean().exec();
       return  message.react(gear.yep.r);
        
        
      }else if(message.args[1]=="all"){
        gear.userDB.updateOne({id:Author.id,'eventData.halloween18.inventory.equipped':true},{$set:{'eventData.halloween18.inventory.$.equipped':false}}).lean().exec();   
         await gear.userDB.updateOne({id:Author.id},{$set:
             {
               'eventData.halloween18.head':null,
               'eventData.halloween18.legs':null,
               'eventData.halloween18.body':null
             }});
         return  message.react(gear.yep.r);
        
      }
    }
    
    if (message.args[0] == "set" || message.args[1] == "gender"){
      
      let resolve = message.args[2]
      if (!resolve) return message.reply("Missing parameter");
      if(["girl","female","gal","woman"].includes(resolve.toLowerCase()))
            await gear.userDB.set(Author.id,{$set: {"eventData.halloween18.gender": "fem"}});
      else if (["boy","male","guy","man"].includes(resolve.toLowerCase()))
            await gear.userDB.set(Author.id,{$set: {"eventData.halloween18.gender": "boy"}});
      else
        return message.reply("Invalid Gender");
      
      return  message.react(gear.yep.r);

      }
    
  
  
  const Canvas = require("canvas");

    
  let base = eventData.gender || "fem";
  //let skin = [message.args[0]||false,message.args[1]||false,message.args[2]||false]
  let equipH = (eventData.inventory||[]).find(x=>x.id == eventData.head)||{};
  let equipB = (eventData.inventory||[]).find(x=>x.id == eventData.body)||{};
  let equipF = (eventData.inventory||[]).find(x=>x.id == eventData.legs)||{};

  const embed = new gear.RichEmbed;
  const embed3 = new gear.RichEmbed;

  embed.setColor("#3b6987");
  let setBonus = 0
  let equippeds = (eventData.inventory||[]).filter(itm=>[equipH.id,equipB.id,equipF.id].includes(itm.id)).map(x=>x.spook||0)
  let equippeds2 = (eventData.inventory||[]).filter(itm=>[equipH.id,equipB.id,equipF.id].includes(itm.id)).map(x=>x.aspectBonus||0)
  equippeds.push(0)
  equippeds2.push(0)
  let aspectBonus = equippeds2.reduce((a,b)=>a+b);
  if(equipH.costume == equipB.costume && equipB.costume == equipF.costume && equipH.costume != null ) setBonus = Math.floor(aspectBonus/3)+10;
  
  let totalSpook =  equippeds.length > 0 ? setBonus + equippeds.reduce((a,b)=>a+b)+aspectBonus : 0
  

   
  if(Target.id == "271394014358405121"){
    equipH = {rarity:"XR",name:"Fancy Lace Headpiece" , id:"---"}
    equipB = {rarity:"XR",name:"Cute Maid Dress" , id:"---"}
    equipF = {rarity:"XR",name:"Techy Robot Legs" , id:"---"}
    totalSpook = 1000
  }
  
  
  let spookPowa = mm("events:halloween18.keywords.spookPowa",P)
  embed.addField("**`🎩 Head  \u200b`**\u200b*`"+`[${equipH.spook||0}](+${equipH.aspectBonus||0})\`*`,equipH.id?gear.emoji(equipH.rarity)+equipH.name:"---",true);
  embed.addField("**`👕 Body  \u200b`**\u200b*`"+`[${equipB.spook||0}](+${equipB.aspectBonus||0})\`*`,equipB.id?gear.emoji(equipB.rarity)+equipB.name:"---",true);
  embed.addField("**`👞 Legs  \u200b`**\u200b*`"+`[${equipF.spook||0}](+${equipF.aspectBonus||0})\`*`,equipF.id?gear.emoji(equipF.rarity)+equipF.name:"---",true);
  embed.addField("\u200b"+(setBonus?`\\⭐ +${setBonus} \`SET\``:""),`${spookPowa}: **${totalSpook}**\n\u200b`,true)
  embed.setAuthor( Target.tag+"'s Outfit",Target.displayAvatarURL())
  
  
  
   const canvas = new Canvas.createCanvas(400, 200);
  const ctx = canvas.getContext('2d');  
  ///================= 

  
  let skin = [
    equipH.costume,
    equipB.costume,
    equipF.costume
             ]
  let top =  skin[0]? `${base}_${skin[0]}_head.png` : "none.png";
  let mid =  skin[1]? `${base}_${skin[1]}_body.png` : "none.png";
  let bot =  skin[2]? `${base}_${skin[2]}_legs.png` : "none.png";
  let _base;
  if(Target.id=="271394014358405121"){
    _base = await gear.getCanvas(paths.BUILD+'event/halloween18/bodies/polluxboo.png');
     }else{
   _base = await gear.getCanvas(paths.BUILD+'event/halloween18/bodies/'+base+"_base.png");
       
     }
  const _top =  await gear.getCanvas(paths.BUILD+'event/halloween18/bodies/' +top );
  const _mid =  await gear.getCanvas(paths.BUILD+'event/halloween18/bodies/' +mid );
  const _bot =  await gear.getCanvas(paths.BUILD+'event/halloween18/bodies/' +bot );    
  const _cask =  await gear.getCanvas(paths.BUILD+'event/halloween18/casket_cls.png' );    
  //const _candy =  await gear.getCanvas(paths.BUILD+'event/halloween18/casket_cls.png' );    
  const _candy =  await gear.getCanvas("https://cdn.discordapp.com/emojis/366437119658557440.png" );    
  
  let rarCols = {
    XR : "#ff3664",
    UR : "#b76af0",
    SR : "#eb90b3",
    R : "#96bfe8",
    U : "#efcb86",
    C : "#beb9cc",
  }
  
  const _power =  await gear.tag(ctx,totalSpook,'900 24px "Whitney HTF"',"#CCD");  
  const _tspook =  await gear.tag(ctx,spookPowa,'600 10px "Whitney HTF SC"',"#CCD");  
  const _hat =  await gear.tag(ctx,equipH.name||"---",'400 12px "Corporate Logo Rounded"',rarCols[equipH.rarity]);    
  const _bod =  await gear.tag(ctx,equipB.name||"---",'400 12px "Corporate Logo Rounded"',rarCols[equipB.rarity]);    
  const _leg =  await gear.tag(ctx,equipF.name||"---",'400 12px "Corporate Logo Rounded"',rarCols[equipF.rarity]);    
  const _txcaskr = await gear.tag(ctx,eventData.caskets||"0",'900 16px "Whitney HTF"',"#CCD");  
  const _txcandy = await gear.tag(ctx,eventData.candy||"0",'900 16px "Whitney HTF"',"#CCD");  
  
  
  ctx.fillStyle = "#282a31"
  ctx.fillRect(0,0,400,200)
  ctx.fillStyle = "rgba(55, 60, 70, 0.49)"
  ctx.fillRect(10,10,180,180)
  ctx.fillRect(200,10,190,30)
  ctx.fillRect(200,50,190,30)
  ctx.fillRect(200,90,190,30)
  ctx.fillRect(200,130,190,60)
  x=55
  y=10
  w=125
  h=150
  ctx.drawImage(_base,x,y,w,h)
  ctx.drawImage(_bot, x,y,w,h)
  ctx.drawImage(_mid, x,y,w,h)
  ctx.drawImage(_top, x,y,w,h)
  let ww
  let MW = 180
  ctx.drawImage(_tspook.item, _power.width + 40,165)
  ctx.drawImage(_power.item, 30,150)
  ww= _hat.width > MW ? MW : _hat.width
  ctx.drawImage(_hat.item,205, 20, ww ,_hat.height);
  ww= _bod.width > MW ? MW : _bod.width
  ctx.drawImage(_bod.item,205, 60, ww ,_bod.height);
  ww= _leg.width > MW ? MW : _leg.width
  ctx.drawImage(_leg.item, 205,100, ww ,_leg.height);
  
  ctx.drawImage(_cask, 200,135, 45,45);
  ctx.drawImage(_txcaskr.item,26+  230,150);
  ctx.drawImage(_candy, 300,143, 28,28);
  ctx.drawImage(_txcandy.item,45+ 290,150);

  embed.attachFiles({
      attachment: await canvas.toBuffer(),
      name: "costume.png"
    });
    let attc = "attachment://costume.png"
  
  
  
  //embed.setThumbnail(Target.displayAvatarURL())
  embed.setImage(attc);
  embed.setFooter("Pollux Halloween Event 2018","https://pollux.amarok.kr/medals/pumpxd.png")  
  
  message.channel.send({embed})
  


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