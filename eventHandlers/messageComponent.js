module.exports = async ( interaction, data) => {
    if (data.custom_id == "booruSave") {
        console.log(interaction.message.embeds)
        //DB.usercols.set(reaction.author.id, { $addToSet: { "collections.boorusave": save } });
        //Progression.emit("action.gallery.save",{msg:ms,userID:reaction.userID,value:1});
        interaction.reply({
            flags: 64,
            content: "Saved to your gallery!",
            components: [{type:1, components:[
                {
                    type: 2,
                    style:5,
                    url: `${paths.DASH}/dash/boorusave}`,
                    label: "See Galery"
                }
            ]}]
        })
    }
}