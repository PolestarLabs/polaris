// TRANSLATE[epic=translations] donate
const init =  async (message, userDB, DB) => {
  const embed = new Embed();
  embed.description = `:heart: **Buy Pollux a cup of tea!**
  Contribute with a donation to keep my services always available!
  
  <:patreon:684734175986712613> [Patreon](https://patreon.com/join/pollux)  • <:Paypal:338329328947429378> [Paypal](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=8JDLAY5TFU9D6&source=url)  • <:pix:845985531162525736> [Pix](https://media.discordapp.net/attachments/277392117167292417/808354942138056764/unknown.png)
                
  By supporting us you help to keep the project going and also get some sweet perks like <:sapphire:367128894307827712> **Sapphires**, <:loot:339957191027195905> **Lootboxes**, and some **exclusive Stickers**
  **[\` MORE INFO \`](https://patreon.com/join/pollux)**`;
  embed.color("#ea7d7d");
  embed.thumbnail("https://cdn.discordapp.com/emojis/482436838523404288.gif");

  return { embed };
};
module.exports = {
  pub: true,
  cmd: "donate",
  perms: 8,
  init,
  cat: "infra",
  aliases: ["prime"]
};
