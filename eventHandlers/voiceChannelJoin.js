const axios = require('axios');

module.exports = async (member,newChannel) => {
    console.log("VC JOIN")
    if(member.id === PLX.user.id){
        console.log(newChannel.type)
        if(newChannel.type !== 13) return;
        axios.patch(`https://discord.com/api/v8/guilds/${newChannel.guild.id}/voice-states/${member.id}`,
            { headers: { Authorization: PLX.token, 'Content-Type':'application/json' } },
            {
                "suppress": false,
                "channel_id": newChannel.id
            }
        )
    } 
};
