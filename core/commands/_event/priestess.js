const Picto = require('../../utilities/Picto.js');
const ECO = require('../../archetypes/Economy.js');
const avicheck = require('./avatarcheck.js')
const EventData = require('../../archetypes/Events.js');
const EV = EventData.event_details; 
const INVOKERS   = new Map();

const init = async function (msg){
    const P = {lngs:msg.lang}
    const eventData = await EV.userData(msg.author);
    const embed = {
        title: $t('events:halloween20.arsTitle',P),
        footer: {
            icon_url: msg.author.avatarURL,
            text: msg.author.tag
        }
    };

    const covenant = await avicheck.init(msg,true);

    embed.image = {url: paths.Build + '/events/halloween20/ars-store.png?'}
    
    embed.description = $t('events:halloween20.arsenika.greet',P)
    embed.fields = [
        {name: "Affinity with Arsenika",value: (eventData.affinityArs || 0) + "/5000", inline:true},
        {name: "Affinity Bonus",value: (covenant === 'dusk' ? 25 : covenant === 'umbral' ? -25 : 0) + "%", inline:true},
    ]
    
    let postMsg = await msg.channel.send({embed});
    INVOKERS.set(msg.author.id,postMsg.id) 

    return postMsg;

}
module.exports={
    init
    ,cooldown: 20000
    ,pub:true
    ,cmd:'priestess'
    ,cat:'_event'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['arsenika','pst','dusk']
    ,reactionButtons:[
        {
            emoji: 'amulet:767214978972254239',
            filter:(msg,emj,uid)=> INVOKERS.get(uid) === msg.id,
            type: "edit",
            response: (msg,args,uID) => {
                msg.removeReactions();                
                buySomething(msg,uID,'events:halloween20.acAmulet' ,'ancient_amulet',350,2500,5)
            }, 
        },{
            emoji: 'casket:504412718753644555',
            filter:(msg,emj,uid)=> INVOKERS.get(uid) === msg.id,
            type: "edit",
            response: (msg,args,uID) => {
                msg.removeReactions();                
                buySomething(msg,uID, 'events:halloween20.arsenika.acCask' ,{$inc:{'eventData.halloween20.caskets':1}},500,5000,25)
            },
            
        },{
            emoji: 'EVT:765986694691422208',
            filter:(msg,emj,uid)=> INVOKERS.get(uid) === msg.id,
            type: "edit",
            response: async (msg,args,uID) => {
                msg.removeReactions();                

                let prompt = await msg.channel.send( "**"+$t('events:halloween20.arsenika.howMany')+"**");
                let res = await msg.channel.awaitMessages(m=>m.author.id === uID && (Number(m.content) > 0),{maxMatches:1,time:15e3});
                if (!res[0]) return msg.channel.send("Are you gonna just look at me like that?");
                prompt.delete().catch(err=>null);
                res[0].delete().catch(err=>null);
                let amt = Math.abs( ~~( Number(res[0]?.content) ) );
                if (amt < 1) return msg.channel.send("Are you trying to fool me?");

                buySomething(msg,uID,'events:halloween20.arsenika.acToken',{$inc:{eventGoodie:amt}},amt*2,amt*50,.5)
            },
            
        },{
            emoji: "❌",
            filter:(msg,emj,uid)=> INVOKERS.get(uid) === msg.id,
            type: "cancel", 
            response: async (msg,args,uID) => {
                msg.channel.send($t('events:halloween20.arsenika.cancel',{lngs:[msg.channel.LANG||msg.guild.LANG,'dev']}));
            }    
        }
    ]
}



async function buySomething(msg,userID,what,DBquery,priceC=1000,priceR=1000,weight=1){


    const P = {lngs:[msg.channel.LANG||msg.guild.LANG,'dev']}

    console.log(userID)
    const embed = msg.embeds[0];
   
    //embed.description = "Waiting...";
    //msg.edit({embed});
    let promptEmbed = {
        title: $t('events:halloween20.arsTitle',P),
        thumbnail: {url:"https://cdn.discordapp.com/attachments/488142034776096772/770110704303996938/unknown.png"},
        description: `${$t(what,P)}

<:CANDY:769023260050325535> **${priceC}**
<:RBN:765986694717374515> **${priceR}**
`,
    }

    let prompt = await msg.channel.send({embed:promptEmbed});

    prompt.addReaction(':CANDY:769023260050325535');
    prompt.addReaction(_emoji('RBN').reaction);

    const reas = await prompt.awaitReactions(rea=> rea.userID === userID,{maxMatches:1,time:15e3}).catch(err=>null);

    let rea = reas[0];
    if(!rea) return prompt.edit({embed:{description: $t('events:halloween20.arsenika.timeout',P) }});
    
    const eventData = await EV.userData(userID);
    const userData = await DB.users.getFull(userID);

    if(what === 'events:halloween20.arsenika.acCask'){
        if(eventData.caskets >= 5){
            return "you can't hold more than 5 caskets at a time!";
        }        
    }


    prompt.removeReactions()

    const covenant = await avicheck.init(rea.author,true);
    let covBonus = (covenant=='dusk'?5:covenant=='umbral'?-5:0) * 10;

    if(rea.emoji.name === 'CANDY'){
        if (eventData.candy >= priceC) {
            if(typeof DBquery === 'string'){
                await userData.addItem(DBquery, 1);
            }else if(typeof DBquery === 'object'){
                await DB.users.set(userID, DBquery);
            }
            await DB.users.set(userID,{$inc:{'eventData.halloween20.candy': -priceC }});
            promptEmbed.description = (_emoji('yep')+ $t('events:halloween20.arsenika.completeC',P) )
            prompt.edit({embed:promptEmbed})
            DB.users.set(userID,{$inc:{'eventData.halloween20.affinityArs': weight + covBonus }})
        }else{
            prompt.removeReactions()
            promptEmbed.description = (_emoji('nope')+$t('events:halloween20.arsenika.noCashC',P) )
            return prompt.edit({embed:promptEmbed});
        }
    }

    if(rea.emoji.id === _emoji('RBN').id){
        if (userData.modules.rubines >= priceR) {
            if(typeof DBquery === 'string'){
                await userData.addItem(DBquery, 1);
            }else if(typeof DBquery === 'object'){
                await DB.users.set(userID, DBquery);
            }
            await DB.users.set(userID,{$inc:{'modules.rubines': -priceR }});
            promptEmbed.description = (_emoji('yep')+$t('events:halloween20.arsenika.completeR',P) )
            prompt.edit({embed:promptEmbed})
            DB.users.set(userID,{$inc:{'eventData.halloween20.affinityArs': weight + covBonus }})
        }else{
            promptEmbed.description = (_emoji('nope')+$t('events:halloween20.arsenika.noCashR',P) )
            return prompt.edit({embed:promptEmbed});
        }
    }

}

