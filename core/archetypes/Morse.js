const MAP = {
  A: ".-",
  B: "-...",
  C: "-.-.",
  D: "-..",
  E: ".",
  F: "..-.",
  G: "--.",
  H: "....",
  I: "..",
  J: ".---",
  K: "-.-",
  L: ".-..",
  M: "--",
  N: "-.",
  O: "---",
  P: ".--.",
  Q: "--.-",
  R: ".-.",
  S: "...",
  T: "-",
  U: "..-",
  V: "...-",
  W: ".--",
  X: "-..-",
  Y: "-.--",
  Z: "--..",
  Á: ".--.-", // A with acute accent
  Ä: ".-.-", // A with diaeresis
  É: "..-..", // E with acute accent
  Ñ: "--.--", // N with tilde
  Ö: "---.", // O with diaeresis
  Ü: "..--", // U with diaeresis
  1: ".----",
  2: "..---",
  3: "...--",
  4: "....-",
  5: ".....",
  6: "-....",
  7: "--...",
  8: "---..",
  9: "----.",
  0: "-----",
  ",": "--..--", // comma
  ".": ".-.-.-", // period
  "?": "..--..", // question mark
  ";": "-.-.-", // semicolon
  ":": "---...", // colon
  "/": "-..-.", // slash
  "-": "-....-", // dash
  "'": ".----.", // apostrophe
  "()": "-.--.-", // parenthesis
  _: "..--.-", // underline
  "@": ".--.-.", // at symbol from http://www.learnmorsecode.com/
  " ": ".......",
};

function encode(obj) {
  return maybeRecurse(obj, encodeMorseString);

  function encodeMorseString(str) {
    let ret = str.split("");
    for (let j in ret) {
      ret[j] = MAP[ret[j].toUpperCase()] || " ";
    }
    return ret.join(" ");
  }
}

function decode(obj) {
  return maybeRecurse(obj, decodeMorseString);

  function decodeMorseString(str) {
    let ret = str.split(" ");
    for (let i in ret) {
      ret[i] = decodeCharacterByMap(ret[i]);
    }
    return ret.join("");
  }
}

function maybeRecurse(obj, func) {
  if (!obj.pop) return func(obj);

  let clone = [];
  let i = 0;  
  while (i++ < obj.length) clone[i-1] = func(obj[i-1]);

  return clone;
}

function decodeCharacterByMap(char) {
  for (let i in MAP) {
    if (MAP[i] === char) return i;
  }
  return " ";
}


module.exports = {
    encode: encode,
    decode: decode,
};