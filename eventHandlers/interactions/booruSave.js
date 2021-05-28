module.exports = async (interaction, data)=>{

        const emb = interaction.message.embeds[0];
        const save = {
            url: emb.image.url,
            saved: interaction.message.timestamp,
            tags: emb.fields.tags ? emb.fields.tags.replaceAll(/[\[\]\`]/,"") : "",
            nsfw: emb.color == 16731205,
        }
        let res = await DB.usercols.set(interaction.userID, { $addToSet: { "collections.boorusave": save } });
        console.log({res})
        if (res?.nModified !== 1) return;

        Progression.emit("action.gallery.save",{msg:interaction.message,userID:interaction.userID,value:1});
        interaction.reply({
            flags: 64,
            content: "Saved to your gallery!",
            components: [{type:1, components:[
                {
                    type: 2,
                    style:5,
                    url: `${paths.DASH}/dash/boorusave`,
                    label: "See Gallery"
                }
            ]}]
        });
        let oldButtonLabel = interaction.messageRaw.components?.[0]?.components?.[0]?.label||"";
        const oldLabelNumber = Number(oldButtonLabel.match(/\(([0-9]+)\)/)?.[1] || 0);
        if (!oldLabelNumber) oldButtonLabel+= " (0)";
        let newLabel = oldButtonLabel.replace(oldLabelNumber,oldLabelNumber+1);

        interaction.message.edit({
            content:  interaction.message.content,
            components: [
                {type:1, components:[{
                  type: 2,
                  style: 2,
                  label: newLabel,
                  custom_id: "booruSave",
                  emoji: {name:"⭐"}
                },{
                    type: 2,
                    style:5,
                    url: `${paths.DASH}/dash/boorusave`,
                    label: "See your Gallery"
                }]}
              ]
        })
    }