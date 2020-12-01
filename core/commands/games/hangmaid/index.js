const cmd = 'hangmaid';
const words = require('./words.json');
const Hangmaid = require(appRoot + '/core/archetypes/Hangmaid.js');

const init = async function (msg, args) {
  const game = new Hangmaid(msg, words);
  game.start().then(async (data) => {
   const mainMessage = await msg.channel.sendMessage(`\`${'_ '.repeat(data.word.length)}\`\nYour word is a type of **${data.theme}**.\nYou have 5 chances remaining.\nUsed letters: \`\`\`none\`\`\``)
   game.registerMessage(mainMessage)
   startCollector(game, msg)
  });
};

const startCollector = async (game, msg) => {
  const response = await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { time: 30000, maxMatches: 1 });
  if (!response[0]) return msg.reply('you haven\'t said a letter in 30 seconds! Stopping the game.')
  await response[0].delete()
  const result = await game.handleInput(response[0].content)
  if (result.lost) {
    await result.originalMessage.edit(`You're out of chances!\n\`${result.wordBoard.join(' ')}\`\nYour word is a type of **${game.theme}**.\nYou have ${result.chances} chance(s) left.\nUsed letters: \`\`\`${result.usedLetters.join(', ')}\`\`\``)
    return msg.reply('Oh no... I won this time, honey. You gotta be smarter than than this in the next match if you wanna win~')
  }
  if (result.won) return msg.reply('You won *this time*! But don\'t worry, I will in the next match...')
  await result.originalMessage.edit(`${result.correct ? 'Correct answer! Keep going.' : 'Wrong answer... try again!'}\n\`${result.wordBoard.join(' ')}\`\nYour word is a type of **${game.theme}**.\nYou have ${result.chances} chance(s) left.\nUsed letters: \`\`\`${result.usedLetters.join(', ')}\`\`\``)
  startCollector(game, msg)
}

module.exports = {
  init,
  cmd,
  perms: 3,
  cat: 'games',
  botPerms: ['attachFiles'],
  aliases: ['hangman', 'forca','hm']
};
