const BOARD = require('../../archetypes/Soundboard.js');
const ytdl= require("ytdl-core"); 

const init = async function (msg,args){

    
    BOARD.play(msg, ytdl(args[0])  );

}

module.exports={
    init
    ,pub:false
    ,cmd:'playit'
    ,cat:'sound'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['py']
}