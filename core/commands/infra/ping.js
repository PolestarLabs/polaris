const {Embed} = require('eris')
const Gal = require('../../structures/Galleries')

const init = async msg => {

  const start = Date.now();
  let embed = new Embed()
  embed.setColor("#36393f")
  embed.description('🏓')
  

    let filepath = await Gal.randomOne('pong',true).catch(console.error);
    console.log(filepath)
    if (filepath) embed.image(filepath);
    msg.channel.createMessage({embed}).then(ms2=>{
      const stop = Date.now();
      const diff = (stop - start);
      //embed.fields = []
      embed.field("Ping",`${msg.guild.shard.latency}ms
*\`Bot Latency\`*`,true)
      embed.field("Pong",`${diff}ms
*\`Image Transport\`*`,true)
      ms2.edit({embed});
    });
}


module.exports = {
  init
  ,pub:true
  ,cmd:'ping'
  ,perms:3
  ,cat:'infra'
  ,botPerms:['embedLinks']
  ,aliases:[]

}
