// const gear = require('../../utilities/Gearbox');
// const DB = require('../../database/db_ops');
const Picto = require("../../utilities/Picto");
// const locale = require('../../../utils/i18node');
// const $t = locale.getT();

const init = async (msg) => {
  const P = { lngs: msg.lang, prefix: msg.prefix };

  try {
    const canvas = Picto.new(700, 520);
    const ctx = canvas.getContext("2d");

    const headbl = Picto.new(470, 90);
    const ctx2 = headbl.getContext("2d");

    let imgLink      = (msg.args.join(" ").match(/(http[^ |^>]+)/gm) || [""])[0];
    // const MENTION   = (msg.args.join(" ").match(/(<@[0-9]+>)/gm) || [""])[0];
    let HEADLINE  = msg.args.join(" ").replace(/(<@[0-9]+>)|(http[^ |^>]+)/gm, "");

    try {
      // imgLink ??= msg.mentions[0]?.displayAvatarURL || await PLX.getChannelImg(msg);
      if (!imgLink) imgLink = msg.mentions[0]?.displayAvatarURL || await PLX.getChannelImg(msg);
    } catch (e) {
      // imgLink ??= (msg.mentions[0] || msg.author).displayAvatarURL;
      if (!imgLink) imgLink = (msg.mentions[0] || msg.author).displayAvatarURL;
    }

    const lnOptions = {
      font: "900 48px Times New Roman",
      sizeToFill: true,
      paddingY: 2,
      verticalAlign: "top",
      textAlign: "left",
    };
    if (HEADLINE?.length === 0 && randomize(0, 3) > 1) {
      if (!global.fakeFeed) {
        setTimeout(() => (global.fakeFeed = null), 30000);
        const RSS = require("rss-parser");
        const parser = new RSS();
        await (async () => {
          try {
            const sources = [
              "https://www.animenewsnetwork.com/newsroom/atom.xml?ann-edition=w",
              "https://www.nasa.gov/rss/dyn/breaking_news.rss",
              "http://feeds.bbci.co.uk/news/world/asia/rss.xml",
            ];
            const ogs = require("open-graph-scraper");
            rand = randomize(0, sources.length - 1);
            const feed = await parser.parseURL(sources[rand]);
            rand2 = randomize(0, 5);
            HEADLINE = feed.items[rand2].title;
            const results = await ogs({ url: feed.items[rand2].link });
            imgLink = results.data.ogImage.url;

            global.fakeFeed = { link: imgLink, title: HEADLINE };
          } catch (e) {

          }
        })();
      } else {
        imgLink = global.fakeFeed.link;
        HEADLINE = global.fakeFeed.title;
      }
    }

    const [newspap, headline, pic] = await Promise.all([
      Picto.getCanvas(`${paths.BUILD}localman.png`),
      Picto.block(ctx, HEADLINE || "Lorem Ipsum", 0, "#242020", 470, 90, lnOptions),
      Picto.getCanvas(imgLink),
    ]);

    ctx.drawImage(newspap, 0, 0);
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = 0.7;
    ctx2.drawImage(headline.item, 0, 0, headline.width, 80);// w,70);
    ctx.save();

    ctx.setTransform(1, 0, -Math.tan(0.19321214), 1, 0, 0);
    //                                            % A X Y H W

    ctx.rotate(0.296706);
    ctx.drawImage(headbl, 170, 80);
    ctx.rotate(-0.296706);
    ctx.restore();
    ctx.save();

    const newHeight = pic.height / (pic.width / 357);

    ctx.setTransform(1, 0, -Math.tan(0.1321214), 1, 0, 0);
    ctx.rotate(0.296706);
    ctx.drawImage(pic, 290, 170, 357, newHeight);
    ctx.rotate(-0.296706);
    ctx.restore();

    msg.delete().catch(() => null);

    await msg.channel.send("", file(await canvas.toBuffer(), "localnews.png"));
  } catch (e) {
    console.error(e);
  }
};
module.exports = {
  init,
  pub: true,
  argsRequired: true,
  cmd: "localnews",
  perms: 3,
  cat: "fun",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ["lnws"],
};
