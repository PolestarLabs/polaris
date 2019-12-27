const cmd = 'hangmaid';
const words = require('./words.json');
const Hangmaid = require(appRoot + '/core/archetypes/Hangmaid.js');

const init = async function (msg, args) {
  const game = new Hangmaid(msg, words);
  let collector
  game.start().then(async (data) => {
   await msg.channel.sendMessage(`\`${'_ '.repeat(data.word.length)}\`\nYour word is a type of **${data.theme}**.\nYou have 5 chances remaining.\nUsed letters: \`\`\`none\`\`\``)
   startCollector(game, msg)
  });
};

const startCollector = async (game, msg) => {
  const response = await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { time: 30000, maxMatches: 1 });
  if (!response[0]) return msg.reply('you haven\'t said a letter in 30 seconds! Stopping the game.')
  const result = await game.handleInput(response[0].content)
  console.log(result)
  if (result.lost) return msg.reply(`I won! The word was ||${game.word}||.`)
  if (result.won) return msg.reply(`You won this time, but I will win the next one.\nThe word was ${game.word}.`)
  await msg.channel.sendMessage(`${result.correct ? 'Correct answer!' : 'Wrong answer...'}\n\`${result.wordBoard.join(' ')}\`\nYour word is a type of **${game.theme}**.\nYou have ${result.chances} chance(s) left.\nUsed letters: \`\`\`${result.usedLetters.join(', ')}\`\`\``)
  startCollector(game, msg)
}

module.exports = {
  init,
  cmd,
  perms: 3,
  cat: 'games',
  botPerms: ['attachFiles'],
  aliases: ['hangman', 'forca']
};
