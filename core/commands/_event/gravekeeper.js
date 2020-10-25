const Picto = require('../../utilities/Picto.js');
const ECO = require('../../archetypes/Economy.js');
const avicheck = require('./avatarcheck.js')
const EventData = require('../../archetypes/Events.js');
const EV = EventData.event_details; 

const init = async function (msg){
    const P = {lngs:msg.lang}
    const eventData = await EV.userData(msg.author);
    const embed = {
        title: $t('events:hallowinter.noxTitle',P),
        footer: {
            icon_url: msg.author.avatarURL,
            text: msg.author.tag
        }
    };

    const covenant = await avicheck.init(msg,true);

    embed.image = {url: paths.Build + '/events/halloween20/nox-store.png'}

    embed.description = $t('events:halloween18.noctix.greet',P)
    embed.fields = [
        {name: "Affinity with Noctix",value: (eventData.affinityNox || 0) + "/500", inline:true},
        {name: "Affinity Bonus",value: (covenant === 'umbral' ? 25 : covenant === 'dusk' ? -25 : 0) + "%", inline:true},
    ]

    let postMsg = await msg.channel.send({embed});

    return postMsg;

}
module.exports={
    init
    ,pub:true
    ,cmd:'gravekeeper'
    ,cat:'_event'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['noctix','gk','umbral']
    ,reactionButtons:[
        {
            emoji: 'wickedrose:769730202782793809',
            type: "edit",
            response: (msg,args,uID) => {
                msg.removeReactions();                
                buySomething(msg,uID,"events:halloween20.acRose",'wicked_rose',350,2500,50)
            }, 
        },{
            emoji: 'casket:504412718753644555',
            type: "edit",
            response: (msg,args,uID) => {
                msg.removeReactions();                
                buySomething(msg,uID, 'events:halloween18.noctix.acCask' ,{$inc:{'eventData.halloween20.caskets':1}},666,3000,25)
            },
            
        },{
            emoji: 'EVT:765986694691422208',
            type: "edit",
            response: async (msg,args,uID) => {
                msg.removeReactions();                

                let prompt = msg.channel.send( "**"+$t('events:halloween18.noctix.howMany')+"**");
                let res = await msg.channel.awaitMessages(m=>m.author.id === uID && (Number(m.content) > 0),{maxMatches:1,time:15e3});
                if (!res[0]) return msg.channel.send("Are you gonna just look at me like that?");
                prompt.delete().catch(err=>null);
                res[0].delete().catch(err=>null);
                let amt = Math.abs( ~~( Number(res[0]?.content) ) );
                if (amt < 1) return msg.channel.send("Are you trying to fool me?");

                buySomething(msg,uID,'events:halloween18.noctix.acToken',{$inc:{eventGoodie:0}},1,100,.5)
            },
            
        },{
            emoji: "❌",
            type: "cancel", 
            response: async (msg,args,uID) => {
                msg.channel.send($t('events:halloween18.noctix.cancel',{lngs:[msg.channel.LANG||msg.guild.LANG,'dev']}));
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
        title: $t('events:hallowinter.noxTitle',P),
        thumbnail: {url:"https://cdn.discordapp.com/attachments/488142034776096772/769335416590696458/unknown.png"},
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
    if(!rea) return prompt.edit({embed:{description: $t('events:halloween18.noctix.timeout',P) }});
    
    const eventData = await EV.userData(userID);
    const userData = await DB.users.getFull(userID);
    prompt.removeReactions()

    const covenant = await avicheck.init(rea.author,true);
    let covBonus = (covenant=='umbral'?5:covenant=='dusk'?-5:0);

    if(rea.emoji.name === 'CANDY'){
        if (eventData.candy >= priceC) {
            if(typeof DBquery === 'string'){
                await userData.addItem(DBquery, 1);
            }else if(typeof DBquery === 'object'){
                await DB.users.set(userID, DBquery);
            }
            await DB.users.set(userID,{$inc:{'eventData.halloween20.candy': -priceC }});
            promptEmbed.description = (_emoji('yep')+ $t('events:halloween18.noctix.completeC',P) )
            prompt.edit({embed:promptEmbed})
            DB.users.set(userID,{$inc:{'eventData.halloween20.affinityNox': weight + covBonus }})
        }else{
            prompt.removeReactions()
            promptEmbed.description = (_emoji('nope')+$t('events:halloween18.noctix.noCashC',P) )
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
            promptEmbed.description = (_emoji('yep')+$t('events:halloween18.noctix.completeR',P) )
            prompt.edit({embed:promptEmbed})
            DB.users.set(userID,{$inc:{'eventData.halloween20.affinityNox': weight + covBonus }})
        }else{
            promptEmbed.description = (_emoji('nope')+$t('events:halloween18.noctix.noCashR',P) )
            return prompt.edit({embed:promptEmbed});
        }
    }

}

