const Stream = require("stream");
const fs = require("fs");

const MORSE = require("../../archetypes/Morse.js");
const BOARD = require("../../archetypes/Soundboard.js");

// const _RADIO = (paths.ASSETS    +  '/sound/tune.mp3');
const _DOT = (`${paths.ASSETS}/sound/short.mp3`);
const _DASH = (`${paths.ASSETS}/sound/long.mp3`);
const _SILENCE = (`${paths.ASSETS}/sound/silent.mp3`);

const dot = "•"; // "<:dot:747373996533612574>"
const dash = "－"; // "<:dash:747373996323897345>"
const space = " ";// "<:space:747373996269371513>"

const init = async function (msg, args) {
  const P = { lngs: msg.lang };
  
  const string = MORSE.cleanup( args.join(" ") );
  const morseCodeString = MORSE.encode( string );

  const outputTX = morseCodeString.replace(/\.\.\.\.\.\.\./g, " ");
  const embed = { // TRANSLATE[epic=translations] ?? morse
    author: { name: "We get signal!" },
    footer: { text: "Radio Operator | Zero Wing", icon_url: "http://i.imgur.com/tda07NK.png" },
    color: 0x5745a3,
    thumbnail: { url: "https://telegraph.p3k.io/assets/telegraph-icon-white.png" },
    description: `${"*\"WHAT?\"*\n```" + ` ${outputTX.replace(/-/g, dash).replace(/\./g, dot).replace(/ /g, space).slice(0, 1500)}` + "```\n" + "📡 "}${$t("forFun.transmittedVc", P)}`,
  };

  if (!msg.member.voiceState.channelID) {
    msg.channel.send({ content: $t("responses.warnings.enterVoiceBetterExperience", P), embed });
  } else {
    const output = new Stream.PassThrough();
    const morseCodeArray = args.map(MORSE.encode);
    const morseFiles = morseCodeArray.reduce((prev, curr) => {
      const morse_arr = [_SILENCE];
      for (position in curr) {
        switch (curr[position]) {
          case ".":
            morse_arr.push(_DOT);
            break;
          case "-":
            morse_arr.push(_DASH);
            break;
          case " ":
            morse_arr.push(_SILENCE);
            break;
          default:
            // morse_arr.push(_SILENCE); <-- maybe glitch noise or idk
            break;
        }
      }

      morse_arr.push(_SILENCE, _SILENCE, _SILENCE);
      return prev.concat(morse_arr);
    }, []);

    playback(morseFiles);
    BOARD.play(msg, output, { playingMessage: { embed } });

    function playback(pulses) {
      return new Promise((resolve, reject) => {
        if (!pulses.length) {
          output.end("Done");
          resolve();
        }
        const stream = fs.createReadStream(pulses[0]);
        stream.pipe(output, { end: false });
        stream.on("end", () => {
          resolve(playback(pulses.slice(1, pulses.length)));
        });
      });
    }
  }
};

module.exports = {
  init,
  pub: true,
  argsRequired: true,
  cmd: "morse",
  cat: "sound",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: [],
};
