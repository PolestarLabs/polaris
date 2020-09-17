const init = function (msg){
  let fs = require('fs')
  delete require.cache[require.resolve(appRoot+'/asciiPollux.js')]  
  let text = require(appRoot+'/asciiPollux.js').ascii();
  process.stdout.write('\033c');
  console.log(text)  
}

module.exports = {
    pub: false,
    cmd: "asciipol",
    perms: 3,
    init: init,
    cat: 'misc',
    cool:800
};