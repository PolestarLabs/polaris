const DB = require('../../database/db_ops');
// const gear = require('../../utilities/Gearbox/global');
const YesNo = require('../../structures/YesNo');
const axios = require('axios');

const googleToken = require(appRoot+'/config.json').google;
let RSS = require('rss-parser');
let parser = new RSS({
  customFields:{
    item: [['media:group','media']]
  }
});

const init = async function (msg){
    
    let P={lngs:msg.lang,prefix:msg.prefix,command:this.cmd}  
    if(PLX.autoHelper(["noargs",$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;
    
    let feedData = await DB.feed.get({server: msg.guild.id});


    // +RSS add (LINK)  
    if(msg.args[0]=== "add"){
        let channelID = msg.args[1];

        if(channelID && channelID.startsWith("http")){
            let pre= channelID.split('/');
            channelID = pre[pre.length - 1];
        };
        
        let destination = msg.channelMentions[0]


        let youtubeChannel = await parser.parseURL("https://www.youtube.com/feeds/videos.xml?channel_id="+channelID).catch(e=>false);

        if(!youtubeChannel) return msg.channel.send( $t('interface.feed.invalidYoutube',P)  );

        channel = destination || feedData.defaultChannel;
        if(!channel) return msg.channel.send( $t('interface.feed.noDefault',P) );       
        
        let payload = {type: "youtube", url: channelID, last: youtubeChannel.items[0], channel: channel};

        if(feedData && feedData.feeds.find(fdd=> fdd.url == channelID)){
            await DB.feed.set({server:msg.guild.id,'feeds.url':channelID},{'feeds.$.channel':channel });
            return msg.channel.send( $t('interface.feed.urlPresent',P) );
        }
        let embed = await feedEmbed(payload.last,youtubeChannel );
        payload.last.media = null;
        console.log(payload)
        await DB.feed.set({server:msg.guild.id},{$addToSet:{feeds:payload}});
        

        P.tuber = embed.author.name;
        console.log(embed.author)
        let LastVideoLink = `
        ${$t("interface.feed.newYoutube", P)}
        ${payload.last.link}`
        P.channelID = `<#${channel}>`
        msg.channel.send(_emoji("yep")+ $t('interface.feed.savedSubLastYoutube',P) );

        
        return  msg.guild.channels.find(chn=>chn.id===channel).send( {content:LastVideoLink}).then(m=>m.channel.send({embed}));
        
    }
    // +RSS remove (LINK || index) 
    if(msg.args[0]=== "remove"||msg.args[0]=== "delete"){
        if (!feedData || feedData.feeds.length == 0) return msg.channel.send( $t('interface.feed.noTube',P) );
        let target = msg.args[1];
        
        if (!target) return msg.channel.send( $t('interface.feed.stateIDorURL',P) );
        let toDelete = feedData.feeds[target] || feedData.feeds.find(f=>f.url == target || f.url.includes(target) )
        let embed = new gear.Embed;
        embed.description = `
                URL: https://youtube.com/channel/${toDelete.url}
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
        if(feedData && feedData.feeds.length > 0){
            msg.channel.send(`
            **${_emoji('todo')+ $t('interface.feed.listShowYoutube',P) }**
\u2003${feedData.feeds.filter(x=>x.type==="youtube").map((x,i)=>`\`\u200b${(i+"").padStart(2,' ')}\` https://youtube.com/channel/${x.url} @ <#${x.channel}>`).join('\n\u2003')}        

*${$t('interface.feed.listRemove',P)}*
`)
        }else{
            msg.channel.send( $t('interface.feed.noTube',P) )
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
    embed.color("#ee1010") 
    embed.title  = "**"+item.title+"**"
    embed.url    = item.link
    embed.author( item.author , null, data.link )
    embed.timestamp(item.pubDate)
    embed.description     = (item.media['media:description'][0] || "" ).split('\n')[0]
    embed.footer("YouTube", "https://unixtitan.net/images/youtube-clipart-gta-5.png")

    return embed;
  }
  
module.exports={
    ytEmbedCreate: feedEmbed,

    init
    ,embedGenerator: feedEmbed
    ,pub:true
    ,cmd:'ytalert'
    ,perms:3
    ,cat:'util'
    ,botPerms:['embedLinks','manageMessages','manageChannels']
    ,aliases:['yta']
}
