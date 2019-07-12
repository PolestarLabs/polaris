const cmd = 'tarot';
const gear = require('../../gearbox.js')
const Canvas = require('canvas')
const paths = require('../../paths.json')


let array2 = require('../../../resources/lists/arkana.json')

let kickIn = [
"I see that ",
"Seems like ",
"The cards say ",
"Recently ",
"Long ago ",
"In the past "
]
let connect = [
"you've been ",
"you were ",
"you have been ",
"you're "
]
let intermezzo = [
", but ",
", and ",
", yet ",
", then "
]
let connect_2 = [
  "now seems to ", 
"now ",
"decided to ",
"got to ",
"had to ",
"will have to ",
"must get to ",
"you feel an urge to ",
"you want so much to ",
"you feel like you have to "
]
let intermission = [
", this means that you will be ",
" which will end up in ",
", that will lead to ",
", so the way is ",
". Take care with stuff like ",
". So, don't worry about ",
". Be careful while ",
", so please dont ever try ",
". I also see you  ",
". And this last card says that you will be ",
". In the future you will be ",
". Very soon you will be "

]
let ligature = [
"dealing with "
, "finding "
, "avoiding "
, "facing "
, "doing "
, "pursuing "
, "following "
, "defying "
, "getting "
]
let intermezzo_2 = [
", and ",
", but ",
", although ",
", though ",
", however "
]
let K = [
  "This will be ",
"That will be ",
"Things like this happen "
]
let happen = [
"very soon! "
, "sooner than you expect! "
, "every day."
, "in some years. "
, "never! "
, "today. "
, "very often. "
]
let last = [
".\nSo please take care"
, ".\nAnd that's what the cards have to say"
, ".\nAnd this is your fortune."
, ".\nSo, please enjoy your future."
, ".\nThat is really awesome isn't it?"
, ".\nI wish i had a fortune like this to me."
, ".\nYou could be better."
, ".\nThings could be worse."

]
let S = [
kickIn,
connect,
  " {{start}} ",
intermezzo,
connect_2,
  " {{mid}} ",
intermission,
//ligature,
  " {{end}} ",
//intermezzo_2,
//K,
//happen,
last
]

function pos() {
  let r = gear.randomize(0, 10);
  return r > 5 ? "UPRIGHT" : "REVERSED";
}

const init = async function (message) {

  try {


    const canvas = new Canvas.createCanvas(750, 350);
    const ctx = canvas.getContext('2d');

    let arcana = [
    gear.randomize(0, array2.length - 1)
    , gear.randomize(0, array2.length - 1)
    , gear.randomize(0, array2.length - 1)
         ];
    let position = [pos(), pos(), pos()];

    let ind = 0;
    let cards = []
    while (ind < 3) {
      let img = array2[arcana[ind]].id;
      let card = new Canvas.createCanvas(250, 350);
      const ctx2 = card.getContext('2d');
      let card_pic = await gear.getCanvas(paths.BUILD + 'tarot/persona3/' + img + '.png');

      let arcaname = await gear.tag(ctx, array2[arcana[ind]].Arcana, '900 24px WhitneyHTF-Black');
      let posname = await gear.tag(ctx, position[ind], '400 20px WhitneyHTF', '#A5A5A3');


      let wid = arcaname.width > 240 ? 240 : arcaname.width;
      await ctx2.drawImage(arcaname.item, 125 - (wid / 2), 310, wid, arcaname.height);

      wid = posname.width
      await ctx2.drawImage(posname.item, 125 - (wid / 2), 20);

      if (position[ind] == "REVERSED") {
        ctx2.translate(0, 350);
        ctx2.scale(1, -1);
      }
      await ctx2.drawImage(card_pic, 37, 50);

      cards.push(card);
      ind++
    };


    cards.forEach(async(card, i) => {
      await ctx.drawImage(card, i * 250, 0);
    })



    let finalString = ""

    for (i = 0; i < S.length; i++) {
      if (typeof S[i] !== 'string') {
        finalString += S[i][gear.randomize(0, S[i].length - 1)]

      } else {
        finalString += S[i]

      }
    }





    let startup = `
Spread:
**${array2[arcana[0]].Arcana}**:\`${position[0]}\`
**${array2[arcana[1]].Arcana}**:\`${position[1]}\`
**${array2[arcana[2]].Arcana}**:\`${position[2]}\`
--
`
    pc = ''
    finalString = finalString
      .replace('{{start}}', pc + array2[arcana[0]][position[0] + '.START'] + pc)
      .replace('{{mid}}', pc + array2[arcana[1]][position[1] + '.MID'] + pc)
      .replace('{{end}}', pc + array2[arcana[2]][position[2] + '.END'] + pc)
      .replace(/ +/g, ' ')
      .replace(/ ,/g, ',')
      .replace(/ \./g, '.')



    let embed = new gear.RichEmbed

    embed.attachFiles({
      attachment: await canvas.toBuffer(),
      name: "tarot.png"
    });
    embed.setImage("attachment://tarot.png");

    pc2 = ''
    embed.setDescription(pc2 + finalString + pc2)
    embed.setTitle("3 Card Spread Fortune")
    embed.setFooter("Current Deck: Persona 3", 'https://lh3.googleusercontent.com/-9YpgeohI1lo/AAAAAAAAAAI/AAAAAAAACFA/u3wB6SrW4Vo/s640/photo.jpg')
    embed.setColor("#951d2f")

    message.channel.send({
      embed
    }).catch(e=>message.channel.send(startup+finalString))

    /*
    message.channel.send(startup+finalString,{
                      files: [{
                          attachment: await canvas.toBuffer(),
                          name: "tarot.png"
                      }]
                  })
    */

  } catch (e) {
    console.error(e)
  }


} 


module.exports = {
  pub: true,
  cmd: cmd,
  perms: 3,
  init: init,
  cat: 'games'
};