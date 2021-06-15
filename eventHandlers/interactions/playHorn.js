const BOARD = require("../../core/archetypes/Soundboard.js");
module.exports = async (interaction, data) => {
    interaction.ack();
    const fakeMsg = interaction.message;
    fakeMsg.author = interaction.member.user;
    fakeMsg.member = await PLX.resolveMember(fakeMsg.guild.id, interaction.userID);
    console.log(fakeMsg)


    const [, sound] = data.custom_id.split(":");
    if (sound == "horn") BOARD.play(fakeMsg, "https://cdn.discordapp.com/attachments/488142034776096772/848254716765143071/colonydeed_partyhorn.ogg", { dontLeave: true });
    if (sound == "verstappen") BOARD.play(fakeMsg, "https://cdn.discordapp.com/attachments/415550879823953930/755212852184481983/verstappen-after-another-race-mugello-2020-tuscan-gp.mp3", { dontLeave: true });
    if (sound == "bolinha") BOARD.play(fakeMsg, `${paths.ASSETS}/sound/bolinadegolfe.mp3`, { dontLeave: true });
    if (sound == "noot") BOARD.play(fakeMsg, `${paths.ASSETS}/sound/noot.mp3`, { dontLeave: true });


}