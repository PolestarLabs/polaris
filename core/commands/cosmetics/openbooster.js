const Picto = require('../../utilities/Picto.js');
const fs = require('fs')

const init = async function (msg) {

    let P={lngs:msg.lang,}
    if(PLX.autoHelper([$t("helpkey",P),'noargs'],{cmd:this.cmd,msg,opt:this.cat}))return;
    

    const [userData,stickerData,boosterData] = await Promise.all([
        DB.users.getFull({id:msg.author.id}),
        DB.cosmetics.find({type:'sticker'}),
        DB.items.find({type:'boosterpack'}),
    ]);
    const collection = msg.args[0];

   // if(userData.amtItem(collection) < 1) return msg.channel.send($t('interface.booster.'));

    function getRandomSticker(col,exc){
        let pile = shuffle( stickerData.filter(stk=> stk.series_id == col && stk.id!=exc) );
        return pile[ randomize(0,pile.length-1) ];
    }

    const stk1    = getRandomSticker(collection);
    if(!stk1) return "Collection does not exist!";
    const stk2    = getRandomSticker(collection,stk1.id);
    const stk1new = userData.modules.stickerInventory.includes(stk1.id);
    const stk2new = userData.modules.stickerInventory.includes(stk2.id);

    const embed = new Embed;

    const thisPack = boosterData.find(b=>b.id===collection+"_booster");
    P.boostername = thisPack.name;
    P.dashboard = `[${$t('terms.dashboard',P)}](${paths.CDN}/dashboard#/stickers)`;
    embed.author( _emoji(thisPack.rarity) + $t('interface.booster.title',P) );
    embed.color = 0x36393f;
    embed.description= `
    ------------------------------------------------
    ${stk1.new?":new:":":record_button:"} ${_emoji(stk1.rarity)}  ${stk1.name}
    ${stk2.new?":new:":":record_button:"} ${_emoji(stk2.rarity)}  ${stk2.name}
 `+"------------------------------------------------\n"+
    $t('interface.booster.checkStickersAt',P)      
     
    embed.image(paths.CDN + `/generators/boosterpack/${collection}/${stk1.id}/${stk2.id}/booster.png?anew=${stk1new}&bnew=${stk2new}` )
    embed.thumbnail(paths.CDN + `/build/boosters/showcase/${collection}.png`)
    embed.footer(msg.author.tag,msg.author.avatarURL)

    msg.channel.send({embed});

};


module.exports = {
    init
    , pub: true
    , cmd: 'openbooster'
    , perms: 3
    , cat: 'cosmetics'
    , botPerms: ['attachFiles', 'embedLinks']
    , aliases: []
}



