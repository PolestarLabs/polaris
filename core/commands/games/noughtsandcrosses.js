const scanlines = (grid) => { // grid = [[x,x,x],[x,x,x],[x,x,x]]

  const res = {
    r1: {
      data: grid[0],
      coords: grid[0].map((r, i) => ([0, i]))
    },
    r2: {
      data: grid[1],
      coords: grid[0].map((r, i) => ([1, i]))
    },
    r3: {
      data: grid[2],
      coords: grid[0].map((r, i) => ([2, i]))
    },

    c1: {
      data: grid.map(r => r[0]),
      coords: grid.map((r, i) => ([i, 0]))
    },
    c2: {
      data: grid.map(r => r[1]),
      coords: grid.map((r, i) => ([i, 1]))
    },
    c3: {
      data: grid.map(r => r[2]),
      coords: grid.map((r, i) => ([i, 1]))
    },

    dLR: {
      data: grid.map((r, c) => r[c]),
      coords: [0, 1, 2].map(p => ([p, p]))
    },
    dRL: {
      data: grid.map((r, c) => r[2 - c]),
      coords: [2, 1, 0].map(p => ([p, p]))
    },

  };

  return res;

}

/**
 * 
 * @param {import('eris').Message<import('eris').GuildTextableChannel>} msg 
 * @param {string[]} args 
 */
 const init = async (msg, args) => {
  if (!args[0]) return msg.channel.createMessage('Missing argument');
  const member = await PLX.getTarget(args[0], msg.guild, false, true);
  if (!member) return msg.channel.createMessage('Unresolved member')
  if (member.id === msg.author.id) return msg.channel.createMessage('Cannot play yourself');
  if (member.user.bot) return msg.channel.createMessage('Cannot play with bots');
  const players = [msg.author.id, member.id];
  let playerTurnIndex = 0;
  let PLXMessage;

  const boardGrid = [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ];

  const markToBoard = (col, row) => {
    boardGrid[row - 1][col - 1] = playerTurnIndex + 1;
  }

  const listener = async (d) => {
    if (d.message.id !== PLXMessage) return;
    if (!players.includes(d.member.user.id)) return PLX.requestHandler.request('POST', `/interactions/${d.id}/${d.token}/callback`, true, { type: 4, data: { content: 'Invalid user', flags: 64 } });
    if (players[playerTurnIndex] !== d.member.user.id) return PLX.requestHandler.request('POST', `/interactions/${d.id}/${d.token}/callback`, true, { type: 4, data: { content: 'Turn is currently other user', flags: 64 } });

    const [x, y] = d.data.custom_id.split(',');

    markToBoard(x, y);
    let winner = 0;
    const finalResult = Object.values(scanlines(boardGrid)).find(combo => {
      if (combo.data.includes(null)) return false;
      const score = combo.data.reduce((acc, val) => acc + val, 0);
      if (~~(score / 3) === score / 3) {
        winner = score / 3;
        return true;
      };
      if (boardGrid.reduce((a, b) => [...a, ...b]).filter((a) => a === null).length === 0) winner = null;
    });

    d.message.components[y - 1].components[x - 1].style = playerTurnIndex ? 4 : 1;
    d.message.components[y - 1].components[x - 1].label = '';
    d.message.components[y - 1].components[x - 1].emoji = playerTurnIndex ? { name: '✖️' } : { id: '851610730880303125' }; // { name: playerTurnIndex ? '❌' : '⭕' };
    d.message.components[y - 1].components[x - 1].disabled = true;

    if (winner) {
      PLX.off('rawWS', listener);

      finalResult.coords.forEach(([x, y]) => d.message.components[x].components[y].style = 3);
      d.message.components = d.message.components.map((a) => { a.components = a.components.map((b) => { b.disabled = true; return b; }); return a; });

      msg.channel.createMessage({
        content: `<@${players[playerTurnIndex]}> has won!`,
        messageReference: { messageID: PLXMessage },
      });
      return PLX.requestHandler.request('POST', `/interactions/${d.id}/${d.token}/callback`, true, { type: 7, data: { content: `<@${players[playerTurnIndex]}> has won!`, components: d.message.components } });

    }

    if (winner === null) { // Draw
      d.message.components = d.message.components.map((a) => { a.components = a.components.map((b) => { b.disabled = true; return b; }); return a; });

      PLX.off('rawWS', listener);

      const content = `${players.map((p) => `<@${p}>`).join(' and ')} drew!`; // Prevent useless double map

      msg.channel.createMessage({
        content,
        messageReference: {
          messageID: PLXMessage,
        },
      });
      return PLX.requestHandler.request('POST', `/interactions/${d.id}/${d.token}/callback`, true, { type: 7, data: { content, components: d.message.components } });
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
