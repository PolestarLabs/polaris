module.exports = async function run(oldMessage){
    if(!oldMessage || !oldMessage.author) return;
    oldMessage.channel.snipe = {
        msg_old:{
            content:        oldMessage.content
            ,attachment:    (oldMessage.attachments||[oldMessage.attachments])?.[0]
        }
        ,author:{
            avatarURL:  oldMessage.author.avatarURL,
            tag:        oldMessage.author.tag
        },
        timestamp: new Date()
    }
}