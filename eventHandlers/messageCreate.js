exports.run = async function (msg) {

   delete require.cache[require.resolve('../core/subroutines/onEveryMessage.js')]
   let pomme = require('../core/subroutines/onEveryMessage.js')

if(
  msg.author.id !== "88120564400553984" &&
  msg.author.id !== "163200584189476865"
  )return;

//console.log(msg.content)

   pomme.run(msg);
  if (msg.content.startsWith('po.')) {






    msg.prefix = 'po.'

    delete require.cache[require.resolve('../core/structures/CommandPreprocessor.js')]
    require('../core/structures/CommandPreprocessor.js').run(msg, {})

  }


}
