const { Member } = require("eris");
const Languages = require("../../core/structures/Locales.js");
const {saveLanguage} = require("../../core/commands/moderation/lang.js");

const currentForms = new Map();
module.exports = async (interaction, data) => {
    console.log(interaction)
    const [,action] = data.custom_id.split(":");
    const [val] = data.values || [];

    const serverData = await DB.servers.get(interaction.guild.id, { "modules.MODROLE": 1 });
    const m = interaction.member;
    m.id = interaction.userID;
    m.user = PLX.users.get(interaction.userID);
    const member = new Member(m, interaction.guild, PLX);
    if (!PLX.modPass(member, "manageRoles", serverData)) {
        return interaction.reply({ content: "Shoo!", flags: 64 });
    }
    
    if (!currentForms.get(interaction.guild.id)) currentForms.set(interaction.guild.id,{
        scope: "server",
        language: interaction.guild.LANG || "en"
    });
    const currentSelections = currentForms.get(interaction.guild.id);
    currentSelections[action] = val;
    currentForms.set(interaction.guild.id, currentSelections);
    const langTo = Languages.i18n.find((lang) => lang.iso === currentSelections.language );

const components = interaction.message.components;
 
components[0].components[0].options = components[0].components[0].options.map(o=> {
    o.default = o.value === currentSelections.scope;
    return o;                
});
components[1].components[0].options = components[1].components[0].options.map(o=> {
    o.default = o.value === currentSelections.language;
    console.log({o})
    return o; 
});
components[2] = ({type:1,components:[
    {type:2, style: 3, label: "Save", custom_id: `langsel:confirm:${interaction.guild.id}`},
    {type:2, style: 4, label: "Cancel", custom_id: `langsel:abort:${interaction.guild.id}`},
]});
 
    const P = {lngs:[langTo.iso]}
    let content = `**Scope:** ${ capitalize(currentSelections.scope) + 
        (currentSelections.scope === 'channel'?`<#${interaction.channel.id}>`:"") 
    } | **Language:** ${langTo.flag} ${capitalize(langTo.name)}`;
    
    if (action === "abort" || action === "confirm" ){
        currentForms.delete(interaction.guild.id);
        components.forEach(row=>row.components.forEach(sub=>sub.disabled = true));
        if ( action === "confirm" ){
            content = ( await saveLanguage(langTo, currentSelections.scope,interaction,P) );
        }
    }
    //await interaction.ack();
    interaction.updateMessage({content,components});
 

    



}

