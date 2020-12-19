// @ts-check
/* eslint-disable no-await-in-loop */
const { global } = require("../../../../internal_modules/database_schema/schemas/_misc.js");
const RussianRoulette = require("../../archetypes/RussianRoulette.js");
const BOARD = require("../../archetypes/Soundboard.js");

const gunRoll = `${appRoot}/../assets/sound/gunroll.mp3`;
const awp = `${appRoot}/../assets/sound/awp.mp3`;
const click = `${appRoot}/../assets/sound/click.mp3`;
const clickNoAmmo = `${appRoot}/../assets/sound/noammo.mp3`;

// TRANSLATE[epic=translations] russian roulette
// TODO[epic=anyone] rr - add easter egg with `=say` cmd
// FIXME[epic=flicky] rr - sound stopped working
// NOTE rr- could really some code cleanup

const ECO = require(`${appRoot}/core/archetypes/Economy.js`);

const startGameCollector = async (game, msg, cb) => {
  const BET = parseInt(msg.args[0]);

  const response = await msg.channel.awaitMessages(
    (m) => m.author.id === msg.author.id && ["shoot", "stop"].includes(m.content.toLowerCase()),
    {
      time: 10e3,
      maxMatches: 1,
    },
  );

  if (!response[0]) return msg.reply("you haven't said your action in 30 seconds! Stopping the game.");

  const result = await game.handleInput(response[0].content);

  console.log({ result });

  if (result.stopped) {
    await ECO.receive(msg.author.id, game.currentPayout - BET, "Russian Roulette STOP");
    return msg.channel.send(`You're a quitter!\n I added **${game.currentPayout} rubines** to your account. Sigh.`);
    // return msg.channel.send(result.better
    //   ? `You're a quitter!\n I added **${game.currentPayout} rubines** to your account. Sigh.`
    //   : "You're a quitter!\nI haven't changed anything because you didn't even played.");
  }

  const message = await msg.channel.send("Let's see if you're going to die now...");
  if (result.lost) { // REVIEW[epic=mitchell] rr - check if we can use transfer instead
    await ECO.pay(msg.author.id, BET, "Russian Roulette FAILURE");
    return message.edit("BOOM! Someone got shot...\nYou lost your money. RIP.");
  } if (result.won) {
    await ECO.receive(msg.author.id, game.currentPayout - BET, "Russian Roulette FLAWLESS");
    return message.edit(`**no bullet noise**\nYou came out alive of the game...\nI added **${game.currentPayout}** rubines to your account.`);
  }

  await message.edit(`**no bullet noise**\nNo bullet this time (${result.rounds} rounds remaining)...\n`
    + `You currently have **${game.currentPayout} rubines.**\n`
    + "Use `shoot` to test your luck one more time (if you don't get shot, I'm going to add more money to your current amount)\n"
    + "Use `stop` to stop here and get your money.");
  return cb(game, msg, cb);
};

const startPlayerCollector = async (msg) => {
  const verifiedPlayers = [];

  const filter = async (m) => m.content.toLowerCase().startsWith("join ")
      && !m.author.bot // NOTE: could be turned into a feature though
      && !verifiedPlayers.filter((a) => a.id === m.author.id)[0]
      && !Number.isNaN(m.content.split(" ")[1])
      && parseInt(m.content.split(" ")[1]) > 0
      && (await ECO.checkFunds(m.author.id, parseInt(m.content.split(" ")[1])))
      && verifiedPlayers.push({
        id: m.author.id,
        name: m.author.username,
        money: parseInt(m.content.split(" ")[1]),
      })
      && msg.edit(`**Total of rubines in the pool**: ${verifiedPlayers.map((a) => a.money).reduce((a, b) => a + b)} rubines\n`
      + `**Players**\n${verifiedPlayers.map((a) => `- **${a.name}** - ${a.money} rubines\n`).join("")}`);

  await msg.channel.awaitMessages(filter, {
    time: 20e3,
  });

  return verifiedPlayers;
};

// START
// Does member die?
const playerRoulette = async (player, game) => {
  const rst = game.handleInput("shoot");
  if (rst.lost) await ECO.pay(player.id, player.money, "RUSSIANROULETTE");
  return !!rst.lost;
};

const handlePlayers = async (msg, players, game, gameFrame) => {
  let voiceChannel = msg.member.voiceState.channelID;
  voiceChannel &= await PLX.joinVoiceChannel(voiceChannel).catch((err) => null);
  let dead = null;
  for (const index in players) { // eslint-disable-line guard-for-in
    await wait(1);
    if (voiceChannel) voiceChannel.stopPlaying();
    const player = players[index];

    // No one is dead so far
    gameFrame.embed.description += `${player.name}'s turn.... `;
    if (voiceChannel) voiceChannel.play(click);
    // gameFrame.embed.image.url = ""// `${paths.CDN}/build/games/russian_roulette/load1_.gif`
    await msg.edit(gameFrame); // Next person, edit message and wait 3 seconds
    const died = await playerRoulette(player, game);

    await wait(4);

    // Fire. Check if they're dead

    if (died) { // Person died
      dead = player; // This is the person who died
      players.splice(index, 1); //  Person should be removed from array
      gameFrame.embed.description += `BOOM! ${player.name} is dead.`;
      gameFrame.embed.color = 0x521723;
      gameFrame.embed.image.url = `${paths.CDN}/build/games/russian_roulette/shot_.gif`;
    } else { // Person did not die
      gameFrame.embed.description += "*no bullet noise*\n";
      gameFrame.embed.color = 0x32437d;
      gameFrame.embed.image.url = `${paths.CDN}/build/games/russian_roulette/blank_.gif`;
    }

    // Tell players the status of that player
    // await wait(1);
    // if (game.voiceChannel) game.voiceChannel.stopPlaying();

    if (voiceChannel) voiceChannel.stopPlaying();
    await msg.edit(gameFrame);
    if (died) {
      if (voiceChannel) voiceChannel.play(awp);
    } else if (voiceChannel) voiceChannel.play(clickNoAmmo);

    if (died) break;
  }
  // End of round
  return dead;
};

const newRound = async (msg, players, round = 0) => {
  // Initialise game
  let voiceChannel = msg.member.voiceState.channelID;
  voiceChannel &= await PLX.joinVoiceChannel(voiceChannel).catch((err) => null);
  if (voiceChannel) voiceChannel.play(gunRoll);
  await wait(2);

  const value = players.map((a) => a.money).reduce((a, b) => a + b);
  const game = new RussianRoulette(null, 0);
  const gameFrame = {
    embed: {
      title: `**Round ${round}**\n`,
      description: "",
      image: { url: "" },
      color: 0x2b2b3b,
    },
  };

  // Actual rounds
  const message = await msg.channel.send(gameFrame);
  const diedInRound = await handlePlayers(message, players, game, gameFrame);
  message.deleteAfter(2e3);

  // Is there 1 person left?
  if (players.length === 1) { // This person wins
    await ECO.receive(players[0].id, value, "RUSSIANROULETTE");

    gameFrame.embed.title = "Show is over, kids!";
    gameFrame.embed.description = `${players[0].name} stands victorious!`;
    gameFrame.embed.color = 0x608a6d;
    gameFrame.embed.image.url = `${paths.CDN}/build/games/russian_roulette/win_.gif`;

    const plxMessage = await msg.channel.send(gameFrame);
    if (voiceChannel) voiceChannel.once("end", () => PLX.leaveVoiceChannel(plxMessage.member.voiceState.channelID));
    return;
  }
  // There are more people in the game
  msg.channel.send({
    embed: {
      title: "End of the round!",
      description: `**Results:**\n${diedInRound ? `${diedInRound.name} was the loser. RIP.` : "No one died this time..."}\nStarting the next round.`,
      thumbnail: { url: `${paths.CDN}/build/games/russian_roulette/miniload.gif` },
    },
  }).then((m) => m.deleteAfter(2e3));

  return newRound(msg, players, round + 1);
};
// END

const init = async (msg, args) => {
  if (args[0] === "multiplayer" || args[0] === "mp" || args[0] === "start") {
    await msg.channel.send("Ok, multiplayer mode.\nTo join the match, just use `join <how many rubines you are using>`.\n"
      + "**The match starts in __20 seconds__.**");
    const players = await startPlayerCollector(await msg.channel.send("**Total of rubines in the pool:** 0 rubines\n**Players**\n---"));
    if (players.length === 1) return msg.channel.send("If only 1 person is going to play, you should use singleplayer mode.");
    if (players.length === 0) return msg.channel.send("No one joined. I'm not playing this alone.");
    await msg.channel.send({
      embed: {
        description: `**Time's up!** Let's get started.\nPlayers: \`\`\`${players.map((a) => a.name).join(", ")}\`\`\``,
        image: { url: `${paths.CDN}/build/games/russian_roulette/load1_.gif` },
      },
    });

    return newRound(msg, shuffle(players), 0);
  }

  const BET = parseInt(args[0]);

  if (!BET) {
    return msg.reply(
      "you have to give me a number of how much rubines you are going to ~~waste~~ use, or you can use `multiplayer` to create a multiplayer game.",
    );
  }
  if (BET < 100) return msg.reply("You gotta bet at very least 100 RBN on thir");
  if (BET > 5000) return msg.reply("You can't put more than 5000 RBN at stake");

  const urf = await ECO.checkFunds(msg.author.id, BET);
  if (!urf) return msg.reply("you don't have all this money to waste with russian roulette.");

  const game = new RussianRoulette(msg, BET);

  await msg.channel.send("Russian Roulette? You probably already know the rules, so let's get started."
    + `\nIf you survive this one, you're going to receive **${game.nextValue} rubines**.\n`
    + "Use `shoot` to proceed (if you get shot, you'll lose your money).");
  return startGameCollector(game, msg, startGameCollector);
};

module.exports = {
  init,
  cmd: "russianroulette",
  pub: true,
  argsRequired: true,
  perms: 3,
  cat: "games",
  botPerms: ["attachFiles", "embedLinks", "manageMessages"],
  aliases: ["rr", "roletarussa"],
};
