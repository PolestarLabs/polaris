const Picto = require('../../utilities/Picto.js');
const YesNo = require('../../structures/YesNo.js');
const ECO = require('../../archetypes/Economy.js');
const avicheck = require('./avatarcheck.js')
const EventData = require('../../archetypes/Events.js');
const EV = EventData.event_details; 

const init = async function (msg){
    const P = {lngs:msg.lang}
    //const eventData = await EV.userData(msg.author);
    const embed = {
        title: $t('events:hallowinter.austriTitle',P),
        footer: {
            icon_url: msg.author.avatarURL,
            text: msg.author.tag
        }
    };

    const covenant = await avicheck.init(msg,true);

    embed.image = {url: paths.Build + '/events/halloween20/aus-store.png?'}

    embed.description = $t('events:halloween20.australis.greet',P);


    let postMsg = await msg.channel.send({embed});

    return postMsg;

}
module.exports={
    init
    ,pub:true
    ,cmd:'trader'
    ,cat:'_event'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['merchant','australis','mrc']
    ,reactionButtons:[
        {
            emoji: 'amulet:767214978972254239',
            type: "edit",
            response: async (msg,args,uID) => {
                msg.removeReactions();
                let res = await flairForItem(msg,uID,'ofuda','ancient_amulet',5);
                return res;
            }, 
        },{
            emoji: 'wickedrose:769730202782793809',
            type: "edit",
            response: async (msg,args,uID) => {
                msg.removeReactions();
                let res = await flairForItem(msg,uID,'noctix_honeymoon','wicked_rose',5);
                return res;
            }, 
        },{
            emoji: ':CANDY:769023260050325535',
            type: "edit",
            response: async (msg,args,uID) => {
                msg.removeReactions();
                const userData = await DB.users.get(uID);
                const P = [msg.channel.LANG||msg.guild.LANG];
                const resEmbed = msg.embeds[0];
                resEmbed.thumbnail = {
                    url: "https://cdn.discordapp.com/emojis/769023260050325535.png?v=1"
                }

                if(userData.modules.rubines < 10000){
                    resEmbed.description = $t('events:halloween20.australis.notEnough',P);
                    return {embed:resEmbed};
                };
                
                await Promise.all([
                    DB.users.set(uID,{$inc: {'eventData.halloween20.candy': 100} }),
                    ECO.pay(uID,10000,'event:cady_shop')
                ]);
            
                resEmbed.description = $t('events:halloween20.australis.finisher',P);
                return {embed:resEmbed};
            },
            
        },{
            emoji: '☯️',
            type: "edit",
            response: async (msg,args,uID) => {
                msg.removeReactions();

                const P = [msg.channel.LANG||msg.guild.LANG];
                let promptEmbed = {
                    description:  $t('events:halloween20.australis.jiangshi',P),
                    thumbnail: {url: paths.CDN + "/build/events/halloween20/jiangshis.png" }
                };
                const response = await msg.channel.send({embed: promptEmbed});
                YesNo(response,{author:{id:uID}},async (c,m)=>{
                    await flairForCostume(m,uID,['jiangshi-g','jiangshi-b'],'jiangshi').then(r=> {
                        console.log(r)
                        m.edit(r)
                    });
                })
            },
            
        },{
            emoji: '🌹',
            type: "edit",
            response: async (msg,args,uID) => {
                msg.removeReactions();

                const P = [msg.channel.LANG||msg.guild.LANG];
                let promptEmbed = {
                    description:  $t('events:halloween20.australis.alraune',P),
                    thumbnail: {url: paths.CDN + "/build/events/halloween20/alraunes.png"}
                };
                const response = await msg.channel.send({embed: promptEmbed});
                YesNo(response,{author:{id:uID}},async (c,m)=>{
                    await flairForCostume(m,uID,['alraune-g','alraune-b'],'alraune').then(r=> {
                        console.log(r)
                        m.edit(r)
                    });
                })
            },
            
        },{
            emoji: "❌",
            type: "cancel", 
            response: async (msg,args,uID) => {
                msg.channel.send($t('events:halloween20.australis.cancel',{lngs:[msg.channel.LANG||msg.guild.LANG,'dev']}));
            }    
        }
    ]
}


async function flairForItem(msg,uID,FLAIR,ITM,AMT){
    const userData = await DB.users.getFull(uID);
    const P = [msg.channel.LANG||msg.guild.LANG];
    const resEmbed = msg.embeds[0];
    resEmbed.thumbnail = {
        url: paths.CDN + "/flairs/"+FLAIR+".png"
    }
    
    if(userData.amountItem(ITM) < AMT){
        resEmbed.description = $t('events:halloween20.australis.notEnough',P);
        return {embed:resEmbed};
    };
    if(userData.modules.flairsInventory.includes(FLAIR)){
        resEmbed.description = $t('events:halloween20.australis.alreadyOwn',P);
        return {embed:resEmbed};
    };

    await DB.users.set(uID,{$addToSet:{'module.flairsInventory':FLAIR }});
    await userData.removeItem(ITM,AMT);                               

    resEmbed.description = $t('events:halloween20.australis.finisher',P);
    return {embed:resEmbed};
}



async function flairForCostume(msg,uID,FLAIR,COSTUME){
    const userData = await DB.users.getFull(uID);
    const P = [msg.channel.LANG||msg.guild.LANG];
    const resEmbed = msg.embeds[0];
    const eventData = await EV.userData(uID);
    P.tier = _emoji('R');

    let costumeFiltered = eventData.inventory.filter(item=> item.costume==COSTUME && !['C','U'].includes(item.rarity) );
    costumeFiltered = costumeFiltered.map(it=> ({id: it.id,type:it.type}) ).filter((v,i,a)=> a.map(x=>x.type).indexOf(v.type) == i).map(item=>item.id);

    if(costumeFiltered.length < 3){
        resEmbed.description = $t('events:halloween20.australis.notEnough',P);
        
        resEmbed.color = 0xCC2233;
        resEmbed.footer.text= "❌";
        return {embed:resEmbed};
    }

    const [FLAIR1,FLAIR2] = FLAIR;


    let firstChoice = eventData.gender === 'girl' ? FLAIR1 : FLAIR2; 
    let secondChoice = eventData.gender === 'girl' ? FLAIR2 : FLAIR1;

    if (userData.modules.flairsInventory.includes(firstChoice)){
        await DB.users.set(uID,{$addToSet:{'modules.flairsInventory':firstChoice}});
    }else if (userData.modules.flairsInventory.includes(secondChoice)){
        resEmbed.description = $t('events:halloween20.australis.alreadyOwn',P);
        resEmbed.color = 0xCC2233;
        resEmbed.footer.text= "❌";
        return {embed:resEmbed};
    }else{
        await DB.users.set(uID,{$addToSet:{'modules.flairsInventory':secondChoice}});
    }
    const newCostumeInv = eventData.inventory.filter(it=> !costumeFiltered.includes(it.id));
    await DB.users.set(uID,{$set:{'eventData.halloween20.inventory':newCostumeInv}});

    resEmbed.description = $t('events:halloween20.australis.finisher',P);
    return {embed:resEmbed}; 
 
}