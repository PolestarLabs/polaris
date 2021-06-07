/**
 * 
 * @param {import('eris').Message<import('eris').GuildTextableChannel>} msg 
 * @param {string[]} args 
 */
const init = async (msg, args) => {
  if (!args[0]) return msg.channel.createMessage('Missing argument');
  const member = await PLX.getTarget(args[0], msg.guild, false, true);
  if (!member) return msg.channel.createMessage('Unresolved member')
  const players = [msg.author.id, member.id];
  let playerTurnIndex = 0;

  const listener = async (d) => {
    if (d.message.id !== msg.id) return;
    if (!players.includes(d.member.user.id)) return PLX.requestHandler.request('POST', `/webhooks/${d.id}/${d.token}/callback`, true, { type: 4, data: { content: 'Invalid user', flags: 64 } });
    if (players[playerTurnIndex] !== d.member.user.id) return PLX.requestHandler.request('POST', `/webhooks/${d.id}/${d.token}/callback`, true, { type: 4, data: { content: 'Turn is currently other user', flags: 64 } });
    const [x, y] = d.data.custom_id.split(',');
    d.message.components[y - 1].components[x - 1].style = playerTurnIndex ? 1 : 4;
    d.message.components[y - 1].components[x - 1].label = '';
    d.message.components[y - 1].components[x - 1].emoji = { name: playerTurnIndex ? 'heavy_multiplication_x' : 'o' };
    d.message.components[y - 1].components[x - 1].disabled = true;
    playerTurnIndex = playerTurnIndex ? 0 : 1;
    await PLX.requestHandler.request('POST', `/webhooks/${d.id}/${d.token}/callback`, true, { type: 4, data: { content: `It is now <@${players[playerTurnIndex]}>'s turn`, components: d.message.components }})
  }

  await msg.channel.createMessage({
    content: `It is now <@${players[playerTurnIndex]}>'s turn`,
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 2,
            custom_id: '1,3',
            label: '\u200b'
          }, {
            type: 2,
            style: 2,
            custom_id: '2,3',
            label: '\u200b'
          }, {
            type: 2,
            style: 2,
            custom_id: '3,3',
            label: '\u200b'
          }
        ]
      }, {
        type: 1,
        components: [
          {
            type: 2,
            style: 2,
            custom_id: '1,2',
            label: '\u200b'
          }, {
            type: 2,
            style: 2,
            custom_id: '2,2',
            label: '\u200b'
          }, {
            type: 2,
            style: 2,
            custom_id: '3,2',
            label: '\u200b'
          }
        ]
      }, {
        type: 1,
        components: [
          {
            type: 2,
            style: 2,
            custom_id: '1,1',
            label: '\u200b'
          }, {
            type: 2,
            style: 2,
            custom_id: '2,1',
            label: '\u200b'
          }, {
            type: 2,
            style: 2,
            custom_id: '3,1',
            label: '\u200b'
          }
        ]
      }
    ]
  })
  PLX.on('rawWS', (p) => p.t === 'INTERACTION_CREATE' && listener(p.d))
}

module.exports = {
  init,
  pub: true,
  cmd: 'noughtsandcrosses',
  argsRequired: true,
  cat: 'games',
  aliases: ['n&c', 'nac', 'nnc', 'tictactoe', 'ttt']
}