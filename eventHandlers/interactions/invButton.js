
module.exports = async (interaction, data) => {

    const [, , ownerID] = data.custom_id?.split(':') || [];
    const [val] = data.values;


    if (ownerID != interaction.userID) {
        return interaction.reply({
            content: "Stop poking other people's stuff!",
            flags: 64
        });
    }
    let destination;
    if (val === ("LOOTBOX")) destination = require("../../core/commands/inventory/lootbox.js").init;
    if (val === ("BOOSTER")) destination = require("../../core/commands/inventory/boosterpack.js").init;
    if (val === ("KEY")) destination = require("../../core/commands/inventory/key.js").init;
    if (val === ("MATERIAL")) destination = require("../../core/commands/inventory/material.js").init;
    if (val === ("CONSUMABLE")) destination = require("../../core/commands/inventory/consumable.js").init;
    if (val === ("JUNK")) destination = require("../../core/commands/inventory/junk.js").init;
    if (val === ("CLOSE")) {
        interaction.ack();
        return interaction.message.disableButtons("all");
    }
    
    const selectRowOne = interaction.message.components[0];
    selectRowOne.components[0].options.forEach(s=> s.default = s.value === val);

    const fakeMsg = Object.assign({}, interaction.message, {
        author: await PLX.resolveUser(interaction.userID),
        prefix: PLX.guildPrefixes[interaction.guild.id][0]
    });    
    let args = [];
    args[10] = interaction.userID;

    await interaction.message.edit({components:[selectRowOne]});
    interaction.ack().catch(err=>null);
    const payload = await destination(fakeMsg, args, interaction.userID, interaction.message);

    const components_original = payload.components||[];
    payload.components = [selectRowOne,components_original[0]].filter(x=>!!x);
 
    interaction.message.edit(payload).catch(err=>null);
 

}