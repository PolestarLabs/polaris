const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const Eris = require('eris');
const MersenneTwister = require('../MersenneTwister');
const generator = new MersenneTwister();

if (Eris.Embed) {
  Eris.Embed.prototype.setDescription = Eris.Embed.prototype.description;
  Eris.Embed.prototype.addField = Eris.Embed.prototype.field;
}

module.exports = {
  nope: ":nope:339398829088571402",
  reload: function () { delete require.cache[require.resolve('./Gearbox')] },

  invisibar: "\u200b\u2003\u200b\u2003\u200b\u2003\u200b\u2003\u200b\u2003\u200b\u2003\u200b\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003",

  Embed: Eris.Embed,
  RichEmbed: this.Embed, // legacy comp

  weightedRand:  (wArr = [-1]) => {
    let ttWgt = 0,
    i, rand;  
  for (i of wArr) {
    ttWgt += i;
  }  
  rand = Math.random() * ttWgt;  
  for (i in wArr) {
    if (rand < wArr[i]) return i; 
    rand -=  wArr[i];
  }  
  return -1;
},

  randomize: function randomize(min, max, seed = Date.now()) {
    let RAND = generator.random(seed);
    return Math.floor(RAND * (max - min + 1) + min);
  },
  wait: function wait(time) {
    time = typeof time == 'number' ? time : 1000;
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(true);
      },
        time * 1000 || 1000);
    });
  },
  miliarize: function miliarize(numstring, strict, char = ".") {
    try {
      if (typeof numstring == "number") {
        numstring = numstring.toString() || "0";
      };
      numstring = numstring.split('.')[0]
      let numstringExtra = numstring.split('.')[1] || "";
      if (numstringExtra.length > 1) numstringExtra = " ." + numstringExtra;
      else numstringExtra = "";

      if (numstring.length < 4) return numstring;
      //-- -- -- -- --
      let stashe = numstring.replace(/\B(?=(\d{3})+(?!\d))/g, char).toString();
      // Gibe precision pls
      if (strict) {
        let stash = stashe
        if (strict === 'soft') {
          stash = stashe.split(char)
          switch (stash.length) {
            case 1:
              return stash + numstringExtra;
            case 2:
              if (stash[1] != "000") break;
              return stash[0] + numstringExtra + "K";
            case 3:
              if (stash[2] != "000") break;
              return stash[0] + char + stash[1][0] + stash[1][1] + numstringExtra + "Mi";
            case 4:
              if (stash[3] != "000") break;
              return stash[0] + char + stash[1][0] + stash[1][1] + numstringExtra + "Bi";
          }
          return stashe + numstringExtra;
        }
        return stash;
      };
      // Precision is not a concern
      stash = stashe.split(char)
      switch (stash.length) {
        case 1:
          return stash.join(" ");
        case 2:
          if (stash[0].length <= 1) break;
          return stash[0] + "K";
        case 3:
          return stash[0] + "Mi";
        case 4:
          return stash[0] + "Bi";
      }
      return stashe + numstringExtra;
    } catch (err) {
      return "---"
    }
  },
  shuffle: function shuffle(array) {
    //console.warn("Deprecation warning: This is a Legacy Function")
    var currentIndex = array.length,
      temporaryValue, randomIndex;
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
  },
  capitalize: function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  },
  objCount: function count(array, what) {
    let it = 0; //go
    array.forEach(i => i === what ? it++ : false);
    return it;
  },

  resolveFile: function (resource) {
    if (Buffer.isBuffer(resource)) return Promise.resolve(resource);

    if (typeof resource === 'string') {
      if (/^https?:\/\//.test(resource)) {
        return fetch(resource).then(res => res.buffer());
      } else {
        return new Promise((resolve, reject) => {
          const file = path.resolve(resource);
          fs.stat(file, (err, stats) => {
            if (err) return reject(err);
            if (!stats || !stats.isFile()) return reject('[FILE NOT FOUND] '.red + file);
            fs.readFile(file, (err2, data) => {
              if (err2) reject(err2);
              else resolve(data);
            });
            return null;
          });
        });
      }
    } else if (typeof resource.pipe === 'function') {
      return new Promise((resolve, reject) => {
        const buffers = [];
        resource.once('error', reject);
        resource.on('data', data => buffers.push(data));
        resource.once('end', () => resolve(Buffer.concat(buffers)));
      });
    }
    return Promise.reject(new TypeError('REQ_RESOURCE_TYPE'));
  },
  file: function (file, name) {
    let finalFile = file instanceof Buffer ? file : fs.readFileSync(file);
    let ts = Date.now();
    if (typeof name === 'string') name = name;
    else if (typeof file === 'string') path.basename(file)
    else ts + ".png";
    let fileObject = {
      file: finalFile,
      name
    }
    return fileObject;
  }


}
