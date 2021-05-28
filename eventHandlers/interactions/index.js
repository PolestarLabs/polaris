const Eris = require('eris');
const axios = require('axios');

module.exports = async function(payload){
    let message = new Eris.Message(payload.d.message, PLX);
    const interaction_type = payload.d.type; //3= button

    const interaction = {
        message,
        id: payload.d.id,
        guild: message.guild,
        channel: message.channel,
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