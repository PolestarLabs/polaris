const cmd = 'hangmaid'
const words = require('./words.json')
const Hangmaid = require(appRoot + '/core/archetypes/Hangmaid.js')

const init = async function (msg) {
  const game = new Hangmaid(msg, words)
  game.start().then(async (data) => {
    // await msg.channel.sendMessage(`\`${'_ '.repeat(data.word.length)}\`\nYour word is a type of **${data.theme}**.\nYou have 5 chances remaining.\nUsed letters: \`\`\`none\`\`\``)
    const mainMessage = await msg.channel.send(`https://beta.pollux.gg/generators/hangmaid?g=${data.wordSpaced}&refresh=${Date.now()}&d=${data.difficulty}&h=${data.theme}`)
    game.registerMessage(mainMessage)
    await startCollector(game, msg)
  })
}

const startCollector = async (game, msg) => {
  const collector = msg.channel.createMessageCollector(m => m.author.id !== PLX.user.id);

  let active = true; 
  let activity = setInterval(() => {
        if (!active) return collector.stop('time');
        active = false;
    }, 30e3);
  
  collector.on('message', async (me) => {
    const guess = me.content.toUpperCase();
    let isFullGuess = false;

    if (guess.length > 1) {
      // either player is talking or trying to guess

      if ( guess === game.word.toUpperCase() ) isFullGuess = true;
      else return null;
    }
    else me.delete();


    if (!isFullGuess && game.wordBoard.includes(guess) || game.incorrectLetters.includes(guess)) return msg.channel.send("You already said that, honey~").then(mee => setTimeout(()=> mee.delete(), 1500));
    const result = await game.handleInput(me);
    if (!result) return;
    if (result.params.e) collector.stop();
    await result.message.delete();
    const newMsg = await msg.channel.send(`${paths.DASH}/generators/hangmaid?a=${result.params.a}&${result.params.e ? `e=${result.params.e}&` : ''}g=${result.params.g}&refresh=${Date.now()}&h=${result.params.h}`);
    await game.registerMessage(newMsg);
  });

  collector.on('end', (coll, reason)=> {
    clearInterval(activity);
  });
}

module.exports = {
  init,
  cmd,
  perms: 3,
  cat: 'games',
  botPerms: ['attachFiles'],
  aliases: ['hangman', 'forca']
}
