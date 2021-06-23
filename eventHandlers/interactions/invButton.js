
module.exports = async (interaction, data) => {

    const startimer = Date.now();

    _benchmark = (s) => {
    console.log(`${s.blue + (Date.now() - startimer)}ms`);
    };


    const [, , ownerID] = data.custom_id?.split(':') || [];

    if (ownerID != interaction.userID) {
        return interaction.reply({
            content: "Stop poking other people's stuff!",
            flags: 64
        });
    }
    let destination;
    if (data.custom_id.includes("LOOTBOX")) destination = require("../../core/commands/inventory/lootbox.js").init;
    if (data.custom_id.includes("BOOSTER")) destination = require("../../core/commands/inventory/boosterpack.js").init;
    if (data.custom_id.includes("KEY")) destination = require("../../core/commands/inventory/key.js").init;
    if (data.custom_id.includes("MATERIAL")) destination = require("../../core/commands/inventory/material.js").init;
    if (data.custom_id.includes("CONSUMABLE")) destination = require("../../core/commands/inventory/consumable.js").init;
    if (data.custom_id.includes("JUNK")) destination = require("../../core/commands/inventory/junk.js").init;
    if (data.custom_id.includes("CLOSE")) {
        interaction.ack();
        return interaction.message.disableButtons("all");
    }
    _benchmark('-u1')
    const fakeMsg = Object.assign({}, interaction.message, {
        author: await PLX.resolveUser(interaction.userID),
        prefix: PLX.guildPrefixes[interaction.guild.id][0]
    })
    
    _benchmark('-u2')
    let args = [];
    args[10] = interaction.userID;

    const injectComponents = await interaction.message.updateButtons([
        { custom_id: data.custom_id, style: 1, disabled: true, label: data.custom_id.split(':')[1] },
        { custom_id: "BLANK", disabled: true },
        { custom_id: /CLOSE/, style: 4 },
        { custom_id: /.*/g, style: 2, disabled: false, label: "" },
    ],{returnObj:true});


    let payload = destination(fakeMsg, args, interaction.userID);

    let stashComponents;
    payload = await payload;
    if (payload.components) {
        stashComponents = payload.components;
        payload.components = undefined;
    }
    payload.components = injectComponents;
    if (stashComponents) payload.components.push(stashComponents[0]);
    else payload.components.splice(2,1);

    interaction.message.edit(payload).then(m => {
        interaction.ack();
        //if (stashComponents) m.addButtons(stashComponents[0].components, 2);
        //else interaction.message.removeComponentRow(2);
        
    });

}