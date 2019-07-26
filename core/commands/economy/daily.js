// const gear = require(appRoot+"/core/utilities/Gearbox");
//const locale = require(appRoot+'/utils/i18node');
//const $t = locale.getT();
const ECO = require(appRoot+"/core/archetypes/Economy");
const DB = require(appRoot+"/core/database/db_ops");
const Picto = require(appRoot+"/core/utilities/Picto");
const Timed = require(appRoot+"/core/structures/TimedUsage");
const Premium = require(appRoot+"/core/utilities/Premium");

const init = function(message){
  
let moment = require("moment");
    moment.locale(message.lang[0]||'en');

let Author = message.author
let now = Date.now()
const P={lngs:message.lang}
const v={
    last: $t('daily.lastdly',P),
    next: $t('daily.next',P),
    streakcurr: $t('daily.streakcurr',P),
    expirestr: $t('daily.expirestr',P),
}  

if(message.args[0]=="info"){
  message.args[0] = "status";
  message.channel.send("*`INFO` is deprecated, please use `STATUS` to check remaining time*")
}
    let after = async function(msg,Dly){
        ddy = await Dly.userData(msg.author);


      let emblem = await Premium.getTier(Author);
      let myDaily = await Premium.getDaily(Author) || 125;

      const embed = new gear.Embed;
      embed.setColor("#d83668");
      if (emblem) {
        embed.author(emblem.toUpperCase()+"-boosted Daily!","http://pollux.fun/images/donate/" + emblem + "-small.png")
      }

      const Canvas = require("canvas");
      const canvas = new Canvas.createCanvas(250, 250);
      const ctx = canvas.getContext('2d');

      //backwards compat
      DB.users.set(Author.id, {$set:{'modules.daily':now}});

      DB.users.findOne({id:Author.id}).then(async userData=>{
        Author.dailing = false;
        //minibuster.up(message,hardStreak+softStreak*10)
        

        let streak = (userData.counters||{daily:{streak:0}}).daily.streak;
        let hardStreak = streak


        await Promise.all([
          userData.addXP(streak),
          ECO.receive(Author.id,myDaily,"daily","RBN")
        ]);

        let dailyGet = $t('$.dailyGet',P).replace("100", "**" + myDaily + "**")
        embed.setDescription("\n" + _emoji('rubine') + dailyGet);

        let gemstone = ""

        if ((hardStreak%10) == 0) {          

          let dailyStreak = $t('$.dailyStreak', P).replace("500", "**500**")
          embed.description += "\n" + (_emoji('ticket') + dailyStreak)

            await ECO.receive(Author.id,500,"daily_10streak","RBN");

        }

        if ((hardStreak%3) == 0) {

          if((hardStreak%10)!=0) gemstone="j";
         
          let dailyStreak = $t('interface.daily.dailyStreakJades', P)
          embed.description += "\n" + (_emoji('jade') + dailyStreak)

          await ECO.receive(Author.id,1000,"daily_3streak","JDE","+");
        }

        if ((hardStreak%200) == 0) {

          gemstone="S"
          
          let dailyStreak = $t('interface.daily.dailyStreakSapphs', P)
          embed.description += "\n" + (_emoji('sapphire') + dailyStreak)

          await ECO.receive(Author.id,1,"daily_250streak","SPH");
        }
        
        if ((hardStreak%365) == 0) {
          gemstone="S"
         
          let dailyStreak = $t('interface.daily.dailyStreakSapphs', P)
          embed.description += "\n" + (_emoji('sapphire') + dailyStreak)

          await ECO.receive(Author.id,1,"daily_365streak","SPH","+");
        }

        embed.description += "\n\n" + "*Streak: **"+hardStreak+"***."


        embed.thumbnail( paths.CDN + "/build/daily/"+ ( gemstone=="S" ? "ringsaph" : gemstone + (hardStreak%10) ) + ".gif" );

        userachinv=userData.modules.achievements;
        if(hardStreak>=10 && !userachinv.includes('10daily')){
          
          await DB.users.set(Author.id,{$addToSet:{'modules.achievements':"10daily",'modules.medalInventory':'10daily'}});
          message.reply("**New Achievement!** Clockwork Collector | Collected 10 Dailies")
        }
          if(hardStreak>=30 && !userachinv.includes('30daily')){
          
            await DB.users.set(Author.id,{$addToSet:{'modules.achievements':"30daily",'modules.medalInventory':'30daily'}});
            message.reply("**New Achievement!** Collector of the Month | Collected 30 Dailies")
        }
          if(hardStreak>=100 && !userachinv.includes('100daily')){
          
            await DB.users.set(Author.id,{$addToSet:{'modules.achievements':"100daily",'modules.medalInventory':'100daily'}});
            message.reply("**New Achievement!** Compulsive Collector | Collected 100 Dailies")
        }
          if(hardStreak>=200 && !userachinv.includes('200daily')){
          
            await DB.users.set(Author.id,{$addToSet:{'modules.achievements':"200daily",'modules.medalInventory':'200daily'}});
            message.reply("**New Achievement!** Blood for a silver Sapphire | Collected 200 Dailies")
        }
        
        
        if (userData.spdaily && userData.spdaily.amt){
          embed.addField(Author.dDATA.spdaily.title,"+"+Author.dDATA.spdaily.amt+_emoji('rubine'));
          await ECO.receive(message.author.id,Author.dDATA.spdaily.amt,"special_daily_boost","RBN","+");
        }

        embed.footer(Author.tag,Author.displayAvatarURL);
        message.channel.send({embed}).catch(e=>null);

    });
}

    let reject = function(message,Daily,r){
          
        P.remaining=  moment.utc(r).fromNow(true)
        let dailyNope = $t('$.dailyNope',P);
        message.reply(_emoji('nope') + dailyNope);
        let embed=new gear.Embed;
        embed.setColor('#e35555');
        embed.description(`
    ${_emoji('time')   } **${v.last}** ${ moment.utc(Daily.userDataStatic).fromNow()}
    ${_emoji('expired')} **${v.expirestr}** ${moment.utc(Daily.userDataStatic+Daily.expiration).fromNow() }
        `);
        return message.channel.send({embed:embed});
    }
    let info = async function(msg,Daily){
        let userDaily = await Daily.userData(msg.author);
        let dailyAvailable = await Daily.dailyAvailable(msg.author);
        let streakGoes = await Daily.keepStreak(msg.author);
        let streak = userDaily.streak;

        let embe2=new gear.Embed;
        embe2.setColor('#e35555')
        embe2.description(`
    ${_emoji('time')   } ${_emoji('offline')} **${v.last}** ${ moment.utc(userDaily.last).fromNow()}
    ${_emoji('future') } ${dailyAvailable?_emoji('online'):_emoji('dnd')} **${v.next}** ${ moment.utc(userDaily.last).add(20,'hours').fromNow() }
    ${_emoji('expired')} ${streakGoes?_emoji('online'):_emoji('dnd')} **${v.expirestr}** ${streakGoes ? moment.utc(userDaily.last+Daily.expiration).fromNow() +" !": "I have bad news for you..." }
    ${_emoji('expense')} ${_emoji('offline')} **${v.streakcurr}** \`${streak }x\`(Hard) | \`${streak%10 }x\`(Soft)
      `)
            return message.channel.send({embed:embe2});
    }

    Timed.init(message,"daily",{streak:true,expiration:1.296e+8*1.8},after,reject,info);
    
}

module.exports={
  init
  ,pub:true
  ,cmd:'daily'
  ,perms:3
  ,cat:'economy'
  ,botPerms:['attachFiles','embedLinks']
  ,aliases:['dly']
}