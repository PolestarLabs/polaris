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
    const match = embedstr.match(/"color":\s*(0[xX]([0-9a-f]{3}(?=[\s}])|[0-9a-f]{6}))/i);
    if (match) { // Parse the match to decimal
      if (match[2].length === 3) match[2] = `0x${match[2][0]}${match[2][0]}${match[2][1]}${match[2][1]}${match[2][2]}${match[2][2]}`;
      const decimal = Math.max(parseInt(match[2]) - 1, 0); // 0xFFF = black
      embedstr = embedstr.replace(match[0], match[0].replace(match[1], decimal.toString()));
    }
    let userEmbed;
    try {
      userEmbed = JSON.parse(embedstr);
    } catch (e) {
      return msg.channel.send({ embed: { description: $t("responses.errors.unparsable", { ...P, link: `[Pollux Embed Architect](${paths.DASH}/embedarchitect)` }) } });
    }
    try{
      msg.delete().catch(err=>null)
    }catch(e){
      // prevent breaking with saytochannel
    }
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
