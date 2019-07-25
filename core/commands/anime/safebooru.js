
const gear = require('../../utilities/Gearbox');

const init = async function (msg,ext){

    delete require.cache[ require.resolve('../../utilities/BooruGetter')];
    const booru = require('../../utilities/BooruGetter');

    let P={lngs:msg.lang,prefix:msg.prefix}
    if(gear.autoHelper([$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;

    const QUALITY_CONTROL = "+score:>1+-rating:questionable+-ass+-breasts"

    let tags = msg.args.join('+') || ''
    let source = "getRandom"
 
    const embed = new gear.Embed();
        embed.color = 0xf44283;
        embed.footer(msg.author.tag,msg.author.avatarURL)
        embed.title("\\❤ \u2003 S a f e b o o r u \u2003 \\❤");

    if(ext && ext.constructor !== Array){
        embed.title         = ext.title;
        embed.description   = ext.description;
        embed.color         = ext.color;
        if (ext.tags) embed.description = tags?("`"+tags.replace(/_/g," ").replace(/\+/g,"` | `")+"`\n"):"";
        if (ext.nsfw){
            source = "getRandomLewd"
            tags += "+score:>5+-loli+-child+-shota+-cgi+-3d+-webm+-bestiality" 
        }else{
            tags += QUALITY_CONTROL 
        }


    
    }else{
        embed.description   = tags?("`"+tags.replace(/_/g," ").replace(/\+/g,"` | `")+"`\n"):""
        tags += QUALITY_CONTROL;
    }    
        
    let res = await booru[source](tags).catch(e=>null);     

    if(res){
        embed.image( res.file_url )
        if(res.tags && (ext||{}).tags) embed.field ("Tags","`["+gear.shuffle(res.tags.slice(1)).split(' ').slice(0,10).join(']` `[')+"]`",true);
        msg.channel.send({embed}).then(ms=>{
            ms.addReaction('👍').catch(e=>null)
            ms.addReaction('👎').catch(e=>null)
            ms.addReaction('💖').catch(e=>null)
            ms.addReaction('😠').catch(e=>null)
        })
    }else{
        embed.description = _emoji('nope') + $t('forFun.booru404',P)
        msg.channel.send({embed})
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