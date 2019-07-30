const init = async function (msg,args,pollux){

    let P={lngs:msg.lang,prefix:msg.prefix}   

    const [USERDATA,DECKDATA] = await Promise.all(
        [
            DB.users.get(msg.author.id),
            DB.cosmetics.find({type:"skin",for: "casino" })
        ]
    );

    embed = new Embed();



    embed.description =""
    let CASINO =[], TAROT = [];
    (USERDATA.modules.skinInventory||[]).forEach((skin,i,arr)=>{
        if (skin.startsWith("casino")) {
            let dkinfo = DECKDATA.find(dk=>dk.id===skin);
            if (dkinfo){
                console.log(dkinfo.rarity+"dek")
                CASINO.push(`${_emoji(dkinfo.rarity+"dek")} **${dkinfo.name}** \n \u2003\u2003 \\🆔\`${dkinfo.localizer}\``);
                console.log(CASINO)
            }
        }
        if (skin.startsWith("tarot"))  {
            let dkinfo = DECKDATA.find(dk=>dk.id===skin);
            if (dkinfo){
                TAROT.push(`${_emoji(dkinfo.rarity+"dek")} **${dkinfo.name}** \n \u2003\u2003 \\🆔\`${dkinfo.localizer}\``);
            }
        }

        
        if(i===arr.length-1){
            CASINO.push(`${_emoji("Cdek")} **Vegas** (default) \n \u2003\u2003 \\🆔\`default\``);
            TAROT.push(`${_emoji("Cdek")} **Persona 3** (default) \n \u2003\u2003 \\🆔\`persona3\``);

            if(CASINO.length>0 && (!pollux || pollux==="casino")) 
                embed.field(
                    `${_emoji('plxcards')} **Casino Decks** \`${msg.prefix}blackjack deck [ID]\``,
                    "\u200b\u2003"+CASINO.join('\n\u2003'));

            if(TAROT.length>0 && (!pollux || pollux==="tarot") )
                embed.field(
                    `${_emoji('plxtarot')} **Tarot Decks** \`${msg.prefix}tarot deck [ID]\``,
                    "\n\u200b\u2003"+TAROT.join('\n\u2003'));
        }
    })
    embed.color("#6757a1");
    embed.thumbnail(paths.CDN+'/build/cards/deckie.png')
console.log(embed)
    msg.channel.send({embed})




}
module.exports={
    init
    ,pub:true
    ,cmd:'decks'
    ,perms:3
    ,cat:'inventory'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:[]
}