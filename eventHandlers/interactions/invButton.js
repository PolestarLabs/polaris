module.exports = async (interaction, data) => {
    console.log({data})
    let destination;
    if (data.custom_id.includes("LOOTBOX") ) destination = require("./lootbox.js").init;
    if (data.custom_id.includes("BOOSTER") ) destination = require("./boosterpack.js").init;
    if (data.custom_id.includes("KEY") ) destination = require("./key.js").init;
    if (data.custom_id.includes("MATERIAL") ) destination = require("./material.js").init;
    if (data.custom_id.includes("CONSUMABLE") ) destination = require("./consumable.js").init;
    if (data.custom_id.includes("JUNK") ) destination = require("./junk.js").init;

    const fakeMsg = Object.assign({}, interaction.message, {
        author: await PLX.resolveUser(interaction.userID)
    })
    let args = [];
    args[10] = interaction.userID;
    const payload = await destination(fakeMsg,args ,interaction.userID);

    console.log({payload})
    interaction.ack();
    let stashComponents;
    if (payload.components) {
        stashComponents = payload.components;
        payload.components = undefined;
    }

    interaction.message.edit( payload ).then(m=>{
        if (stashComponents) m.addButtons(stashComponents[0].components,2);
        else interaction.message.removeComponentRow(2);
    });
  
}