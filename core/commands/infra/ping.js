// TRANSLATE[epic=translations] ping

const Gal = require("../../structures/Galleries");

const init = async (msg) => {
  // FIXME[epic=anyone] This could be negative if clocks are out of sync
  // NOTE Seems super minor tbh

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
  embed.fields.push({
    name: "Internal Services",
    value: `${_emoji('loading')}`,
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

  
  PLX.api.get('/internal/ping').then( async res=>{
    const {data} = res;
    let INST = data.RABBITHOUSE;
    INST.name = "RABBITHOUSE";
    const cluster = ["cluster_"+ (process.env.CLUSTER_ID) ] ||0;
    
    // FIXME add internal services later
    embed.fields.pop();
    /*
    embed.fields[3] = {
      name: "Internal Services",
      value: `${(INST?.[cluster]?.last) > Date.now() - 5e3 ? _emoji('yep') : _emoji('nope') } *\`${INST.name}/${process.env.CLUSTER_ID}\`* **${INST?.[cluster]?.diff || "000" }**ms\n` +
             `${(data.METEORA?.cluster_0?.last) > Date.now() - 5e3 ? _emoji('yep') : _emoji('nope') } *\`${"METEORA"}/${0}\`* **${start - data?.METEORA?.cluster_0?.last || "000" }**ms`,
      inline: true,
    };
    */
    await wait(1);
    ms2.edit({ embed });
  });



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
