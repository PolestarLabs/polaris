const gear = require('../../utilities/Gearbox');
const DB = require('../../database/db_ops');
const Picto = require('../../utilities/Picto');
const locale = require('../../../utils/i18node');
const $t = locale.getT();

    const init = async function (msg) {

    let P={lngs:msg.lang,prefix:msg.prefix}
    if(gear.autoHelper([$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;



    
    
      try{
      const canvas = Picto.new(700, 520);
      const ctx = canvas.getContext('2d');
    
        const headbl = Picto.new(470, 60);
        const ctx2 = headbl.getContext('2d');
        
      const P = {
        lngs: msg.lang
      }
        
        let pre = msg.content.split(/ +/).slice(1).join(' ')
        let regex = /^(.*[A-z])/

        let pre2 = pre.match(regex)?pre.match(regex)[0]:""
        let spot =pre2.indexOf('http')
        let headline_tx =   spot<0 ? pre2 : pre2.slice(0,spot);
        let img_link    
        try{
            img_link  =    Picto.getCanvas( spot>-1 ? pre2.slice(spot) : ( msg.mentions[0]|| {}).displayAvatarURL || await gear.getChannelImg(msg));
        }catch(e){
            img_link  =    Picto.getCanvas( spot>-1 ? pre2.slice(spot) : ( (msg.mentions[0]||msg.author).displayAvatarURL ));
        }

        console.log(img_link)
    
    
        
      const [newspap, headline, pic] = await Promise.all([
          Picto.getCanvas(paths.BUILD + 'localman.png'),
          Picto.tag(ctx, headline_tx || "Pollux Ipsum Dolor sit amet Consectetur", "900 48px Times New Roman", "#242020"),
          img_link
      ]);
    
        

        ctx.drawImage(newspap, 00, 0);
        ctx.globalCompositeOperation = 'multiply'
        ctx.globalAlpha = 0.7
        let w = headline.width > 470 ? 470 : headline.width;    
        let h = headline.width > 470 ? 50 : headbl.height;    
        ctx2.drawImage(headline.item, 0,0,w,h);
         ctx.save()

        ctx.setTransform(1, 0, -Math.tan(0.1321214), 1, 0, 0);
       //                                            % A X Y H W
        
    
       ctx.rotate(0.296706)
       ctx.drawImage(headbl, 170,100 )
        
       ctx.rotate(-0.296706)
       ctx.restore()
        //img
       ctx.save()
        
        
          let new_width = 357
        //let new_height =  pic.width / new_width 
    
        
          
        let new_height = pic.height/(pic.width/357)
       
         ctx.setTransform(1, 0, -Math.tan(0.1321214), 1, 0, 0);
        
        
       ctx.rotate(0.296706)
       ctx.drawImage(pic, 290,170,357,new_height);
    
       ctx.rotate(-0.296706)
        
       ctx.restore()
        
        //rotate 17 deg >> 0.296706 Rad
        // 100 X 194 Y
        
        pic.width 
        pic.height 
        
      
        
    
      await msg.channel.send( '',gear.file( await canvas.toBuffer(),'localnews.png'))
        
        msg.delete()
    
    }catch(e){
      console.error(e)
    }







}
module.exports={
    init
    ,pub:true
    ,cmd:'localnews'
    ,perms:3
    ,cat:'fun'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['lnws']
}

