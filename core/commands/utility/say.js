// const gear = require('../../utilities/Gearbox');

const init = async function (msg, args) {
  const P = { lngs: msg.lang, prefix: msg.prefix };
  if (PLX.autoHelper(["noargs", $t("helpkey", P)], { cmd: this.cmd, msg, opt: this.cat })) return;

  if (msg.args[0] === "embed") {
    if (["?", "help", $t("helpkey", P)].includes(msg.args[1]) || !msg.args[1]) {
      return msg.channel.send({
        embed: {
          description: "Check [this link](https://leovoel.github.io/embed-visualizer/) to create embeds. Then paste it in `+say embed <JSON CODE>`",
        },
      });
    }
    let embedstr = msg.content.substr(msg.content.indexOf("embed") + 5).trim();
    // Check for hex colour representation
    const match = embedstr.match(/"color":\s*(0[x][0-9a-f]{0,6})/i);
    if (match) { // Parse the match to decimal
      const decimal = parseInt(match[1]);
      embedstr = embedstr.replace(match[0], match[0].replace(match[1], decimal.toString()));
    }
    try {
      const userEmbed = JSON.parse(embedstr);
    } catch (e) {
      return msg.channel.send($t("responses.errors.unparsable", P));
    }
    msg.delete().catch(e => null);
    msg.channel.send(userEmbed.embed ? userEmbed : { embed: userEmbed });
  } else {
    msg.channel.send(msg.args.join(" "));
  }
};

module.exports = {
  init,
  pub: true,
  cmd: "say",
  perms: 3,
  cat: "util",
  botPerms: ["attachFiles", "embedLinks", "manageMessages"],
  aliases: [],
};
