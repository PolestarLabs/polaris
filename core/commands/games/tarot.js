/*
const kickIn = [
  "I see that ",
  "Seems like ",
  "The cards say ",
  "Recently ",
  "Long ago ",
  "In the past ",
];
const connect = [
  "you've been ",
  "you were ",
  "you have been ",
  "you're ",
];
const intermezzo = [
  ", but ",
  ", and ",
  ", yet ",
  ", then ",
];
const connect2 = [
  "now seems to ",
  "now ",
  "decided to ",
  "got to ",
  "had to ",
  "will have to ",
  "must get to ",
  "you feel an urge to ",
  "you want so much to ",
  "you feel like you have to ",
];
const intermission = [
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
  ". Very soon you will be ",

];
const ligature = [
  "dealing with ",
  "finding ",
  "avoiding ",
  "facing ",
  "doing ",
  "pursuing ",
  "following ",
  "defying ",
  "getting ",
];
const intermezzo_2 = [
  ", and ",
  ", but ",
  ", although ",
  ", though ",
  ", however ",
];
const K = [
  "This will be ",
  "That will be ",
  "Things like this happen ",
];
const happen = [
  "very soon! ",
  "sooner than you expect! ",
  "every day.",
  "in some years. ",
  "never! ",
  "today. ",
  "very often. ",
];
const last = [
  ".\nSo please take care",
  ".\nAnd that's what the cards have to say",
  ".\nAnd this is your fortune.",
  ".\nSo, please enjoy your future.",
  ".\nThat is really awesome isn't it?",
  ".\nI wish i had a fortune like this to me.",
  ".\nYou could be better.",
  ".\nThings could be worse.",

];
const S = [
  kickIn,
  connect,
  " {{start}} ",
  intermezzo,
  connect2,
  " {{mid}} ",
  intermission,
  // ligature,
  " {{end}} ",
  // intermezzo_2,
  // K,
  // happen,
  last,
];
*/

const TAROT = require("../../archetypes/Tarot");

const init = async (msg, args) => {
  const amt = parseInt(args[0]) || 3;
  const skin = parseInt(args[0]) ? args[1] || "persona3" : args[0] || "persona3";

  const Tarot = new TAROT(msg, amt);

  // console.log(Tarot);

  const img = await Tarot.drawSpread(skin);

  console.log(img);

  return msg.channel.send("", { file: img.toBuffer(), name: "tarot.png" });

  /*
  try {
    let finalString = "";

    for (i = 0; i < S.length; i++) {
      if (typeof S[i] !== "string") {
        finalString += S[i][randomize(0, S[i].length - 1)];
      } else {
        finalString += S[i];
      }
    }

    const startup = `
  Spread:
  **${ARCANA[arcana[0]].Arcana}**:\`${position[0]}\`
  **${ARCANA[arcana[1]].Arcana}**:\`${position[1]}\`
  **${ARCANA[arcana[2]].Arcana}**:\`${position[2]}\`
  --
  `;
    pc = "";
    finalString = finalString
      .replace("{{start}}", pc + ARCANA[arcana[0]][`${position[0]}.START`] + pc)
      .replace("{{mid}}", pc + ARCANA[arcana[1]][`${position[1]}.MID`] + pc)
      .replace("{{end}}", pc + ARCANA[arcana[2]][`${position[2]}.END`] + pc)
      .replace(/ +/g, " ")
      .replace(/ ,/g, ",")
      .replace(/ \./g, ".");

    const embed = new RichEmbed();

    embed.attachFiles({
      attachment: await canvas.toBuffer(),
      name: "tarot.png",
    });
    embed.setImage("attachment://tarot.png");

    pc2 = "";
    embed.setDescription(pc2 + finalString + pc2);
    embed.setTitle("3 Card Spread Fortune");
    embed.setFooter("Current Deck: Persona 3", "https://lh3.googleusercontent.com/-9YpgeohI1lo/AAAAAAAAAAI/AAAAAAAACFA/u3wB6SrW4Vo/s640/photo.jpg");
    embed.color = 0x951d2f;

    message.channel.send({
      embed,
    }).catch((e) => message.channel.send(startup + finalString));

    /*
      message.channel.send(startup+finalString,{
                        files: [{
                            attachment: await canvas.toBuffer(),
                            name: "tarot.png"
                        }]
                    })
      * /
  } catch (e) {
    console.error(e);
  }
  */
};

module.exports = {
  pub: true,
  cmd: "tarot",
  perms: 3,
  init,
  cat: "games",
};
