const play = async function (msg,SOUND,options) {

    const {playingMessage,exitMessage} = options||{};

    if(!msg.guild || !msg.member.voiceState?.channelID){
        return msg.channel.send("Please join a voice channel first!");
    }

    PLX.joinVoiceChannel(msg.member.voiceState.channelID)
        .catch((err) => msg.channel.send("Please join a voice channel first!") )
        .then((voiceChannel) => {
            voiceChannel.dontLeave = false;
            if (voiceChannel.playing) {
                voiceChannel.dontLeave = true;
                voiceChannel.stopPlaying();
            };
        
        voiceChannel.play(SOUND);
        if (playingMessage) msg.channel.send( playingMessage );  

        voiceChannel.on("end", () => {
            if(!voiceChannel.dontLeave){
                if (exitMessage) msg.channel.send( exitMessage );
                PLX.leaveVoiceChannel(msg.member.voiceState.channelID)
            }else{

            }
        });
    });

};

module.exports = {play}
