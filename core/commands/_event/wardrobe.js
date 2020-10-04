const {
        RichEmbed,
        yep,
        emoji,
        userDB,
        nope,
        cleanup,
        wait
      } = require("../../gearbox.js");

//const locale = require('../../../utils/multilang_b');
//const mm = locale.getT();

const cmd = 'wardrobe';

const EV = require('./clockwork/halloween.js');


const init = async function (message) {


//GATHER DATA
  const Author = message.author
  const USERDATA = await userDB.findOne({id: Author.id}).lean().exec();
  const eventData = await EV.userData(Author);
  
    const P = {
      lngs: message.lang,
      user: Author
    }
    
//STATIC STRINGS    
    
  const noEventPart     = mm("events:generic.noEventPart",P);
  const examples_t      = mm("events:halloween18.tradeExamples",P);     
  const gotCasket       = mm("events:halloween18.caskets.gotCasket",P);
  const noCasket        = mm("events:halloween18.caskets.noCasket",P);
  const wardrobeBrief   = mm("events:halloween18.wardrobe.brief",P);
  const t_garments      = mm("events:halloween18.wardrobe.garments",P) ;
  const spookyWardrobe  = mm("events:halloween18.wardrobe.spookyWardrobe",P) ;
  
  const confirmDestroy  = mm("responses.items.confirmDestroy",P);
  const destroyWhat     = mm("responses.items.destroyWhat",P);
  const cantDestroy     = mm("responses.items.cantDestroy",P);
  const destroyConfirmed= mm("responses.items.destroyed",P);  
  
  const t_rubines       = mm("keywords.RBN_plural",P);
  const t_AMOUNT        = mm("terms.amount",P).toUpperCase();
  
  const exchangeWhat    = mm("responses.trade.exchangeWhat",P);
  const tradeStert      = mm("responses.trade.tradeStert",P);
  const has10toOffer    = mm("responses.trade.has10toOffer",P);        
  const tradeSummary    = mm("responses.trade.tradeSummary",P);
  const confimrTrade    = mm("responses.trade.confimrTrade",P);
  const plsConfirmTrade = mm("responses.trade.plsConfirmTrade",P);
  const confirmPiece2   = mm("responses.trade.trade.confirm10s",P);
  const transConfirm    = mm("responses.trade.confirmed",P);
  const transDeclined   = mm("responses.trade.declined",P);
  const transTimeout    = mm("responses.trade.timeout",P);
  
  const confirmSave    = mm("events:halloween18.wardrobe.confirmSave",P) ;
  const confirmSave2    = mm("events:halloween18.wardrobe.confirmSave2",P) ;
  const alreadYhere    = mm("events:halloween18.wardrobe.mementoExists",P) ;
  const mementoDamaged    = mm("events:halloween18.wardrobe.mementoDamaged",P) ;
  
//-----
  
  
function checkEquip(it){
   if(it.equipped === true){
      message.reply (emoji('nope')+"`ITEM IS EQUIPPED`");
     return true;
    }      
}


  
//SUBS
  
//-----DESTROY
  if (message.args[0] == "destroy"){
    if (message.args[1]){
      let item = eventData.inventory[Number(message.args[1].replace(/[^0-9]/g,''))-1]      
      if(!item){
        return message.reply(cantDestroy);
      }

      
      let itemPresent = emoji(item.rarity)+"**"+item.name+"** ["+item.spook+"]"
      if (checkEquip(item) === true) return;
      let x_embed = new RichEmbed;
      x_embed.description = itemPresent;
      x_embed.setColor("#ffb62c")
      
      if( message.author.trading ==true)return message.react(nope.r);
      message.author.trading = true;
      message.channel.send(confirmDestroy,{embed:x_embed}).then(async mes=>{
          await mes.react(yep.r);
          mes.react(nope.r);
          
          const reas = await mes.awaitReactions(rea=>rea.users.has(message.author.id),{max:1,time:10000});
              
      message.author.trading = false;
          if(reas.size == 0 ) return message.channel.send("`TIMEOUT`");
          if(reas.first().emoji.id === yep.i){
            x_embed.setColor("#3db75e")
            x_embed.description = emoji("jade")+" 1000 "+mm('keywords.JDE_plural',P);
            await userDB.set(Author.id, {$inc:{'modules.jades':1000}});        
            let neoinvent = eventData.inventory.filter(x=>x.id!==item.id);
            await userDB.set(Author.id, {$set:{'eventData.halloween18.inventory':neoinvent}});            
            mes.reactions.removeAll();
            mes.edit(destroyConfirmed,{embed:x_embed})
          }
          if(reas.first().emoji.id === nope.i){
            x_embed.setColor("#e2253b")
            mes.delete();
             return message.channel.send("`CANCEL`");
          }        
        
    })
    }else{
  message.reply(destroyWhat)
    }
    return;
  }
//-----   
  
//-----TRADE   
  if (message.args[0] == "trade"){    
    if (message.args[1]&&message.args[2]){
      if( message.args[2] && message.botUser.users.get(message.args[2].replace(/[^0-9]/g,'')) ){
        let target = message.botUser.users.get(message.args[2].replace(/[^0-9]/g,''));
        let item = eventData.inventory[Number(message.args[1].replace(/[^0-9]/g,''))-1]
        let itemPresent = emoji(item.rarity)+"**"+item.name+"** ["+item.spook+"]"
        if (checkEquip(item) === true) return;
        P.targetName = target.tag
        P.targetMention = target
          
        if(target.id == message.author.id){
          message.react("🇳");   
          message.react("🇴");
          message.react("🇵");
          message.react("🇪");
          return;
        }
            if( message.author.trading ==true || target.trading ==true || target.id == message.author.id)return message.react(nope.r);
 
            message.author.trading = true;
            target.trading = true;
        
        let tradestart = await message.channel.send  (
          `  
  __${tradeStert}__
>>> \`TRADE\` ${itemPresent}
>>> ${target} 

${mm("responses.trade.has10toOffer",P)}
\`\`\`ml
(* ${exchangeWhat} *)
R ['${t_AMOUNT}'] |-> ${t_rubines}
G ['ItemID'] |-> ${t_garments}
${"```"}
${examples_t}
`);
        
        
  
   
let targetData = userDB.findOne({id:target.id}).lean().exec();
const tradeRes =        await message.channel.awaitMessages(msg=>msg.author.id==target.id && msg.content.match(/^[RGrg] +[0-9]+$/),{max:1,time:18000});
targetData = await targetData;
        
            message.author.trading = false;
            target.trading = false;
        
        if (tradeRes.size===0) return message.channel.send("`💔 TIMEOUT`");
        
        let trad = tradeRes.first().content.toUpperCase().split(/ +/);
        let numInput = Math.abs(parseInt(trad[1]));
        if(isNaN(numInput)) return message.channel.send("`💔 INVALID NUMBER`")
        let tradeSubject,queryStringOut,queryStringIn;
        
        if(trad[0]=="G"){
          
          let targetInv = targetData.eventData.halloween18.inventory
          let itemComing = targetInv[numInput-1];
          
          if(itemComing.equipped === true){
             return tradeRes.first().reply (emoji('nope')+"`💔 ITEM IS EQUIPPED`");
          }
          
          tradeSubject = emoji(itemComing.rarity)+"**"+itemComing.name+"** ["+itemComing.spook+"]"
          if(!itemComing) return message.reply ("`💔 INVALID ITEM");
          
          let compiledInv = targetInv.filter(itm=>itm.id!=itemComing.id);
          
          queryStringOut = {$set:{"eventData.halloween18.inventory":compiledInv}}
          queryStringIn  = {$push:{"eventData.halloween18.inventory":itemComing}}
          
        }
        
        cleanup([message,tradestart,tradeRes.first()])
        if(targetData.eventData.halloween18.inventory.length>11 && trad[0]!=="G")return tradeRes.first().reply("`💔 MAX ITEMS LIMIT`");
        
        if(trad[0]=="R"){
        if(targetData.modules.rubines < numInput)return message.reply("`💔 INSUFFICIENT FUNDS`");
          tradeSubject = "**"+numInput+"** x Rubines "+emoji("rubine")
          queryStringOut = {$inc:{"modules.rubines":-numInput}}
          queryStringIn  = {$inc:{"modules.rubines":numInput}}
        }
        if(trad[0]=="C"){
        if(targetData.eventData.halloween18.candy < numInput)return message.reply("`💔 INSUFFICIENT CANDY`");
          tradeSubject = "**"+numInput+"** x Candy "+EV.emoji.candy1
          queryStringOut = {$inc:{"eventData.halloween18.candy":-numInput}}
          queryStringIn  = {$inc:{"eventData.halloween18.candy":numInput}}
        }

        
        let c_embed = new RichEmbed();
        
        c_embed.setTitle(confimrTrade)
        
       let confirmPiece1 = `
**${tradeSummary}**
**\`${Author.tag}\`** >>>  ${itemPresent}
**\`${target.tag}\`** >>>  ${tradeSubject}
\u200b
`
       
       c_embed.setDescription(confirmPiece1 + confirmPiece2)
          
          
          message.reply(plsConfirmTrade,{embed:c_embed}).then(async mes=>{
          await mes.react(yep.r);
           mes.react(nope.r);
          
          const reas = await mes.awaitReactions(rea=>rea.users.has(message.author.id),{max:1,time:10000});
            c_embed.setDescription(confirmPiece1)
            let ts= new Date();
            c_embed.setTimestamp(ts)
            
          if(reas.size == 0 ) {
            c_embed.setColor("#ffb62c");
            c_embed.setFooter(transTimeout,"https://cdn.discordapp.com/emojis/476214608592633866.png?v=1");
            mes.edit({embed:c_embed})
            return message.channel.send("`TIMEOUT`");
          }
          if(reas.first().emoji.id === yep.i){
            c_embed.setColor("#3db75e");
            c_embed.setFooter(transConfirm,"https://cdn.discordapp.com/emojis/339398829050953728.png");
            mes.edit({embed:c_embed})
            mes.reactions.removeAll()
            
let me_targetInv = eventData.inventory
let me_compiledInv = me_targetInv.filter(itm=>item.id!=itm.id);            
let me_queryStringOut = {$set:{"eventData.halloween18.inventory":me_compiledInv}}
let me_queryStringIn  = {$push:{"eventData.halloween18.inventory":item}}
            
            await userDB.set(Author.id, me_queryStringOut);
            await userDB.set(Author.id, queryStringIn);
            await userDB.set(target.id, queryStringOut);
            
            await wait(1);
            await userDB.set(target.id, me_queryStringIn);
                    
            
          }else{
            c_embed.setColor("#e2253b");
            c_embed.setFooter(transDeclined,"https://cdn.discordapp.com/emojis/339398829088571402.png");
            mes.edit({embed:c_embed})
            return mes.reactions.removeAll()
          }
          
        })

        return;
        
      }else{
        miniUsage = "`+wardrobe trade [#ID] >[@USER]<`"
        return message.reply ( miniUsage )        ;
      }
    }else{
      miniUsage = "`+wardrobe trade [#ID] [@USER]`"
      return message.reply ( miniUsage );
    }
  }
//-----     
  

//----MEMENTO
  if (["keep","memento"].includes(message.args[0])){
    if (message.args[1]){
      let item = eventData.inventory[Number(message.args[1].replace(/[^0-9]/g,''))-1]      
      if(!item){
        return message.reply(`INVALID ITEM`);
      }      
      let itemPresent = emoji(item.rarity)+"**"+item.name+"** ["+item.spook+"]"
      if (checkEquip(item) === true) return;
      let embed = new RichEmbed;
      embed.description = itemPresent;
      embed.setColor("#ffb62c")
        let memento = eventData.memento || [];

      if(memento.filter(itm=>itm.type==item.type && itm.costume == item.costume).length>0){
        message.react(nope.r);
        return message.reply(alreadYhere)
      }
       if(item.spook<0) return message.reply(mementoDamaged);
      
      if( message.author.trading ==true)return message.react(nope.r);
      let mes = await message.channel.send(confirmSave,{embed})
      
      mes.react(yep.r)
      mes.react(nope.r)
      const reas = await mes.awaitReactions(rea => rea.users.has(message.author.id), {
        max: 1,
        time: 10000
      });

      message.author.trading = false;
      if (reas.size == 0) return message.channel.send("`TIMEOUT`");
      if (reas.first().emoji.id === yep.i) {
        
         let neoinvent = eventData.inventory.filter(x=>x.id!==item.id);
            await userDB.set(Author.id, {$set:{'eventData.halloween18.inventory':neoinvent}});     
        memento.push(item)
     
        
            await userDB.set(Author.id, {$set:{'eventData.halloween18.memento':memento}});         
        embed.setColor("#ff50bc") 
            mes.reactions.removeAll();
            mes.edit(emoji('yep')+confirmSave2,{embed});
            
        if(memento.length == 13){
          await userDB.set(Author.id, {$inc:{'eventGoodie':1000}});   
          mes.channel.send("You got 1000 bonus Event Tokens for completing 50% of your Memento Collection!")
        }
        else if(memento.length == 27){
          await userDB.set(Author.id, {$addToSet:{'modules.achievements':"memento_completionist"},$inc:{'eventGoodie':2000}});   
          mes.channel.send("You got 2000 bonus Event Tokens for completing 100% of your Memento Collection!")
          
        }
        return;
        
          }
        
      if (reas.first().emoji.id === nope.i) {
        mes.delete();
        return message.channel.send("`CANCEL`");
      }      
      
      }
      
    }
  
//----  
  
//DEFAULT
  const embed = new RichEmbed;embed.setColor("#3b6987");

  for (i in eventData.inventory) {
    let ind = eventData.inventory
    embed.addField(
      emoji(ind[i].rarity) + ind[i].name + (ind[i].augment ? " +" + ind[i].augment : ""),
    ` \`\`\`ml
${ind[i].equipped===true?"🔒":" "}[#${((Number(i)+1)+"").padStart(2,0)}]|${(ind[i].spook+"").padStart(2,0)}SPK${ ind[i].aspectBonus?"(+"+(ind[i].aspectBonus+"").padStart(2,0)+")":""  }
\`\`\``, true)
}

  embed.setAuthor(spookyWardrobe, Author.displayAvatarURL());
  //embed.setDescription(wardrobeBrief);
  embed.setFooter("Pollux Halloween Event 2018", "https://pollux.amarok.kr/medals/pumpxd.png");
  embed.setThumbnail("https://pollux.amarok.kr/build/event/halloween18/wardrobe.png");

  message.channel.send({embed});
  
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