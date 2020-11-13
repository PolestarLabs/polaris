const { dbGetter } = require("../../../../dashboard/structures/PrimitiveGearbox")


const init = async function (msg,args){



}


async function topFlags(msg,args){

    let RANKS = await DB.rankings.find({type: {$in: ["guessflag-server","guessflag-solo"]}}).sort({points:-1}).limit(10);
    
    let standings = (await Promise.all(RANKS.map(async (item,i)=>{
        let subject; 
        if (item.type.includes('solo')) subject = await PLX.resolveUser(item.id);
        else subject = await PLX.getRESTGuild(item.id);
console.log(item)
        return `${_emoji('rank'+(i+1))} \`[${item.type.includes('solo') ? 'SOLO' : 'SERVER'}]\` **${((subject.name||(`${subject.username}#${subject.discriminator}`)) +'**').padEnd(40,"-") } ${item.points}pts. Grade **${item.data.grade}** - ${item.data.time||"Time Attack"} ${item.data.time? item.data.time + 's :: Endless Mode': ''}`
    }))).join('\n')

    msg.channel.send(standings)

}


module.exports={
    init
    ,pub:true
    ,cmd:'highscores'
    ,cat:'games'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['hiscores','hsc'],
    autoSubs: [
        {
          label: "flags",
          gen: topFlags,
          options: {
            aliases: [ "guessflag"],
            //invalidUsageMessage: (msg) => { PLX.autoHelper("force", { msg, cmd: "commend", opt: "social" }); },
          },
        },
    ]
}