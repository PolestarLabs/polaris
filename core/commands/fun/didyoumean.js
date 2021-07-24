// const gear = require('../../utilities/Gearbox');
const Picto = require("../../utilities/Picto");
// const locale = require('../../../utils/i18node');
// const $t = locale.getT();

const init = async (msg) => {
  const P = { lngs: msg.lang, prefix: msg.prefix };

  Target = msg.mentions[0] || {};
  let onepart = true;
  let textop;
  let textbot = msg.args.join(" ").replace(/<@[0-9]*>/g, "");

  if (Target.id !== msg.author.id) {
    const chMessages = await msg.channel.getMessages(10, msg.id);
    textop = chMessages.find((m) => m.author.id === Target.id)?.cleanContent || false;
    if (textop) {
      onepart = false;
    }

    textbot = msg.args.join(" ").replace(/<@[0-9]*>/g, "");
  }

  if (msg.referencedMessage){
    textop = msg.referencedMessage.cleanContent;
    onepart = false;
  }else if (msg.args.includes("^")) {
    const messageGrab = await PLX.getPreviousMessage(msg);
    if (messageGrab) textop = messageGrab.cleanContent;
    textbot = msg.args.filter((a) => a !== "^").join(" ");
    onepart = false;
  }

  const messagebyID = [msg.args[0]].filter((arg) => arg && !Number.isNaN(arg) && arg.length > 10);
  if (messagebyID.length > 0) {
    const newmes = await PLX.getPreviousMessage(msg, messagebyID[0]);
    if (newmes) textop = newmes.cleanContent;
    textbot = msg.args.slice(1).join(" ").replace(/[0-9]{10,}/g, "");
    onepart = false;
  }

  if (msg.quoteArgs) {
    textop = msg.quoteArgs;
    textbot = msg.args.join(" ").replace(`"${textop}"`, "");
    onepart = false;
  }

  if (textop && textop.length > 50) {
    textop = `${textop.slice(0, 50)}...`;
  }

  const canvas = Picto.new(500, onepart ? 150 : 250);
  const partwoOrigin = onepart ? 0 : 100;
  const ctx = canvas.getContext("2d");

  const part1 = Picto.getCanvas(`${paths.CDN}/build/dym/part1.png`);
  const part2 = Picto.getCanvas(`${paths.CDN}/build/dym/part2.png`);

  ctx.drawImage(await part2, 0, partwoOrigin);
  Picto.setAndDraw(ctx, Picto.tag(ctx, "Did you mean:", "300 16px Arial", "#CC0000"), 150, 100 + partwoOrigin, 150, "right");
  Picto.setAndDraw(ctx, Picto.tag(ctx, textbot, "600 italic 16px Arial", "#1223BB"), 155, 100 + partwoOrigin, 320, "left");

  if (!onepart) {
    ctx.drawImage(await part1, 0, 0);
    Picto.setAndDraw(ctx, Picto.tag(ctx, textop, undefined, "#000"), 142, 52, 240);
  }
  await msg.channel.send("", file(await canvas.toBuffer(), "didyoumean.png"));
};
module.exports = {
  init,
  pub: true,
  cmd: "didyoumean",
  argsRequired: true,
  perms: 3,
  cat: "fun",
  botPerms: ["attachFiles"],
  aliases: ["dym"],
};
