const gear = require('../../utilities/Gearbox');
const DB = require('../../database/db_ops');


const init = async function (msg){

    let P={lngs:msg.lang,prefix:msg.prefix}
    if(gear.autoHelper([$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;

    const moment = require('moment')
          moment.locale(msg.lang[0]);
          
    let TG = gear.getTarget(msg,0,true);
    let joinMoment = moment.utc(msg.guild.member(TG).joinedAt);
    P.target = TG.username; 
    P.joinedstamp = joinMoment.format( moment.localeData().longDateFormat('LLLL') )

    moment.locale('en')
    let wiki = joinMoment.format('YYYY')+'_'+joinMoment.format('MMMM')+'_'+joinMoment.format('D');

    P.joinedstamp = `[${P.joinedstamp}](https://en.wikipedia.org/wiki/Portal:Current_events/${wiki} "A lot went on in this day...")`

    msg.channel.send({embed: {description: $t('misc.memberSince',P),color:11237342} } )
    


}
module.exports={
    init
    ,pub:true
    ,cmd:'joined'
    ,perms:3
    ,cat:'utility'
    ,botPerms:['embedLinks']
    ,aliases:[]
}