const Eris = require('eris');
const axios = require('axios');

module.exports = async function(payload){

    let message;
    try{
       message  = new Eris.Message(payload.d.message, PLX);
    }catch(err){
        message  = payload.d.message;
        message.author = payload.d.member.user;
        message.member = payload.d.member;
        message.guild = PLX.guilds.find(g=>g.id === payload.d.guild_id);
        message.channel = await PLX.getChannel(payload.d.channel_id);
        message.reply = message.channel.createMessage
    }
    const interaction_type = payload.d.type; //3= component
    const component_type = payload.d.data.component_type; // 2 button 3 drop down

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
        ack: function(){
            PLX.requestHandler.request('POST', `/interactions/${this.id}/${this.token}/callback`, true, {
                "type": this.type === 3 ? 6 : 1
            });
        },
        defer: function(){
            PLX.requestHandler.request('POST', `/interactions/${this.id}/${this.token}/callback`, true, {
                "type": 5
            });
        },
        updateMessage: function(data){
            if (this.type === 3) return null;
            const response = {data};
            response.type = 7;
            PLX.requestHandler.request('POST', `/interactions/${this.id}/${this.token}/callback`, true, response);
        },
        reply: function(data){
            const response = {data};
            response.type = 4;
            PLX.requestHandler.request('POST', `/interactions/${this.id}/${this.token}/callback`, true, response);
        },
    }

    if (interaction_type === 2){
        PLX.emit("applicationCommand", interaction, payload.d.data);
    }
    if (interaction_type === 3){
        PLX.emit("messageComponent", interaction, payload.d.data);
    }


}