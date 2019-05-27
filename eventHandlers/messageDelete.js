module.exports = async function run(oldMessage){
    if(!oldMessage) return;
    if(oldMessage.author.bot) return;
    oldMessage.channel.snipe = {
        msg_old:{
            content:        oldMessage.content
            ,attachment:    oldMessage.attachments[0]
        }
        ,author:{
            avatarURL:  oldMessage.author.avatarURL,
            tag:        oldMessage.author.tag
        },
        timestamp: new Date()
    }
}