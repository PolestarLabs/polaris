const init = async function (msg) {

    const [userDocResult, cosmeticsData] = await Promise.all([
        DB.users.findOne({ id: msg.author.id }).noCache(),
        DB.userCosmetics.get(msg.author.id),
    ]);
    const userData = userDocResult._doc;
    const vanillaUserData = (await vDB.users.findOne({ id: msg.author.id }).noCache())._doc;

 

    return {
        embed: {
            fields: [
                {
                    name: "Polaris DB", value: `
                Rubines: \`${userData.currency.RBN}\`
                Sapphires: \`${userData.currency.SPH}\`
                Jades: \`${userData.currency.JDE}\`
                Level: \`${userData.progression.level}\`
                Exp: \`${userData.progression.exp}\`
                Inventory: \`${(cosmeticsData?.inventory||[]).length}\`
                Backgrounds: \`${(cosmeticsData?.bgInventory||[]).length}\`
                Medals: \`${(cosmeticsData?.medalInventory||[]).length}\`
                Stickers: \`${(cosmeticsData?.stickerInventory||[]).length}\`
                Flairs: \`${(cosmeticsData?.flairInventory||[]).length}\`
                Equipped BG:
                 • \`${userData.profile.bgID.padEnd(32, ' ')}\`
                Equipped Medals:
                \u2003 • \`${userData.profile.medals.join('\`\n\u2003 • \`')}\`
                
                `, inline: true
                },
                {
                    name: "Vanilla DB", value: `
                Rubines: \`${vanillaUserData.modules.rubines}\`
                Sapphires: \`${vanillaUserData.modules.sapphires}\`
                Jades: \`${vanillaUserData.modules.jades}\`
                Level: \`${vanillaUserData.progression.level}\`
                Exp: \`${vanillaUserData.progression.exp}\`
                Inventory: \`${vanillaUserData.profile.inventory.length}\`
                Backgrounds: \`${vanillaUserData.profile.bgInventory.length}\`
                Medals: \`${vanillaUserData.profile.medalInventory.length}\`
                Stickers: \`${vanillaUserData.profile.stickerInventory.length}\`
                Flairs: \`${vanillaUserData.modules.flairsInventory.length}\`
                Equipped BG:
                 • \`${vanillaUserData.profile.bgID.padEnd(32, ' ')}\`
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