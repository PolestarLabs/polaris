const gear = require('../../utilities/Gearbox');

const init = async function (msg){

    let P={lngs:msg.lang,prefix:msg.prefix}
    if(gear.autoHelper(["noargs",$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;
    

    if(msg.args[0] === "embed"){
        if(["?","help",$t('helpkey',P)].includes(msg.args[1]) || !msg.args[1] ){
            return msg.channel.send({embed:{
                description: "Check [this link](https://leovoel.github.io/embed-visualizer/) to create embeds. Then paste it in `+say embed <JSON CODE>`"
            }});
        }
        let userEmbed = JSON.parse(msg.content.substr(msg.content.indexOf('embed')+5).trim());
        msg.channel.send(userEmbed.embed?userEmbed:{embed:userEmbed})
        msg.delete().catch()
    }else{
        msg.channel.send(msg.content.split(/ +/).slice(1).join(' '))
        msg.delete().catch()
    }
}

module.exports={
    init
    ,pub:true
    ,cmd:'say'
    ,perms:3
    ,cat:'util'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:[]
}