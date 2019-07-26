let kickIn = [
    "I see that ",
    "Seems like ",
    "The cards say ",
    "Recently ",
    "Long ago ",
    "In the past "
    ]
    let connect = [
    "you've been ",
    "you were ",
    "you have been ",
    "you're "
    ]
    let intermezzo = [
    ", but ",
    ", and ",
    ", yet ",
    ", then "
    ]
    let connect_2 = [
      "now seems to ", 
    "now ",
    "decided to ",
    "got to ",
    "had to ",
    "will have to ",
    "must get to ",
    "you feel an urge to ",
    "you want so much to ",
    "you feel like you have to "
    ]
    let intermission = [
    ", this means that you will be ",
    " which will end up in ",
    ", that will lead to ",
    ", so the way is ",
    ". Take care with stuff like ",
    ". So, don't worry about ",
    ". Be careful while ",
    ", so please dont ever try ",
    ". I also see you  ",
    ". And this last card says that you will be ",
    ". In the future you will be ",
    ". Very soon you will be "
    
    ]
    let ligature = [
    "dealing with "
    , "finding "
    , "avoiding "
    , "facing "
    , "doing "
    , "pursuing "
    , "following "
    , "defying "
    , "getting "
    ]
    let intermezzo_2 = [
    ", and ",
    ", but ",
    ", although ",
    ", though ",
    ", however "
    ]
    let K = [
      "This will be ",
    "That will be ",
    "Things like this happen "
    ]
    let happen = [
    "very soon! "
    , "sooner than you expect! "
    , "every day."
    , "in some years. "
    , "never! "
    , "today. "
    , "very often. "
    ]
    let last = [
    ".\nSo please take care"
    , ".\nAnd that's what the cards have to say"
    , ".\nAnd this is your fortune."
    , ".\nSo, please enjoy your future."
    , ".\nThat is really awesome isn't it?"
    , ".\nI wish i had a fortune like this to me."
    , ".\nYou could be better."
    , ".\nThings could be worse."
    
    ]
    let S = [
    kickIn,
    connect,
      " {{start}} ",
    intermezzo,
    connect_2,
      " {{mid}} ",
    intermission,
    //ligature,
      " {{end}} ",
    //intermezzo_2,
    //K,
    //happen,
    last
    ]
    
    
const TAROT = require('../../archetypes/Tarot');

    const init = async function (msg,args) {
    
        let Tarot = new TAROT(msg,Number(args[0]||3));

        //console.log(Tarot);
    
        let img = await Tarot.drawSpread('persona3');

        console.log(img)

        msg.channel.send('',{file:img.toBuffer(),name:'tarot.png'} )


    return;
      try {
    
    
    
        let finalString = ""
    
        for (i = 0; i < S.length; i++) {
          if (typeof S[i] !== 'string') {
            finalString += S[i][randomize(0, S[i].length - 1)]
    
          } else {
            finalString += S[i]
    
          }
        }
    
    
    
    
    
        let startup = `
    Spread:
    **${ARCANA[arcana[0]].Arcana}**:\`${position[0]}\`
    **${ARCANA[arcana[1]].Arcana}**:\`${position[1]}\`
    **${ARCANA[arcana[2]].Arcana}**:\`${position[2]}\`
    --
    `
        pc = ''
        finalString = finalString
          .replace('{{start}}', pc + ARCANA[arcana[0]][position[0] + '.START'] + pc)
          .replace('{{mid}}', pc + ARCANA[arcana[1]][position[1] + '.MID'] + pc)
          .replace('{{end}}', pc + ARCANA[arcana[2]][position[2] + '.END'] + pc)
          .replace(/ +/g, ' ')
          .replace(/ ,/g, ',')
          .replace(/ \./g, '.')
    
    
    
        let embed = new RichEmbed
    
        embed.attachFiles({
          attachment: await canvas.toBuffer(),
          name: "tarot.png"
        });
        embed.setImage("attachment://tarot.png");
    
        pc2 = ''
        embed.setDescription(pc2 + finalString + pc2)
        embed.setTitle("3 Card Spread Fortune")
        embed.setFooter("Current Deck: Persona 3", 'https://lh3.googleusercontent.com/-9YpgeohI1lo/AAAAAAAAAAI/AAAAAAAACFA/u3wB6SrW4Vo/s640/photo.jpg')
        embed.setColor("#951d2f")
    
        message.channel.send({
          embed
        }).catch(e=>message.channel.send(startup+finalString))
    
        /*
        message.channel.send(startup+finalString,{
                          files: [{
                              attachment: await canvas.toBuffer(),
                              name: "tarot.png"
                          }]
                      })
        */
    
      } catch (e) {
        console.error(e)
      }
    
    
    } 
    
    
    module.exports = {
      pub: true,
      cmd: 'tarot',
      perms: 3,
      init: init,
      cat: 'games'
    };
    