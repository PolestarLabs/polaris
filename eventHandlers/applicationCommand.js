module.exports = async (interaction, data) => {

    const { name: cmd } = data;
    console.log(data, "DATA".green)
    try {
        const response = await Promise.race([
            PLX.commands[cmd].execute(interaction.message, interaction.message.args || []).catch(err => {
                console.error(err, 'the err');
                return "ERROR"
            }),
            wait(2.5).then(x => "TIMEOUT")
        ]);

        if (response === "TIMEOUT") {
            await interaction.defer();
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