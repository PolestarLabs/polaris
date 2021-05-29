const play = async (msg, SOUND, options) => {
  const { playingMessage, exitMessage } = options || {};

  if (!msg.guild || !msg.member.voiceState?.channelID) {
    return msg.channel.send("Please join a voice channel first!");
  }

  return PLX.joinVoiceChannel(msg.member.voiceState.channelID).then(
    (voiceChannel) => {
      voiceChannel.dontLeave = false;
      if (voiceChannel.playing) {
        voiceChannel.dontLeave = true;
        voiceChannel.stopPlaying();
      }

      voiceChannel.play(SOUND);
      if (playingMessage) msg.channel.send(playingMessage);

      voiceChannel.on("end", () => {
        if (!voiceChannel.dontLeave && !options?.dontLeave) {
          if (exitMessage) msg.channel.send(exitMessage);
          PLX.leaveVoiceChannel(msg.member.voiceState.channelID);
        }
      });
    },
    () => msg.channel.send("Please join a voice channel first!"),
  );
};

module.exports = { play };
