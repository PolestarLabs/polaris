// TRANSLATE[epic=translations] ping

const Gal = require("../../structures/Galleries");

const init = async (msg) => {
  // FIXME[epic=anyone] This could be negative if clocks are out of sync
  const ack   = Date.now() - msg.timestamp;

  const embed = {};
  embed.color = 0x36393f;
  embed.description = "🏓";
  embed.fields = [];

  embed.fields.push({
    name: "Ping",
    value: `---ms
*\`Response Time\`*`,
    inline: true,
  });
  embed.fields.push({
    name: "Pong",
    value: `---ms
*\`Image Transport\`*`,
    inline: true,
  });
  embed.fields.push({
    name: "Pong",
    value: `---ms
*\`Discord Latency\`*`,
    inline: true,
  });

  const start = Date.now();
  const filepath = await Gal.randomOne("pong", true).catch(console.error);
  const stop = Date.now();
  if (filepath) embed.image = { url: filepath };

  const ms2 = await msg.channel.send({ embed });
  const diff = (stop - start);

  embed.fields[0] = {
    name: "Ping",
    value: `${ack}ms
*\`Response Time\`*`,
    inline: true,
  };
  embed.fields[1] = {
    name: "Pong",
    value: `${diff}ms
*\`Image Transport\`*`,
    inline: true,
  };
  embed.fields[2] = {
    name: "Plenk",
    value: `${msg.guild.shard.latency}ms
*\`Discord Latency\`*`,
    inline: true,
  };

  console.log(embed);
  await wait(0.5);
  ms2.edit({ embed });
  return null;
};

module.exports = {
  init,
  pub: true,
  cmd: "ping",
  perms: 3,
  cat: "infra",
  botPerms: ["embedLinks"],
  aliases: [],

};
