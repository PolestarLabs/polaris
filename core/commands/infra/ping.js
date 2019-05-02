const {Embed} = require('eris')
const init = async msg => {

  const start = Date.now();
  let embed = new Embed()
  embed.setColor("#36393f")
  embed.description('🏓')

  const fs = require('fs'); 
  fs.readdir(appRoot + "/../v7/resources/imgres/build/frenes/pong/", function (err, files) {
    let {randomize} = require ('../../utilities/Gearbox.js')
    let rand = randomize(0, files.length - 1);
    let filepath ="https://pollux.fun/build/frenes/pong/" + files[rand]
    //let file = fs.readFileSync(filepath);

    embed.image(filepath.replace(/ /g,'%20'))
    msg.channel.createMessage({embed}).then(ms2=>{
      const stop = Date.now();
      const diff = (stop - start);
      embed.fields = []
      embed.field("Ping",`${msg.guild.shard.latency}ms
*\`Bot Latency\`*`,true)
      embed.field("Pong",`${diff}ms
*\`Image Transport\`*`,true)
      ms2.edit({embed});
    });
  });
}


module.exports = {
  cmd:"ping",
  init,
  cat: 'infra'
}
