const {Embed} = require('../../utilities/Gearbox');
const Gal = require('../../structures/Galleries')

const init = async function (msg){

    embed = new Embed();
    let img = {};

    if(msg.args[0] && !!parseInt(msg.args[0])){
        let index = parseInt(msg.args[0]);
        img.file =  paths.CDN+"/random/smug/"+index;
        img.index = index
    }else{
        img = await Gal.randomOneIndexed('smug',true);
    }

    let avgcolor = await require('../../utilities/Picto').avgColor(img.file);

    embed.image(img.file);
    embed.color(avgcolor);
    embed.footer("Smug Anime Girl #"+img.index);

    msg.channel.send({embed});

}

module.exports={
    init
    ,pub:true
    ,cmd:'smug'
    ,perms:3
    ,cat:'img'
    ,botPerms:['embedLinks']
    ,aliases:[]
}
