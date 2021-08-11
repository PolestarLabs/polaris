module.exports = async (interaction, data) => {



    const { name: cmd } = data;
    const CURRENT_COMMAND = PLX.commands[cmd] || Object.values(PLX.commands).find(val=>{
       
        return val.contextMenu?.name === cmd;
    });
    
    console.log({cmd});

    if (!CURRENT_COMMAND) return;

    interaction.message.command = CURRENT_COMMAND;
    interaction.message.interaction = interaction
    try {
        const response = await Promise.race([
            CURRENT_COMMAND.execute(interaction.message, interaction.message.args || []).catch(err => {
                console.error(err, 'APP COMMAND ERROR');
                return "ERROR"
            }),
            wait(2.5).then(x => "TIMEOUT")
        ]);

        console.log({response});
        if (!response) return interaction.reply( {content: `\u200b${_emoji("yep")}`} );

        if (response === "TIMEOUT") {
            await interaction.defer();
        }

        if (response?.length && typeof response === 'string') {
            return interaction.reply({content:response});
        }

        response.embeds = [response?.embed]
        if (data.options?.find(x => x.name === 'private')?.value) response.flags = 64;

        if (response?.length && typeof response !== 'string') {
            let [res, file] = response;
            return interaction.reply(res, file);
        }

        if (response === "TIMEOUT" || !response || (!response.embed && !response.content)) {
            return interaction.editOriginal({ content: "\u200b" || _emoji("yep") });
        }

        interaction.reply(response);

    } catch (err) {
        console.error(err);
    }

}