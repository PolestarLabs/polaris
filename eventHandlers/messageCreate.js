

const meSubs = require('../core/subroutines/onEveryMessage.js');

module.exports = async function (msg) {

  if(msg.author.bot) return;
  if(!PLX.ready) return console.log('Message not Ready'.red);
  
  //DEBUG -----------------------------------------------------
  
  if(PLX.refreshing){
    delete require.cache[require.resolve('../core/structures/CommandPreprocessor.js')]
    delete require.cache[require.resolve('../core/subroutines/onEveryMessage.js')]
  }
  
  if( (PLX.tapping) && !global.piggyback){
    let PEV =  PLX.tapping
    if([msg.channel.id,msg.guild.id,msg.author.id,"all"].includes(PEV) || PLX.beta)

      console.log(
        msg.author.tag.blue+`(${msg.author.id})\n    `.gray,
        msg.content.inverse+"\n",
        `    @ ${("#"+msg.channel.name).yellow}(${msg.channel.id}) `,
        `> ${(msg.guild.name).bgBlue}(${msg.guild.id}) `, "\n"+"--------".gray
      );
  }
  
  //-----------------------------------------------------------
  
  meSubs(msg);
}