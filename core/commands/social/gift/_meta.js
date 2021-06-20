module.exports = {    
    ITEM_TYPES : [
        {
            type: "background",
            aliases: ["bg"],
            database: "cosmetics",
            inventory: "bgInventory",
            equipSlot: "bgID",
            finder: "code"
        },
        {
            type: "medal",
            aliases: ["mdl","badge"],
            database: "cosmetics",
            inventory: "medalInventory",
            equipSlot: "medals",
            finder: "icon"
        },
        {
            type: "sticker",
            aliases: ["stk"],
            database: "cosmetics",
            inventory: "stickerInventory",
            equipSlot: "sticker",
            finder: "id"
        }
    ]
}