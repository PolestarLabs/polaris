
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

const EventData = require('../../archetypes/Events.js');
const EV = EventData.event_details; 
const Picto = require('../../utilities/Picto.js')

const oldBuildPath = "https://pollux.amarok.kr/build/"


const init = async function (msg){

  const P = {lngs: msg.lang };
  moment.locale(msg.lang[0]);

  const Author = msg.author  
  const Target = await PLX.getTarget(msg.args[0],msg.guild,false,true) || msg.member;
  
  const USERDATA = await DB.users.findOne({ id: Author.id });
  const eventData = await EV.userData(Author);

  
  //if (Author.dailing === true) return message.channel.send("There's already a collect request going on!");




//const locale = require('../../../utils/multilang_b'); 
//const mm = locale.getT();
  
const pricetab = {  
  acCask: {r:3800 , c:800 },
  acDoll: {r:6000 , c:200 },
  acToken: {r:85 , c:1 }  
}
 
    
 
  let increment;

  const Channel = msg.channel
  
  const textIntro= $t('events:halloween18.noctix.greet',P)
  const itemlist= $t('events:halloween18.noctix.list',P)
  
  const rejecc=$t('events:halloween18.noctix.cancel',P)
  const timeout= $t('events:halloween18.noctix.timeout',P)
  const timeout_followup=$t('events:halloween18.noctix.timeout2',P)
  //const timeout_followup2= $t('events:halloween18.noctix.list',P)
  const howMany= $t('events:halloween18.noctix.howMany',P)
  const noCashR=$t('events:halloween18.noctix.noCashR',P)
  const noCashC=$t('events:halloween18.noctix.noCashC',P)
 
  const completeC=$t('events:halloween18.noctix.completeC',P)
  const completeR=$t('events:halloween18.noctix.completeR',P)
  
  const acs = {
      acCask:$t('events:halloween18.noctix.acCask',P),
      acDoll:$t('events:halloween18.noctix.acDoll',P),
      acToken:$t('events:halloween18.noctix.acToken',P) 
  }

  const embed = {};
  
  //embed.setAuthor("🎃 Pollux Halloween Event",null,"https://pollux.amarok.kr/events/halloween18")
  
  embed.color = 0xb9223f
  embed.footer = {text: msg.author.tag, icon_url: msg.author.avatarURL};
  //let iter = (msg.guild.dDATA.event||{}).iterations||0
  //let rate = "Lootbox droprate for "+msg.guild.name+":\u2003[ "+(100+iter)+"% ]\u2003("+((iter)/312).toFixed(4)+"% per Message)"
  
  //embed.setFooter(rate)
  
  let processedAvatar = (await Picto.getFullCanvas("https://pollux.amarok.kr/build/event/halloween18/noctixroun4.png"))?.toDataURL();
  Channel.createWebhook( {name: "Noctix - Underworld Gravekeeper", avatar: processedAvatar } ,"EVENT" ).then(async wh=>{
    
    await page1(embed,wh);



  
      
     // return PLX.deleteWebhook(wh.id,wh.token,"Gravekeeper Session Over");
      
  
    
  function tokensDialog(wh,curr){

    return PLX.executeWebhook(wh.id,wh.token,{wait:!0, content: howMany}).then(async m=>{
      const res =        await msg.channel.awaitMessages(msg2=>msg2.author.id==msg.author.id && msg2.content.match(/[0-9]+$/),{maxMatches:1,time:10000}).catch(e=>[]);
        if (res.size===0) {
          await PLX.executeWebhook(wh.id,wh.token,{wait:!0, content: rejecc});
          return false;
        }
        let amount_w = Math.abs(parseInt(res[0].content) ||0);
        
        let multi = curr=="rubines" ? 85 : 1;
        let total = amount_w * multi;
        let checkAgainst = curr=="rubines" ? USERDATA.modules.rubines : eventData.candy;
      
        if( checkAgainst < total){
          await PLX.executeWebhook(wh.id,wh.token,{wait:!0, content: (curr=="rubines" ? noCashR : noCashC)});
          return false;
        }
      
        if(curr == "rubines"){
          //await DB.audits.new(msg.author.id,pricetab.acDoll.r,"event-gravekeeper(TOKENS)","RBN","-");
          await DB.users.set(msg.author.id,{$inc:{"modules.rubines":-total}});
           await wait(1);
          PLX.executeWebhook(wh.id,wh.token,{wait:!0, content: completeR});
        }else if (curr == "candy"){
          await DB.users.set(msg.author.id,{$inc:{"eventData.halloween18.candy":-total}});
           await wait(1);
          PLX.executeWebhook(wh.id,wh.token,{wait:!0, content: completeC});
        }
        await DB.users.set(msg.author.id,{$inc:{eventGoodie:amount_w}});
        return false;
      
    
    });
    
  }
    
  async function processItem(item,wh){
    
    let text = acs[item];
    PLX.executeWebhook(wh.id,wh.token,{wait:!0, content: text}).then(async m=>{
      
       await m.addReaction(":candy1:366437119658557440");
       await m.addReaction(":rubine:367128893372760064");
      
      const reas = await m.awaitReactions(rea=>rea.userID === msg.author.id,{maxMatches:1,time:10000}).catch(e=>[]);
        if(reas.size == 0|| !reas[0]) {
             PLX.executeWebhook(wh.id,wh.token,{wait:!0, content: rejecc});
            return PLX.deleteWebhook(wh.id,wh.token,"Gravekeeper Session Over");
          }
      if(reas[0].emoji.name=="candy1"){
        let afford = eventData.candy > pricetab[item].c
        if(afford){
          if(item == "acToken"){
            await tokensDialog(wh,"candy");
            return PLX.deleteWebhook(wh.id,wh.token,"Gravekeeper Session Over");
          }
          if(item == "acDoll"){
            await DB.users.set(msg.author.id,{$set:{"eventData.halloween18.dailysec":0},
                                                 $inc:{"eventData.halloween18.candy":-pricetab.acDoll.c}});
            await wait(1);
            await PLX.executeWebhook(wh.id,wh.token,{wait:!0, content: completeC});
            PLX.deleteWebhook(wh.id,wh.token,"Gravekeeper Session Over");
            return true;
          }
          if(item == "acCask"){
            await DB.users.set(msg.author.id,{ $inc:{"eventData.halloween18.caskets":1,
                                                        "eventData.halloween18.candy":-pricetab.acCask.c}});
            await wait(1);
            await PLX.executeWebhook(wh.id,wh.token,{wait:!0, content: completeC});
            PLX.deleteWebhook(wh.id,wh.token,"Gravekeeper Session Over");
            return true;
          }
        }else{
          await PLX.executeWebhook(wh.id,wh.token,{wait:!0, content: noCashC});
          return PLX.deleteWebhook(wh.id,wh.token,"Gravekeeper Session Over");
        }
        
      }
      if(reas[0].emoji.name=="rubine"){
        let afford = USERDATA.modules.rubines > pricetab[item].r
        if(afford){
          if(item == "acToken"){
            await tokensDialog(wh,"rubines");
            return PLX.deleteWebhook(wh.id,wh.token,"Gravekeeper Session Over");
          }
          if(item == "acDoll"){
            //await DB.audits.new(msg.author.id,pricetab.acDoll.r,"event-gravekeeper(DOLL)","RBN","-");
            await DB.users.set(msg.author.id,{$set:{"eventData.halloween18.dailysec":0},
                                                 $inc:{"modules.rubines":-pricetab.acDoll.r}});
            await PLX.executeWebhook(wh.id,wh.token,{wait:!0, content: completeR});
            PLX.deleteWebhook(wh.id,wh.token,"Gravekeeper Session Over");
            return true;
          }
          if(item == "acCask"){
            //await DB.audits.new(msg.author.id,pricetab.acCask.r,"event-gravekeeper(CASKET)","RBN","-");
            await DB.users.set(msg.author.id,{ $inc:{"eventData.halloween18.caskets":1,
                                                        "modules.rubines":-pricetab.acCask.r}});
            await PLX.executeWebhook(wh.id,wh.token,{wait:!0, content: completeR});
            PLX.deleteWebhook(wh.id,wh.token,"Gravekeeper Session Over");
            return true;
          }
        }else{
          await PLX.executeWebhook(wh.id,wh.token,{wait:!0, content: noCashR});
          return PLX.deleteWebhook(wh.id,wh.token,"Gravekeeper Session Over");
        }
        
      }
      
    })
    
  }
  
  
  
  async function page1(embed,wh,m2){
    if(m2)m2.delete();
    embed.description = textIntro;
    embed.image = {url: 'http://pollux.amarok.kr/build/event/halloween18/menu.png'};
    let m = await PLX.executeWebhook(wh.id,wh.token,{wait:!0, embeds: [embed]});
    
    
    await m.addReaction(":casket:504412718753644555");
    await m.addReaction("🎎");
    await m.addReaction(":token_simplelarge:550389035642912779");
    await m.addReaction("❓");
    
      const reas = await m.awaitReactions(rea=>rea.userID === msg.author.id,{maxMatches:1,time:10000}).catch(e=>[]);;
       
     embed.image = {url: 'http://pollux.amarok.kr/build/event/halloween18/menu2bottom.png'};
            
          if(reas.size == 0 ) {
              msg.channel.send(timeout);
            await wait(2);
             await PLX.executeWebhook(wh.id,wh.token,{wait:!0, content: timeout_followup});
            return PLX.deleteWebhook(wh.id,wh.token,"Gravekeeper Session Over");
          }
          if(reas[0].emoji.name=="casket"){
            await processItem("acCask",wh);
            //return wh.delete()
          }
          if(reas[0].emoji.name=="🎎"){
            await processItem("acDoll",wh);
            //return wh.delete()
          }
          if(reas[0].emoji.name=="token_simplelarge"){
            await processItem("acToken",wh);
            //return wh.delete()
          }
          if(reas[0].emoji.name=="❓"){
            return  page2(embed,wh,m);
            
          }

  }
   
  
  async function page2(embed,wh,m2){
    if(m2)m2.delete();
     embed.description = itemlist;
     embed.image = {url: 'http://pollux.amarok.kr/build/event/halloween18/menu2bottom.png'};
      let m =await PLX.executeWebhook(wh.id,wh.token,{wait:!0, embeds: [embed]});
      m.addReaction("↩")
      m.addReaction(_emoji('nope').reaction)
          const reas = await m.awaitReactions(rea=>rea.userID === msg.author.id,{maxMatches:1,time:20000}).catch(e=>[]);
          if(reas.size == 0 ) {
             msg.channel.send("`TIMEOUT`");
            return PLX.deleteWebhook(wh.id,wh.token,"Gravekeeper Session Over");
          } 
          if(reas[0].emoji.name=="nope"){
             msg.channel.send("`CANCEL`");
            return PLX.deleteWebhook(wh.id,wh.token,"Gravekeeper Session Over");
          }
          if(reas[0].emoji.name=="↩"){
             return page1(embed,wh,m);
            
          }
  }

  
  });
  
}//end block

module.exports={
  init
  ,pub:true
  ,cmd:'gravekeeper'
  ,cat:'_event'
  ,botPerms:['manageWebhooks','embedLinks']
  ,aliases:[]
}