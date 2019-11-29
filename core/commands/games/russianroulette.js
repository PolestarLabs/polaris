const cmd = 'russianroulette';
const RussianRoulette = require(appRoot + '/core/archetypes/RussianRoulette.js');
const economy = require(appRoot + '/core/archetypes/Economy.js');

const init = async function (msg, args) {
  if (args[0] === 'multiplayer') {
    await msg.channel.sendMessage(`Ok, multiplayer mode.\nTo join the match, just use \`join <how many rubines you are using>\`.\n**The match starts in __20 seconds__.**`);
    const players = await startPlayerCollector(await msg.channel.sendMessage('**Total of rubines in the pool:** 0 rubines\n**Players**\n---'));
    if (players.length === 1) return msg.channel.sendMessage('If only 1 person is going to play, you should use singleplayer mode.')
    if (players.length === 0) return msg.channel.sendMessage('No one joined. I\'m not playing this alone.')
    await msg.channel.sendMessage(`**Time's up!** Let's get started.\nPlayers: \`\`\`${players.map(a => a.name).join(', ')}\`\`\``);
    return startMultiplayerLoop(msg, shuffle(players))
  }

  if (isNaN(parseInt(args[0]))) return msg.reply('you have to give me a number of how much rubines you are going to ~~waste~~ use, or you can use `multiplayer` to create a multiplayer game.')

  const urf = await economy.checkFunds(msg.author.id, parseInt(args[0]))
  if (!urf) return msg.reply('you don\'t have all this money to waste with russian roulette.')
  economy.pay(msg.author.id, parseInt(args[0]))

  const game = new RussianRoulette(msg, parseInt(args[0]))

  await msg.channel.sendMessage(`Russian Roulette? You probably already know the rules, so let\'s get started.\nIf you survive this one, you\'re going to receive **${game.nextValue} rubines**.\nUse \`shoot\` to proceed (if you get shot, you'll lose your money).`)
  startGameCollector(game, msg)
};

const startGameCollector = async (msg) => {
  const response = await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { time: 30000, maxMatches: 1 });
  if (!response[0]) return msg.reply('you haven\'t said your action in 30 seconds! Stopping the game.')
  const result = await game.handleInput(response[0].content)
  if (result.invalidInput) return msg.channel.sendMessage('You **have** to say shoot or stop. Game stopped, and I\'m not returning your money back.')
  if (result.stopped) {
    const better = parseInt(msg.args[0]) > result.currentValue
    if (better) economy.pay(msg.author.id, result.currentValue, 'RUSSIANROULETTE')
    return msg.channel.sendMessage(better ? `You're a quitter!\n I added **${result.currentValue} rubines** to your account. Sigh.` : 'You\'re a quitter!\nI haven\'t changed anything because you didn\'t even played.')
  }

  const message = await msg.channel.sendMessage('Let\'s see if you\'re going to die now...')
  if (result.lost) {
    return message.edit(`BOOM! Someone got shot...\nYou lost your money. RIP.`)
  } else if (result.won) {
    economy.receive(msg.author.id, parseInt(msg.args[0]) * 1.5, 'RUSSIANROULETTE')
    return message.edit(`**no bullet noise**\nYou came out alive of the game...\nI added **${game.maxValue}** rubines to your account.`)
  }

  await message.edit(`*\*no bullet noise\**\nNo bullet this time (${result.rounds} rounds remaining)...\nYou currently have **${result.currentValue} rubines.**\nUse \`shoot\` to test your luck one more time (if you don't get shot, I'm going to add more money to your current amount)\nUse \`stop\` to stop here and get your money.`)
  startCollector(game, msg)
}

const startPlayerCollector = async (msg) => {
  const verifiedPlayers = []
  const filter = async (m) => {
    return m.content.startsWith('join ') &&
           !verifiedPlayers.filter(a => a.id === m.author.id)[0] &&
           !isNaN(m.content.split(' ')[1]) &&
           parseInt(m.content.split(' ')[1]) > 0 &&
           (await economy.checkFunds(m.author.id, parseInt(m.content.split(' ')[1]))) &&
           verifiedPlayers.push({ id: m.author.id, name: m.author.username, money: parseInt(m.content.split(' ')[1]) }) &&
           msg.edit(`**Total of rubines in the pool**: ${verifiedPlayers.map(a => a.money).reduce((a, b) => a + b)} rubines\n**Players**\n${verifiedPlayers.map(a => `- **${a.name}** - ${a.money} rubines\n`)}`)
  }
  const collector = await msg.channel.awaitMessages(filter, { time: 20e3, maxMatches: 5 });
  return verifiedPlayers
}

const startMultiplayerLoop = async (msg, players) => {
  const value = players.map(a => a.money).reduce((a, b) => a + b)
  let finished = false
  let round = 1
  let lost = false
  while (!finished) {
    const game = new RussianRoulette(null, 0)
    let content = `**Round ${round}**\n`
    const message = await msg.channel.sendMessage(content);
    let _p = 0
    while (_p < players.length) {
      const player = players[_p]
      content += `${player.name}'s turn.... `
      await message.edit(content);
      const rst = game.handleInput('shoot')
      if (rst.lost) {
        players = shuffle(players.filter(a => a.id !== player.id))
        await economy.pay(player.id, player.money, 'RUSSIANROULETTE');
        lost = player
      }
      await wait(3);
      if (lost) content += `BOOM! ${player.name} is dead.`
      else content += '*no bullet noise*\n'
      await message.edit(content);
      if (lost) {
        _p = players.length + 1
      } else {// Stop the forEach loop, the bullet is now gone
        _p++
      }
      await wait(3);
    }
    if (players.length === 1) {
      economy.receive(players[0].id, value, 'RUSSIANROULETTE')
      return message.channel.sendMessage(`Game over, you all! ${players[0].name} won.`)
      finished = true
    }
    _p = 0
    await message.channel.sendMessage('End of the round! **Results:**\n'+ (lost ? `${lost.name} was the loser. RIP.` : 'No one died this time...') +'\nStarting the next round.');
    lost = null
    round++
  }
}

module.exports = {
  init,
  cmd,
  argsRequired: true,
  perms: 3,
  cat: 'games',
  botPerms: ['attachFiles','embedLinks','manageMessages'],
  aliases: ['rr', 'roletarussa']
};
