const BOORU = require('../../utilities/BooruGetter');
const ax = require('axios');

const init = async function (msg,args,ext){

    const QUALITY_CONTROL = "+score:>0"+(msg.channel.nsfw?"":"+-rating:questionable")

    let tags = args.join('+') || ''
    let endpoint = "getRandom"
 
    const embed = new Embed();
        embed.color = 0xf44283;
        embed.footer(msg.author.tag,msg.author.avatarURL)
        embed.title("\\❤ \u2003 S a f e b o o r u \u2003 \\❤");

    if(ext && ext.constructor !== Array){
        embed.title         = ext.title;
        embed.description   = ext.description;
        embed.color         = ext.color;
        if (ext.tags) embed.description = tags?("`"+tags.replace(/_/g," ").replace(/\+/g,"` | `")+"`\n"):"";
        if (ext.nsfw && msg.channel.nsfw){
            endpoint = "getRandomLewd"
            tags += "+-loli+-lolicon+-child+-shota+-cgi+-3d+-webm+-bestiality+-rating:safe"
        }else{
            tags += QUALITY_CONTROL
        }
        if(!msg.channel.nsfw && ext.nsfw) embed.title="NSFW NOT ENABLED IN THIS CHANNEL";
    }else{
        embed.description   = tags?("`"+tags.replace(/_/g," ").replace(/\+/g,"` | `")+"`\n"):""
        tags += QUALITY_CONTROL;
    }    

    let res = await BOORU[endpoint](tags).catch(e=>null);     
    
    let enhancedRes;
    if(res) enhancedRes = (await ax.get(`http://danbooru.donmai.us/posts.json?md5=${res.md5||res.hash}`).catch(e=>{return {data:null}})).data;
    
    if(res && enhancedRes){
        embed.image( enhancedRes.file_url )
        let elipsis = enhancedRes.tag_string_character.split(' ').length > 5 ? " (...)" :"";
        if(enhancedRes.tag_string_artist) embed.field ("Artist","**["+ enhancedRes.tag_string_artist.split(' ')[0].split('_').map(capitalize).join(' ')+`]()**`,true )
        if(enhancedRes.tag_string_character) embed.field ("Characters",enhancedRes.tag_string_character.split(' ').map(char=> char.split('_').map(capitalize).join(' ') ).slice(0,5).join(", ")+elipsis,true )
        if(enhancedRes.tag_string_copyright) embed.field ("Source", enhancedRes.tag_string_copyright.split(' ').filter((v,i,a)=> !v.includes(a[(i||5)+-1])).map(src=> src.split('_').map(capitalize).join(' ')).slice(0,3).join(", "),true )
        if(enhancedRes.tag_string_general && ext?.tags) embed.field ("Tags","`["+shuffle(enhancedRes.tag_string_general.slice(1).split(' ').slice(0,10)).join(']` `[')+"]`",true);
        msg.channel.send({embed}).then(ms=>{

            addReactions(ms,{
                url: (enhancedRes.large_file_url || enhancedRes.file_url),
                saved: Date.now(),
                tags: enhancedRes.tag_string,
                nsfw: ext && ext.nsfw

            })
        })
    }else if(res){
        embed.image( res.file_url )
        if(res.tags && ext?.tags) embed.field ("Tags","`["+shuffle(res.tags.slice(1)).split(' ').slice(0,10).join(']` `[')+"]`",true);
        msg.channel.send({embed}).then(ms=>{
            addReactions(ms,{
                url: ( res.sample_url.includes('safebooru') ?  res.file_url : res.sample_url.replace("/samples","//samples") ),
                saved: Date.now(),
                tags: res.tags,
                nsfw: ext && ext.nsfw

            })
        })
    }else{
        embed.description = _emoji('nope') + $t('forFun.booru404',{lngs:msg.lang,prefix:msg.prefix})
        msg.channel.send({embed})
    }

    function addReactions(ms,save){
        ms.addReaction('👍').catch(e=>null)
        ms.addReaction('👎').catch(e=>null)
        ms.addReaction('💖').catch(e=>null)
        ms.addReaction('😠').catch(e=>null)
        if(save){
            ms.addReaction('⭐').catch(e=>null)
            ms.awaitReactions( reaction=>{
            
                if(reaction.author.id == PLX.user.id) return false;
     
                if(reaction.emoji.name == "⭐"){
                    
                    DB.usercols.set(reaction.author.id,{$addToSet:{'collections.boorusave':save}});
                    ms.removeReaction('⭐',reaction.author.id).catch(e=>null);
                    return true;
                }
                 
            }, {time: 15000} ).catch(e=>{
                console.error(e)
                ms.removeReaction('⭐')
                
            }).then(reas=>{
                if (!reas || reas.length === 0 ) return;
               
                let savers = reas.map(rea=> rea.author.username)
                ms.channel.send("Saved by "+savers.join(","))
                ms.removeReaction('⭐')

            })
        }

    }
}
module.exports={
    init
    ,pub:true
    ,cmd:'safebooru'
    ,perms:3
    ,cat:'anime'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['safe']
    ,scope: "booru"
}