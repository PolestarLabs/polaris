//delete require.cache[require.resolve('../../archetypes/YTDownloader.js')];

const ytd = require('../../archetypes/YTDownloader.js');


const init = async function (msg){
    
    ytd(msg.args[0],msg.author.id).then(file=>{
        msg.channel.send("here,",file)
    }).catch(err=>{
         
        msg.channel.send(err)
    });

}

module.exports={
    init
    ,cooldown: 8000
    ,pub:false
    ,cmd:'ytdown'
    ,cat:'utility'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:[]
}