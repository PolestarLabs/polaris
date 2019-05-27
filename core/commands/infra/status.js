const gear = require('../../utilities/Gearbox');
const {inspect} = require('util');
const os = require('os');
//const DB = require('../../database/db_ops');

const init = async function (msg){
    
    let moment = require("moment");
        moment.locale(msg.lang[0]||'en');

    let P={lngs:msg.lang,prefix:msg.prefix}
    if(gear.autoHelper([$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;

    
let emb =    new gear.Embed

 
emb.color('#e83774')

//let SHARDATA=(await gear.globalDB.get()).shardData;

let server_estimate_count = POLLUX.guilds.size / POLLUX.shards.size * POLLUX.options.maxShards;
let user_estimate_count = POLLUX.users.size / POLLUX.shards.size * POLLUX.options.maxShards;
let ping    = `${msg.guild.shard.latency}ms`
let duration =  moment(Date.now() + POLLUX.uptime) - moment() 
let s = Math.floor( (duration/1000) % 60 );
let m = Math.floor( (duration/1000/60) % 60 );
let h = Math.floor( (duration/(1000*60*60)) % 24 );
let d = Math.floor( duration/(1000*60*60*24) );
let uptime =  (d?d + 'D ':'') + (duration>=3.6e+6?h + 'h ':'') + (duration>=60000?m + 'm ':'') + s  + 's'; 



let ram_usage = Math.round(inspect(process.memoryUsage().heapUsed) / 1000000) +"~"+ Math.round(inspect(process.memoryUsage().heapTotal) / 1000000);;

emb.thumbnail(POLLUX.user.avatarURL)

emb.field('\u200b','𝚂𝚘𝚌𝚒𝚊𝚕 𝙸𝚗𝚏𝚘𝚛𝚖𝚊𝚝𝚒𝚘𝚗 ',false)

emb.field(gear.emoji('mobo')+'   Servers',"```ml\n~"  +gear.miliarize( server_estimate_count, true) + "```", true)
emb.field(':busts_in_silhouette:    Users',"```ml\n~" +gear.miliarize( user_estimate_count        ) + "```", true)


emb.field('\u200b','𝚃𝚎𝚌𝚑𝚗𝚒𝚌𝚊𝚕 𝚂𝚝𝚊𝚝𝚞𝚜 ',false)
emb.field(gear.emoji('cog')+'   Websocket Ping         \u200b',"```ml\n"+ ping +"```", true)
emb.field(gear.emoji('memslot')+'    RAM Usage',"```ml\n"+ram_usage+" MB```", true)

//emb.field(gear.emoji('mobo')+'   Servers in this Shard              \u200b',"```css\n"+(`[${gear.getShardCodename(POLLUX,Number(msg.guild.shard.id)+1)} Shard] `)+(bot.guilds.filter(x=>x.shard.id==msg.guild.shard.id).size)+"```", true)
emb.field(gear.emoji('mobo')+'  Servers in this Cluster         \u200b',"```css\n"+(`[S${msg.guild.shard.id}C${process.env.CLUSTER_ID}] ${POLLUX.guilds.size}`)+"```", true)
emb.field(gear.emoji('cpu')+'   Cluster Uptime',"```ml\n"+(uptime)+"```", true)

emb.field('\u200b'         ,'𝙻𝚒𝚗𝚔𝚜 ',false)
emb.field('Donate'         ,"<a:polluxYAY:482436838523404288>  [Pollux on Patreon](https://patreon.com/Pollux)", true)
emb.field('Invite'         ,':love_letter:  [Pollux.gg/invite]('+paths.CDN+'/invite)     \u200b', true)
emb.field('Commands'       ,':gear:  [Pollux.gg/commands]('+paths.CDN+'/commands)', true)
emb.field('Support Server' ,':question:  [Pollux\'s Mansion]('+paths.CDN+'/support)    \u200b', true)
emb.field('Twitter'        ,'<:twitter:510526878139023380>  [@maidPollux](https://twitter.com/maidPollux)    \u200b', true)
emb.field('Subreddit'      ,'<:reddit:510526878038360074>   [/r/Pollux](https://reddit.com/r/Pollux)    \u200b', true)

emb.footer("❤\u2003 Powered by "+os.cpus().length+"x "+os.cpus()[1].model )


  msg.channel.send({embed:emb})



}
module.exports={
    init
    ,pub:true
    ,cmd:'status'
    ,perms:3
    ,cat:'infra'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:[]
}