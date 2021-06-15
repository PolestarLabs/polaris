const axios = require('axios');

module.exports = async (member, newChannel) => {
    console.log("VC JOIN")
    if (member.id === PLX.user.id) {
        console.log(newChannel.type)
        if (newChannel.type !== 13) return;
        PLX.requestHandler.request("PATCH", `/guilds/${newChannel.guild.id}/voice-states/@me`, true, {
            suppress: false,
            channel_id: newChannel.id,
        })
    }
};
