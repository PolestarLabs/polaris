
/*

                         __    _                                   
                    _wr""        "-q__                             
                 _dP                 9m_     
               _#P                     9#_                         
              d#@                       9#m                        
             d##                         ###                       
            J###                         ###L                      
            {###K                       J###K                      
            ]####K      ___aaa___      J####F                      
        __gmM######_  w#P""   ""9#m  _d#####Mmw__                  
     _g##############mZ_         __g##############m_               
   _d####M@PPPP@@M#######Mmp gm#########@@PPP9@M####m_             
  a###""          ,Z"#####@" '######"\g          ""M##m            
 J#@"             0L  "*##     ##@"  J#              *#K           
 #"               `#    "_gmwgm_~    dF               `#_          
7F                 "#_   ]#####F   _dK                 JE          
]                    *m__ ##### __g@"                   F          
                       "PJ#####LP"                                 
 `                       0######_                      '           
                       _0########_                                   
     .               _d#####^#####m__              ,              
      "*w_________am#####P"   ~9#####mw_________w*"                  
          ""9@#####@M""           ""P@#####@M""                    


 VANILLA CODE AHEAD   -   VANILLA CODE AHEAD   -   VANILLA CODE AHEAD   -   VANILLA CODE AHEAD   -   VANILLA CODE AHEAD   -   VANILLA CODE AHEAD 

######################################################################
######################################################################
####                                                              ####
####             THIS IS DIRECT PORT OF OLD CODE                  ####
####                                                              ####
####     AND SHOULD _NOT_ BE USED WITH THE NEW CODEBASE           ####
####                                                              ####
######################################################################
####                                                              ####
####                THINGS TO BE PROPERLY PORTED:                 ####
####                                                              ####
####     -- Proper use of async/await                             ####
####     -- Database: INVENTORY here is handled the old way       ####
####     -- Timed Command: does not use TimedCommand module       ####
####                                                              ####
####                                                              ####
######################################################################
######################################################################
*/


const moment = require("moment");

  
const YEP = _emoji('yep');
const NOPE = _emoji('nope');
const EventData = require('../../archetypes/Events.js');
const EV = EventData.event_details; 
const Picto = require('../../utilities/Picto.js')

const oldBuildPath = "https://pollux.amarok.kr/build/"


const init = async function (msg){

  const P = {lngs: msg.lang, user: msg.author.tag };
  moment.locale(msg.lang[0]);

  const Author = msg.author  
  
  const USERDATA = await DB.users.findOne({ id: Author.id });
  const eventData = await EV.userData(Author);





//const locale = require('../../../utils/multilang_b');
//const mm = locale.getT();


    
//STATIC STRINGS    
    
  const noEventPart     = $t("events:generic.noEventPart",P);
  const examples_t      = $t("events:halloween18.tradeExamples",P);     
  const gotCasket       = $t("events:halloween18.caskets.gotCasket",P);
  const noCasket        = $t("events:halloween18.caskets.noCasket",P);
  const wardrobeBrief   = $t("events:halloween18.wardrobe.brief",P);
  const t_garments      = $t("events:halloween18.wardrobe.garments",P) ;
  const spookyWardrobe  = $t("events:halloween18.wardrobe.spookyWardrobe",P) ;
  
  const confirmDestroy  = $t("responses.items.confirmDestroy",P);
  const destroyWhat     = $t("responses.items.destroyWhat",P);
  const cantDestroy     = $t("responses.items.cantDestroy",P);
  const destroyConfirmed= $t("responses.items.destroyed",P);  
  
  const t_rubines       = $t("keywords.RBN_plural",P);
  const t_AMOUNT        = $t("terms.amount",P).toUpperCase();
  
  const exchangeWhat    = $t("responses.trade.exchangeWhat",P);
  const tradeStert      = $t("responses.trade.tradeStert",P);
  const has10toOffer    = $t("responses.trade.has10toOffer",P);        
  const tradeSummary    = $t("responses.trade.tradeSummary",P);
  const confimrTrade    = $t("responses.trade.confimrTrade",P);
  const plsConfirmTrade = $t("responses.trade.plsConfirmTrade",P);
  const confirmPiece2   = $t("responses.trade.trade.confirm10s",P);
  const transConfirm    = $t("responses.trade.confirmed",P);
  const transDeclined   = $t("responses.trade.declined",P);
  const transTimeout    = $t("responses.trade.timeout",P);
  
  const confirmSave    = $t("events:halloween18.wardrobe.confirmSave",P) ;
  const confirmSave2    = $t("events:halloween18.wardrobe.confirmSave2",P) ;
  const alreadYhere    = $t("events:halloween18.wardrobe.mementoExists",P) ;
  const mementoDamaged    = $t("events:halloween18.wardrobe.mementoDamaged",P) ;
  
//-----
  
  
function checkEquip(it){
   if(it.equipped === true){
      msg.reply (_emoji('nope')+"`ITEM IS EQUIPPED`");
     return true;
    }      
}


  
//SUBS
  
//-----DESTROY
  if (msg.args[0] == "destroy"){
    if (msg.args[1]){
      let item = eventData.inventory[Number(msg.args[1].replace(/[^0-9]/g,''))-1]      
      if(!item){
        return msg.reply(cantDestroy);
      }

      
      let itemPresent = _emoji(item.rarity)+"**"+item.name+"** ["+item.spook+"]"
      if (checkEquip(item) === true) return;
      let x_embed = {};
      x_embed.description = itemPresent;
      x_embed.color = 0xffb62c
      
      if( msg.author.trading ==true)return msg.addReaction(NOPE.reaction);
      msg.author.trading = true;
      msg.channel.send( {content: confirmDestroy, embed:x_embed}).then(async mes=>{
          await mes.addReaction(YEP.reaction);
          mes.addReaction(NOPE.reaction);
          
          const reas = await mes.awaitReactions(rea=>rea.userID === msg.author.id,{maxMatches:1,time:10000});
              
      msg.author.trading = false;
          if(reas.size == 0 ) return msg.channel.send("`TIMEOUT`");
          if(reas?.[0].emoji.id === YEP.id){
            x_embed.color = 0x3db75e
            x_embed.description = _emoji("jade")+" 1000 "+$t('keywords.JDE_plural',P);
            await DB.users.set(Author.id, {$inc:{'modules.jades':1000}});        
            let neoinvent = eventData.inventory.filter(x=>x.id!==item.id);
            await DB.users.set(Author.id, {$set:{'eventData.halloween18.inventory':neoinvent}});            
            mes.removeReactions();
            mes.edit({content: destroyConfirmed,embed:x_embed})
          }
          if(reas?.[0].emoji.id === NOPE.id){
            x_embed.color = 0xe2253b
            mes.delete();
             return msg.channel.send("`CANCEL`");
          }        
        
    })
    }else{
  msg.reply(destroyWhat)
    }
    return;
  }
//-----   
  
//-----TRADE   
  if (msg.args[0] == "trade"){    
    if (msg.args[1]&&msg.args[2]){
      if( msg.args[2] && PLX.users.find(u=>u.id==msg.args[2].replace(/[^0-9]/g,'')) ){
        let target = PLX.users.find(u=>u.id==msg.args[2].replace(/[^0-9]/g,''));
        let item = eventData.inventory[Number(msg.args[1].replace(/[^0-9]/g,''))-1]
        let itemPresent = _emoji(item.rarity)+"**"+item.name+"** ["+item.spook+"]"
        if (checkEquip(item) === true) return;
        P.targetName = target.tag
        P.targetMention = target
          
        if(target.id == msg.author.id){
          msg.addReaction("🇳");   
          msg.addReaction("🇴");
          msg.addReaction("🇵");
          msg.addReaction("🇪");
          return;
        }
            if( msg.author.trading ==true || target.trading ==true || target.id == msg.author.id)return msg.addReaction(NOPE.reaction);
 
            msg.author.trading = true;
            target.trading = true;
        
        let tradestart = await msg.channel.send  (
          `  
  __${tradeStert}__
>>> \`TRADE\` ${itemPresent}
>>> ${target.tag} 

${$t("responses.trade.has10toOffer",P)}
\`\`\`ml
(* ${exchangeWhat} *)
R ['${t_AMOUNT}'] |-> ${t_rubines}
G ['ItemID'] |-> ${t_garments}
${"```"}
${examples_t}
`);
        
        
  
   
let targetData = DB.users.findOne({id:target.id}).lean().exec();
const tradeRes =        await msg.channel.awaitMessages(msg=>msg.author.id==target.id && msg.content.match(/^[RGrg] +[0-9]+$/),{maxMatches:1,time:18000});
targetData = await targetData;
        
            msg.author.trading = false;
            target.trading = false;
        
        if (tradeRes.length == 0 ) return msg.channel.send("`💔 TIMEOUT`");
        
        let trad = tradeRes?.[0]?.content?.toUpperCase()?.split(/ +/);
        let numInput = Math.abs(parseInt(trad[1]));
        if(isNaN(numInput)) return msg.channel.send("`💔 INVALID NUMBER`")
        let tradeSubject,queryStringOut,queryStringIn;
        
        if(trad[0]=="G"){
          
          let targetInv = targetData.eventData.halloween18.inventory
          let itemComing = targetInv[numInput-1];
          
          if(itemComing.equipped === true){
             return tradeRes?.[0].reply (_emoji('nope')+"`💔 ITEM IS EQUIPPED`");
          }
          
          tradeSubject = _emoji(itemComing.rarity)+"**"+itemComing.name+"** ["+itemComing.spook+"]"
          if(!itemComing) return msg.reply ("`💔 INVALID ITEM");
          
          let compiledInv = targetInv.filter(itm=>itm.id!=itemComing.id);
          
          queryStringOut = {$set:{"eventData.halloween18.inventory":compiledInv}}
          queryStringIn  = {$push:{"eventData.halloween18.inventory":itemComing}}
          
        }
        
        [msg,tradestart,tradeRes?.[0]].forEach(x=>x.delete().catch(err=>null));
        if(targetData.eventData.halloween18.inventory.length>11 && trad[0]!=="G")return tradeRes?.[0].reply("`💔 MAX ITEMS LIMIT`");
        
        if(trad[0]=="R"){
        if(targetData.modules.rubines < numInput)return msg.reply("`💔 INSUFFICIENT FUNDS`");
          tradeSubject = "**"+numInput+"** x Rubines "+_emoji("rubine")
          queryStringOut = {$inc:{"modules.rubines":-numInput}}
          queryStringIn  = {$inc:{"modules.rubines":numInput}}
        }
        if(trad[0]=="C"){
        if(targetData.eventData.halloween18.candy < numInput)return msg.reply("`💔 INSUFFICIENT CANDY`");
          tradeSubject = "**"+numInput+"** x Candy "+EV.emoji.candy1
          queryStringOut = {$inc:{"eventData.halloween18.candy":-numInput}}
          queryStringIn  = {$inc:{"eventData.halloween18.candy":numInput}}
        }

        
        let c_embed = {}();
        
        c_embed.setTitle(confimrTrade)
        
       let confirmPiece1 = `
**${tradeSummary}**
**\`${Author.tag}\`** >>>  ${itemPresent}
**\`${target.tag}\`** >>>  ${tradeSubject}
\u200b
`
       
       c_embed.description= confirmPiece1 + confirmPiece2
          
          
          msg.reply({content:plsConfirmTrade,embed:c_embed}).then(async mes=>{
          await mes.addReaction(YEP.reaction);
           mes.addReaction(NOPE.reaction);
          
          const reas = await mes.awaitReactions(rea=>rea.userID === msg.author.id,{maxMatches:1,time:10000});
            c_embed.description= confirmPiece1
            let ts= new Date();
            c_embed.timestamp= ts
            
          if(reas.size == 0 ) {
            c_embed.color = 0xffb62c;
            c_embed.footer = {text: transTimeout, icon_url: "https://cdn.discordapp.com/emojis/476214608592633866.png?v=1"};
            mes.edit({embed:c_embed})
            return msg.channel.send("`TIMEOUT`");
          }
          if(reas?.[0].emoji.id === YEP.id){
            c_embed.color = 0x3db75e;
            c_embed.footer = {text: transConfirm, icon_url: "https://cdn.discordapp.com/emojis/339398829050953728.png"};
            mes.edit({embed:c_embed})
            mes.reactions.removeAll()
            
let me_targetInv = eventData.inventory
let me_compiledInv = me_targetInv.filter(itm=>item.id!=itm.id);            
let me_queryStringOut = {$set:{"eventData.halloween18.inventory":me_compiledInv}}
let me_queryStringIn  = {$push:{"eventData.halloween18.inventory":item}}
            
            await DB.users.set(Author.id, me_queryStringOut);
            await DB.users.set(Author.id, queryStringIn);
            await DB.users.set(target.id, queryStringOut);
            
            await wait(1);
            await DB.users.set(target.id, me_queryStringIn);
                    
            
          }else{
            c_embed.color = 0xe2253b;
            c_embed.footer = {text: transDeclined, icon_url: "https://cdn.discordapp.com/emojis/339398829088571402.png"};
            mes.edit({embed:c_embed})
            return mes.reactions.removeAll()
          }
          
        })

        return;
        
      }else{
        miniUsage = "`+wardrobe trade [#ID] >[@USER]<`"
        return msg.reply ( miniUsage )        ;
      }
    }else{
      miniUsage = "`+wardrobe trade [#ID] [@USER]`"
      return msg.reply ( miniUsage );
    }
  }
//-----     
  

//----MEMENTO
  if (["keep","memento"].includes(msg.args[0])){
    if (msg.args[1]){
      let item = eventData.inventory[Number(msg.args[1].replace(/[^0-9]/g,''))-1]      
      if(!item){
        return msg.reply(`INVALID ITEM`);
      }      
      let itemPresent = _emoji(item.rarity)+"**"+item.name+"** ["+item.spook+"]"
      if (checkEquip(item) === true) return;
      let embed = {};
      embed.description = itemPresent;
      embed.color = 0xffb62c
        let memento = eventData.memento || [];

      if(memento.filter(itm=>itm.type==item.type && itm.costume == item.costume).length>0){
        msg.addReaction(NOPE.reaction);
        return msg.reply(alreadYhere)
      }
       if(item.spook<0) return msg.reply(mementoDamaged);
      
      if( msg.author.trading ==true)return msg.addReaction(NOPE.reaction);
      let mes = await msg.channel.send( {content:confirmSave, embed})
      
      mes.addReaction(YEP.reaction)
      mes.addReaction(NOPE.reaction)
      const reas = await mes.awaitReactions(rea => rea.userID === msg.author.id, {
        maxMatches: 1,
        time: 10000
      }).catch(e=>[]);

      msg.author.trading = false;
      if (reas.size == 0) return msg.channel.send("`TIMEOUT`");
      if (reas?.[0].emoji.id === YEP.id) {
        
         let neoinvent = eventData.inventory.filter(x=>x.id!==item.id);
            await DB.users.set(Author.id, {$set:{'eventData.halloween18.inventory':neoinvent}});     
        memento.push(item)
     
        
            await DB.users.set(Author.id, {$set:{'eventData.halloween18.memento':memento}});         
        embed.color = 0xff50bc 
            mes.removeReactions();
            mes.edit( {content: _emoji('yep')+confirmSave2,embed});
            
        if(memento.length == 13){
          await DB.users.set(Author.id, {$inc:{'eventGoodie':1000}});   
          mes.channel.send("You got 1000 bonus Event Tokens for completing 50% of your Memento Collection!")
        }
        else if(memento.length == 27){
          await DB.users.set(Author.id, {$addToSet:{'modules.achievements':"memento_completionist"},$inc:{'eventGoodie':2000}});   
          mes.channel.send("You got 2000 bonus Event Tokens for completing 100% of your Memento Collection!")
          
        }
        return;
        
          }
        
      if (reas?.[0].emoji.id === NOPE.id) {
        mes.delete();
        return msg.channel.send("`CANCEL`");
      }      
      
      }
      
    }
  
//----  
  
//DEFAULT
  const embed = {};
  embed.color = 0x3b6987;
  embed.fields = []

  for (i in eventData.inventory) {
    let ind = eventData.inventory
    embed.fields.push({
     name: _emoji(ind[i].rarity) + ind[i].name + (ind[i].augment ? " +" + ind[i].augment : ""),
value: ` \`\`\`ml
${ind[i].equipped===true?"🔒":" "}[#${((Number(i)+1)+"").padStart(2,0)}]|${(ind[i].spook+"").padStart(2,0)}SPK${ ind[i].aspectBonus?"(+"+(ind[i].aspectBonus+"").padStart(2,0)+")":""  }
\`\`\``, 
inline: !0
    })
}

  embed.footer = {name: spookyWardrobe, avatar_url:  Author.avatarURL};
  //embed.description= wardrobeBrief;
  embed.footer = {text: "Pollux Halloween Event 2020", icon_url:  "https://pollux.amarok.kr/medals/pumpxd.png"};
  //embed.thumbnail= {url: "https://pollux.amarok.kr/build/event/halloween18/wardrobe.png"};

  msg.channel.send({embed});
  
}


 module.exports={
   init
   ,pub:false
   ,cmd:'wardrobe'
   ,cat:'_event'
   ,botPerms:['attachFiles','embedLinks']
   ,aliases:[]
 }