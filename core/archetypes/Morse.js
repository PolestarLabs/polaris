const MAP = {
    'A': '.-',
    'B': '-...',
    'C': '-.-.',
    'D': '-..',
    'E': '.',
    'F': '..-.',
    'G': '--.',
    'H': '....',
    'I': '..',
    'J': '.---',
    'K': '-.-',
    'L': '.-..',
    'M': '--',
    'N': '-.',
    'O': '---',
    'P': '.--.',
    'Q': '--.-',
    'R': '.-.',
    'S': '...',
    'T': '-',
    'U': '..-',
    'V': '...-',
    'W': '.--',
    'X': '-..-',
    'Y': '-.--',
    'Z': '--..',
    'Á': '.--.-', // A with acute accent
    'Ä': '.-.-',  // A with diaeresis
    'É': '..-..', // E with acute accent
    'Ñ': '--.--', // N with tilde
    'Ö': '---.',  // O with diaeresis
    'Ü': '..--',  // U with diaeresis
    '1': '.----',
    '2': '..---',
    '3': '...--',
    '4': '....-',
    '5': '.....',
    '6': '-....',
    '7': '--...',
    '8': '---..',
    '9': '----.',
    '0': '-----',
    ',': '--..--',  // comma
    '.': '.-.-.-',  // period
    '?': '..--..',  // question mark
    ';': '-.-.-',   // semicolon
    ':': '---...',  // colon
    '/': '-..-.',   // slash
    '-': '-....-',  // dash
    "'": '.----.',  // apostrophe
    '()': '-.--.-', // parenthesis
    '_': '..--.-',  // underline
    '@': '.--.-.',  // at symbol from http://www.learnmorsecode.com/
    ' ': '.......'
  };
  



module.exports = {
    encode: encode,
    decode: decode,
    map: MAP,

  };
  
  
  function encode (obj) {
    return maybeRecurse(obj, encodeMorseString);
  
    function encodeMorseString (str) {
      var ret = str.split('');
      for (var j in ret) {
        ret[j] = MAP[ret[j].toUpperCase()] || '?';
      }
      return ret.join(' ');
    }
  }
  
  function decode (obj, dichotomic) {
    return maybeRecurse(obj, decodeMorseString);
  
    function decodeMorseString (str) {
      var ret = str.split(' ');
      for (var i in ret) {
          ret[i] = decodeCharacterByMap(ret[i]);
      }
      return ret.join('');
    }
  }
  
  function maybeRecurse (obj, func) {
    if (!obj.pop) {
      return func(obj);
    }
  
    var clone = [];
    var i = 0;
    for (; i < obj.length; i++) {
      clone[i] = func(obj[i]);
    }
    return clone;
  }
  
  function decodeCharacterByMap (char) {
    for (var i in MAP) {
      if (MAP[i] == char) {
        return i;
      }
    }
    return ' ';
  }
  