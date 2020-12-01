const init = async function (msg, args) {    


    let messageID = (args[0] && !isNaN(args[0]) && args[0].length > 10) || args[0].split('/').slice(-1);
    if ( messageID) {
        let tmsg = await PLX.getPreviousMessage(msg, args[0]);
        if (tmsg) {
                
            msg.channel.send({embed:{
                    description: `[${tmsg.content}](https://discordapp.com/channels/${tmsg.guild.id}/${tmsg.channel.id}/${tmsg.id})`,
                    thumbnail: {url: tmsg.author.avatarURL.replace(512,32)},
                    color: serverColor(tmsg.author),
                    title: tmsg.author.tag,
                    image:{url:tmsg.attachments?.[0]?.url || null},
                    timestamp: new Date(tmsg.timestamp)
            }})

        }else{
            msg.addReaction(_emoji('nope').reaction);
        }
    }else{
        msg.addReaction(_emoji('nope').reaction);
    }

    function serverColor(TARGET) {
        const roles = msg.guild.member(TARGET).roles.map((r) => msg.guild.roles.get(r)).filter((x) => x.color).sort((a, b) => b.position - a.position);
        const color = roles[0]?.color || 0xf53258;
        return color;
    }
};


module.exports = {
  init,
  pub: false,
  cmd: "msglink",
  cat: "utility",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ['mlnk'],
};
