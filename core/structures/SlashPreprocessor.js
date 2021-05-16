//const config = require("../../config.json");
const { Client, MessageEmbed, Message } = require("discord-slash");

const thistoken = PLX._token.replace('Bot ','');
console.log({thistoken})
const client = new Client(thistoken, PLX.user.id);

client.on("ready", () => {
  console.log("Connected and listining for intentions");
});

client.on("interaction", (data) => {
    console.log( "inter" )
    console.log("[ INTERACTION ]".yellow, require("util").inspect(data,0,2,1) )
})

module.exports = client;