const cmd = 'background';
const fs = require("fs");
const gear = require("../../utilities/Gearbox");
const DB = require("../../database/db_ops");
const ECO = require("../../archetypes/Economy.js");
//const locale = require(appRoot + '/utils/i18node');
//const $t = locale.getT();

var init = async function (message) {

  let  BGBASE = await DB.cosmetics.bgs();

  
  let MSG = message.content
  let args = message.args.join(' ');
  let helpkey = $t("helpkey", {lngs: message.lang});
  if (MSG.split(/ +/)[1] == helpkey || MSG.split(/ +/)[1] == "?" || MSG.split(/ +/)[1] == "help") {
    return PLX.usage(cmd, message, this.cat);
  }


  let YA = {
    r: ":yep:339398829050953728",
    id: '339398829050953728'
  }
  let NA = {
    r: ":nope:339398829088571402",
    id: '339398829088571402'
  }
 

  BGBASE = gear.shuffle(BGBASE)
  let selectedBG = BGBASE.find(bg=>{
    if(bg.id===args) return true;
    if(bg.code===args) return true;
    if(args.includes(bg.code)) return true;
    if(message.args.some(arg=> bg.name.toLowerCase().includes(arg))) return true;
    if(message.args.some(arg=> bg.tags.toLowerCase().includes(arg))) return true;
    return false;
  });
  if(!selectedBG) selectedBG=gear.shuffle(BGBASE)[28];
 
  const embed = new gear.Embed;
  
  embed.author("Background","https://pollux.fun/images/tiers/"+selectedBG.rarity+".png");
  embed.description =`
   **${ selectedBG.name}**
  \`${ selectedBG.code}\`
  Get more Backgrounds at https://pollux.fun/bgshop
  `
  _price = selectedBG.price || GNums.bgPrices[selectedBG.rarity] 
  embed.field("Price",  selectedBG.buyable&&!selectedBG.event ? _price : "`NOT FOR SALE`",true  )
  embed.field("Droppable",  selectedBG.droppable ? _emoji('yep') :  _emoji('nope')+"x" ,true  )
  if (selectedBG.event ) embed.field("Event","`"+selectedBG.event+"`",true);
  else embed.field("\u200b","\u200b",true);

  const userData = await DB.users.get(message.author.id);
  let hasIt = userData.modules.bgInventory.includes(selectedBG.code)
  let affordsIt = await ECO.checkFunds(message.author,_price);
  let canBuy  = selectedBG.buyable&&!selectedBG.event;
  if (hasIt){
    embed.field("\u200b","You already have this Background. Equip it?",false);      
  }else{
    
    if  (selectedBG.buyable&&!selectedBG.event){
      if (affordsIt)
      embed.field("\u200b","Buy this Background?");
      else
      embed.field("\u200b","You cannot afford this Background");      
    }

  }

  let imageLink = "https://pollux.fun/backdrops/"+selectedBG.code+".png";
  const Picto = require(appRoot+'/core/utilities/Picto');
  embed.setColor(await Picto.avgColor(imageLink));
  embed.image(imageLink)
  const YesNo = require('../../structures/YesNo');
message.channel.send({embed}).then(async m => {

  async function positive(cancellation){
    if(!hasIt && affordsIt){
      await ECO.pay(message.author.id, _price, "bgshop_bot", "RBN");
    };
    if(!affordsIt)return cancellation();
      await DB.users.set({id: message.author.id}, {
        $set: {
          "modules.bgID": selectedBG.code
        },
        $addToSet: {
          "modules.bgInventory": selectedBG.code
        }
      });
    }

  if(!hasIt && affordsIt && canBuy ){
    YesNo.run(m,message,positive,null,null,{
      strings:{
        cancel:"Cancelled!",
        confirm:"Background acquired and equipped! 😉 ",
        timeout:"Timeout!"
      }
    })
  };

});

  }

module.exports = {
  pub: true,
  cmd: cmd,
  perms: 3,
  init: init,
  cat: 'cosmetics',
  aliases: ["bg", "backdrop"]
};