const Stream = require('stream');
const fs = require('fs');

const BOARD = require('../../archetypes/Soundboard.js');
const morse_txt = require("morse");


//const _RADIO = (paths.ASSETS    +  '/sound/tune.mp3');
const _DOT = (paths.ASSETS + '/sound/short.mp3');
const _DASH = (paths.ASSETS + '/sound/long.mp3');
const _SILENCE = (paths.ASSETS + '/sound/silent.mp3');

const dot = "•"; //"<:dot:747373996533612574>"
const dash = "－"; //"<:dash:747373996323897345>"
const space = " ";//"<:space:747373996269371513>"


const init = async function (msg, args) {

  let P = { lngs: msg.lang };
  let string = args.join(' ')
    .replace(/[À-Åà-å]/gmi, "A")
    .replace(/[Ææ]/gmi, "AE")
    .replace(/[Çç]/gmi, "C")
    .replace(/[Ð]/gmi, "D")
    .replace(/[È-Ëè-ë]/gmi, "E")
    .replace(/[Ì-Ïì-ï]/gmi, "I")
    .replace(/[Ññ]/gmi, "N")
    .replace(/[Ò-Øðò-ø]/gmi, "O")
    .replace(/[ßẞ]/gmi, "S")
    .replace(/[Ù-Üù-ü]/gmi, "U")
    .replace(/[Ýýÿ]/gmi, "Y")
    .replace(/[þÞ]/gmi, "TH")
    .toUpperCase();;
  let code = morse_txt.encode(string);

  let outputTX = code.replace(/\.\.\.\.\.\.\./g, " ");
  const embed = {
    author: { name: "We get signal!" }
    , footer: { text: "Radio Operator | Zero Wing", icon_url: "http://i.imgur.com/tda07NK.png" }
    , color: 0x5745a3
    , thumbnail: { url: "https://telegraph.p3k.io/assets/telegraph-icon-white.png" }
    , description: "*\"WHAT?\"*\n```" + ` ${outputTX.replace(/-/g, dash).replace(/\./g, dot).replace(/ /g, space).slice(0, 1500)}` + "```\n" + "📡 " + $t('forFun.transmittedVc', P)

  };
  console.log(embed);

  if (!msg.member.voiceState.channelID) {
    msg.channel.send({ content: $t('responses.warnings.enterVoiceBetterExperience', P), embed });
  } else {

    const output = new Stream.PassThrough();

    const morseCode = string.split(' ').map(word => morse_txt.encode(word));

    const morseFiles = morseCode.reduce((prev, curr) => {
      var morse_arr = [_SILENCE];
      for (position in curr) {
        switch (curr[position]) {
          case '.':
            morse_arr.push(_DOT);
            break;
          case '-':
            morse_arr.push(_DASH);
            break;
          case ' ':
            morse_arr.push(_SILENCE);
            break;
          default:
            //morse_arr.push(_SILENCE); <-- maybe glitch noise or idk
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
          output.end('Done');
          resolve();
        }
        let stream = fs.createReadStream(pulses[0]);
        stream.pipe(output, { end: false });
        stream.on('end', function () {
          resolve(playback(pulses.slice(1, pulses.length)));
        });
      });
    }

  }

};

module.exports = {
  init
  , pub: false
  , cmd: 'morse'
  , cat: 'sound'
  , botPerms: ['attachFiles', 'embedLinks']
  , aliases: []
};


