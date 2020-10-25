const Picto = require('../../utilities/Picto.js');
const ECO = require('../../archetypes/Economy.js');
const avicheck = require('./avatarcheck.js')
const EventData = require('../../archetypes/Events.js');
const EV = EventData.event_details; 

const init = async function (msg){
    const P = {lngs:msg.lang}
    const eventData = await EV.userData(msg.author);
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
            response: (msg,args,uID) => {
                msg.removeReactions();
                //check if flair
                //check if 5 amulet
                //go
                buySomething(msg,uID,'events:halloween20.australis.amulet')
            }, 
        },{
            emoji: 'wickedrose:769730202782793809',
            type: "edit",
            response: (msg,args,uID) => {
                msg.removeReactions();
                //check if flair
                //check if 5 circlets
                //go
                buySomething(msg,uID,"events:halloween20.australis.spellbind")
            }, 
        },{
            emoji: ':CANDY:769023260050325535',
            type: "edit",
            response: (msg,args,uID) => {
                msg.removeReactions();
                //check if rubines
                //go
                buySomething(msg,uID, 'events:halloween20.australis.candy' )
            },
            
        },{
            emoji: '☯️',
            type: "edit",
            response: async (msg,args,uID) => {
                msg.removeReactions();
                //check gender
                // check if flair 1
                // check if flair 2
                //check if jiangshi parts R+
                //go
                buySomething(msg,uID,'events:halloween20.australis.jiangshi')
            },
            
        },{
            emoji: '🔯 ',
            type: "edit",
            response: async (msg,args,uID) => {
                msg.removeReactions();
                //check gender
                // check if flair 1
                // check if flair 2
                //check if magician parts R+
                //go
                buySomething(msg,uID,'events:halloween20.australis.magician')
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



async function buySomething(msg,userID,what,DBquery,priceC=1000,priceR=1000,weight=1){

    const P = {lngs:[msg.channel.LANG||msg.guild.LANG,'dev']}

    console.log(userID)
    const embed = msg.embeds[0];
   
    //embed.description = "Waiting...";
    //msg.edit({embed});
    let promptEmbed = {
        title: $t('events:halloween20.arsTitle',P),
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
    if(!rea) return prompt.edit({embed:{description: $t('events:halloween20.arsenika.timeout',P) }});
    
    const eventData = await EV.userData(userID);
    const userData = await DB.users.getFull(userID);
    prompt.removeReactions()

    const covenant = await avicheck.init(rea.author,true);
    let covBonus = (covenant=='dusk'?5:covenant=='umbral'?-5:0);

    if(rea.emoji.name === 'CANDY'){
        if (eventData.candy >= priceC) {
            if(typeof DBquery === 'string'){
                await userData.addItem(DBquery, 1);
            }else if(typeof DBquery === 'object'){
                await DB.users.set(userID, DBquery);
            }
            await DB.users.set(userID,{$inc:{'eventData.halloween18.candy': -priceC }});
            promptEmbed.description = (_emoji('yep')+ $t('events:halloween20.arsenika.completeC',P) )
            prompt.edit({embed:promptEmbed})
            DB.users.set(userID,{$inc:{'eventData.halloween18.affinityNox': weight + covBonus }})
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
            DB.users.set(userID,{$inc:{'eventData.halloween18.affinityNox': weight + covBonus }})
        }else{
            promptEmbed.description = (_emoji('nope')+$t('events:halloween20.arsenika.noCashR',P) )
            return prompt.edit({embed:promptEmbed});
        }
    }

}

