const BOORU = require('../../utilities/BooruGetter');
const ax = require('axios');

const init = async function (msg,args,ext){

    const QUALITY_CONTROL = "+score:>1+-rating:questionable+-ass+-breasts"

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
        if (ext.nsfw){
            endpoint = "getRandomLewd"
            tags += "+score:>5+-loli+-child+-shota+-cgi+-3d+-webm+-bestiality" 
        }else{
            tags += QUALITY_CONTROL 
        }
    }else{
        embed.description   = tags?("`"+tags.replace(/_/g," ").replace(/\+/g,"` | `")+"`\n"):""
        tags += QUALITY_CONTROL;
    }    
        

    let res = await BOORU[endpoint](tags).catch(e=>null);     

    let enhancedRes;
    if(res) enhancedRes = (await ax.get(`http://danbooru.donmai.us/posts.json?md5=${res.md5||res.hash}`)).data;

console.log(enhancedRes)

    if(res && enhancedRes){
        embed.image( res.file_url )
        let elipsis = enhancedRes.tag_string_character.split(' ').length > 5 ? " (...)" :"";
        if(enhancedRes.tag_string_artist) embed.field ("Artist","**["+ enhancedRes.tag_string_artist.split(' ')[0].split('_').map(capitalize).join(' ')+`]()**`,true )
        if(enhancedRes.tag_string_character) embed.field ("Characters",enhancedRes.tag_string_character.split(' ').map(char=> char.split('_').map(capitalize).join(' ') ).slice(0,5).join(", ")+elipsis,true )
        if(enhancedRes.tag_string_copyright) embed.field ("Source", enhancedRes.tag_string_copyright.split(' ').filter((v,i,a)=> !v.includes(a[(i||5)+-1])).map(src=> src.split('_').map(capitalize).join(' ')).slice(0,3).join(", "),true )
        if(enhancedRes.tag_string_general && (ext||{}).tags) embed.field ("Tags","`["+shuffle(enhancedRes.tag_string_general.slice(1).split(' ').slice(0,10)).join(']` `[')+"]`",true);
        msg.channel.send({embed}).then(ms=>{
            addReactions(ms)
        })
    }else if(res){
        embed.image( res.file_url )
        if(res.tags && (ext||{}).tags) embed.field ("Tags","`["+shuffle(res.tags.slice(1)).split(' ').slice(0,10).join(']` `[')+"]`",true);
        msg.channel.send({embed}).then(ms=>{
            addReactions(ms)
        })
    }else{
        embed.description = _emoji('nope') + $t('forFun.booru404',{lngs:msg.lang,prefix:msg.prefix})
        msg.channel.send({embed})
    }

    function addReactions(ms){
        ms.addReaction('👍').catch(e=>null)
        ms.addReaction('👎').catch(e=>null)
        ms.addReaction('💖').catch(e=>null)
        ms.addReaction('😠').catch(e=>null)
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
}