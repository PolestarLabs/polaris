var gear = require("../../gearbox.js");
var paths = require("../../paths.json");
var fs = require("fs");
var cmd = 'mw';
const eko = require("../../archetypes/ekonomist.js")
var locale = require('../../../utils/multilang_b');
var mm = locale.getT();
const Canvas = require("canvas");

var init = async function (message, userDB, DB) {
  
  const EV = require('./clockwork/halloween.js');
  const eventData = await EV.userData(message.author);
  
  
 const canvas = new Canvas.createCanvas(200, 200);
  const ctx = canvas.getContext('2d');
  
  ///=================
  
  
  let base = "fem"
  //let skin = [message.args[0]||false,message.args[1]||false,message.args[2]||false]
    let equipH = eventData.inventory.find(x=>x.id == eventData.head)||{};
  let equipB = eventData.inventory.find(x=>x.id == eventData.body)||{};
  let equipF = eventData.inventory.find(x=>x.id == eventData.legs)||{};
  
  let skin = [
    equipH.costume,
    equipB.costume,
    equipF.costume
             ]
  let top = `${base}_${skin[0]}_head.png` ;
  let mid = `${base}_${skin[1]}_body.png` ;
  let bot = `${base}_${skin[2]}_legs.png` ;
  
  const _base = await gear.getCanvas(paths.BUILD+'event/halloween18/bodies/'+base+"_base.png");
  const _top = await gear.getCanvas(paths.BUILD+'event/halloween18/bodies/' +top );
  const _mid = await gear.getCanvas(paths.BUILD+'event/halloween18/bodies/' +mid );
  const _bot = await gear.getCanvas(paths.BUILD+'event/halloween18/bodies/' +bot );
    
  
  ctx.drawImage(_base,0,0,166,200)
  ctx.drawImage(_bot,0,0,166,200)
  ctx.drawImage(_mid,0,0,166,200)
  ctx.drawImage(_top,0,0,166,200)
  
  
  
  
    
  await message.channel.send("```"+JSON.stringify({skin,equipH,
equipB,
equipF,})+"```",{
                    files: [{
                        attachment: await canvas.toBuffer(),
                        name: "aassddff.png"
                    }]
                })
  
  
  
}



module.exports = {
  pub: false,
  cmd: cmd,
  perms: 3,
  init: init,
  cat: 'cosmetics',
   botperms:["MANAGE_MESSAGES","ATTACH_FILES","EMBED_LINKS"]
};