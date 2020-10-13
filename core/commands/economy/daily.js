const Timed = require(`../../structures/TimedUsage`);
const Premium = require(`${appRoot}/core/utilities/Premium`);

const Picto = require("../../utilities/Picto.js");
const ECO = require("../../archetypes/Economy");

const _ASSETS = paths.CDN + "/build/daily/"

const constantAssets = Promise.all([
  Picto.getCanvas(_ASSETS + "boost.png"),
  Picto.getCanvas(_ASSETS + "exptag.png"),
  Picto.getCanvas(_ASSETS + "dono-tag.png"),
  Picto.getCanvas(_ASSETS + "super.png"),
  Picto.getCanvas(_ASSETS + "prev100.png"),
  Picto.getCanvas(_ASSETS + "prev30.png"),
  Picto.getCanvas(_ASSETS + "prev10.png"),
  Picto.getCanvas(_ASSETS + "soft100.png"),
  Picto.getCanvas(_ASSETS + "soft30.png"),
  Picto.getCanvas(_ASSETS + "soft10.png"),
  Picto.getCanvas(_ASSETS + "soft9.png"),
  Picto.getCanvas(_ASSETS + "soft8.png"),
  Picto.getCanvas(_ASSETS + "soft7.png"),
  Picto.getCanvas(_ASSETS + "soft6.png"),
  Picto.getCanvas(_ASSETS + "soft5.png"),
  Picto.getCanvas(_ASSETS + "soft4.png"),
  Picto.getCanvas(_ASSETS + "soft3.png"),
  Picto.getCanvas(_ASSETS + "soft2.png"),
  Picto.getCanvas(_ASSETS + "soft1.png"),
]);




const init = async (msg,args) => {
  const [boost,expTag,donoTag,super10,prev100,prev30,prev10,soft100,soft30,soft10,soft9,soft8,soft7,soft6,soft5,soft4,soft3,soft2,soft1] = await constantAssets; 

  const moment = require("moment");
  moment.locale(msg.lang[0] || "en");

  const Author = msg.author;
  const now = Date.now();
  const P = { lngs: msg.lang };
  const v = {
    last: $t("interface.daily.lastdly", P),
    next: $t("interface.daily.next", P),
    streakcurr: $t("interface.daily.streakcurr", P),
    expirestr: $t("interface.daily.expirestr", P),
  };

  if (msg.args[0] === "info") {
    msg.args[0] = "status";
    msg.channel.send("*`INFO` is deprecated, please use `STATUS` to check remaining time*");
  }
  //const after = async (msg, Dly) => {
    //ddy = await Dly.userData(msg.author);

    const emblem = await Premium.getTier(Author);
    //const myDaily = await Premium.getDaily(Author) || 125;

    //const embed = new Embed();
    //embed.setColor("#d83668");
    if (emblem) {
      //embed.author(`${emblem.toUpperCase()}-boosted Daily!`, `http://pollux.fun/images/donate/${emblem}-small.png`);
    }

    const userData = await DB.users.getFull(msg.author.id);
    const dailyPLXMember = await PLX.getRESTGuildMember("277391723322408960",msg.author.id);



    let dailyCard = Picto.new(800,600);
    let ctx = dailyCard.getContext('2d');


    let streak = Number(args[0]||1) //userData.counters?.daily?.streak || 1;
    console.log({streak})

    let myDaily = {
      RBN: 0,
      SPH: 0,
      JDE: 0,
      cosmoFragment: 0,
      evToken: 0,
      comToken: 0,
      lootbox: 0,
      stickers: 0,
      boost: 0,
      boosterpack: 0,

    };

    let softStreak = streak % 10 || 10;
    const is = (x)=> !(streak%x);
    let isRoadTo30 = (streak%30) > 20;
    let isRoadTo100 = (streak%100) > 90;

    
    //msg.channel.send(JSON.stringify({softStreak,is30,is100,isRoadTo30,isRoadTo100},0,2));
    
    
    ctx.drawImage(eval("soft"+softStreak),0,0);
    if(isRoadTo30 && !is(30)) ctx.drawImage(prev30,0,0);
    if(isRoadTo100 && !is(100)) ctx.drawImage(prev100,0,0);
    
    if(softStreak==1) myDaily.RBN += 150;
    if(softStreak==2) myDaily.RBN += 150;
    if(softStreak==3) myDaily.JDE += 1000;
    if(softStreak==4) myDaily.cosmoFragment += 25;
    if(softStreak==5) myDaily.JDE += 1500;
    if(softStreak==6) myDaily.lootbox += 1;
    if(softStreak==7) myDaily.RBN += 350;
    if(softStreak==8) myDaily.cosmoFragment += 25;
    if(softStreak==9) myDaily.comToken += 5;
    
    if(is(10)){
      myDaily.RBN += 500;
      myDaily.JDE += 2500;
      myDaily.lootbox += 1;
      myDaily.cosmoFragment += 35;
      myDaily.boosterpack += 1;
    }

    if(is(30)){
      ctx.clearRect(0, 0, 800, 600);
      ctx.drawImage(soft30,0,0);
    }
    if(is(100)){
      ctx.clearRect(0, 0, 800, 600);
      ctx.drawImage(soft100,0,0);
    }    

    if(dailyPLXMember?.premiumSince){
      myDaily.boost = miliarize(~~(( Date.now() - new Date(msg.member.premiumSince).getTime() ) / (24 * 60 * 60e3) / 10));
      ctx.drawImage(boost,0-50,0);
    }
    
    ctx.drawImage(expTag,0,0);

    

    
    let text_STREAK= Picto.tag(ctx,"STREAK ","italic 900 14px 'Panton Black'","#FFF") //,{line: 8, style: "#223"} )
    let text_EXP= Picto.tag(ctx,"EXP", "italic 900 18px 'Panton Black'","#FFF",{line: 8, style: "#223"} )
    let number_STREAK= Picto.tag(ctx,streak,"italic 900 32px 'Panton Black'","#FFF") //,{line: 8, style: "#223"} )
    let number_STREAK_PRIZE= Picto.tag(ctx,Math.max(~~(streak/2),10),"italic 900 28px 'Panton Black'","#FFF",{line: 8, style: "#223"} )
    let number_BOOST_PRIZE= Picto.tag(ctx, "+"+myDaily.boost,"italic 900 35px 'Panton Black'","#FFF",{line: 8, style: "#223"} )
    

    ctx.rotate(-.03490658503988659)

    ctx.drawImage(number_STREAK.item,258-number_STREAK.width/2,526);
    ctx.drawImage(text_STREAK.item,221,557);
    ctx.drawImage(number_STREAK_PRIZE.item,155-number_STREAK_PRIZE.width,532);
    ctx.drawImage(text_EXP.item,200-text_EXP.width,537);
    
    ctx.rotate(.03490658503988659)
    
    if(myDaily.boost) ctx.drawImage(number_BOOST_PRIZE.item,660-50,540);
    








    let lootAction = (x)=>null;
    let boosterAction = (x)=>null;
    let itemAction = (x)=>null;
    let tokenAction = (x)=>null;

    let items = []
    for(itm of Object.keys(myDaily) ){

      P.count = myDaily[itm];

      if(itm === 'lootbox'){
        lootAction = (x)=> userData.addItem(x);
      }
      if(itm === 'boosterpack'){
        boosterAction = (x)=> userData.addItem(x);
      }
      if(itm === 'item'){
        itemAction = (x)=> userData.addItem(x);
      }
      
      if(itm === 'comToken'){
        tokenAction = (x)=> userData.addItem('commendtoken',x);
      }
      
      if(P.count) items.push( `${_emoji(itm)} **${P.count}** ${$t("keywords."+itm,P)}` );
    }

    PLX.sendJSON(msg.channel.id,myDaily)
    
    return msg.channel.send({embed:{
      description:`
${items.join('\n')}
      `,
      color:0x03dffc,
      image: {url:"attachment://daily.png"}
    }},{ file: dailyCard.toBuffer('image/png'), name: "daily.png" });


  //}
 
  const info = async (msg, Daily) => {
    const userDaily = await Daily.userData(msg.author);
    const dailyAvailable = await Daily.dailyAvailable(msg.author);
    const streakGoes = await Daily.keepStreak(msg.author);
    const { streak } = userDaily;

    const embe2 = new Embed();
    embe2.setColor("#e35555");
    embe2.description(`${_emoji("time")} ${_emoji("offline")} **${v.last}** ${moment.utc(userDaily.last).fromNow()}`
      + `${_emoji("future")} ${dailyAvailable
        ? _emoji("online") : _emoji("dnd")} **${v.next}** ${moment.utc(userDaily.last).add(20, "hours").fromNow()}`
      + `${_emoji("expired")} ${streakGoes ? _emoji("online") : _emoji("dnd")} **${v.expirestr}**`
      + `${streakGoes ? `${moment.utc(userDaily.last + Daily.expiration).fromNow()} !` : "I have bad news for you..."}
    ${_emoji("expense")} ${_emoji("offline")} **${v.streakcurr}** \`${streak}x\`(Hard) | \`${streak % 10}x\`(Soft)`);
    return msg.channel.send({ embed: embe2 });
  };

 // Timed.init(msg, "daily", { streak: true, expiration: 1.296e+8 * 1.8 }, after, reject, info);
};

module.exports = {
  init,
  pub: true,
  cmd: "daily",
  perms: 3,
  cat: "economy",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ["dly"],
};
