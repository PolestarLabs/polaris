const gear = require('../../utilities/Gearbox');
const Picto = require('../../utilities/Picto.js');
const DB = require('../../database/db_ops');
const fs = require('fs')

const init = async function (msg) {

    delete require.cache[require.resolve('../../structures/Animation')];
    let Animation = require('../../structures/Animation');
    let P = { lngs: msg.lang, prefix: msg.prefix }
    if (gear.autoHelper([$t('helpkey', P)], { cmd: this.cmd, msg, opt: this.cat })) return;


    SERIES = "nierauto";
    A = "cat2b"
    B = "flowers2b" 


    const [boosterPack,stickerA,stickerB] = await Promise.all([
        Picto.getCanvas(paths.Build+"/boosters/showcase/"+ SERIES +".png"),
        Picto.getCanvas(paths.CDN+"/stickers/"+ A +".png"),
        Picto.getCanvas(paths.CDN+"/stickers/"+ B +".png")
    ]);
    const newe       = await Picto.getCanvas(paths.Build+"new.png");

    
    gif = new Animation({
        w: 250,
        h: 250,
        lastFrame: 60,
        framerate: 48,
        filename: "test",
        cache: false,
        repeat: -1,
      //  transparentColor: 0x2C2F33,
    });

   gif.gif.setDispose(3)
   gif.gif.setQuality(20)

    DISPLACE = 0
    RDX = 0.6
    RDX2 = .7


    pandemonium = function (frame) {
        canvas = Picto.new(250, 250);
        ctx = canvas.getContext('2d');
        ctx.translate(-50, 0);

        ctx.globalCompositeOperation = "destination-over"

        ctx.drawImage(Picto.tag(ctx,frame).item,0 , 0)

        if(frame < 5){            
            ctx.drawImage(boosterPack,175- boosterPack.width * RDX / 2  ,0+(0),285*RDX ,418 * RDX)
        }else if(frame < 20){
            DISPLACE+= 10+frame-20
            ctx.drawImage(boosterPack,175- boosterPack.width * RDX / 2  ,0+(DISPLACE),285*RDX ,418 * RDX)
        }else if(frame < 35){
            DISPLACE+= (frame-19)/2 +1
            ctx.drawImage(boosterPack,175- boosterPack.width * RDX / 2  ,0+(DISPLACE),285*RDX ,418 * RDX)
        }else{  
            ctx.drawImage(boosterPack,175- boosterPack.width * RDX / 2  ,0+(DISPLACE),285*RDX ,418 * RDX)
        }

        if(frame>25){
            DISPLACE+=1/2            
            
            ctx.save()
            ctx.translate(350, 250);
            ctx.rotate((30-20)/100+((frame-36 )/ frame / (frame/20)))
            ctx.translate(-350, -250);
            ctx.drawImage(stickerA,175- stickerA.width * RDX / 2 + Math.ceil((36-20)/2) +00,   ((frame<30?-frame-20:-50)+50+(.8*(frame-20))) ,250*RDX2 ,250 * RDX2)
            ctx.rotate(-(30-20)/100+((frame-36) / frame))
            
            if(frame>30){
                ctx.restore()
                ctx.save()
                ctx.translate(-100, 250);
                ctx.rotate(- ((30-20)/100+((frame-36 )/ frame / (frame/20))))
                ctx.translate(100, -250);
                ctx.drawImage(stickerB, -(frame-20) + 175- stickerA.width * RDX / 2 + Math.ceil((36-20)/2), 10+ (frame<30?-frame-20:-50)+50+(.8*(frame-20)) ,250*RDX2 ,250 * RDX2)
                ctx.rotate( ((30-20)/100+((frame-36 )/ frame / (frame/20))))
            }
        }

        ctx.restore()
        
        if(frame > 35 && frame <= 40){           
           let  DSP_I= 30
           let  DSP_E= -20
           let tDSP =   DSP_I + ( (frame-30)*((DSP_E-DSP_I)/9) )
           ctx.drawImage(newe, 50 +tDSP, 50 , 50,50 )
           ctx.drawImage(newe, 250-tDSP ,50 , 50,50 )
        }
        if(frame>40){
            let DSP_I= -20
            let DSP_E= 0
            let tDSP = DSP_I + ( (10)*((DSP_E-DSP_I)/10))            
            if(frame<50){
                tDSP=   DSP_I + ( (frame-40)*((DSP_E-DSP_I)/10) )
            }
            ctx.globalCompositeOperation = "source-over"            
            ctx.drawImage(newe, 50 +tDSP,50 , 50,50 )
            ctx.drawImage(newe, 250-tDSP,50 ,50,50 )
            ctx.globalCompositeOperation = "destination-over"
        }
        ctx.fillStyle = "#2266AA"//"#2C2F33"
        ctx.fillRect(0,0,350,250)

        return ctx;
    }


    gif.generate(pandemonium);

    gif.once('done', res =>{
        msg.channel.send('', res)
    });


};


module.exports = {
    init
    , pub: true
    , cmd: 'booster'
    , perms: 3
    , cat: 'cosmetics'
    , botPerms: ['attachFiles', 'embedLinks']
    , aliases: []
}



