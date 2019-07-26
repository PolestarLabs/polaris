// const gear = require('../../utilities/Gearbox');
// const DB = require('../../database/db_ops');

const init = async function (msg){

    let P={lngs:msg.lang,prefix:msg.prefix}
    if(PLX.autoHelper([$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;


    let A = paths.CDN + "/build/coins/befli_heads.gif"
    let A1= paths.CDN + "/build/coins/befli_h_s.png"
    let B = paths.CDN + "/build/coins/befli_tails.gif"
    let B1= paths.CDN + "/build/coins/befli_t_s.png"
    let rand = randomize(1,59)

    let res = rand % 2 === 0 ? A : B
    let res2 = rand % 2 === 0 ? A1 : B1
    let face = rand % 2 === 0 ? $t('terms.coinHeads') : $t('terms.coinTails')

    let embed = new Embed()
    embed.author(msg.author.tag + " flips a coin...",msg.author.avatarURL)
    embed.thumbnail(res)
    
    msg.channel.send({embed}).then(async x=>{
        embed.description = `... and landed **${face}**
        
        \u200b` 
        embed.thumbnail.url = res2
        await wait(5.5);
        x.edit({embed})

    })



}
module.exports={
    init
    ,pub:true
    ,cmd:'flip'
    ,perms:3
    ,cat:'util'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:[]
}