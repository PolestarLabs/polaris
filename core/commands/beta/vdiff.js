const init = async function (msg) {

    const userData = (await DB.users.findOne({ id: msg.author.id }).noCache())._doc;
    const vanillaUserData = (await vDB.users.findOne({ id: msg.author.id }).noCache())._doc;

 

    return {
        embed: {
            fields: [
                {
                    name: "Polaris DB", value: `
                Rubines: \`${userData.modules.RBN}\`
                Sapphires: \`${userData.modules.SPH}\`
                Jades: \`${userData.modules.JDE}\`
                Level: \`${userData.modules.level}\`
                Exp: \`${userData.modules.exp}\`
                Inventory: \`${userData.modules.inventory.length}\`
                Backgrounds: \`${userData.modules.bgInventory.length}\`
                Medals: \`${userData.modules.medalInventory.length}\`
                Stickers: \`${userData.modules.stickerInventory.length}\`
                Flairs: \`${userData.modules.flairsInventory.length}\`
                Equipped BG: 
                 • \`${userData.modules.bgID.padEnd(32, ' ')}\`
                Equipped Medals:
                \u2003 • \`${userData.modules.medals.join('\`\n\u2003 • \`')}\`
                
                `, inline: true
                },
                {
                    name: "Vanilla DB", value: `
                Rubines: \`${vanillaUserData.modules.rubines}\`
                Sapphires: \`${vanillaUserData.modules.sapphires}\`
                Jades: \`${vanillaUserData.modules.jades}\`
                Level: \`${vanillaUserData.modules.level}\`
                Exp: \`${vanillaUserData.modules.exp}\`
                Inventory: \`${vanillaUserData.modules.inventory.length}\`
                Backgrounds: \`${vanillaUserData.modules.bgInventory.length}\`
                Medals: \`${vanillaUserData.modules.medalInventory.length}\`
                Stickers: \`${vanillaUserData.modules.stickerInventory.length}\`
                Flairs: \`${vanillaUserData.modules.flairsInventory.length}\`
                Equipped BG:
                 • \`${vanillaUserData.modules.bgID.padEnd(32, ' ')}\`
                Equipped Medals:
                \u2003 • \`${vanillaUserData.modules.medals.join('\`\n\u2003 • \`')}\`
                
                `, inline: true
                },
            ]
        }
    }



}
module.exports = {
    init
    , pub: false
    , cmd: 'vdiff'
    , cat: 'beta'
    , botPerms: ['attachFiles', 'embedLinks']
    , aliases: []
}