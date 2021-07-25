const INVENTORY = require("../../core/archetypes/Inventory.js");
const { createInventoryEmbed } = require("../../core/commands/inventory/lootbox.js");
const GENERATOR = require("../../core/commands/cosmetics/lootbox_generator.js");
module.exports = async (interaction, data) => {
    const buttonArgs = data.custom_id.split(':');

    const [, boxType, originalAuthor, primaryLang] = buttonArgs;

    const { userID, message } = interaction;
    const author = await PLX.resolveUser(originalAuthor);

    if (userID !== originalAuthor) return interaction.reply({
        content: "Only the owner can see inside. Shoo!",
        flags: 64
    });

    const userInventory = new INVENTORY(userID, "box");
    let Inventory = await userInventory.listItems();
    const selectedBox = Inventory.find((bx) => bx.rarity === boxType);

    if (!selectedBox) return interaction.reply({
        content: $t("responses.inventory.noSuchBox", { lngs: [primaryLang, 'dev'] }),
        flags: 64
    });
    interaction.ack();


    const fakeMsg = interaction.message;
    fakeMsg.author = author;
    fakeMsg.lang = [primaryLang, "en", "dev"];
    fakeMsg.prefix = interaction.message.prefix;


    //this.hooks = GENERATOR.hooks;
    await GENERATOR.init(fakeMsg, { boxID: selectedBox.id }).catch(console.error);

    Inventory = await userInventory.listItems();
    //const currentButtons = interaction.messageRaw.components[0]?.components;


    await interaction.message.updateButtons(["C", "UR", "SR", "UR"].map(button => {
        return {
            custom_id: new RegExp(`openBox:${button}:`),
            disabled: !Inventory.find((bx) => bx.rarity === button)
        }
    }));

    await interaction.message.edit({
        embed: createInventoryEmbed(Inventory, fakeMsg),
        //components: [{type:1,components: currentButtons}]
    })
}