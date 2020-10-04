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