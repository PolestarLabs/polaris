module.exports = async function run(msg,oldMessage){
    if(!oldMessage) return;
    if(msg.author.bot) return;
    msg.channel.snipe = {
        msg_old:{
            content:        oldMessage.content
            ,attachment:    (oldMessage.attachments||[oldMessage.attachments])?.[0]
        },
        msg_new:{
            content:        msg.content            
        }
        ,author:{
            avatarURL:  msg.author.avatarURL,
            tag:        msg.author.tag
        }
        ,timestamp: new Date()
    }
}