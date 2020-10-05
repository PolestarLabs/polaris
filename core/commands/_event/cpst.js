
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
####     -- Database: EVENT INVENTORY                             ####
####     -- Vanilla asset paths that might not be available       ####
####                                                              ####
######################################################################
######################################################################
*/


const oldBuildPath = "https://pollux.amarok.kr/build/"
const Picto = require('../../utilities/Picto.js')
const EventData = require('../../archetypes/Events.js');
const EV = EventData.event_details; 

const init = async function (message) {
  
  const eventData = await EV.userData(message.author);  

  const canvas = Picto.new(200, 200);
  const ctx = canvas.getContext('2d');  
  ///=================
  
  
  let base = "fem"
  let skin = [message.args[0]||false,message.args[1]||false,message.args[2]||false]
  let equipH = eventData.inventory.find(x=>x.id == eventData.head)||{};
  let equipB = eventData.inventory.find(x=>x.id == eventData.body)||{};
  let equipF = eventData.inventory.find(x=>x.id == eventData.legs)||{};
  
  /*
  let skin = [
    equipH.costume,
    equipB.costume,
    equipF.costume
    ]
  */
  let top = `${base}_${skin[0]}_head.png` ;
  let mid = `${base}_${skin[1]}_body.png` ;
  let bot = `${base}_${skin[2]}_legs.png` ;
  
  const _base = await Picto.getCanvas(oldBuildPath+'event/halloween18/bodies/'+base+"_base.png").catch(err=>Picto.new(1,1));
  const _top = await Picto.getCanvas(oldBuildPath+'event/halloween18/bodies/' +top ).catch(err=>Picto.new(1,1));
  const _mid = await Picto.getCanvas(oldBuildPath+'event/halloween18/bodies/' +mid ).catch(err=>Picto.new(1,1));
  const _bot = await Picto.getCanvas(oldBuildPath+'event/halloween18/bodies/' +bot ).catch(err=>Picto.new(1,1));
    
  
  ctx.drawImage(_base,0,0,166,200)
  ctx.drawImage(_bot,0,0,166,200)
  ctx.drawImage(_mid,0,0,166,200)
  ctx.drawImage(_top,0,0,166,200)
  
  
  
  
    
  await message.channel.send("```"+JSON.stringify({skin,equipH,
equipB,
equipF,})+"```",{
                    file:  await canvas.toBuffer(),
                        name: "aassddff.png"
                    
                })
  
  
  
}


module.exports={
  init
  ,pub:false
  ,cmd:'cpst'
  ,cat:'_event'
  ,botPerms:['attachFiles','embedLinks','manageMessages']
  ,aliases:[]
}