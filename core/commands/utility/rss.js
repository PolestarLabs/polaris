const DB = require('../../database/db_ops');
const gear = require('../../utilities/Gearbox');
const YesNo = require('../../structures/YesNo');
const RSS = require('rss-parser');
const parser = new RSS();


const init = async function (msg){
    
    const P={lngs:msg.lang,prefix:msg.prefix,command:this.cmd}
    if(gear.autoHelper(["noargs",$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;
    
    let feedData = await DB.feed.get({server: msg.guild.id});
    const RSSFiltered = feedData ? (feedData.feeds||[]).filter(fd=>fd.type=="rss") : [];

    // +RSS add (LINK) 
    if(msg.args[0]=== "add"){
        let str = msg.args[1];
        let destination = msg.channelMentions[0]
        let feed = await parser.parseURL(str).catch(e=>false);
        if(!feed) return msg.channel.send( $t('interface.feed.invalidRSS',P) );
        channel = destination || feedData.defaultChannel;
        
        if(!channel) return msg.channel.send( $t('interface.feed.noDefault',P) );
        
        let payload = {type: "rss", url: str, last: feed.items[0], channel: channel};

        if(feedData && feedData.feeds.find(fdd=> fdd.url == str)){
            await DB.feed.set({server:msg.guild.id,'feeds.url':str},{'feeds.$.channel':channel });
            return msg.channel.send( $t('interface.feed.urlPresent',P) );
        }

        await DB.feed.set({server:msg.guild.id},{$addToSet:{feeds:payload}});
        let embed = await feedEmbed(feed.items[0],feed);
        P.channelID = `<#${channel}>`
        msg.channel.send(_emoji("yep"), $t('interface.feed.savedSubLastRSS',P));
        return  POLLUX.getChannel(channel).send( {embed} );        
        
    }

    

    // +RSS remove (LINK || index) 
    if(msg.args[0]=== "remove"||msg.args[0]=== "delete"){
        if (!feedData || RSSFiltered.length == 0) return msg.channel.send( $t('interface.feed.noFeed',P) );
        let target = msg.args[1];
        if (!target) return msg.channel.send( $t('interface.feed.stateIDorURL',P) );
        let toDelete = RSSFiltered[target] || feedData.feeds.find(f=> f.type == "rss" && (f.url == target || f.url.includes(target)) )
        let embed = new gear.Embed;
        embed.description = `
                URL: \`${toDelete.url}\`
                ${$t('terms.discord.channel')}: <#${toDelete.channel}>
                `;
        let confirm = await msg.channel.send({content:
            $t('interface.generic.confirmDelete',P),
            embed});
        YesNo.run(confirm,msg,async (cc)=>{
            await DB.feed.set({server:msg.guild.id},{$pull:{feeds:toDelete}});            
        });    
    }

    if(msg.args[0]=== "list"){        
        if(feedData && RSSFiltered.length > 0){
            msg.channel.send(`
            **${_emoji('todo')+ $t('interface.feed.listShowRSS',P) }**
\u2003${RSSFiltered.map((x,i)=>`\`\u200b${(i+"").padStart(2,' ')}\` <${x.url}> @ <#${x.channel}>`).join('\n\u2003')}        

*${$t('interface.feed.listRemove',P)}*
`)
        }else{
            msg.channel.send( $t('interface.feed.noFeed',P) )
        }
    }
    // +RSS defaultchannel (#channel) 
    if(msg.args[0]=== "channel"){
        let channel =  msg.channelMentions[0]
        await DB.feed.set({server:msg.guild.id},{$set:{defaultChannel:channel}});
        P.channelID = `<#${channel}>`;
        msg.channel.send( rand$t('responses.verbose.interjections.acknowledged',P)+ $t('interface.feed.channelUpdate',P) )
    }
 
}



async function feedEmbed(item,data){
    let embed = new gear.Embed;
    embed.color("#ff8a42") 
    embed.title  = item.title
    embed.url    = item.url || item.link || item.guid
    embed.author(item.author || item.creator)
    embed.timestamp(item.isoDate)
    embed.thumbnail((data.image||{url:'https://cdn.pixabay.com/photo/2017/06/25/14/38/rss-2440955_960_720.png'}).url || '')
    embed.description     = (item.contentSnippet || item.content || "" ).split('\n')[0]
    embed.footer(data.title )
    let ogs = require('open-graph-scraper');
    let results = await ogs({ 'url': item.guid  }).catch(e=>{return false});
    let img_link = results ? results.data.ogImage.url: null;  
    if(img_link) embed.image = {url:img_link};
    return embed;
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
