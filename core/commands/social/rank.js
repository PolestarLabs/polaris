const Picto = require('../../utilities/Picto.js')

const init = async function (msg){

    const P = {lngs:msg.lang,prefix:msg.prefix}


    const TARGET = await PLX.getTarget(msg.args[0], msg.guild);
    if (!TARGET) return msg.channel.send($t("responses.errors.kin404", P));

    let userData,serverData,selfLocal,LRpos;
    await Promise.all([
        userData = await DB.users.get(TARGET.id), 
        serverData = await DB.servers.get(msg.guild.id), 
        selfLocal = await DB.localranks.get({user:TARGET.id,server:msg.guild.id}), 
    ]);
    
    if(!selfLocal || !userData){
        return msg.channel.send ($t("responses.errors.kin404",P));
    }
    
    const exp =selfLocal.exp || 0;
    const level = selfLocal.level || 0;
    const upfactor = serverData.modules.UPFACTOR || .1;
    
    let exptoNex = Math.trunc(Math.pow((level + 1) / upfactor, 2));
    let exptoThis = Math.trunc(Math.pow(level / upfactor, 2));
    let frameofact = exptoNex - exptoThis;
    let levelcoverage = exp - exptoThis
    let percent = levelcoverage / frameofact;
    
    
    const canvas = Picto.new(800,278);
    const ctx = canvas.getContext('2d')
    let _back,_bg,_mask,_roundel,_hexavat;
    //const rolecolor = msg.guild.roles.find(r=>r.id==TARGET.roles[0])
    await Promise.all([
        _back  = await Picto.getCanvas(paths.BUILD+"/profile/mainframe_mini.png")
        ,_bg  = await Picto.getCanvas(paths.CDN+"/backdrops/"+userData.modules.bgID+".png")
        ,_flair  = await Picto.getCanvas(paths.CDN+"/flairs/"+(userData.modules.flairTop||'default')+".png")
        ,_mask  = await Picto.getCanvas(paths.BUILD+"/profile/bgmask.png")
        ,_roundel  = await Picto.XChart(120,percent, userData.modules.favcolor, undefined,level,$t("website.level", P))
        ,_hexavat  = await Picto.makeHex(210,TARGET.avatarURL)
        ,_hexfram  = await Picto.makeHex(250)
    ]);
    ctx.drawImage(_bg,80,20,720,360)
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(_mask,0,0)
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(_back,0,0)
    
    let colorstrap = Picto.new(81, 600)
    let cx = colorstrap.getContext("2d")
    cx.fillStyle = serverColor()
    cx.fillRect(0, 0, 82, 255);
    cx.globalAlpha = 0.99
    cx.globalCompositeOperation = "destination-atop";
    cx.drawImage(_back, -9, -10)
    cx.globalCompositeOperation = "multiply";
    cx.drawImage(_back, -9, -10)
    ctx.drawImage(_back, 0, 0)
    ctx.globalAlpha = 1
    ctx.drawImage(colorstrap, 9, 10)
    ctx.globalAlpha = 1;
    
    ctx.drawImage(_hexfram,20,3)
    ctx.drawImage(_hexavat,40,23)
    ctx.drawImage(_roundel,265,146)
    ctx.drawImage(_flair,250,1,100,120)
    
    LRpos = await DB.localranks.find({server:msg.guild.id,'exp':{$gt:selfLocal.exp}},{_id:1}).countDocuments()
    
    Picto.setAndDraw(ctx, Picto.tag(ctx, TARGET.nick||TARGET.username, "900 42px 'Whitney HTF'", "#eee")    , 340, 28,420,'left',)
    Picto.setAndDraw(ctx, Picto.tag(ctx, "#"+(1+LRpos), "900 42px 'Whitney HTF'", "#2f2c2c")    , 495, 185,112,'right',)
    Picto.setAndDraw(ctx, Picto.tag(ctx, "RANK", "400 16px 'Whitney HTF'", "#2f2c2c")   , 390, 175,112,'left',)
    Picto.setAndDraw(ctx, Picto.tag(ctx, selfLocal.thx||0, "900 42px 'Whitney HTF'", "#2f2c2c")     , 670, 185,112,'right')
    Picto.setAndDraw(ctx, Picto.tag(ctx, "THX", "400 16px 'Whitney HTF'", "#2f2c2c")    , 560, 175,112,'left')
    
    
    let buff = await canvas.toBuffer();
    msg.channel.createMessage('', {
        file: buff,
        name: "rank-" + TARGET.id + ".png"
    })
    
    
    function serverColor(){
        let roles = msg.guild.member(TARGET).roles.map(r => msg.guild.roles.get(r)).filter(x=> x.color ).sort((a,b) => b.position - a.position);
        let color = roles[0]?.color || 0xf53258
        return "#"+ Number(color).toString(16)
    }
    
}



module.exports={
    init
    ,pub:true
    ,cmd:'rank'
    ,perms:3
    ,cat:'social'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['mini','svpfp','minicard']
}