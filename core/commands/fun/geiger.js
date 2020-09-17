const Picto = require("../../utilities/Picto.js");

const init = async function (message) {
  try {
    const canvas = Picto.new(300, 500);
    const ctx = canvas.getContext("2d");

    const P = {
      lngs: message.lang,
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
    if (message.channel.decontamination) {
      num = num - randmin > 0 ? num - randmin : 0;
      message.channel.decontamination = false;
    }
    if (message.channel.cancer > 0) {
      num = message.channel.cancer + Math.floor(1 + num - 200);
    }

    const geiger = await Picto.getCanvas(`${paths.BUILD}geiger.png`);
    const needle = Picto.new(116, 116);
    const ctx2 = needle.getContext("2d");
    const needle_p = await Picto.getCanvas(`${paths.BUILD}cen_needle.png`);
    await ctx.drawImage(geiger, 0, 0, 300, 500);

    ctx2.translate(58, 58);
    const pointer = num > 350 ? 120 : num / 3;
    const light = num > 350;
    const light_p = await Picto.getCanvas(`${paths.BUILD}geig_lite.png`);
    const warn = num > 10000;
    const warn_p = await Picto.getCanvas(`${paths.BUILD}geig_radio.png`);

    if (light) {
      await ctx.drawImage(light_p, 0, 0);
    }
    if (warn) {
      await ctx.drawImage(warn_p, 0, 0);
    }

    ctx2.rotate((Math.PI / 180) * (-60 + pointer));
    ctx2.translate(-58, -58);
    await ctx2.drawImage(needle_p, 0, 0, 116, 116);

    await ctx.drawImage(needle, 84, 77, 116, 116);

    if (randomize(1, 10) === 10) {
      message.channel.cancer -= 10000;
    }

    setTimeout(() => {
      message.channel.cancer = 0;
    }, 30000);

    const tagA = await Picto.tag(ctx, 888888, "34px 'digital-7'", "#59652d");
    const tagB = await Picto.tag(ctx, num, "34px 'digital-7'", "#111114");

    await ctx.drawImage(tagA.item, 90, 224);
    await ctx.drawImage(tagB.item, 90 - tagB.width + 90, 224);

    P.percentage = miliarize(Math.floor(Math.pow((num / 350) * 100, 2) / 100));
    P.radiation = miliarize(num);
    P.user = message.member.nick || message.author.username;

    message.channel.cancer = num + 50;

    await message.channel.send($t("forFun.cancer", P));
    await wait(2);
    await message.channel.send("", file(canvas.toBuffer(), "geiger.png"));
    await wait(1);

    await message.channel.send($t("forFun.geiger", P));
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
