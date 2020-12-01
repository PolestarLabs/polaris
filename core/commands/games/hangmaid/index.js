const cmd = 'hangmaid'
const words = require('./words.json')
const Hangmaid = require(appRoot + '/core/archetypes/Hangmaid.js')

const init = async function (msg, args) {
  const game = new Hangmaid(msg, words)
  game.start().then(async (data) => {
    // await msg.channel.sendMessage(`\`${'_ '.repeat(data.word.length)}\`\nYour word is a type of **${data.theme}**.\nYou have 5 chances remaining.\nUsed letters: \`\`\`none\`\`\``)
    const mainMessage = await msg.channel.send(`https://beta.pollux.gg/generators/hangmaid?g=${data.wordSpaced}&refresh=${Date.now()}&d=${data.difficulty}&h=${data.theme}`)
    game.registerMessage(mainMessage)
    await startCollector(game, msg)
  })
}

const startCollector = async (game, msg) => {
  const collector = msg.channel.createMessageCollector(m => m.author.id === msg.author.id, { time: 50000 })

  collector.on('message', async (me) => {
    await me.delete()
    if (game.wordBoard.includes(me.content.toUpperCase())) msg.channel.send("You already said that, honey~").then(mee => setTimeout(mee.delete(), 1500))
    const result = await game.handleInput(me)
    await result.message.edit(`https://beta.pollux.gg/generators/hangmaid?a=${result.params.a}&${result.params.e ? `e=${result.params.e}&` : ''}g=${result.params.g}&refresh=${Date.now()}&h=${result.params.h}`)
  })
}

module.exports = {
  init,
  cmd,
  perms: 3,
  cat: 'games',
  botPerms: ['attachFiles'],
  aliases: ['hangman', 'forca']
}
