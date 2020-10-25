
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

const oldBuildPath = "https://vanilla.pollux.gg/build/"


const init = async function (msg){

  const P = {lngs: msg.lang, user: msg.author.tag };
  moment.locale(msg.lang[0]);

  const Author = msg.author  
  
  const USERDATA = await DB.users.findOne({ id: Author.id });
  const eventData = await EV.userData(Author);


    
//STATIC STRINGS    
    
         let costumes ={
           werewolf: "🐺 Werewolf",
            wizard: "🔮 Wizard",
            demon: "👺 Devil",
            vampire: "🦇 Vampire",
            astronaut: "🚀 Astronaut",
            duck: "🦆 Duck",
            pirate: "☠ Pirate",
            mummy: "⚰ Mummy",
            scrow: "🎃 Scarecrow",
            //jiangshi: "☯ Jiangshi",
            //alraune: "🌹 Alraune",
         }
   
//let targetData = userDB.findOne({id:target.id}).lean().exec();

  
//DEFAULT
  const embed = {};
  embed.color= 0xd8459a;
  embed.fields =[];

  const parts = {head:"Hat",body:"Vest",legs:"Legs"}
    let ind = eventData.memento || [];
  for (i in costumes) {
    let things = ""
  for (i2 in parts) {
    let item = (ind.find(x=> x.type == i2 && x.costume == i) || {})
    let itemName = (item.name||"`--none--`").split(" ")[0];
    things += parts[i2]+": "+(item.id?_emoji(item.rarity):"")+" **"+itemName+"**\n"
  }
    embed.fields.push( {name: costumes[i], value:things, inline:true});
  }

  embed.author={name: Author.tag+"'s Memento Collection", avatar_url: Author.avatarURL};

  embed.footer = {text:"Pollux Halloween Event 2020", icon_url: "https://pollux.amarok.kr/medals/pumpxd.png"};
 

  msg.channel.send({embed});
  
}

module.exports={
  init
  ,pub:true
  ,cmd:'memento'
  ,cat:'_event'
  ,botPerms:['attachFiles','embedLinks']
  ,aliases:[]
}