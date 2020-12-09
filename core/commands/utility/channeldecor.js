const init = async function (msg,args){

    let targetParent = (PLX.getChannel(msg.channelMentions[0]|| msg.channel.id)).parentID;
    
    if(!targetParent) return msg.addReaction(_emoji('nope').reaction);
    // FIXME[epic=flicky] Not a function https://discord.com/channels/277391723322408960/755894901308260422/786192561932861460
    if( !targetParent.permissionsOf(msg.author.id).has('manageChannels') ) return msg.addReaction(_emoji('nope').reaction);

    let emojiC = args.filter(a=>!a.includes(targetParent))[0];
    
    if(args[0] === 'clear'){
        msg.guild.channels.filter(c=>c.parentID == targetParent)
            .forEach((chn,i,arr)=>{
                let newName = chn.name+"";
                newName = newName.replace(/╭₊꒰(.+)꒱・/g,'');
                newName = newName.replace(/┃₊꒰(.+)꒱・/g,'');
                newName = newName.replace(/╰₊꒰(.+)꒱・/g,'');
                chn.edit({name: `${newName}`});
            });
        return msg.addReaction(_emoji('yep').reaction);
    }

    const emojiRegex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g

    console.log(args,emojiC,targetParent)

    let emoji = emojiC.match(emojiRegex) ? emojiC : `🧪`;

    msg.guild.channels.filter(c=>c.parentID == targetParent)
        .sort((a,b)=>a.position-b.position)
        .forEach((chn,i,arr)=>{
            let newName = chn.name+"";
            newName = newName.replace(/╭₊꒰(.+)꒱・/g,'');
            newName = newName.replace(/┃₊꒰(.+)꒱・/g,'');
            newName = newName.replace(/╰₊꒰(.+)꒱・/g,'');
            if(i === 0) chn.edit({name: `╭₊꒰${emoji}꒱・${newName}`});
            else if(i === arr.length-1) chn.edit({name: `╰₊꒰${emoji}꒱・${newName}`});
            else chn.edit({name: `┃₊꒰${emoji}꒱・${newName}`});
        })
        return msg.addReaction(_emoji('yep').reaction);    
}

module.exports={
    init
    ,pub:true
    ,cmd:'channeldecor'
    ,cat:'utility'
    ,botPerms:['manageChannels']
    ,aliases:['chdc']
}

