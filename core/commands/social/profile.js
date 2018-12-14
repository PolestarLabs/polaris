const fs = require("fs");
const gear = require('../../utilities/Gearbox.js')
const pikto = require('../../utilities/Picto.js')


const Canvas = require("canvas");
const locale = require(appRoot+'/utils/i18node');
const $t = locale.getT();
const DB= require('../../database/db_ops');

  var line = 0;


function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke == 'undefined') {
    stroke = true;
  }
  if (typeof radius === 'undefined') {
    radius = 5;
  }
  if (typeof radius === 'number') {
    radius = {tl: radius, tr: radius, br: radius, bl: radius};
  } else {
    var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
    for (var side in defaultRadius) {
      radius[side] = radius[side] || defaultRadius[side];
    }
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) {
    ctx.fill();
  }
  if (stroke) {
    ctx.stroke();
  }

}


const init= async function run(msg) {

  let start = Date.now()


  function benchmark(reson){
    let now = Date.now()
    console.error("checkpoint - `"+(now-start)+"ms` ("+reson+")")
    //msg.reply("checkpoint - `"+(now-start)+"ms` ("+reson+")")
  }

if(msg.content.split(/ +/).slice(1)[0]=="frame"){
 let ag= msg.content.split(/ +/).slice(1)[1];
  let frame = (msg.author.dDATA.switches||{}).profileFrame
  function switchon(){
    DB.users.set(msg.author.id,{$set:{'switches.profileFrame':true}}).then(x=>msg.react(':switchon:343511231434588161'));
  }
  function switchoff(){
    DB.users.set(msg.author.id,{$set:{'switches.profileFrame':false}}).then(x=>msg.react(':switchoff:343511248085843968'));
  }

  if(ag && ag == "on"){
    switchon()
  }else if (ag && ag == "off"){
    switchoff()
  }else{
    frame ? switchoff() : switchon();
  }
  return;
}

  try{


    const canvas = new Canvas.createCanvas(800, 600);
    const ctx = canvas.getContext('2d');




  //if(msg.author.id!="88120564400553984") return msg.reply("Under Mantainance | Em Manutenção");

  const P={lngs:msg.lang}
  const v={
    LEVEL: $t("website.level",P)
    ,GLOBAL: $t("website.global",P)
    ,SERVER: $t("discord.server",P)

  }

  let finder = msg.content.split(/ +/).slice(1).join(' ')
  if(!finder) finder = msg.author.id;

const Server = msg.guild
       const Target = await gear.getTarget(msg);
        let TARGET_DB   = await DB.users.findOne({id:Target.id}) ;
        const SV_DB   = await DB.servers.findOne({id:Server.id});

if (TARGET_DB.modules.bgID == undefined) {
   TARGET_DB.modules.bgID = "5zhr3HWlQB4OmyCBFyHbFuoIhxrZY6l6";
}
if (TARGET_DB.modules.rep == undefined) {
   TARGET_DB.modules.rep = 0;
}
if (TARGET_DB.modules.bgInventory == undefined) {
   TARGET_DB.modules.bgInventory = ["5zhr3HWlQB4OmyCBFyHbFuoIhxrZY6l6"];
}
if (TARGET_DB.modules.medalInventory == undefined) {
   TARGET_DB.modules.medalInventory = [];
}
if (TARGET_DB.modules.medals == undefined) {
   TARGET_DB.modules.medals = [0, 0, 0, 0, 0, 0, 0, 0, 0];
}
    // console.log('here1')
    // console.log(TARGET_DB.modules.medals.length )


if (TARGET_DB.modules.medals.length < 9) {
  let lent =  9-TARGET_DB.modules.medals.length
  for(i=0;i<lent;i++){
    await DB.users.set(Target.id,{$push:{'modules.medals':0}});
  }
  TARGET_DB   = await DB.users.findOne({id:Target.id});
}

let  originals=["370610552403132416","271394014358405121"]

//let querypoolGlobal =await userDB.find()

let querypoolLocal= SV_DB.modules.LOCALRANK;

    const Sranked= []
    for (i in querypoolLocal) {
     const SrankItem = {}
     if (Server.members.has(i)) {
         if (SV_DB.modules.LOCALRANK[i]) {
           SrankItem.exp = SV_DB.modules.LOCALRANK[i].exp
         } else {
           SrankItem.exp = 0
         }
         SrankItem.id = i
         Sranked.push(SrankItem);
       }
     }





let flair = TARGET_DB.modules.flairTop || 'default';

    let favcolor    = "#"+(TARGET_DB.modules.favcolor || "#bb55e0").replace("#","")
    let PFLD = (TARGET_DB.switches||{profiled:false}).profiled;
    let  backgroundId    = (TARGET_DB.modules.bgID|| "5zhr3HWlQB4OmyCBFyHbFuoIhxrZY6l6")
    if(Target.bot && !PFLD)backgroundId="IlyEEDBj0GLLlFl8n6boPLSkADNuBwke";
    let persotex    = (TARGET_DB.modules.persotext || "I have no personal text because i'm lazy as a sloth.")
    const nametag     = Target.tag
    let nickname;
    let tagline;
    try{
      nickname      = Server.member(Target).displayName ||Target.username
      tagline       = TARGET_DB.modules.tagline;
    }catch(e){
      nickname      =(Target||msg.author).username
      tagline       = TARGET_DB.modules.tagline || "A fellow Pollux user";
    }

    let rubines     = gear.miliarize(TARGET_DB.modules.rubines || 0)
   // let globalrank  = "#"+((ranked.findIndex(i => i.id === Target.id))+1)
    let serverank ;


let globalrank;
    if(!Target.bot){
    serverank   = "#"+((Sranked.findIndex(i => i.id === Target.id))+1)



    globalrank  = DB.users.find({"modules.exp": { $gt : TARGET_DB.modules.exp},blacklisted:{$exists:false}}).countDocuments();

    }


    //console.log("post-ranks");


    let rep         = TARGET_DB.modules.rep
    let propic;
    try{

     propic = (Target.user||Target).displayAvatarURL
    }catch(e){
      propic=Target.displayAvatarURL ;
    }

    let medals      = TARGET_DB.modules.medals  || [0,0,0,0,0,0,0,0,0]
    let sticker     = TARGET_DB.modules.sticker


function XPercent(x,l,f=0.0427899){
  let exptoNex    = Math.trunc(Math.pow((l + 1) / f, 2));
  let exptoThis   = Math.trunc(Math.pow(l / f, 2));

  let frameofact  = exptoNex - exptoThis;
  let levelcoverage = x-exptoThis
  let percent     = levelcoverage/frameofact;
  return percent;
}


let exp         = TARGET_DB.modules.exp     ||0;
let level       = TARGET_DB.modules.level   ||0;


let percent= XPercent(exp,level)
const SVFAC       = SV_DB.modules.UPFACTOR || 1;


let l_exp,
   l_level,
   l_exptoNex,
   l_exptoThis,
   l_frameofact,
   l_percent;

  try{

    l_exp         = SV_DB.modules.LOCALRANK[Target.id].exp  || 0
    l_level       = SV_DB.modules.LOCALRANK[Target.id].level|| 0

    l_percent     = XPercent(l_exp,l_level,SVFAC)

  }catch(e){
    //console.error(e)
    l_exp           =  0
    l_level         =  0
    l_frameofact  = 0
    l_percent     = 0

  }

  if (Target.id == "271394014358405121") {
    backgroundId = "RKvqxoAzgKM62MEfZYIOO6nHBqnZQV1i";
    sticker = "dmg"
    nickname = "P o l l u x"
    l_level = 999
    level = 999
    percent = 1
    l_percent = 1
    rubines = 'Infinite'
    globalrank= "∞"
    serverank= "∞"
    favcolor = "#b72d5d"
    persotex = "Customise your profile and more at http://www.pollux.fun \nType p!help for commands!"
    medals = [
              "halloween_2017","ghostling","discord",

              "brazil","pollux","starcraft",

              "adobe","hallux","gbusters"

             ]
  }
  if (Target.id == "370610552403132416") {
    backgroundId = "medic";

    nickname = "Lt. Morales | The Medic"
    l_level = 128
    level = 500
    percent = 1
    l_percent = 1
    globalrank= "∞"
    serverank= "∞"
    favcolor = "#ef1942"
    persotex = "Where's the Emergency?"
    medals = [
              0,0,0,

              0,"starcraft","heroes",

              0,0,0

             ]
  }



  async function XChart(size, pcent, colorX,pic,lvthis) {
    const color = TColor(colorX);
    const pi = Math.PI;
    let startR = pi * 3 / 2, endR = pToR(pcent) * pi;
    if (pcent == "1") { endR = pi * 7 / 2; }
    const rx = size / 2, ry = rx;
    const canvas_proto = new Canvas.createCanvas(size,size);
    const context = canvas_proto.getContext('2d');
    function TColor(rgbColor) {
        rgbColor = rgbColor.replace(/\s/g, "");
        const arrRGB = new Array(3);
        if (rgbColor.indexOf("rgb") > -1) {
            const colorReg = /\s*\d+,\s*\d+,\s*\d+/i;
            const t = colorReg.exec(rgbColor)[0].split(",");
            for (let i = 0; i < arrRGB.length; i++) {
                arrRGB[i] = t[i];
            }
        }
        else if (rgbColor.indexOf("#") > -1) {
            if (rgbColor.length > 4)//"#fc0,#ffcc00"
            {
                let j = 1;
                for (let i = 0; i < arrRGB.length; i++) {
                    arrRGB[i] = parseInt(rgbColor.substr((i + j), 2), 16);
                    j += 1;
                }
            } else {
                for (let i = 0; i < arrRGB.length; i++) {
                    let t = rgbColor.substr((i + 1), 1);
                    t = t + t;
                    arrRGB[i] = parseInt(t, 16);
                }
            }
        }
        return arrRGB.join(",") ;
    }
    function pToR(p) {
        const r = (p * 2) % 2 + 1.5;
        if (r >= 0 && r <= 2) return r;
        return Math.abs((2 - r) % 2);
    }
    function arcDraw(r, color) {
        context.beginPath();
        context.arc(rx, ry, r, startR, endR, false);
        context.fillStyle = color;
        context.lineTo(rx, ry);
        context.closePath();
        context.fill();
    }
    canvas_proto.width = canvas_proto.height = size;



    context.beginPath();
    context.arc(rx, ry, rx - 5, 0, pi * 2, true);
    context.strokeStyle = 'rgba(' + color + ',0.25)';
    context.lineWidth = 4;
    context.stroke();
    arcDraw(rx - 0, 'rgba(' + color + ',1)');

    context.beginPath();
    context.arc(rx, ry, rx - 7, 0, pi * 2, false);
    context.fillStyle = 'rgba(255,255,255,1)';
    context.lineTo(rx, ry);
    context.closePath();
    context.fill();

    if(pic){
      context.clip();
      let a = await pikto.getCanvas(pic);
      context.drawImage(a, 0, 0,size,size);
      context.restore()
    }

    context.fillStyle = 'rgba(255,255,255,.5)';
    context.fill();
    context.fillStyle = 'rgba(' + color + ',1)'; ;


    context.font = "900 18px 'Whitney HTF'";

    const t = (pcent * 100).toFixed(0) + "%";
    let WW =  context.measureText(t+"%").width
    context.fillText(t, size/2+15-WW/2, size-15);



    let label = await pikto.tag(context,v.LEVEL.toUpperCase(),false,"#222");
    let tg = await pikto.tag(context,lvthis,"900 56px 'Whitney HTF'","#363636");

    let f = .8
    let lx = (size/2) - (label.width/2/f)
    let ly = (size/2) - (label.height*1.5)
    let lh=label.height/f
    let lw=label.width/f

    let x = (size/2) - (tg.width/2)
    let y = (size/2) - (tg.height/2)

    await context.drawImage(label.item,lx,15,lw,lh);
    await context.drawImage(tg.item,x,y,tg.width,tg.height);

    return canvas_proto

}
  async function Hex(size,picture) {
    let globalOffset = 0
    size = size/2
    let x  = size+10
    let y=  -size

    let cw=size
    let ch=size


    let hex= new Canvas.createCanvas (size*2+20,size*2+20)
    let c=hex.getContext("2d")
    c.rotate(1.5708)
    c.save();
    c.beginPath();
    c.moveTo(x + size * Math.cos(0), y + size * Math.sin(0));

    for (side=0; side < 7; side++) {
      c.lineTo(x + size * Math.cos(side * 2 * Math.PI / 6), y + size * Math.sin(side * 2 * Math.PI / 6));
    }

     c.fillStyle = "#ffffff" //Target.id=="88120564400553984"?"#2b2b3b":"rgb(248, 248, 248)";
    c.fill();
 if(picture){
    c.clip();
    let a = await pikto.getCanvas(picture);
      c.rotate(-1.5708)
      c.drawImage(a, 0, x-size,size*2,size*2);
      c.restore()


c.globalCompositeOperation='xor';

c.shadowOffsetX = 0;
c.shadowOffsetY = 0;
c.shadowBlur = 10;
c.shadowColor = 'rgba(30,30,30,1)';

c.beginPath();
  for (side=0; side < 7; side++) {
      c.lineTo(x + size * Math.cos(side * 2 * Math.PI / 6), y + size * Math.sin(side * 2 * Math.PI / 6));
    }
c.stroke();
c.stroke();
c.stroke();

c.globalCompositeOperation='destination-atop';


 }else{
    c.shadowColor = "rgba(34, 31, 39, 0.77)"
    c.shadowBlur = 10

 }
       c.fill();

    return hex

  }

  //==================================================================
  //==================================================================
  //==================================================================
  //==================================================================
  //==================================================================


  const offset_hex  = 15
  const AVATAR_HEX  = {x:15 ,y:125}
  const G_ROUNDEL   = {x:680,y:10 }
  const L_ROUNDEL   = {x:465,y:380}
  const DISPLAYNAME = {x:0  ,y:0  }
  const _MEDALS     = {x:580  ,y:370  }
  const _STICKER    = {x:115  ,y:390  }
  const _BG         = {x:90  ,y:28  }
  const G_RANK      = {x:430  ,y:390  }
  const L_RANK      = {x:430  ,y:440  }
  const _RUBINES    = {x:236  ,y:535  }
  const _EXP        = {x:0  ,y:0  }
  const _REP        = {x:53  ,y:60  }
  const _FT        =  {x:235  ,y:265  }

  //=========================================



  let mainframe =  pikto.getCanvas(paths.BUILD+"/profile/"+(Target.bot?PFLD?"mainframe_botpart":"mainframe_bot":"mainframe")+".png"),
      _bg =  pikto.getCanvas(paths.BUILD+"/backdrops/"+backgroundId+".png"),
      _flairTop =  pikto.getCanvas(paths.BUILD+"/flairs/top/"+flair+".png");


  let medals_images = []
  let valid_images = []
  let valid_medals  = 0


  if(medals.map(x=>x==0).length>=5){

  for(i=0;i<medals.length;i++){

    let md = medals[i].constructor == Array ? medals[i][0] : medals[i]
    if (md==0||md==undefined) md = "undefined";
    else{
    valid_medals++;

      let imge = await pikto.getCanvas(paths.MEDALS+md+".png");
      //console.log(imge)
      //console.log(paths.MEDALS+md+".png")
      valid_images.push(imge);
    }

    //await medals_images.push(await pikto.getCanvas(paths.MEDALS+md+".png"));
  }
  }


  let pre_a = Server.iconURL ||"https://orig00.deviantart.net/b86e/f/2016/343/a/e/cosmog_discord_icon_by_zelakantal-dar345n.png"
  let serpic = pre_a.replace("jpg","png")


  let global_roundel = await XChart(120,percent,favcolor||"#dd5383",false,level);

  let local_roundel = await XChart(120,l_percent,"#9459af",serpic,l_level);
  //let local_roundel = await XChart(120,l_percent,((Server.member(Target)||{displayHexColor:"#9459af"}).displayHexColor ||"#9459af"),serpic,l_level);

  let hex_frame = await Hex(250);
  let hex_pic =   await Hex(220,propic);



    // NICKNAME ============================================================>

   let label = await pikto.tag(ctx,nickname,"900 44px 'Whitney HTF'","#223");
   let tagliney = await pikto.tag(ctx,tagline,"100 16px 'Whitney HTF'","#445");

    // REPUTATION ============================================================>
   rep = rep > 999 ? 999 : rep;
   let _rep = await pikto.tag(ctx,rep,"40px 'Visitor TT1 BRK'","#fff");
   let rep_displace= _rep.width/2

    // LOVEPOINTS ============================================================>
   let lovpoints = TARGET_DB.modules.lovepoints > 999 ? 999 : TARGET_DB.modules.lovepoints;
   let _love = await pikto.tag(ctx,lovpoints||"0","40px 'Visitor TT1 BRK'","#fff");
   let love_displace= _love.width/2

   _bg = await _bg;
  ctx.drawImage(_bg,_BG.x,_BG.y,687,340);

    //=====================================================
    //                MARIAGE TAG
    //=====================================================



  let marriagestatus = TARGET_DB.married
  let marriageCanvas, marriage_partner;
  if(marriagestatus && marriagestatus.length > 0){
    try{
      marriageCanvas = Canvas.createCanvas(300,60);
      let cxx = marriageCanvas.getContext("2d")
      marriage_partner = marriagestatus.find(itm=>itm.featured==true)
      ||marriagestatus.find(itm=>itm.ring=='stardust')
      ||marriagestatus.find(itm=>itm.ring=='sapphire')
      ||marriagestatus.find(itm=>itm.ring=='rubine')
      ||marriagestatus.find(itm=>itm.ring=='jade');

      //console.log(marriage_partner)

      cxx.fillStyle = "#ffffff"
      roundRect(cxx, 0, 0, 300, 60,10,true);

      let marriTo = "Married to:"//$t('marriage.marriedTo',P)
      let partner = await msg.botUser.users.fetch(marriage_partner.id);
      let WIFE = partner.username
      let WIFEavi = await pikto.getCanvas(partner.displayAvatarURL );

      let marRing = await pikto.getCanvas('http://pollux.fun/build/items/'+(marriage_partner.ring)+'.png')
          ,married_tex = await pikto.tag(cxx,marriTo,"500 18px 'Whitney HTF',Sans","#3a3a4d")
          ,married_tag = await pikto.tag(cxx,WIFE,"900 36px 'Whitney HTF',Sans","#3a3a4d");

      let sinceref = Date.now()-marriage_partner.since

      let eversince =
          Math.round(sinceref / 1000 / 60 / 60 / 24 / 30 / 12)||
          Math.round(sinceref / 1000 / 60 / 60 / 24 / 30 )||
          Math.round(sinceref / 1000 / 60 / 60 / 24 )||
          Math.round(sinceref / 1000 / 60 / 60 )||
          Math.round(sinceref / 1000 / 60 )||
          Math.round(sinceref / 1000 );
          let unit;
          if(Math.round(sinceref / 1000 )) unit="s";
          if(Math.round(sinceref / 1000 / 60 )) unit="m";
          if(Math.round(sinceref / 1000 / 60 / 60 )) unit="h";
          if(Math.round(sinceref / 1000 / 60 / 60 / 24 )) unit="d";
          if(Math.round(sinceref / 1000 / 60 / 60 / 24 / 30 )) unit="Mo";
          if(Math.round(sinceref / 1000 / 60 / 60 / 24 / 30 / 12)) unit="Yr";

        let married_eversince = await pikto.tag(cxx," "+eversince+unit+"","600 20px 'Whitney HTF',Sans","#3a3a4d");

        let wid = married_tag.width>150?150:married_tag.width;
        cxx.drawImage(married_tag.item,60,13,wid,married_tag.height);
      try{
       cxx.drawImage(WIFEavi,5,5,50,50);
      }catch(e){
        let wifeavi2 =await pikto.getCanvas(msg.author.displayAvatarURL);
       cxx.drawImage(wifeavi2,5,5,50,50);
      }
        cxx.drawImage(marRing,245,5,50,50);
        cxx.drawImage(married_tex.item,60,0,100,married_tex.height);
        cxx.drawImage(married_eversince.item,208,25);

      }catch(e){
        console.error(e)
      }
    }


    //=====================================================
    //                SIDEBAR COLOR
    //=====================================================


  let colorstrap = new Canvas.createCanvas(82,600)
  let cx = colorstrap.getContext("2d")

  mainframe = await mainframe;

  cx.fillStyle = favcolor
  cx.fillRect(0, 0, 82, 570);
  cx.globalAlpha = 0.9
  cx.globalCompositeOperation = "destination-atop";
  cx.drawImage(mainframe,-10,-10)

  cx.globalCompositeOperation = "multiply";
  cx.drawImage(mainframe,-10,-10)

  ctx.drawImage(mainframe,0,0)
  ctx.drawImage(colorstrap,10,10)

  ctx.shadowBlur = 25;
  ctx.shadowColor = 'rgba(30,30,30,.5)';

  //-------------------------------------------------------------

  if(marriage_partner){
    ctx.drawImage(marriageCanvas,100,18);
  }

  ctx.shadowBlur =0;
  ctx.shadowColor = 'rgba(30,30,30,.3)';

  ctx.globalCompositeOperation = "source-over";

  let labw = label.width > 440? 440:label.width
  let taglw = tagliney.width > 440 ? 440 : tagliney.width;
  ctx.drawImage(label.item,328,290,labw,label.height)
  //ctx.drawImage(tagliney.item,320,285+label.height,taglw,tagliney.height)

  ctx.drawImage(_rep.item,_REP.x-rep_displace,_REP.y)

    if(TARGET_DB.married&&TARGET_DB.married.length>0){
      ctx.globalAlpha  = .5
      let hart = await pikto.getCanvas(paths.BUILD+"hearticon.png");
      ctx.drawImage(hart,24,400,60,60)
      ctx.drawImage(_love.item,_REP.x-love_displace,_REP.y+400)
      ctx.globalAlpha  = 1

    }
  //-------------------------------------------------------------

  if(sticker){
    let sticky = await pikto.getCanvas(paths.BUILD+"/stickers/"+sticker+".png");
    ctx.drawImage(sticky,_STICKER.x-10,_STICKER.y-25,170, 170)
  }else{
    let polluxi = await pikto.getCanvas(paths.BUILD+"/polluxi.png");
    ctx.drawImage(polluxi,_STICKER.x,_STICKER.y-20)
  }

   let personal = await pikto.block(ctx,persotex,"18px 'Whitney HTF', sans-serif","#000",275,70)
   ctx.drawImage(personal.item,290,490)

  let rubicount = await pikto.tag(ctx,rubines,
                                 "900 30px 'Whitney HTF',Sans","#2b2b2b")
  if(!Target.bot)ctx.drawImage(rubicount.item,_RUBINES.x-rubicount.width,_RUBINES.y);

    let REP = await pikto.tag(ctx,"REP",
                               "900 30px 'Whitney HTF',Sans","#ffffff")
    ctx.globalAlpha = .6;
  ctx.drawImage(REP.item,52-REP.width/2,25)
    ctx.globalAlpha = 1;
    let grank = await pikto.tag(ctx,"#"+gear.miliarize((await globalrank)),
                               "900 22px 'Whitney HTF',Sans","#2b2b2b")
   if(!Target.bot){
     ctx.drawImage(grank.item,G_RANK.x-grank.width,G_RANK.y)
   }
    let lrank = await pikto.tag(ctx,gear.miliarize(serverank),
                               "900 22px 'Whitney HTF',Sans","#2b2b2b")
   if(!Target.bot){
     ctx.drawImage(lrank.item,L_RANK.x-lrank.width,L_RANK.y)
   }
  await ctx.drawImage(hex_frame,AVATAR_HEX.x,AVATAR_HEX.y);

  if(valid_medals==1){
    let x=_MEDALS.x + (150 / 2 - 50)
    let y=_MEDALS.y + (150 / 2 - 50)

    await ctx.drawImage(await valid_images[0],x,y,150,150)

  }else if(valid_medals==2){

    let x=_MEDALS.x
    let y=_MEDALS.y+100

      await ctx.drawImage(await valid_images[0],x,y,100,100);
      await ctx.drawImage(await valid_images[1],x+100,y,100,100);

    }else if(valid_medals==3){

    let x=_MEDALS.x
    let x1=_MEDALS.x + (200 / 2 - 50)
    let y=_MEDALS.y
      await ctx.drawImage(await valid_images[0],x1,y,100,100);
      await ctx.drawImage(await valid_images[1],x,y+100,100,100);
      await ctx.drawImage(await valid_images[2],x+100,y+100,100,100);

    }else if(valid_medals==4){

    let x=_MEDALS.x
    let y=_MEDALS.y
      await ctx.drawImage(await valid_images[0],x,y,100,100);
      await ctx.drawImage(await valid_images[1],x+100,y,100,100);
      await ctx.drawImage(await valid_images[2],x,y+100,100,100);
      await ctx.drawImage(await valid_images[3],x+100,y+100,100,100);

  }else{

    let x=_MEDALS.x
    let y=_MEDALS.y
    let ind = 0
    let row = 0
    while(ind<8){
      let col = 0
        while(col<3){
          //console.log({col,ind,row,MEDAL:medals_images[ind]})
          if(medals[ind]){
            let medalie = await pikto.getCanvas(paths.MEDALS+medals[ind]+".png");
            await ctx.drawImage(medalie,x+68*col,y+68*row, 64,64);
          }
          ind= await ind+1;
          ++col;
        }
        ++row;
    }

  }

  //ctx.drawImage(medals_images[1],_MEDALS.x+100,_MEDALS.y)
      try{
        _flairTop = await _flairTop;
         ctx.drawImage(_flairTop,_FT.x,_FT.y,100,120);
      }
      catch(e){

      }


    if(!Target.bot){
      ctx.drawImage(local_roundel,L_ROUNDEL.x,L_ROUNDEL.y,96,96);
      ctx.drawImage(global_roundel,G_ROUNDEL.x,G_ROUNDEL.y);
    }
      ctx.drawImage(hex_pic,AVATAR_HEX.x+offset_hex,AVATAR_HEX.y+offset_hex);


    if(TARGET_DB.switches && (TARGET_DB.switches.profiled || TARGET_DB.switches.profileFrame)){

      let tier = await gear.getTier(Target,msg.botUser,msg);
      if(Target.id=='88120564400553984')tier='chalk'
      if(TARGET_DB.switches.profiled)tier='chalk'

      if(tier){
        let tierframe = await pikto.getCanvas(paths.BUILD+"profile/donortiers/neo"+tier+".png");
        ctx.drawImage(tierframe,-11,110);
      }
    }


    //=========================================
    //=========================================
    ///             HONORIFICS
    //=========================================
    //=========================================


    try{
      /*
    if(TARGET_DB.switches && !TARGET_DB.switches.hideProle){

      console.log(1)

      let bottomTag = await gear.getTagge(Target,msg.botUser,msg);
      if(Target.id=='318159939027730433')bottomTag='nonoan'
      if(Target.id=='88120564400553984')bottomTag='owner'
      console.log(2)
      if(bottomTag){
        let tierframe = await pikto.getCanvas(paths.BUILD+"profile/bottomtags/"+bottomTag+".png");
        ctx.drawImage(tierframe,268,559);
      }
        console.log(3)
      if(bottomTag=="translator" && TARGET_DB.switches.translator){
        let flag = await pikto.getCanvas(paths.BUILD+"flags/"+TARGET_DB.switches.translator+".png");
        ctx.drawImage(flag,313 ,567,32,21);
      }
      console.log()
    }
    */
    }catch(e){
      console.error(e)
    }


    if(TARGET_DB.blacklisted && TARGET_DB.blacklisted !=""){

       let bliste = await pikto.getCanvas(paths.BUILD+"bliste.png");
       ctx.globalCompositeOperation ='saturation';
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
      ctx.fillRect(0,0,800,600)
       ctx.drawImage(bliste,-2 ,2);
    }






        var stop = Date.now();
        var diff = (stop - start);
if(msg.channel.id=='433639502465204252'){
  msg.channel.send("|\n\n**"+msg.author.tag+"**")
}

    let buff = await canvas.toBuffer();
   await msg.channel.createMessage('',{
                        file: buff,
                        name: "profile-"+Target.id+".png"
                })

  }catch(e){
    console.log("ERROR PROFILE")
    console.error(e)
    msg.channel.send("```ml"+`
    /*====*______________________________________________. ''' .
    |     |                                             / LEVEL \\
    | REP |                                            |    #    |
    | --- |                         'SORRY,             \\  XX%  /
    |     |                  AN ERROR HAS OCCURRED       ' ... '|
    |     |            BUT HAVE THIS ASCII CARD INSTEAD         |
    |     |              IT IS ALMOST THE SAME THING,           |
    |     .\` ^ \`.            JUST MORE 'VINTAGE'                |
    |   /         \\                                             |
    |  |           |_,---.______________________________________|_
    |  |           | | F | DISPLAYNAME                            |
    |   \\         /--'___'----------------------------------------+
    |     '. _ .'     \\.                         |               |/
    |     |            |   GLOBALRANK     ####%  |  [0] [1] [2]  |
    |     |  [STICKER] |   LOCALRANK    L_ROUNDEL|               |
    |     |            |                         |  [3] [4] [5]  |
    | F-B |____________||´''''''''''''''''''''|| |               |
    |     |   RUBINES  ||  P E R S O T E X T  || |  [6] [7] [8]  |
    |  D  |      XXX<| || D O E S N´T   F I T || |               |
    +-----+------------++=====================++-+--------------*/
`+"```")
  }//end catch 1

}//end block


module.exports = {
    pub: false,
    cmd: "profile",
    perms: 3,
    init: init,
    cat: 'social',
    cool:800
};
