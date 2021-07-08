module.exports = async (interaction, data) => {
    const [,guildID,channelID] = data.custom_id.split(":");
    const messageID = interaction.message.id;

    const dropSwitch = (await DB.reactRoles.findOne({
        message: guildID === "demo" ? "demo" : messageID,
        channel: channelID,
        server: guildID,
        type:"drop-multi"
    }))?._doc;

    if (!dropSwitch) return;

    let newOption = dropSwitch.options.find(({componentOption:opt})=>{
        return opt.value == data.values[0];
    });
    
    if (data.values[0] == 0) return interaction.ack();
 
    interaction.reply({
        flags: 64,
        embed:{},
        embeds:[],
        content: "",
        ...newOption.payload
    })

   

}