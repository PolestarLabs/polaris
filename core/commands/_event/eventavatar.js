const Picto = require("../../utilities/Picto"); 
const YesNo = require("../../structures/YesNo"); 



const init = async function (msg,args){

    let canvas = Picto.new(256,256);
    let ctx = canvas.getContext("2d")

    let propic = msg.author.avatarURL
    let frames = {
        dusk: 'https://cdn.discordapp.com/attachments/488142034776096772/768533054033100891/1603302958410.png',
        umbral: 'https://cdn.discordapp.com/attachments/488142034776096772/768533077164032040/1603302964011.png'
    }
    const P = {lngs: msg.lang,prefix:msg.prefix};
 

    let prompt,joining;
    
if(!args || (args[0] != 'dusk' && args[0] !='umbral')){

        prompt = await msg.channel.send("Select the covenant you want to join: "+`
        🌇 - Dusk
        🌃 - Umbral
        `);
        prompt.addReaction('🌇');
        prompt.addReaction('🌃');
        
        const reas = await prompt.awaitReactions({
      maxMatches: 1,
      authorOnly: msg.author.id,
      time: 25e3,
    }).catch(err=>0);
    if (!reas?.length)  return _emoji('nope') + "`TIMEOUT`";
    
    
    if (reas.length === 1 && reas[0].emoji.name === "🌇") joining = 'dusk';
    else if (reas.length === 1 && reas[0].emoji.name === '🌃') joining = 'umbral';
    else return _emoji('nope') + "Error";
    prompt.delete()
}else{
    joining = args[0]
}



    let frame= await Picto.getCanvas( frames[joining] );
    let pix= await Picto.getCanvas(propic);
    
    await ctx.drawImage( pix  ,0 ,0, 256, 256);
    await ctx.drawImage( frame,0 ,0, 256, 256 );
    

    ctx.globalCompositeOperation = 'destination-in';
    
    ctx.fillStyle = "#000";
    ctx.fillRect(0,0,256,256);
    ctx.fillStyle = "#FFF";
    ctx.arc(128,128, 128, 0, 2 * Math.PI);

    ctx.fill()
  
    //embed.setColor(factionKit.color);

    const embed = {}
    embed.thumbnail = {url:"attachment://event-"+msg.author.id+".png"}

    embed.description =
        (joining == 'dusk' ? $t('events:halloween20.covenants.joinDusk',P) : $t('events:halloween20.covenants.joinUmbral',P))
        + '\n' + $t('events:halloween20.avatar.preview');

    
    let aviPrompt = await msg.channel.send({embed},{file: await canvas.toBuffer(), name: "event-"+msg.author.id+".png" });

    let nope = function(){
        embed.thumbnail = null;
        aviPrompt.delete().catch(err=>null);
    }

    YesNo(aviPrompt,msg, async function(){
        embed.description =
            (joining == 'dusk' ? $t('events:halloween20.covenants.joinDusk',P) : $t('events:halloween20.covenants.joinUmbral',P))
        embed.footer = {text:
            (joining == 'dusk' ? $t('events:halloween20.covenants.joinDuskAffinity',P) : $t('events:halloween20.covenants.joinUmbralAffinity',P)).replace(/\*\*/g,'')
        }
        
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage( frame,0 ,0, 256, 256 );
        embed.image = {url:"attachment://event-"+msg.author.id+"2.png"};
        embed.thumbnail = null;
        aviPrompt.delete();
        let xxx = await msg.channel.send({embed},{file: await canvas.toBuffer("image/png", { compressionLevel: 0, filters: canvas.PNG_FILTER_NONE }), name: "event-"+msg.author.id+"2.png" }).then(x=>{
            embed.description += "\n["+$t('events:halloween20.avatar.clickHere',P)+"]("+x.embeds[0].image.url+")\n\n"
            + $t('events:halloween20.covenants.plsupdate',P);
            return x.edit({embed})
        });
        console.log({xxx})
        
    },nope,nope) 

}
module.exports={
    init
    ,pub:true
    ,cmd:'eventavatar'
    ,cat:'_event'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['evpfp']
}