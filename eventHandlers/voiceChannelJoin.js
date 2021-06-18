const axios = require('axios');

module.exports = async (member, newChannel) => {
    if (member.id === PLX.user.id) {
        if (newChannel.type !== 13) return;
        PLX.requestHandler.request("PATCH", `/guilds/${newChannel.guild.id}/voice-states/@me`, true, {
            suppress: false,
            channel_id: newChannel.id,
        })
    }
};
