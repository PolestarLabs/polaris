const init = async function(msg,args) {
    delete require.cache[require.resolve("../../structures/Galleries")];
    const Gal = require("../../structures/Galleries");
  
 
  
    const embed = new Embed();
    let Target = await PLX.getTarget(msg.args[0], msg.guild);

    let img = await Gal.randomOne("pat", true);
    let avgcolor = await require("../../utilities/Picto").avgColor(img);
  
    embed.image(img);
    embed.color(avgcolor);
    console.log(avgcolor)
    embed.description = `${msg.member.nick|| msg.author.username} pats ${Target.nick|| Target.username}`
    msg.channel.send({ embed });
  };
  
  module.exports = {
    init,
    pub: false,
    cmd: "pat",
    perms: 3,
    cat: "img",
    botPerms: ["embedLinks"],
    aliases: []
  };
  