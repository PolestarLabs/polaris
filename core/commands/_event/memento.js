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

const cmd = 'memento';

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
    
         let costumes ={
           nurse: "💉 Nurse",
            wizard: "🔮 Wizard",
            devil: "👺 Devil",
            vamp: "🦇 Vampire",
            frank: "🗿 Frank",
            chicken: "🐔 Chicken",
            cow: "🐮 Cow",
            mummy: "⚰ Mummy",
            scrow: "🎃 Scarecrow",
         }
   
//let targetData = userDB.findOne({id:target.id}).lean().exec();

  
//DEFAULT
  const embed = new RichEmbed;embed.setColor("#d8459a");
  const parts = {head:"Hat",body:"Vest",legs:"Legs"}
    let ind = eventData.memento
  for (i in costumes) {
    let things = ""
  for (i2 in parts) {
    let item = (ind.find(x=> x.type == i2 && x.costume == i) || {})
    let itemName = (item.name||"`--none--`").split(" ")[0];
    things += parts[i2]+": "+(item.id?emoji(item.rarity):"")+" **"+itemName+"**\n"
  }
    embed.addField(costumes[i],things,true);
}

  embed.setAuthor(Author.tag+"'s Memento Collection", Author.displayAvatarURL());
  //embed.setDescription(wardrobeBrief);
  embed.setFooter("Pollux Halloween Event 2018", "https://pollux.amarok.kr/medals/pumpxd.png");
 

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