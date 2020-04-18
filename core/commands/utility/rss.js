// const DB = require('../../database/db_ops');
// const gear = require('../../utilities/Gearbox/global');
const YesNo = require('../../structures/YesNo');
const RSS = require('rss-parser');
const parser = new RSS();


const init = async function (msg){
    
    const P={lngs:msg.lang,prefix:msg.prefix,command:this.cmd}
    if(PLX.autoHelper(["noargs",$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;
    
    const feedData = await DB.feed.find({server: msg.guild.id, type:'rss'}).lean().exec();
     

    // +RSS add (LINK) 
    if(msg.args[0]=== "add"){
        let str = msg.args[1];
        let destination = msg.channelMentions[0]
        let feed = await parser.parseURL(str).catch(e=>false);
        if(!feed) return msg.channel.send( $t('interface.feed.invalidRSS',P) );
        channel = destination || msg.channel.id; //feedData.defaultChannel;
        feed.items = feed.items.filter(x=>x.link.startsWith('http'));
        if(!channel) return msg.channel.send( $t('interface.feed.noDefault',P) );
        
        let payload = {type: "rss", url: str, last: feed.items[0], channel: channel};

        if(feedData && feedData.find(fdd=> fdd.url == str)){
            await DB.feed.set({server:msg.guild.id,url:str},{$set:{channel} });
            return msg.channel.send( $t('interface.feed.urlPresent',P) );
        }
        let embed = await feedEmbed(feed.items[0],feed);
        payload.server= msg.guild.id
        payload.thumb = feed.logo || (feed.image||{}).url   || ''
        payload.name = feed.title || (feed.image||{}).title || 'RSS Feed'


        await DB.feed.new(payload);

        P.channelID = `<#${channel}>`
        msg.channel.send(_emoji("yep")+ $t('interface.feed.savedSubLastRSS',P));
        return  PLX.getChannel(channel).send( {embed} );        
        
    }

    

    // +RSS remove (LINK || index) 
    if(msg.args[0]=== "remove"||msg.args[0]=== "delete"){
        if (!feedData || feedData.length == 0) return msg.channel.send( $t('interface.feed.noFeed',P) );
        let target = msg.args[1];
        if (!target) return msg.channel.send( $t('interface.feed.stateIDorURL',P) );
        let toDelete = feedData[target] || feedData.find(f=> f.type == "rss" && (f.url == target || f.url.includes(target)) )
        if(!toDelete) return msg.channel.send( $t('interface.feed.stateIDorURL',P) );
        
        let embed = new Embed;
        embed.description = `
                URL: \`${toDelete.url}\`
                ${$t('terms.discord.channel')}: <#${toDelete.channel}>
                `;
        let confirm = await msg.channel.send({content:
            $t('interface.generic.confirmDelete',P),
            embed});
        YesNo(confirm,msg,async (cc)=>{
            //await DB.feed.set({server:msg.guild.id},{$pull:{feeds:toDelete}});            
            await DB.feed.deleteOne({server:msg.guild.id, url: toDelete.url });        
        });    
    }

    if(msg.args[0]=== "list"){        
        if(feedData && feedData.length > 0){
            msg.channel.send(`
            **${_emoji('todo')+ $t('interface.feed.listShowRSS',P) }**
\u2003${feedData.map((x,i)=>`\`\u200b${(i+"").padStart(2,' ')}\` <${x.url}> @ <#${x.channel}>`).join('\n\u2003')}        

*${$t('interface.feed.listRemove',P)}*
`)
        }else{
            msg.channel.send( $t('interface.feed.noFeed',P) )
        }
    }
    // +RSS defaultchannel (#channel) 
    if(msg.args[0]=== "channel"){
        let channel =  msg.channelMentions[0]
        await DB.servers.set({id:msg.guild.id},{$set:{'modules.defaultRSSChannel':channel}});
        P.channelID = `<#${channel}>`;
        msg.channel.send( rand$t('responses.verbose.interjections.acknowledged',P)+ $t('interface.feed.channelUpdate',P) )
    }
 
}



async function feedEmbed(item,data){

    console.log({data})

    let embed = new Embed;
    let ogs = require('open-graph-scraper');
    embed.color("#ff8a42") 
    embed.title  = item.title
    embed.url    = item.url || item.link || item.guid
    embed.footer(item.author || item.creator||'Pollux RSS Feed Tool')
    embed.timestamp(item.isoDate)
    embed.description     = (item.contentSnippet || item.content || "" ).split('\n')[0]
    embed.author(data.title )
    
    let [results,res_thumb] = await Promise.all([
        ogs({ 'url': embed.url  }).catch(e=>{ console.error(e); return false}),
        ogs({ 'url': data.link || (embed.url.split('//'[1]+'').split('/')[0] )  }).catch(e=>{ console.error(e); return false})
    ]);

    embed.thumbnail = normalizeImage(res_thumb) || {url: (data.image||{}).url || 'https://cdn.pixabay.com/photo/2017/06/25/14/38/rss-2440955_960_720.png'};
    embed.image = normalizeImage(results)
    embed.author.icon_url = 'https://cdn.pixabay.com/photo/2017/06/25/14/38/rss-2440955_960_720.png';

console.log("EMBED.".red)
    console.log({embed})
    return embed;
  }

function normalizeImage(results){
    let img_link = results ? results.data.ogImage.url: null;  
    let res = img_link ? {url:img_link.startsWith('//')?img_link.replace('//','http://'):img_link} : null;
    return res;
}

  
module.exports={
    init
    ,embedGenerator: feedEmbed
    ,pub:true
    ,cmd:'rss'
    ,perms:3
    ,cat:'util'
    ,botPerms:['embedLinks','manageMessages','manageChannels']
    ,aliases:['feed']
}
