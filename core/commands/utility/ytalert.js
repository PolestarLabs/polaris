const DB = require('../../database/db_ops');
const gear = require('../../utilities/Gearbox');
const YesNo = require('../../structures/YesNo');
const axios = require('axios');

const googleToken = require(appRoot+'/config.json').google;


const init = async function (msg){
    
    let P={lngs:msg.lang,prefix:msg.prefix,command:this.cmd}  
    if(gear.autoHelper(["noargs",$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;
    
    let feedData = await DB.feed.get({server: msg.guild.id});


    // +RSS add (LINK)  
    if(msg.args[0]=== "add"){
        let channelID = msg.args[1];

        if(channelID && channelID.startsWith("http")){
            let pre= channelID.split('/');
            channelID = pre[pre.length - 1];
        };
        
        let destination = msg.channelMentions[0]


        let youtubeChannel = await getYTData(channelID,googleToken);
        if(!youtubeChannel) youtubeChannel =   
        await getYTData(
            (
                await axios.get(`https://www.googleapis.com/youtube/v3/channels?key=${googleToken}&forUsername=${channelID}&part=id&maxResults=1`)
                .then(res=>{channelID = res.data.items[0].id; return channelID;})
                .catch(e=>null)
            )
            ,googleToken
        );

        if(!youtubeChannel) return msg.channel.send( $t('interface.feed.invalidYoutube',P)  );

        channel = destination || feedData.defaultChannel;
        if(!channel) return msg.channel.send( $t('interface.feed.noDefault',P) );
        
        
        let payload = {type: "youtube", url: channelID, last: youtubeChannel.items.filter(v=>v.id.kind=="youtube#video")[0], channel: channel};

        if(feedData && feedData.feeds.find(fdd=> fdd.url == channelID)){
            await DB.feed.set({server:msg.guild.id,'feeds.url':channelID},{'feeds.$.channel':channel });
            return msg.channel.send( $t('interface.feed.urlPresent',P) );
        }
        await DB.feed.set({server:msg.guild.id},{$addToSet:{feeds:payload}});


        
        let embed = await feedEmbed(payload.last,youtubeChannel.items.find(it=>it.id.kind=="youtube#channel"));
        P.tuber = embed.author.name;
        let LastVideoLink = `
        ${$t("interface.feed.newYoutube",`**${P.tuber} has posted a new video!** Check it out at:`,P)}
        https://youtube.com/watch?v=${payload.last.id.videoId}`
        P.channelID = `<#${channel}>`
        msg.channel.send(gear.emoji("yep")+ $t('interface.feed.savedSubLastRSS',P) );

        
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
                URL: https://youtube.com/channel/\`${toDelete.url}\`
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
            **${gear.emoji('todo')+ $t('interface.feed.listShowYoutube',P) }**
\u2003${feedData.feeds.map((x,i)=>`\`\u200b${(i+"").padStart(2,' ')}\` <${x.url}> @ <#${x.channel}>`).join('\n\u2003')}        

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
    
    if(!data){
        data = (await axios.get(`https://www.googleapis.com/youtube/v3/search?channelId=${item.snippet.channelId}&maxResults=1&part=snippet&key=${googleToken}&fields=items(snippet)&type=channel`).catch(e=>null)).data.items[0];
    }
    
    let embed = new gear.Embed;
    embed.color("#cc1010") 
    embed.title  = "**"+item.snippet.title+"**"
    embed.url    = `https://youtube.com/watch?v=${item.id.videoId}`
    embed.author( data.snippet.channelTitle , data.snippet.thumbnails.default.url, `https://youtube.com/channel/${item.id.channelId}` )
    embed.timestamp(item.snippet.publishedAt)
    embed.description     = (item.snippet.description || "" ).split('\n')[0]
    embed.footer("YouTube", "https://unixtitan.net/images/youtube-clipart-gta-5.png")

    return embed;
  }


  async function getYTData(ID,TOKEN){
    return (await axios.get(`https://www.googleapis.com/youtube/v3/search?channelId=${ID}&maxResults=2&part=snippet,id&key=${TOKEN}&fields=items(id,snippet)&type=video%2Cchannel&order=date`).catch(e=>{return{}})).data;
}


  
module.exports={
    ytEmbedCreate: feedEmbed,
    getYTData: getYTData,

    init
    ,embedGenerator: feedEmbed
    ,pub:true
    ,cmd:'ytalert'
    ,perms:3
    ,cat:'util'
    ,botPerms:['embedLinks','manageMessages','manageChannels']
    ,aliases:['yta']
}
