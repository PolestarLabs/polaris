
const Gal = require('../../structures/Galleries')

const init = async function (msg){

    embed = new Embed();

    let img = await Gal.randomOne('ahegao',true);

    embed.image(img);
    embed.color("#FFFFFF");
    //embed.description(":coffee: **Coffee time!**");

    msg.channel.send({embed});

}

module.exports={
    init
    ,pub:true
    ,cmd:'ahegao'
    ,perms:3
    ,cat:'nsfw'
    ,botPerms:['embedLinks']
    ,aliases:[]
}
