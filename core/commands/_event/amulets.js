const YesNo = require('../../structures/YesNo.js');
const EventData = require('../../archetypes/Events.js');
const EV = EventData.event_details; 

const init = async function (msg){

    const P = { lngs:[msg.lang], prefix: msg.prefix };
    const eventData = await EV.userData(msg.author);

    let userData = await DB.users.getFull(msg.author.id);

    let hasTwo = userData.hasItem('ancient_amulet',2); // two?

    if (hasTwo){
        //exchange x for jiang set blabla;

        const promptEmbed = {
            description: $t('events:halloween20.amuletExchangePrompt',P)
        }
        const prompt = await msg.channel.send( {embed:promptEmbed} ); // temp



        await YesNo(prompt,msg,()=>{

            if( eventData.inventory?.length > 11) return message.reply(canOnly20);
            //Author,typ,rar,cos,name,asp,aug
            let phab = EV.phabricate(Author,null,null,'jiangshi', 'Jiangshi',null,20 );
            DB.users.set(Author.id,{$push:{"eventData.halloween20.inventory":phab}});
            
        });
        





        return $t('events:hallowen20.amuletExchangeSuccess',P);
    }else{
        return $t('events:hallowen20.amuletCantAfford',P);
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