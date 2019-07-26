// const gear = require('../../utilities/Gearbox');
// const DB = require('../../database/db_ops');
const Picto = require('../../utilities/Picto');
//const locale = require('../../../utils/i18node');
//const $t = locale.getT();

const init = async function (msg) {

  let P = { lngs: msg.lang, prefix: msg.prefix }
  if (PLX.autoHelper([$t('helpkey', P)], { cmd: this.cmd, msg, opt: this.cat })) return;

  try {
    const canvas = Picto.new(700, 520);
    const ctx = canvas.getContext('2d');

    const headbl = Picto.new(470, 90);
    const ctx2 = headbl.getContext('2d');

    const P = {
      lngs: msg.lang
    }

    let pre = msg.content.split(/ +/).slice(1).join(' ')
    let regex = /^(.*[A-z,0-9])/

    let pre2 = pre.match(regex) ? pre.match(regex)[0] : ""
    let spot = pre2.indexOf('http')
    let headline_tx = "" + (spot < 0 ? pre2 : pre2.slice(0, spot));
    let img_link
    try {
      img_link = spot > -1 ? pre2.slice(spot) : (msg.mentions[0] || {}).displayAvatarURL || await PLX.getChannelImg(msg);
    } catch (e) {
      img_link = spot > -1 ? pre2.slice(spot) : ((msg.mentions[0] || msg.author).displayAvatarURL);
    }

    let lnOptions = {
      font: `900 48px Times New Roman`,
      sizeToFill: true,
      paddingY: 2,
      verticalAlign: 'top',
      textAlign: "left",
    }
    if (!headline_tx || headline_tx.length == 0 && randomize(0, 3) > 1) {
      if (!global.fakeFeed) {
        setTimeout(()=>global.fakeFeed = null, 30000); 
        let RSS = require('rss-parser');
        let parser = new RSS();
        await (async () => {
          try {
            let sources = [
              'https://www.animenewsnetwork.com/newsroom/atom.xml?ann-edition=w',
              'https://www.nasa.gov/rss/dyn/breaking_news.rss',
              'http://feeds.bbci.co.uk/news/world/asia/rss.xml',
            ]
            let ogs = require('open-graph-scraper');
            rand = randomize(0, sources.length - 1);
            let feed = await parser.parseURL(sources[rand]);
            rand2 = randomize(0, 5)
            headline_tx = feed.items[rand2].title;
            let results = await ogs({ 'url': feed.items[rand2].link });
            img_link = results.data.ogImage.url;

            global.fakeFeed = { link: img_link, title: headline_tx };

          } catch (e) {
            
          }
        })();
      }else{
        img_link  = global.fakeFeed.link
        headline_tx = global.fakeFeed.title        
      }
    }
      
      const [newspap, headline, pic] = await Promise.all([
    Picto.getCanvas(paths.BUILD + 'localman.png'),
    Picto.block(ctx, headline_tx||"Lorem Ipsum", 0, "#242020", 470, 90, lnOptions),
    Picto.getCanvas(img_link)
  ]);


    ctx.drawImage(newspap, 00, 0);
    ctx.globalCompositeOperation = 'multiply'
    ctx.globalAlpha = 0.7
    ctx2.drawImage(headline.item, 0, 0, headline.width, 80)//w,70);
    ctx.save()

    ctx.setTransform(1, 0, -Math.tan(0.19321214), 1, 0, 0);
    //                                            % A X Y H W

    ctx.rotate(0.296706)
    ctx.drawImage(headbl, 170, 80)
    ctx.rotate(-0.296706)
    ctx.restore()
    ctx.save()

    let new_height = pic.height / (pic.width / 357)

    ctx.setTransform(1, 0, -Math.tan(0.1321214), 1, 0, 0);
    ctx.rotate(0.296706)
    ctx.drawImage(pic, 290, 170, 357, new_height);
    ctx.rotate(-0.296706)
    ctx.restore()


    msg.delete()
    await msg.channel.send('', file(await canvas.toBuffer(), 'localnews.png'))

  } catch (e) {
    console.error(e)
  }

}
module.exports = {
  init
  , pub: true
  , cmd: 'localnews'
  , perms: 3
  , cat: 'fun'
  , botPerms: ['attachFiles', 'embedLinks']
  , aliases: ['lnws']
}