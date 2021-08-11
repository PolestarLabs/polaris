const Eris = require('eris');
const axios = require('axios');

module.exports = async function (payload) {

    let message;
    const interaction_type = payload.d.type; //3= component
    const component_type = payload.d.data?.component_type;
    
    INSTR.inc("interactions",{ component_type, interaction_type })

    if (!payload.d.member){
        console.log(payload.d);
        console.log(interaction);
        console.log("MEMBERLESS PAYLOAD INSPECT");
    }
    try {
        message = new Eris.Message(payload.d.message, PLX);
    } catch (err) {
        if (interaction_type === 2) {
            
            
            message = {
                id: payload.d.id,
                fake: true,
                author: await PLX.resolveUser(payload.d.member?.id || payload.d.member?.user?.id),
                member: await PLX.resolveMember(payload.d.guild_id, payload.d.member.user.id),
                guild: PLX.guilds.get(payload.d.guild_id) || (await PLX.getRESTGuild(payload.d.guild_id)),
                channel: await PLX.getChannel(payload.d.channel_id),
                timestamp: Date.now(),
                content: `p!${payload.d.data.name}`,
                embeds: [],
                
            }
            if (payload.d.data?.type === 1 ){
                console.log(PLX.commands[payload.d.data.name],payload.d.data.name, )
                message.args= PLX.commands[payload.d.data.name].slashOptions?.args?.map(arg => {
                    return payload.d.data.options?.find(x => x.name === arg)?.value
                }) || []
            }
            if (payload.d.data?.type === 2||payload.d.data?.type === 3 ){
                console.log('type ',payload.d.data)
                message.args = [payload.d.data.target_id];
                if (payload.d.data?.type === 3){
                    console.log('type 3')
                    Object.assign(message, payload.d.data.resolved.messages[payload.d.data.target_id] )
                    message.author = await PLX.resolveUser( message.author.id );
                    message.member.user = message.author;
                }
            }


            message.lang = [message.channel.LANG || message.guild.LANG || 'en', 'dev']

        } else {
            message = payload.d.message;
            message.author = payload.d.member.user;
            message.member = payload.d.member;
            message.guild = PLX.guilds.find(g => g.id === payload.d.guild_id);
            message.channel = await PLX.getChannel(payload.d.channel_id);
            message.reply = message.channel.createMessage
        }
    }

    const interaction = {
        message,
        messageRaw: payload.d.message,
        id: payload.d.id,
        guild: message.guild,
        channel: message.channel,
        userID: payload.d.member?.user?.id,
        member: payload.d.member,
        token: payload.d.token,
        type: interaction_type,
        ack: function () {
            return PLX.requestHandler.request('POST', `/interactions/${this.id}/${this.token}/callback`, true, {
                "type": this.type === 3 ? 6 : 1
            });
        },
        defer: function () {
            return PLX.requestHandler.request('POST', `/interactions/${this.id}/${this.token}/callback`, true, {
                "type": 5
            });
        },
        updateMessage: function (data) {
            //if (this.type === 3) return null;
            const response = { data };
            response.type = 7;
            return PLX.requestHandler.request('POST', `/interactions/${this.id}/${this.token}/callback`, true, response);
        },
        editOriginal: function (data, file) {
            return PLX.requestHandler.request('PATCH', `/webhooks/${PLX.user.id}/${this.token}/messages/@original`, true, data, file);
        },
        reply: function (data, file) {
            const response = { data };
            response.type = 4;
            return PLX.requestHandler.request('POST', `/interactions/${this.id}/${this.token}/callback`, true, response, file);
        },
        followup: function (data, file) {
            if (data.embed) data.embeds = [data.embed];
            return PLX.requestHandler.request('POST', `/webhooks/${PLX.user.id}/${this.token}?wait=true`, true, data, file);
        },
    }
    interaction.message.ireply = interaction.reply;
    interaction.message.iack = interaction.ack;


    if (interaction_type === 2) {
        PLX.emit("applicationCommand", interaction, payload.d.data);
    }
    if (interaction_type === 3) {
        //console.log(require('util').inspect({interaction,data: payload.d.data},0,2,1))
        PLX.emit("messageComponent", interaction, payload.d.data);
    }


}