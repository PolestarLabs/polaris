const { Member } = require("eris");
const Languages = require("../../core/structures/Locales.js");

module.exports = async (interaction, data) => {
    const serverData = await DB.servers.get(interaction.guild.id, { "modules.MODROLE": 1 });
    const m = interaction.member;
    m.id = interaction.userID;
    m.user = PLX.users.get(interaction.userID);
    const member = new Member(m, interaction.guild, PLX);
    if (!PLX.modPass(member, "manageRoles", serverData)) {
        return interaction.reply({ content: "Shoo!", flags: 64 });
    }
    interaction.reply({
        content: "Select Language",
        flags: 64,
        components: [
            {
                "type": 1,
                "components": [
                    {
                        "type": 3,
                        "placeholder": "Select a language...",
                        "custom_id": "ddown-langsel",
                        "min_values": 1,
                        "max_values": 1,
                        "options": Languages.i18n.map(lang => {
                            console.log(lang.flag)
                            return {
                                "label": capitalize(lang.name),
                                "description": capitalize(lang["name-e"]),
                                "value": lang.iso,
                                "emoji": lang.flag.id
                                    ? { id: lang.flag.id }
                                    : { name: "🤠" }
                                , "default": false
                            }
                        }).slice(0, 25)
                    }
                ]
            }
        ]
    });


}