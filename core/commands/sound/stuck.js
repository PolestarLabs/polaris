const BOARD = require('../../archetypes/Soundboard.js')

const init = async function (msg){

    BOARD.play(msg, "https://cdn.discordapp.com/attachments/415550879823953930/755212852184481983/verstappen-after-another-race-mugello-2020-tuscan-gp.mp3");

}

module.exports={
    init
    ,pub:false
    ,cmd:'stuck'
    ,cat:'sound'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:[]
}