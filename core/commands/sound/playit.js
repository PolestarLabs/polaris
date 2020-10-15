const BOARD = require('../../archetypes/Soundboard.js');
const ytdl= require("ytdl-core"); 

const init = async function (msg,args){

    let chunks = [];
    let fileBuffer;

    ytdl.getInfo(args[0]).then((a,b)=>{
        let title   = a.videoDetails.title;
        let author  = a.videoDetails.author.name;
        let thumb   = `https://i.ytimg.com/vi/${a.videoDetails.videoId}/hqdefault.jpg`
        let dur     = a.videoDetails.lengthSeconds;

        msg.delete();

        const URL = `https://pollux.gg/generators/nowplaying.png?uid=${
            msg.author.id
        }&thumb=${
            encodeURIComponent(thumb)
        }&name=${
            encodeURIComponent(title)
        }&artist=${
            encodeURIComponent(author)
        }&dur=${
            (dur%60) +":"+ ~~(dur/60)
        }&time=${
            "00:04"
        }&key=${
            'polestar4728'
        }`

        console.log(URL);

        const STREAM=ytdl(args[0], {quality: 'lowestaudio'});
        let playingMessage = {
            embed: {
                description:`<:play:343511123204767744> [**Now Playing**](https://youtube.com/${a.url})`,
                image:{url: URL},
                color:0x36393f
            }
        }
        
        BOARD.play(msg,STREAM,{
            playingMessage,
            //exitMessage:"gon"
        })
    })



}

module.exports={
    init
    ,pub:false
    ,cmd:'playit'
    ,cat:'sound'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['py']
}