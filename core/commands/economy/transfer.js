const gear = require('../../utilities/Gearbox');
const DB = require('../../database/db_ops');
const ECO = require('../../archetypes/Economy');
const Timed = require("../../structures/TimedUsage");
const moment = require("moment");

const init = async function (msg){

    let P={lngs:msg.lang,prefix:msg.prefix}
    if(gear.autoHelper(['noargs',$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;
    
    if (msg.args.length < 2 ) return gear.autoHelper('force', {
        cmd, msg, opt: this.cat
    });


    const AMOUNT = Math.abs(parseInt(msg.args[0])) || 0;
    let TARGET = gear.getTarget(msg,1,false);
    if (TARGET instanceof Promise) TARGET = await TARGET;

    const [USERDATA,TARGETDATA] = await Promise.all([
        DB.users.get(msg.author.id),
        DB.users.get(TARGET.id)
    ]);

    
    if(USERDATA.modules.rubines < TARGETDATA.modules.rubines){
  //      return msg.reply("you cannot send Rubines to an account with a higher balance.");
    }
    if(AMOUNT > 2500){
        return msg.reply("you cannot send more than 2500 Rubines at a time.");
    }   
    if(AMOUNT === USERDATA.modules.rubines){
        return msg.reply("you cannot send all of your Rubines at once.");
    }

  // ======================================================================
    const v={
        last: $t('daily.lastdly',P),
        next: $t('daily.next',P),
    }    
    let reject = function(msg,Daily,r){
        P.remaining=  moment.utc(r).fromNow(true)
        let dailyNope = $t('responses.give.cooldown',P);
        let embed=new gear.Embed();
        embed.setColor('#e35555');
        embed.description = _emoji('nope') + dailyNope +P.remaining+" "+r;
        return msg.channel.send({embed:embed});
    }
    let info = async function(msg,Daily){
        let {last} = await Daily.userData(msg.author);
        let dailyAvailable = await Daily.dailyAvailable(msg.author);

        let embe2=new gear.Embed();
        embe2.setColor('#e35555')
        embe2.description=`
    ${_emoji('time')   } ${_emoji('offline')} **${v.last}** ${ moment.utc(last).fromNow()}
    ${_emoji('future') } ${dailyAvailable?_emoji('online'):_emoji('dnd')} **${v.next}** ${ moment.utc(last).add(8,'hours').fromNow() }
      `
            return msg.channel.send({embed:embe2});
    }

    let precheck =  async function(msg,Dly){
        if(await ECO.checkFunds(msg.author.id,AMOUNT)){            
            return true
        }else{
            P.number = USERDATA.modules.rubines
            msg.channel.send($t('responses.generic.noFundsBalance',P))
            return false
        }
    }
    let after = function(msg,Dly){

        ECO.transfer(msg.author.id,TARGET.id,Math.ceil(AMOUNT*0.95),"Rubine Transfer","RBN").then(payload=>{
            embed=new gear.Embed();
            embed.thumbnail(TARGET.avatarURL)
            embed.footer(msg.author.tag,msg.author.avatarURL)
            embed.image("https://cdn.discordapp.com/attachments/488142034776096772/586549151206998057/transfer.gif")
            embed.description =`
            
            **${msg.author.username}** transfered **${AMOUNT}**${_emoji('RBN')} to **${TARGET.username}**
            Transaction Fee: **${Math.floor(AMOUNT*0.05)}${_emoji('RBN')}**
            Transaction ID: \`${payload.transactionId}\`
            
            `
            msg.channel.send({embed})
        })

    }

  Timed.init(msg,"transfer_rbn",{day:(8*60*60*1000)},after,reject,info,precheck);



}
module.exports={
    init
    ,pub:true
    ,cmd:'transfer'
    ,perms:3
    ,cat:'economy'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['give']
}