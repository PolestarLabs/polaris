const Languages = require("../../core/structures/Locales.js");

module.exports = async (interaction, data) => {
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