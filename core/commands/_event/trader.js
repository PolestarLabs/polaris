const Picto = require('../../utilities/Picto.js');
const YesNo = require('../../structures/YesNo.js');
const ECO = require('../../archetypes/Economy.js');
const avicheck = require('./avatarcheck.js')
const EventData = require('../../archetypes/Events.js');
const EV = EventData.event_details; 
const INVOKERS   = new Map();


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
    const userData = await DB.users.get(msg.author.id);
    
    
    embed.image = {url: paths.Build + '/events/halloween20/aus-store.png?'}
    
    embed.description = $t('events:halloween20.australis.greet',P);
    embed.fields = [
        {name:"Candy",value:userData?.eventData?.halloween20?.candy||0 ,inline:!0},
        {name:"Ancient Amulets",value:userData.modules.inventory.find(i=> i.id === 'ancient_amulet')?.count||0 ,inline:!0},
        {name:"Wicked Roses",value:userData.modules.inventory.find(i=> i.id === 'wicked_rose')?.count||0 ,inline:!0}
    ]
    
    
    let postMsg = await msg.channel.send({embed});
    INVOKERS.set(msg.author.id,postMsg.id) 

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
            filter:(msg,emj,uid)=> INVOKERS.get(uid) === msg.id,
            type: "edit",
            response: async (msg,args,uID) => {
                msg.removeReactions();
                let nms = await msg.channel.send({embed:{description:'Loading...'}});
                let res = await flairForItem(nms,uID,'ofuda','ancient_amulet',5);
                return 1;
               
            }, 
        },{
            emoji: 'wickedrose:769730202782793809',
            filter:(msg,emj,uid)=> INVOKERS.get(uid) === msg.id,
            type: "edit",
            response: async (msg,args,uID) => {
                msg.removeReactions();
                let nms = await msg.channel.send({embed:{description:'Loading...'}});
                let res = await flairForItem(nms,uID,'noctix_honeymoon','wicked_rose',5);

                return "2";
           
            }, 
        },{
            emoji: 'CANDY:769023260050325535',
            type: "edit",
            filter:(msg,emj,uid)=> INVOKERS.get(uid) === msg.id,
            response: async (msg,args,uID) => {
                const userData = await DB.users.get(uID);
                const P = [msg.channel.LANG||msg.guild.LANG];
                let nms = await msg.channel.send({embed:{description:'Loading...'}});
                const resEmbed = nms.embeds[0];
                resEmbed.thumbnail = {
                    url: "https://cdn.discordapp.com/emojis/769023260050325535.png?v=1"
                }
                msg.removeReactions();

                if(userData.modules.rubines < 10000){
                    resEmbed.description = $t('events:halloween20.australis.notEnough',P);
                    return nms.edit( {embed:resEmbed} );
                };
                
                await Promise.all([
                    DB.users.set(uID,{$inc: {'eventData.halloween20.candy': 100} }),
                    ECO.pay(uID,10000,'event:cady_shop')
                ]);
            
                resEmbed.description = $t('events:halloween20.australis.finisher',P);
                await nms.edit( {embed:resEmbed} );
            },
            
        },{
            emoji: '☯️',
            filter:(msg,emj,uid)=> INVOKERS.get(uid) === msg.id,
            type: "edit",
            response: async (msg,args,uID) => {
                msg.removeReactions();

                const P = [msg.channel.LANG||msg.guild.LANG];
                let promptEmbed = {
                    description:  $t('events:halloween20.australis.jiangshi',P),
                    thumbnail: {url: paths.CDN + "/build/events/halloween20/jiangshis.png" }
                };
                const response = await msg.channel.send({embed: promptEmbed});
                await YesNo(response,{author:{id:uID}},async (c,m)=>{
                    await flairForCostume(m,uID,['jiangshi-g','jiangshi-b'],'jiangshi').then(r=> {
                        console.log(r)
                        m.edit(r)
                    });
                })
            },
            
        },{
            emoji: '🌹',
            filter:(msg,emj,uid)=> INVOKERS.get(uid) === msg.id,
            type: "edit",
            response: async (msg,args,uID) => {
                msg.removeReactions();
                
                const P = [msg.channel.LANG||msg.guild.LANG];
                let promptEmbed = {
                    description:  $t('events:halloween20.australis.alraune',P),
                    thumbnail: {url: paths.CDN + "/build/events/halloween20/alraunes.png"}
                };
                const response = await msg.channel.send({embed: promptEmbed});
                await YesNo(response,{author:{id:uID}},async (c,m)=>{
                    await flairForCostume(m,uID,['alraune-g','alraune-b'],'alraune').then(r=> {
                        console.log(r)
                        m.edit(r)
                    });
                })
            },
            
        },{
            emoji: '⭐',
            filter:(msg,emj,uid)=> INVOKERS.get(uid) === msg.id,
            type: "edit",
            response: async (msg,args,uID) => {
                msg.removeReactions();

                const P = [msg.channel.LANG||msg.guild.LANG];
                let promptEmbed = {
                    description:  $t('events:halloween20.australis.sticker',P)
                };
                const response = await msg.channel.send({embed: promptEmbed});
                YesNo(response,{author:{id:uID}},async (c,m)=>{
                    await candyForSticker(m,uID,['ars','ars-ur2']).then(r=> {
                        console.log(r)
                        m.edit(r)
                    });
                })
            },
            
        },{
            emoji: "❌",
            filter:(msg,emj,uid)=> INVOKERS.get(uid) === msg.id,
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

    
    if(userData.modules.inventory.find(i=> i.id === ITM)?.count < AMT){
        resEmbed.description = $t('events:halloween20.australis.notEnough',P);
        return msg.edit({embed:resEmbed});
    };
    if(userData.modules.flairsInventory.includes(FLAIR)){
        resEmbed.description = $t('events:halloween20.australis.alreadyOwn',P);
       return  msg.edit({embed:resEmbed});
    };

    await DB.users.set(uID,{$addToSet:{'modules.flairsInventory':FLAIR }});
    await userData.removeItem(ITM,AMT);                               

    resEmbed.description = $t('events:halloween20.australis.finisher',P);
   return msg.edit({embed:resEmbed});
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
        await DB.users.set(uID,{$addToSet:{'modules.flairsInventory':secondChoice}});
    }else if (userData.modules.flairsInventory.includes(secondChoice)){
        resEmbed.description = $t('events:halloween20.australis.alreadyOwn',P);
        resEmbed.color = 0xCC2233;
        resEmbed.footer.text= "❌";
        return {embed:resEmbed};
    }else{
        await DB.users.set(uID,{$addToSet:{'modules.flairsInventory':firstChoice}});
    }
    const newCostumeInv = eventData.inventory.filter(it=> !costumeFiltered.includes(it.id));
    await DB.users.set(uID,{$set:{'eventData.halloween20.inventory':newCostumeInv}});

    resEmbed.description = $t('events:halloween20.australis.finisher',P);
    return {embed:resEmbed}; 
 
}


async function candyForSticker(msg,uID,STICKERS){
    const userData = await DB.users.getFull(uID);
    const P = [msg.channel.LANG||msg.guild.LANG];
    const resEmbed = msg.embeds[0];
    const eventData = await EV.userData(uID);
    P.tier = _emoji('R');

    const [STICKER1,STICKER2] = STICKERS;

    if (eventData.candy < 2500) {
        resEmbed.description = $t('events:halloween20.australis.notEnough',P);        
        resEmbed.color = 0xCC2233;
        resEmbed.footer.text= "❌";
        return {embed:resEmbed};
    }


    if (!userData.modules.stickerInventory.includes(STICKER1)){
        resEmbed.image = {url:paths.CDN+"/stickers/"+STICKER1+".png"};
        await DB.users.set(uID,{$addToSet:{'modules.stickerInventory':STICKER1}});
    }else if (userData.modules.flairsInventory.includes(STICKER2)){
        resEmbed.description = $t('events:halloween20.australis.alreadyOwn',P);
        resEmbed.color = 0xCC2233;
        resEmbed.footer.text= "❌";
        return {embed:resEmbed};
    }else{
        resEmbed.image = {url:paths.CDN+"/stickers/"+STICKER2+".png"};
        await DB.users.set(uID,{$addToSet:{'modules.stickerInventory':STICKER2}});
    }
  
    await DB.users.set(uID,{$inc:{'eventData.halloween20.candy':-2500}});

    resEmbed.description = $t('events:halloween20.australis.finisher',P);
    return {embed:resEmbed}; 
 
}