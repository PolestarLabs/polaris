module.exports = async (interaction, data) => {
    console.log({data})
    let destination;
    if (data.custom_id.includes("LOOTBOX") ) destination = require("../../core/commands/inventory/lootbox.js").init;
    if (data.custom_id.includes("BOOSTER") ) destination = require("../../core/commands/inventory/boosterpack.js").init;
    if (data.custom_id.includes("KEY") ) destination = require("../../core/commands/inventory/key.js").init;
    if (data.custom_id.includes("MATERIAL") ) destination = require("../../core/commands/inventory/material.js").init;
    if (data.custom_id.includes("CONSUMABLE") ) destination = require("../../core/commands/inventory/consumable.js").init;
    if (data.custom_id.includes("JUNK") ) destination = require("../../core/commands/inventory/junk.js").init;
    if (data.custom_id.includes("CLOSE") ) {
        interaction.ack();
        return interaction.message.disableButtons("all");
    }

    const fakeMsg = Object.assign({}, interaction.message, {
        author: await PLX.resolveUser(interaction.userID)
    })
    let args = [];
    args[10] = interaction.userID;
    const payload = await destination(fakeMsg,args ,interaction.userID);

    await interaction.message.removeComponentRow(2);
    await interaction.message.updateButtons([
        {custom_id: data.custom_id, style: 1, disabled: true, label:data.custom_id.split(':')[1] },
        {custom_id: "BLANK", disabled: true},
        {custom_id: /CLOSE/, style:4},
        {custom_id:/.*/g,style:2,disabled:false,label:""},
    ]);    

    let stashComponents;
    if (payload.components) {
        stashComponents = payload.components;
        payload.components = undefined;
    }
    
    
    interaction.message.edit( payload ).then(m=>{
        if (stashComponents) m.addButtons(stashComponents[0].components,2);
        //else interaction.message.removeComponentRow(2);
        interaction.ack();       
    });
  
}