const Picto = require("../../utilities/Picto.js");

const init = async (msg) => {
  try {
    const canvas = Picto.new(300, 500);
    const ctx = canvas.getContext("2d");

    const P = {
      lngs: msg.lang,
    };

    const rand = randomize(0, 1000);
    let num;

    switch (true) {
      case rand === 1000:
        num = "CANCER";
        break;
      case rand > 950:
        num = randomize(0, 999999);
        break;
      case rand > 900:
        num = randomize(0, 100000);
        break;
      case rand > 850:
        num = randomize(0, 10000);
        break;
      default:
        num = randomize(0, 350);
    }
    // num=42 ;
    const randmin = randomize(200, 800);
    if (msg.channel.decontamination) {
      num = num - randmin > 0 ? num - randmin : 0;
      msg.channel.decontamination = false;
    }
    if (msg.channel.cancer > 0) {
      num = msg.channel.cancer + Math.floor(1 + num - 200);
    }

    const geiger = await Picto.getCanvas(`${paths.BUILD}geiger.png`);
    const needle = Picto.new(116, 116);
    const ctx2 = needle.getContext("2d");
    const needleP = await Picto.getCanvas(`${paths.BUILD}cen_needle.png`);
    ctx.drawImage(geiger, 0, 0, 300, 500);

    ctx2.translate(58, 58);
    const pointer = num > 350 ? 120 : num / 3;
    const light = num > 350;
    const lightP = await Picto.getCanvas(`${paths.BUILD}geig_lite.png`);
    const warn = num > 10000;
    const warnP = await Picto.getCanvas(`${paths.BUILD}geig_radio.png`);

    if (light) ctx.drawImage(lightP, 0, 0);
    if (warn) ctx.drawImage(warnP, 0, 0);

    ctx2.rotate((Math.PI / 180) * (-60 + pointer));
    ctx2.translate(-58, -58);
    ctx2.drawImage(needleP, 0, 0, 116, 116);

    ctx.drawImage(needle, 84, 77, 116, 116);

    if (randomize(1, 10) === 10) msg.channel.cancer -= 10000;

    setTimeout(() => (msg.channel.cancer = 0), 30000);

    const tagA = Picto.tag(ctx, 888888, "34px 'digital-7'", "#59652d");
    const tagB = Picto.tag(ctx, num, "34px 'digital-7'", "#111114");

    ctx.drawImage(tagA.item, 90, 224);
    ctx.drawImage(tagB.item, 90 - tagB.width + 90, 224);

    P.percentage = miliarize(Math.floor((((num / 350) * 100) ** 2) / 100));
    P.radiation = miliarize(num);
    P.user = msg.member.nick || msg.author.username;

    msg.channel.cancer = num + 50;

    await msg.channel.send($t("forFun.cancer", P));
    await wait(2);
    await msg.channel.send("", file(canvas.toBuffer(), "geiger.png"));
    await wait(1);

    await msg.channel.send($t("forFun.geiger", P));
  } catch (e) {
    console.error(e);
  }
};

module.exports = {
  pub: true,
  cmd: "geiger",
  perms: 3,
  init,
  cat: "fun",
};
