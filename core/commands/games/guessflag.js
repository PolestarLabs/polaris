const GG = require('../../archetypes/GuessingGames');
const init = async function (msg,args){


    let gamemode =  "normal";
    let guessed  =  "{{user}} got it! This is the flag of **{{answer}}**";
    let timeout  =  "Time's up! Seems like nobody guessed it. :("


    if (args.includes('endless')){
        gamemode = "endless";
        timeout  =  "Time's up! Looks like this one was a tough one..."
        msg.channel.send("Alright! We're playing in **endless mode**. Let's see how far can you go.")
    } 
    if (args.includes('time')){
        gamemode = "time";
        timeout  =  "Time's up! Let's see how you performed..."
        guessed  =  "{{user}} got it! This is the flag of **{{answer}}**. On to the next...";
        msg.channel.send("Alright! We're playing in **time attack mode**. Just how many flags you can guess within 1 minute?")
    } 

    let Flags = new GG('guessflags','image',{
        title: "Guess the Flag",
        prompt: "What country does this flag belong to?",
        solo: args.includes('solo'),
        gamemode,guessed,timeout
    });

    Flags.play(msg);

}

module.exports={
    init
    ,pub:true
    ,cmd:'guessflag'
    ,cat:'games'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['gtf']
}