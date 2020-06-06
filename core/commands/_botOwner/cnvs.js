const Picto =  require('../../utilities/Picto');

const init = async function (msg,args){

    let xxx= await Picto.getCanvas('https://cdn.discordapp.com/avatars/88120564400553984/7c1b14d35014c39c00b4e3512cc5babc.png?size=512');
    const Canvas = Picto.new(xxx.width,xxx.height);
    const ctx    = Canvas.getContext('2d');

    ctx.drawImage(xxx,0,0)

    let yyy = Canvas.toDataURL()
    console.log(yyy)
    yyy = xxx.toDataURL()
    console.log(yyy,2)

    msg.channel.send( "." ,file(Canvas.toBuffer(),"x.png"));


}
module.exports={
    init
    ,pub:false
    ,cmd:'asd'
    ,perms:3
    ,cat:'_botOwner'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:[]
}