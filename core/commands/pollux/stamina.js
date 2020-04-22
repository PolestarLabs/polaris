const Picto = require('../../utilities/Picto.js');
const Anime = require('../../structures/Animation.js');
const moment = require('moment')

const init = async function (msg,args){

let max = args[1] || 100;
let curr = (parseInt(args[0] || 50)||0) ;
curr = curr > max ? max : curr; 

const canvas = Picto.new(800,50);
const ctx = canvas.getContext('2d');

 

let embed = {
    description: `
    **Current Stamina** \`${curr}\`\u2003•\u2003\`${max}\` **Max Stamina**
`,
    color: 0xf75047,
    image:{ url: 'attachment://stamina.gif' } ,
    fields: [
        {value:`
> *You can replenish Stamina **with [Food Items](http://aaa.com)***

        ` ,name: `Stamina reset **${ moment.utc(1585951200000).fromNow() }**`,inline:true  }
 
    ]
    ,footer:  {text: msg.author.tag, icon_url: msg.author.avatarURL}
} 


let renderFrame = (current) => {
    const barSize = (690 * (current / max));
    Picto.roundRect(ctx,50,0,700,35,20,'#FFF');
    ctx.save()
    Picto.roundRect(ctx,55,5,690,25,15,'#98F');
    Picto.roundRect(ctx,55,5,690,25,15,'transparent');
    ctx.clip()
    Picto.roundRect(ctx,55,5,barSize,25,15,'#f75047');
    ctx.restore()
    let Percent = Picto.tag(ctx, parseInt(100 *current/max) + "% ","600 20px 'Visitor TT1 BRK'","#FFF").item;
    let pctPosition = 60+barSize-Percent.width
    pctPosition = pctPosition < 60 ? 60 + barSize : pctPosition ; 
    ctx.drawImage( Percent , pctPosition ,10 )
}

let GIF = new Anime({
    w: 800, h: 40,
    filename: 'stamina',
    lastFrame: 30,
    framerate: 60,
    repeat: -1,
    cache: true
});

GIF.generate(function(frame){
    renderFrame( ( (curr * ((frame+1)/30) ))  );
    return ctx
})

GIF.on('done',(gif)=>{
    
    msg.channel.createMessage({
        content:' ',
        embed}, gif );
})





}
module.exports={
    init
    ,pub:false
    ,cmd:'stamina'
    ,perms:3
    ,cat:'pollux'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:[]
}