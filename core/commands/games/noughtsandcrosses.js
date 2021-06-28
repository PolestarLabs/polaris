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
  let PLXMessage;

  // possible wins: top, middle, bottom, left, center, right, TLBR, TRBL
  const counters = [
    Array(8).fill(0),
    Array(8).fill(0),
  ]

  const addToCounter = (col, row) => {
    counters[playerTurnIndex][row]++;
    counters[playerTurnIndex][col]++;
    if (row === col) {
      counters[playerTurnIndex][6]++;
    }
    if (row + col === 2) { // 0,2 or 2,0 or 1,1
      counters[playerTurnIndex][7]++; 
    }
  }

  const hasWon = (counter) => {
    const win = counter.indexOf(3);
    if (win === -1) {
      if (counters.map((c) => c.filter((d) => d !== 0).length).reduce((a, b) => a + b) === 9) return null;
      return false;
    }

    return win;
  }

  const listener = async (d) => {
    if (d.message.id !== PLXMessage) return;
    if (!players.includes(d.member.user.id)) return PLX.requestHandler.request('POST', `/interactions/${d.id}/${d.token}/callback`, true, { type: 4, data: { content: 'Invalid user', flags: 64 } });
    if (players[playerTurnIndex] !== d.member.user.id) return PLX.requestHandler.request('POST', `/interactions/${d.id}/${d.token}/callback`, true, { type: 4, data: { content: 'Turn is currently other user', flags: 64 } });

    const [x, y] = d.data.custom_id.split(',');
    addToCounter(x, y);

    d.message.components[y - 1].components[x - 1].style = playerTurnIndex ? 4 : 1;
    d.message.components[y - 1].components[x - 1].label = '';
    d.message.components[y - 1].components[x - 1].emoji = playerTurnIndex ? { name: '✖️' } : { id: '851610730880303125' }; // { name: playerTurnIndex ? '❌' : '⭕' };
    d.message.components[y - 1].components[x - 1].disabled = true;

    const winStatus = hasWon(counters[playerTurnIndex]);
    if (winStatus) {
      PLX.off('rawWS', listener);

      if (winStatus < 3) { // horizontal win (0, 1, 2 possible, 0, 1, 2 on y axis)
        d.message.components[winStatus].components = d.message.components[winStatus].components.map((c) => {
          c.style = 3;
          return c;
        });
      } else if (winStatus < 6) { // vertical win (3, 4, 5 possible, 0, 1, 2 on x axis)
        d.message.components = d.message.components.map((c) => {
          c.components[winStatus - 3].style = 3;
          return c;
        });
      } else if (winStatus === 6) { // TLBR
        d.message.components[0].components[0].style = 3;
        d.message.components[1].components[1].style = 3;
        d.message.components[2].components[2].style = 3;
      } else { // TRBL
        d.message.components[0].components[2].style = 3;
        d.message.components[1].components[1].style = 3;
        d.message.components[2].components[0].style = 3;
      }

      d.message.components = d.message.components.map((a) => { a.components = a.components.map((b) => { b.disabled = true; return b; }); return a; });

      msg.channel.createMessage({
        content: `<@${players[playerTurnIndex]}> has won!`,
        messageReference: { messageID: PLXMessage },
      });
      return PLX.requestHandler.request('POST', `/interactions/${d.id}/${d.token}/callback`, true, { type: 7, data: { content: `<@${players[playerTurnIndex]}> has won!`, components: d.message.components }});
    }

    if (winStatus === null) { // Draw
      d.message.components = d.message.components.map((a) => { a.components = a.components.map((b) => { b.disabled = true; return b; }); return a; });

      PLX.off('rawWS', listener);

      const content = `${players.map((p) => `<@${p}>}`).join(' and ')} drew!`; // Prevent useless double map

      msg.channel.createMessage({
        content,
        messageReference: {
          messageID: PLXMessage,
        },
      });
      return PLX.requestHandler.request('POST', `/interactions/${d.id}/${d.token}/callback`, true, { type: 7, data: { content, components: d.message.components }});
    }

    playerTurnIndex = playerTurnIndex ? 0 : 1;
    await PLX.requestHandler.request('POST', `/interactions/${d.id}/${d.token}/callback`, true, { type: 7, data: { content: `It is now <@${players[playerTurnIndex]}>'s turn`, components: d.message.components } });
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
      }
    ]
  }).then((m) => PLXMessage = m.id)
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