
// const gear = require('../../utilities/Gearbox');

const init = function (message,userDB,DB) {

  let embed = new gear.Embed
  embed.description = " :hearts: **Buy Pollux a cup of tea!** \nContribute with a donation to keep me running and get some sweet perks like <:sapphire:367128894307827712> **Sapphires**, <:loot:339957191027195905> **Lootboxes**, and **exclusive Stickers**!\n Check my [Patreon](https://patreon.com/join/pollux) or my [Donation Page](https://pollux.gg/donate) !"
  embed.color("#ea7d7d")
  embed.thumbnail("https://cdn.discordapp.com/emojis/482436838523404288.gif")

  message.channel.send({embed})
}
 module.exports = {
    pub:true,
    cmd: 'donate',
    perms: 8,
    init: init,
    cat: 'infra'
};
