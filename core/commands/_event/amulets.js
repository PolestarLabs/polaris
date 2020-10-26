const YesNo = require('../../structures/YesNo.js');
const EventData = require('../../archetypes/Events.js');
const EV = EventData.event_details; 

const init = async function (msg){

    const P = { lngs:msg.lang, prefix: msg.prefix };
    const eventData = await EV.userData(msg.author);

    let userData = await DB.users.getFull(msg.author.id);

    let hasTwo = userData.modules.inventory.find(i=> i.id === 'ancient_amulets')?.count >= 5; // two?
    P.emj = "<:amulet:767214978972254239>"
    P.emj2 = "☯"

    if (hasTwo){

        let promptEmbed = {
            description: $t('events:halloween20.amuletExchangePrompt',P),
            thumbnail: {url: "https://cdn.discordapp.com/emojis/767214978972254239.png"}
        }
        const prompt = await msg.channel.send( {embed:promptEmbed} );


        await YesNo(prompt,msg,async (_,m)=>{
            console.log(m)
            promptEmbed = m.embeds[0];
            promptEmbed.description = $t("events:halloween18.caskets.tooManyGar",P);
            if( eventData.inventory?.length > 11) return prompt.edit( {embed: promptEmbed} );

            let phab = EV.phabricate(msg.author,null,null,'jiangshi', 'Jiangshi',null,20);
            
            await Promise.all([
                userData.removeItem('ancient_amulet',5),
                DB.users.set(msg.author.id,{$push:{"eventData.halloween20.inventory":phab}})
            ]);
            
            P.rar   = _emoji(phab.rarity);
            P.item  = phab.name + "`"+(phab.spook)+"`";
            promptEmbed.description = $t('events:halloween20.amuletExchangeSuccess',P);
            await prompt.edit({embed:promptEmbed})

        });
             
        





       
    }else{
        return $t('events:halloween20.amuletCantAfford',P);
    }



    //confirm
    //send item
    

}
module.exports={
    init
    ,pub:true
    ,cmd:'amulets'
    ,cat:'_event'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:[]
}