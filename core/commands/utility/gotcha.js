// const gear = require('../../utilities/Gearbox');

const init = async function (msg) {
  try {
    const embed = new Embed();
    embed.color("#f8a863");

    snipe = msg.channel.snipe;

    if (snipe) {
      if (Object.keys(snipe)[1] !== "msg_new") {
        embed.description = `\`\`\`${snipe.msg_old.content}\`\`\``;
        embed.footer(snipe.author.tag, snipe.author.avatarURL);
        embed.timestamp(snipe.timestamp);
        if (snipe.msg_old.attachment) embed.image(snipe.msg_old.attachment.proxy_url);
        msg.channel.send({ embed });
      } else if (Object.keys(snipe)[1] === "msg_new") {
        embed.description = `\`\`\` ${snipe.msg_old.content}\`\`\` \n**edited to**\`\`\`${snipe.msg_new.content}\`\`\``;
        embed.timestamp(snipe.timestamp);
        embed.footer(snipe.author.tag, snipe.author.avatarURL);
        msg.channel.send({ embed });
      } else {
        console.log("GOTCHA no typeof");
        msg.addReaction(nope).catch();
      }
    } else {
      msg.addReaction(nope).catch();
      console.log("GOTCHA no scope");
    }
  } catch (e) {
    console.error(e);
  }
};

module.exports = {
  init,
  pub: true,
  cmd: "gotcha",
  perms: 3,
  cat: "utility",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: [],
};
