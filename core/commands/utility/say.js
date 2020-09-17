// const gear = require('../../utilities/Gearbox');

const init = async (msg) => {
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
    const userEmbed = JSON.parse(msg.content.substr(msg.content.indexOf("embed") + 5).trim());
    msg.channel.send(userEmbed.embed ? userEmbed : { embed: userEmbed });
  } else {
    msg.channel.send(msg.content.split(/ +/).slice(1).join(" "));
  }
};

module.exports = {
  init,
  pub: true,
  deleteCommand: true,
  cmd: "say",
  perms: 3,
  cat: "util",
  botPerms: ["attachFiles", "embedLinks", "manageMessages"],
  aliases: [],
};
