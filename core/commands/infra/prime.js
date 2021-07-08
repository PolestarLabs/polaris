// TRANSLATE[epic=translations] donate
const init = async (msg, args) => {
  const USERDATA = await DB.users.findOne({ id: msg.author.id }).lean().exec();

  if (USERDATA.prime.tier && !msg.content.includes('donate')) {
    const UNCLAIMED =
      new Date().getMonth() !==
      new Date(USERDATA.prime?.lastClaimed).getMonth();

    let MAXPREM = USERDATA.prime?.maxServers || 0;

    let userPremiumCount = USERDATA.prime?.servers?.length || 0;
    let DD = new Date();
    let NN = DD.getMonth();

    if (msg.args[0] === "info") {
      if (MAXPREM < 1)
        return msg.channel.send(_emoji("nope") + "**Not eligible**");

      if (UNCLAIMED)
        msg.channel.send( _emoji("nope") + "**Rewards unclaimed** \n*Please try `+rewards`." );

      return _emoji(USERDATA.prime?.tier) +" **Prime Servers Info:** `" +`${userPremiumCount}/${MAXPREM}\` \`\`\`${USERDATA.prime?.servers?.join(" ") || "-- No Servers --"}` +"```";
    }

    if (!msg.args[1])
      return msg.reply({
        content:
          `\`${msg.prefix}prime add [SERVER ID]\` Register a new Prime server.` +
          `\`${msg.prefix}prime remove [SERVER ID]\` Unegister an existing Prime server.` +
          `\`${msg.prefix}prime info\` Check Prime servers information.`,
      });

    const primeServerId = msg.args[1];
    const SVdata = await DB.servers.findOne({ id: primeServerId }).lean().exec();

    if (!SVdata){
      return _emoji("nope") + "**Server Registry not found!** | Pollux has no data about your server. Try inviting ther non-prime version first.";
    }

    if (msg.args[0] === "remove") {     
      PLX.leaveGuild(primeServerId);
      await DB.users.set(msg.author.id, {$pull: { "prime.servers": SVdata.id }});

      return _emoji("yep") + "**All Set!** | Server **" + (SVdata.name || (SVdata.meta || {}).name) + "** Removed!" + ` (${userPremiumCount}/${MAXPREM})`;
    }

    if (msg.author.id == "88120564400553984") MAXPREM = 999;

    let unwelcome = ["462316885195882508", "322455878336905216 "];

    if (msg.guild.id != "277391723322408960")
      return _emoji("nope") + "**Must be used in Pollux's official server** | Server not Activated";

    if (MAXPREM < 1)
      return _emoji("nope") + "**Not eligible** | Server not Activated";

    if (!SVdata)
      return _emoji("nope") + "**Server not found** | Server not Activated";
    if (unwelcome.includes(SVdata.id))
      return _emoji("nope") + "**Server ineligible for Premium** | Server not Activated";

    if (USERDATA.prime?.servers?.includes(SVdata.id))
      return _emoji("nope") + "**Server already activated** | Nothing has changed";

    if (UNCLAIMED)
      return _emoji("nope") + "**Rewards unclaimed** | Server not Activated\n*Please try `+rewards` before trying this."

    if (userPremiumCount >= MAXPREM)
      return _emoji("nope") + "**Max Servers Activated** `["+`${userPremiumCount}/${MAXPREM} : ${(USERDATA.switches || {}).premiumServers }`+"]` | Server not Activated";
    
    await DB.users.set(msg.author.id, {
      $set: { "prime.maxServers": MAXPREM },
    });
    await DB.users.set(msg.author.id, {
      $push: { "prime.servers": SVdata.id },
    });

    return ({
      content:
        _emoji("yep") +
        "**All Set!** | Server **" +
        (SVdata.name || (SVdata.meta || {}).name) +
        "** Activated!" +
        ` (${1 + userPremiumCount}/${MAXPREM})`,
      embed: {
        description:
          "Invite Prime Pollux [HERE](https://pollux.gg/invite/prime?sv=" +
          SVdata.id +
          ")",
      },
    });

    
  };
  

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
  cmd: "prime",
  perms: 8,
  init,
  cat: "infra",
  aliases: ["donate", "premium", "activateprime"],
};
