const axios = require('axios');

const init = async function (msg) {

    setTimeout(async () => {
        const { voiceState } = (await PLX.resolveMember(msg.guild.id, PLX.user.id));
        if (!voiceState.channelID) return;
        const currentChannel = (await PLX.getChannel(voiceState.channelID));
        if (currentChannel.type !== 13) return;

        axios.patch(`https://discord.com/api/v8/guilds/${currentChannel.guild.id}/voice-states/${PLX.user.id}`,
            {
                "suppress": false,
                "channel_id": voiceState.channelID
            },
            { headers: { Authorization: PLX.token, 'Content-Type': 'application/json' } }
        ).catch(err => {
            msg.addReaction(_emoji('nope').reaction);
        });
        msg.addReaction(_emoji('yep').reaction);
    }, 1200);
}


module.exports = {
    init
    , pub: true
    , argsRequired: true
    , cmd: 'play'
    , cat: 'music'
    , botPerms: ['attachFiles', 'embedLinks']
    , aliases: ['p']
}