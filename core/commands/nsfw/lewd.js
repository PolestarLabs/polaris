const init = async function (msg){

    delete require.cache[require.resolve('../anime/safebooru')]
    return require('../anime/safebooru').init(msg,{title:" ",color:0xff4c45, nsfw: true, tags:true});

}
module.exports={
    init
    ,pub:true
    ,cmd:'lewd'
    ,perms:3
    ,cat:'nsfw'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['rule34','hentai']
}