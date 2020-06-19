// const gear = require('../../utilities/Gearbox');

const init = function (message, userDB, DB) {
  const embed = new Embed();
  embed.description = `:heart: **Buy Pollux a cup of tea!**
  Contribute with a donation to keep my services always available and get some sweet perks like <:sapphire:367128894307827712> **Sapphires**, <:loot:339957191027195905> **Lootboxes**, and some **exclusive Stickers**!
  
  [Patreon](https://patreon.com/join/pollux) <:patreon:684734175986712613> • [Paypal](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=8JDLAY5TFU9D6&source=url) <:Paypal:338329328947429378> • [Cash Shop](${paths.CDN}/shop/cash-shop) <:Paypal:338329328947429378> 
  
  **[\` MORE INFO \`](${paths.CDN}/donate)**`;
  embed.color("#ea7d7d");
  embed.thumbnail("https://cdn.discordapp.com/emojis/482436838523404288.gif");

  message.channel.send({ embed });
};
module.exports = {
  pub: true,
  cmd: "donate",
  perms: 8,
  init,
  cat: "infra",
};
