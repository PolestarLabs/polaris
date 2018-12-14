const Eris = require('eris');
const MersenneTwister = require('./MersenneTwister');
const generator = new MersenneTwister();

module.exports = {

  reload: function(){delete require.cache[require.resolve('./Gearbox')]},
  emoji: function emoji(query){
    return "-"
  },
  getTarget: function getTarget(msg,argPos=0,self=true){
    if(!msg.args[0]) return msg.author;
    let ID = msg.args[argPos].replace(/[^0-9]/g,'');
    let user = POLLUX.users.find(usr=> usr.id === ID )
    if(!user){
      user = msg.guild.members.find(mbr=>
                  mbr.username.toLowerCase().includes(msg.args[argPos].toLowerCase())
                            );
      if (!user) user = msg.author;
    }
    return user;
  },

  Embed: Eris.Embed,
  RichEmbed: this.Embed,
  randomize: function randomize(min, max) {
    let RAND = generator.random();
    return Math.floor(RAND * (max - min + 1) + min);
  },

  wait: function wait(time){
      time = typeof time == 'number' ? time : 1000;
      return new Promise(resolve => {
          setTimeout(() => {
            resolve(true);
          },
          time*1000||1000);
      });
    },

  miliarize: function miliarize(numstring,strict,char="."){
      try{
        if (typeof numstring == "number"){
            numstring = numstring.toString() || "0";
        };
        numstring = numstring.split('.')[0]
        let numstringExtra = numstring.split('.')[1]||"";
        if(numstringExtra.length > 1)numstringExtra = " ."+ numstringExtra;
        else numstringExtra = "";

        if(numstring.length < 4)return numstring;
        //-- -- -- -- --
        let stashe = numstring.replace(/\B(?=(\d{3})+(?!\d))/g, char).toString();
        // Gibe precision pls
        if(strict){
            let stash = stashe.split(char)
        switch(stash.length){
            case 1:
                return stash+numstringExtra;
            case 2:
                if(stash[1]!="000") break;
                return stash[0]+numstringExtra+"K";
            case 3:
                if(stash[2]!="000") break;
                return stash[0]+char+stash[1][0]+stash[1][1]+numstringExtra+"Mi";
            case 4:
                if(stash[3]!="000") break;
                return stash[0]+char+stash[1][0]+stash[1][1]+numstringExtra+"Bi";
             }
            return stashe+numstringExtra;
        };
        // Precision is not a concern
        stash = stashe.split(char)
        switch(stash.length){
            case 1:
                return stash.join(" ");
            case 2:
                if(stash[0].length<=1) break;
                return stash[0]+"K";
            case 3:
                return stash[0]+"Mi";
            case 4:
                return stash[0]+"Bi";
             }
         return stashe+numstringExtra;
    }catch(err){
      return "---"
    }
    },
  shuffle:  function shuffle(array) {
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

}
