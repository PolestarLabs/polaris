const init = async function (msg,args){

if(args[0] == 'add'){
    if(args[1]){
        targetChannels = msg.channelMentions
        await DB.users.set(msg.author.id,{$addToSet:{'switches.channeldeck': {$each: targetChannels }  }});
        msg.addReaction(_emoji('yep').reaction);
        
    }
}

else if(args[0] == 'del'){
    if(args[1]){
        targetChannels = msg.channelMentions
        await DB.users.set(msg.author.id,{$pull:{'switches.channeldeck': {$each: [targetChannels]}  }});
        msg.addReaction(_emoji('yep').reaction);
         
    }
}

else{
    
    msg.delete().catch(e=>null)
    
    const userChannelDeck = ((await DB.users.get(msg.author.id)).switches||{}).channeldeck || [];

    let deck = userChannelDeck.map(chn=> `<#${chn}>`);
    msg.channel.createMessage({embed:{
        
        description: `
        **Channel Deck**
        ${_emoji('__') +deck.join('\u2003\n'+_emoji('__') )}
        
        `
       , footer:{text:msg.author.tag, icon_url: msg.author.avatarURL}
       ,color: 0x7289DA
        
    }}) //.then(ms=>{ms.deleteAfter(10000); msg.delete()});
}

}
module.exports={
    init
    ,pub:true
    ,cmd:'chdeck'
    ,perms:3
    ,cat:'utility'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['chdk']
}