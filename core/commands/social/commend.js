const gear = require('../../utilities/Gearbox');
const Timed = require("../../structures/TimedUsage");
const moment = require("moment");
const DB = require('../../database/db_ops');
//const locale = require('../../../utils/i18node');
//const $t = locale.getT();

const init = async function (msg){
    
    let P={lngs:msg.lang,prefix:msg.prefix}

    if(gear.autoHelper(['noargs',$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat,aliases:this.aliases}))return;
    
    let Target = gear.getTarget(msg, 0, false)||gear.getTarget(msg, 1, false);

    if(msg.args.includes("info")||msg.args.includes("status")||msg.args.includes("stats")){
        if(msg.args.length !== 1)  Target = gear.getTarget(msg, 0, false)||gear.getTarget(msg, 1, false);
        if(msg.args.length === 1)  Target = msg.author;
    } 

    if(!Target){
        return msg.reply($t('responses.commend.noPerson',P));
    }
  
    
    if(Target==null)Target=msg.author;
    const userData    = await DB.users.get(msg.author.id);
    const targetData  = (await DB.users.get(Target.id)) || (await DB.users.new(Target));
    const targetDataC = (await DB.commends.get(Target.id))||{id:Target.id,whoIn:[],whoOut:[]};
    
    if(msg.args.includes('info')){
        let metas = await DB.users.find({id:{$in:targetDataC.whoIn.map(u=>u.id)}},{id:1,meta:1});
        let commendT3 = targetDataC.whoIn.map(u=>{
            return { name: metas.find(x=>x.id==u.id).meta.tag, amt: u.count}
        }) ;
        let embed = new gear.Embed().
        color("#3b9ea5").thumbnail('https://pollux.fun/build/rank.png')
        .description(
        `__**Commend Info for ${Target.mention}**__
\u2003        Total Commends Received: **${targetData.modules.commend||0}**
\u2003        Total Commends Given: **${targetData.modules.commended||0}**
        `
        +(commendT3.length>0?`
__**Top Commenders**__
\u2003        ${commendT3[0]?`**${commendT3[0].name}** > ${commendT3[0].amt}`:""}  
\u2003        ${commendT3[1]?`**${commendT3[1].name}** > ${commendT3[1].amt}`:""}  
\u2003        ${commendT3[2]?`**${commendT3[2].name}** > ${commendT3[2].amt}`:""}  

        `:""))
        return msg.channel.send({embed})

    }
    
   const preafter = async function preafter(M, D) {
       if ((userData.modules.inventory.find(itm => itm.id == 'commendtoken') || {}).count >= 1) {
           if (Target.id === msg.author.id) {
               msg.channel.send(gear.emoji('nope') + $t('responses.commend.noSelf', P));
               return false;
           }
       } else {
           msg.reply($t('responses.commend.noItem', P));
           return false;
       }
   }

    const after = async function after(msg,Dly){ 

        await Promise.all([
            userData.removeItem('commendtoken'),
            userData.incrementAttr('commended',1),
            targetData.incrementAttr('commend',1),
            targetData.upCommend(msg.author),
            
        ]);

        P.target    = Target.nick || (Target.user||Target).username;
        P.author    = msg.member.nick || msg.author.username;
        P.cmcount   = (targetData.modules.commend +1 )|| 0
        P.pplcount  = targetDataC.whoIn.length

        let embed = new gear.Embed()
            .thumbnail('https://pollux.fun/build/rank.png')
            .color('#3b9ea5')
            .timestamp(new Date)
            .description(`
            ${$t('responses.commend.give',P)}
            ${$t('responses.commend.totals',P)}
            `);
console.log(embed)
        msg.channel.send({embed});
 

}


    let reject = function(msg,Daily,r){          
        P.remaining=  moment.utc(r).fromNow(true)
        let dailyNope = $t('responses.commend.cooldown',P);
        let embed=new gear.Embed;
        embed.setColor('#e35555');
        embed.description(gear.emoji('nope') + dailyNope);
        return msg.channel.send({embed:embed});
    }


    let info = async function(msg,Daily){
        let userDaily = await Daily.userData(msg.author);
        let dailyAvailable = await Daily.dailyAvailable(msg.author);
        P.remaining = moment.utc(userDaily.last).add(Daily.day,'milisseconds').fromNow(true);
        let embe2=new gear.Embed;
        embe2.setColor('#3b9ea5')
        embe2.description(`
    ${gear.emoji('future') } ${dailyAvailable?gear.emoji('online')+$t('responses.commend.check_yes',P):gear.emoji('dnd')+$t('responses.commend.check_no',P)} 
       
    :reminder_ribbon: × **${userData.modules.inventory.find(i=>i.id==="commendtoken").count||0}**
         `)
            return msg.channel.send({embed:embe2});
    }

    Timed.init(msg,"commend",{day:3.6e+6},after,reject,info,preafter);



}

module.exports={
    init
    ,pub:true
    ,cmd:'commend'
    ,perms:3
    ,cat:'social'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['com','rec']
}