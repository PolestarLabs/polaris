const gear = require('../../utilities/Gearbox');
const Picto = require('../../utilities/Picto');
const DB = require('../../database/db_ops');
const locale = require('../../../utils/i18node');
const $t = locale.getT();

const init = async function (msg,programatic){

    delete require.cache[require.resolve('name-this-color')]
    const colors = require('name-this-color');
    let P={lngs:msg.lang,prefix:msg.prefix}
    if(gear.autoHelper(['noargs',$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;

    let hexRegex = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ 
    let hexColor = (msg.args[0].match(hexRegex)||[])[0];


    let result = hexColor ? colors(hexColor) : colors("hexColor");
 

    let embed = new gear.Embed(),
        Canvas = Picto.new(140,140),
        ctx = Canvas.getContext('2d');

    if(result){
 result = result[0]
       // let RGB = colors.rgb(result[0])
        embed
        .author(result.title,"https://png.icons8.com/paint-brush/dusk/64")
        .color(result.hex )
        .image("attachment://color.png")
        .footer(""+result.hex )

        Picto.roundRect(ctx,10,10,120,120,20,"#"+hexColor);
        let file = gear.file(Canvas.toBuffer(),'color.png');
        if(programatic) return {embed,file,hex:result.hex,name:result.title};
        
        msg.channel.send({embed},file)
        
    }else{
        if(programatic) {
            Picto.roundRect(ctx,10,10,120,120,20,"#000000");
            let file = gear.file(Canvas.toBuffer(),'color.png');
          return  {embed,file,hex:"#000000",name:"INVALID COLOR"};
        } 
        msg.reply("`ERROR :: COLOR NOT FOUND`")
    }

}
module.exports={
    init
    ,pub:true
    ,cmd:'color'
    ,perms:3
    ,cat:'util'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:[]
}