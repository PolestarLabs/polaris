const play = async function (msg,SOUND,options) {

    const {playingMessage,exitMessage} = options||{};

    if(!msg.guild || !msg.member.voiceState?.channelID){
        return msg.channel.send("Please join a voice channel first!");
    }

    PLX.joinVoiceChannel(msg.member.voiceState.channelID)
        .catch((err) => msg.channel.send("Please join a voice channel first!") )
        .then((voiceChannel) => {
        if (voiceChannel.playing) voiceChannel.stopPlaying();
        
        voiceChannel.play(SOUND);        
        if (playingMessage) msg.channel.send( playingMessage );  

        voiceChannel.once("end", () => {
            if (exitMessage) msg.channel.send( exitMessage );
            PLX.leaveVoiceChannel(msg.member.voiceState.channelID)
        });
    });

};

module.exports = {play}
