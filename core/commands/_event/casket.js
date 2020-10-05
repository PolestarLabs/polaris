
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



const init = async function (message){

  const P = {lngs: message.lang };
  moment.locale(message.lang[0]);

  const v = {
    last: $t('daily.lastdly', P),
    next: $t('daily.next', P),
    streakcurr: $t('daily.streakcurr', P),
    expirestr: $t('daily.expirestr', P),
  }

  
  const noCasket  =   $t("events:halloween18.caskets.noCasket",P);
  const canOnly20 =   $t("events:halloween18.caskets.tooManyGar",P);
  let noEventPart =   $t("events:halloween18.caskets.noCasket",P);

  const comment =  rand$t('events:halloween18.caskets.commentary',P);

  
  const Author = message.author
  //if (Author.dailing === true) return message.channel.send("There's already a casket request going on!");


  const USERDATA = await DB.users.findOne({ id: Author.id });
  const eventData = await EV.userData(Author);


  const casketine =  [
    $t("events:halloween18.caskets.casketine.quiet",P),
    $t("events:halloween18.caskets.casketine.notsus",P),
    $t("events:halloween18.caskets.casketine.onenot",P),
    $t("events:halloween18.caskets.casketine.oly",P)
  ]

  const embed_pos = {};
  embed_pos.color = 0x3b6987;
  embed_pos.footer = {text:"Pollux Halloween Event 2020" , icon_url: "https://pollux.amarok.kr/medals/pumpxd.png"};
  const embed_pre = {};
  embed_pre.setColor = 0x3b6987;
  embed_pre.footer = {text:"Pollux Halloween Event 2020" , icon_url: "https://pollux.amarok.kr/medals/pumpxd.png"};



  if (message.content.endsWith('open')) {
      
    if( eventData.inventory?.length > 11) return message.reply(canOnly20);
      
    
    if (eventData.caskets > 0) {

      let phab = EV.phabricate(Author);
      DB.users.set(Author.id,{$inc:{"eventData.halloween18.caskets":-1}});
      DB.users.set(Author.id,{$push:{"eventData.halloween18.inventory":phab}});
        
      embed_pre.thumbnail = { url: 'https://pollux.amarok.kr/build/event/halloween18/casket_cls.png' };
        
      P.user = message.member.nick || message.author.username;
      let casket1= $t("events:halloween18.caskets.openintro",P);
      let casket2= $t("events:halloween18.caskets.open.followup",P);
                
      embed_pre.description = casket1;
      embed_pos.thumbnail = {url: 'https://pollux.amarok.kr/build/event/halloween18/casket_opn.png' };
      embed_pos.description = `
  ${casket1}
  **${_emoji(phab.rarity)+phab.name}** (\`${(phab.spook)} ${$t("events:halloween18.keywords.spook")}\`)
  ${comment}

      `;

      message.channel.send({embed: embed_pre})
        .then(async me => {
          await wait(3);
          me.edit({embed: embed_pos})
            .then(me2 => {
            //post message
          })
        })

      } else {
        embed_pos.description = noCasket
        message.channel.send({embed: embed_pos})
      }

    }else{
      const casketine2 = eventData.caskets == 0 ? casketine[0] : eventData.caskets == 1 ? casketine[1] : eventData.caskets > 4 ? casketine[3] : eventData.caskets >1 ? casketine[02] :  casketine[1]; 
      
      embed_pos.thumbnail = {url: 'https://pollux.amarok.kr/build/event/halloween18/casket_cls.png' };
      P.count = eventData.caskets;
      embed_pos.description = `\u200b
 ${$t("events:halloween18.caskets.hasCask",P)}
 ${casketine2}
 `   
       message.channel.send({embed: embed_pos})
   
   };

}

module.exports={
  init
  ,pub:false
  ,cmd:'casket'
  ,cat:'_event'
  ,botPerms:['attachFiles','embedLinks']
  ,aliases:[]
}

