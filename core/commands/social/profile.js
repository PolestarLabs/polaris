const UserProfileModel = require('../../archetypes/UserProfileModel');
// const gear = require('../../utilities/Gearbox.js');
const Picto = require('../../utilities/Picto.js');
// const DB = require('../../database/db_ops');

const XYZ ={
  global_roundel: {X: 680,  Y: 2},
  persotex    : {W: 270, H: 76, X:515, Y:492 - 125 },
  wifeRect    : {X:100,Y:1,W:314,H:65,R:37},
  wifeName    : {X:165 ,Y:  7 ,W:183 ,A:'left'   },
  lovepoints  : {X:165 ,Y: 35 ,W:183 ,A:'left'   },
  wifeSince   : {X:350 ,Y: 35 ,W:183 ,A:'right'  },
  commend     : {X: 53 ,Y: 25 ,W: 80 ,A:'center' },
  name        : {X:325 ,Y:268 ,W:420 ,A:'left'   },
  medals      : {X:98,Y: 378                     },
  tagline     : {X:332 ,Y:310 ,W:440 ,A:'left'   },
  rubines     : {X:706 ,Y:521 ,W:440             },
  sapphires   : {X:706 ,Y:521 ,W:440             },
  globalRank  : {X:588 ,Y:462 ,W: 80 ,A: 'right' },
  localRank   : {X:725 ,Y:462 ,W: 80 ,A: 'right' },
  background  : {X: 88 ,Y: 15 ,W:692, H: 345      },
  sticker     : {X: 323 ,Y: 397 ,W:215, H: 215    },
  avatar      : {X: 6,  Y: 123},
  flair       : {X: 235,  Y: 245, W:100, H:120},
  flag     : {X: 748,  Y: 280},
  offset_hex  : 20
}; 
const COLORS = {
  PRIMARY_TXT_COLOR     : "#2b2b3b",
  PRIMARY_TXT_SIZE      : "#2b2b3b",
  PRIMARY_TXT_WEIGHT    : "#2b2b3b",      
  SECONDARY_TXT_COLOR   : "#363f5c",
  SECONDARY_TXT_SIZE    : "#2b2b3b",
  SECONDARY_TXT_WEIGHT  : "#2b2b3b",
  wifeFill: "#333340"
};
const TEXT={
  NAME:{
    SIZE:   42,
    WEIGHT: 900,
    FAMILY: "Whitney HTF",
    COLOR:  "#2b2b3b"
  },
  TAGLINE:{
    SIZE:20,
    WEIGHT:600,
    FAMILY:'Whitney HTF SC',
    COLOR: "#363f5c"
  },       
  WIFENAME:{
    SIZE:24,
    WEIGHT:600,
    FAMILY:'Whitney HTF',
    COLOR:"#fdfdfd"
  },    
  WIFESMALL:{
    SIZE: 20,
    WEIGHT: 100,
    FAMILY:'Whitney HTF',
    COLOR:"#fdfdfd"
  },
  RANKS:{
    SIZE: 22,
    WEIGHT: 300,
    FAMILY: 'Whitney HTF Light',
    COLOR: "#fdfdfd"
  },
  PERSOTEX:{
    SIZE: 16,
    WEIGHT: '',
    FAMILY: ' ',
    COLOR: "#AAC",
  },
  SIDEBAR:{
    SIZE: 40,
    WEIGHT: "",
    FAMILY:"Visitor TT1 BRK",
    COLOR: "#fdfdfd"
  },
  THX:{
    SIZE: 30,
    WEIGHT: 900,
    FAMILY:"Whitney HTF",
    COLOR: "#ffffff"
  },
  RUBINES:{
    SIZE: 26,
    WEIGHT: 400,
    FAMILY:'Corporate Logo Rounded',
    COLOR: "#CCE"
  }       
};


init = async (msg)=>{


  // PROFILE FRAME
  if (msg.content.split(/ +/).slice(1)[0] == "frame") {
    let ag = msg.content.split(/ +/).slice(1)[1];
    let dDATA = await DB.users.get(msg.author.id);
    let frame = (dDATA.switches || {}).profileFrame

    function switchon() {
      DB.users.set(msg.author.id, {
        $set: {
          'switches.profileFrame': true
        }
      }).then(x => null) //msg.addReaction(':switchon:343511231434588161'));
    }

    function switchoff() {
      DB.users.set(msg.author.id, {
        $set: {
          'switches.profileFrame': false
        }
      }).then(x => null) // msg.addReaction(':switchoff:343511248085843968'));
    }

    if (ag && ag == "on") {
      switchon()
    } else if (ag && ag == "off") {
      switchoff()
    } else {
      frame ? switchoff() : switchon();
    }
    return;
  }

  // NORMAL PROFILE -->

  const Target = PLX.getTarget(msg,0,true,true);
  let Target_Database = await DB.users.get({id:Target.id});

  console.log({Target_Database})
  
  if(Target_Database) Target_Database.type = 'udata';
  
 

  const USERPROFILE = new UserProfileModel(Target_Database||msg.args[0],(msg.guild?msg.guild.member(Target):Target));
  //console.log(USERPROFILE)
  await Promise.all([
    await USERPROFILE.wifeData,
    await USERPROFILE.localData    
  ]);
  USERPROFILE.rank = (await USERPROFILE.globalRank)+1;

try{

  //============================  CANVAS START   ===================//

    const isMarried = USERPROFILE.marriage && USERPROFILE.wife;
    const canvas = Picto.new(800,600);
    const ctx = canvas.getContext('2d');

  //=========================================
  //                            Gather Images
  //=========================================

    let img={};
    img.mainframe    = Picto.getCanvas(paths.CDN + "/build/profile/"        + (Target.bot ? PFLD ? "mainframe_botpart" : "mainframe_bot" : "mainframe") + ".png");
    img.background   = Picto.getCanvas(paths.CDN + "/backdrops/"            + USERPROFILE.background   + ".png");
    img.flair        = Picto.getCanvas(paths.CDN + "/flairs/"               + USERPROFILE.flair        + ".png");
    img.sticker      = Picto.getCanvas(paths.CDN + "/stickers/"             + USERPROFILE.sticker      + ".png");
    img.flag         = Picto.getCanvas(paths.CDN + "/build/flags/"         + USERPROFILE.countryFlag  + ".png");
    img.aviFrame     = Picto.getCanvas(paths.CDN + "/build/profile/frames/" + USERPROFILE.profileFrame + ".png");
    img.medals       = USERPROFILE.medals.map(mdl=> new Object({
                                  canvas: Picto.getCanvas(paths.CDN + "/medals/"+mdl+".png"),
                                  index: USERPROFILE.medals.indexOf(mdl)
                                }) );    
    img.iconRubine     = Picto.getCanvas(paths.CDN + "/images/gems/rubine_full.png");
    img.iconSapphire   = Picto.getCanvas(paths.CDN + "/images/gems/sapphire_full.png");
    img.global_roundel = Picto.XChart(120, USERPROFILE.percent, USERPROFILE.favColor, false, USERPROFILE.level);
    img.hex_frame = Picto.makeHex(250);
    img.hex_pic = Picto.makeHex(210, USERPROFILE.avatar);
    
    if(isMarried) {
      img.wifeAvatar = Picto.getCanvas(USERPROFILE.wife.wifeAvatar);
      img.wifeHeart = Picto.getCanvas( paths.CDN+"/build/profile/marriheart_"+USERPROFILE.wife.ring+".png")
    }

//==========================================
//                      Gather Graphic Text
//==========================================

    let txt={};
    let txt_type;

    txt_type = "NAME"
    txt.name    = Picto.tag(ctx, USERPROFILE.localName,    `${TEXT[txt_type].WEIGHT} ${TEXT[txt_type].SIZE}px '${TEXT[txt_type].FAMILY}'`,TEXT[txt_type].COLOR);
    
    txt_type = "TAGLINE"
    txt.tagline = Picto.tag(ctx,  USERPROFILE.tagline,     `${TEXT[txt_type].WEIGHT} ${TEXT[txt_type].SIZE}px '${TEXT[txt_type].FAMILY}'`,TEXT[txt_type].COLOR);
    
    txt_type = "PERSOTEX"
    txt.persotex = Picto.block(
        ctx, USERPROFILE.personalText,
        `${TEXT[txt_type].WEIGHT} ${TEXT[txt_type].SIZE}px '${TEXT[txt_type].FAMILY}'`,
        TEXT[txt_type].COLOR,
        XYZ.persotex.W, XYZ.persotex.H,{paddingY:5} //255, 70
    );

    txt_type = "SIDEBAR"
    txt.commend = Picto.tag(ctx, USERPROFILE.commend,      `${TEXT[txt_type].WEIGHT} ${TEXT[txt_type].SIZE}px '${TEXT[txt_type].FAMILY}'`,TEXT[txt_type].COLOR);
    txt.thx = Picto.tag(ctx, USERPROFILE.thx,              `${TEXT[txt_type].WEIGHT} ${TEXT[txt_type].SIZE}px '${TEXT[txt_type].FAMILY}'`,TEXT[txt_type].COLOR);
    
    if(isMarried){
      txt_type = "WIFENAME"
      txt.wifeName = Picto.tag(ctx, USERPROFILE.wife.wifeName,             `${TEXT[txt_type].WEIGHT} ${TEXT[txt_type].SIZE}px '${TEXT[txt_type].FAMILY}'`,TEXT[txt_type].COLOR);
      
      txt_type = "WIFESMALL"
      txt.lovepoints = Picto.tag(ctx, USERPROFILE.wife.lovepoints,             `${TEXT[txt_type].WEIGHT} ${TEXT[txt_type].SIZE}px '${TEXT[txt_type].FAMILY}'`,TEXT[txt_type].COLOR);
      txt.wifeSince = Picto.tag(ctx, USERPROFILE.wife.since,                  `${TEXT[txt_type].WEIGHT} ${TEXT[txt_type].SIZE}px '${TEXT[txt_type].FAMILY}'`,TEXT[txt_type].COLOR);
    }
    
    txt_type = "RUBINES"
    txt.rubines = Picto.tag(ctx, miliarize(USERPROFILE.rubines) ,             `${TEXT[txt_type].WEIGHT} ${TEXT[txt_type].SIZE}px '${TEXT[txt_type].FAMILY}'`,TEXT[txt_type].COLOR);
    txt.sapphires = Picto.tag(ctx, miliarize(USERPROFILE.sapphires) ,             `${TEXT[txt_type].WEIGHT} ${TEXT[txt_type].SIZE}px '${TEXT[txt_type].FAMILY}'`,TEXT[txt_type].COLOR);
    
    txt_type = "RANKS"
    txt.globalRank = Picto.tag(ctx, "#"+miliarize(USERPROFILE.rank) ,             `${TEXT[txt_type].WEIGHT} ${TEXT[txt_type].SIZE}px '${TEXT[txt_type].FAMILY}'`,TEXT[txt_type].COLOR);
    txt.localRank = Picto.tag(ctx, "#"+miliarize(USERPROFILE.localRank) ,             `${TEXT[txt_type].WEIGHT} ${TEXT[txt_type].SIZE}px '${TEXT[txt_type].FAMILY}'`,TEXT[txt_type].COLOR);
    
    let REP = Picto.tag(ctx, "THX", "900 30px 'Whitney HTF',Sans", "#ffffff")

  //=========================================
  //                      DRAW BACKROP (IMG)
  //=========================================

  ctx.globalCompositeOperation = "source-over";

  // FULL I/O PARALLELISM   \m/

  let backdrop = new Promise(async resolveAll =>{    
   
    let backmost = new Promise(async resolveBack =>{
      const canvas = Picto.new(800,600);
      const ctx = canvas.getContext('2d');
      img.background.then(async IMG=>{
        ctx.drawImage( IMG, XYZ.background.X, XYZ.background.Y, XYZ.background.W, XYZ.background.H);  

        img.mainframe.then(mainframe=>{
          
          let colorstrap = Picto.new(81, 600)
          let cx = colorstrap.getContext("2d")

          cx.fillStyle = USERPROFILE.favColor;
          cx.fillRect(0, 0, 81, 580);
          cx.globalAlpha = 0.9
          cx.globalCompositeOperation = "destination-atop";
          cx.drawImage(mainframe, -10, -10)

          cx.globalCompositeOperation = "multiply";
          cx.drawImage(mainframe, -10, -10)
          
          ctx.drawImage(mainframe, 0, 0)
          ctx.globalAlpha = .9;
          ctx.drawImage(colorstrap, 9, 10)
          ctx.globalAlpha = 1;
          
          Picto.getCanvas(paths.CDN+"/build/profile/litostar.png").then(IMG=> {
            ctx.globalAlpha = .65;
            ctx.drawImage(IMG, XYZ.commend.X - 53, XYZ.commend.Y-25 );
            ctx.globalAlpha = 1;
            resolveBack(canvas);
          });
          mainframe = null;
        })
      })
    });

   
    const canvas = Picto.new(800,600);
    const ctx = canvas.getContext('2d');        
    let sticker;
    if(USERPROFILE.sticker)
      sticker = img.sticker.then(IMG => ctx.drawImage(IMG , XYZ.sticker.X - 10 -10, XYZ.sticker.Y - 25 -8,  XYZ.sticker.W,  XYZ.sticker.H) );
    if(isMarried){

      ctx.lineWidth = 2;
      let picDiameter = 26
      let rectFill = COLORS.wifeFill

      let WIFE = USERPROFILE.wife;
      let ringTierColor = "white";
      if(WIFE.ring == "stardust") ringTierColor= "#2d6fe8";
      if(WIFE.ring == "sapphire") ringTierColor= "#DaA905";
      if(WIFE.ring == "rubine")   ringTierColor= "#DaA905";
      if(WIFE.ring == "jade")     ringTierColor= "#7888a7";

      ctx.shadowBlur = 25;
      ctx.shadowColor = 'rgba(30,30,30,.5)';
      
      let wR = XYZ.wifeRect
      Picto.roundRect(ctx,wR.X,wR.Y,wR.W,wR.H,wR.R,rectFill,ringTierColor)

      ctx.shadowBlur = 0;
      ctx.shadowColor = 'rgba(30,30,30,.3)';
      ctx.save();

      img.wifeHeart.then(IMG => ctx.drawImage( IMG , wR.X+15, wR.Y+14) );

      (async ()=>{
        ctx.beginPath();
        let thiX = wR.X+wR.W   -(picDiameter+ctx.lineWidth*2)
        ctx.arc(thiX,picDiameter+6, picDiameter+2, 0, Math.PI*2,true);
        ctx.clip();
        ctx.drawImage( (await img.wifeAvatar) ,thiX-picDiameter,wR.Y+5,54,54);
        ctx.closePath();
        ctx.restore();
      })()

    }

    Promise.all([backmost,sticker]).then(array=>{
      sticker;
      ctx.globalCompositeOperation = "destination-over";
      ctx.drawImage(array[0],0,0);
      ctx.globalCompositeOperation = "source-over";
      array = null;
      resolveAll(canvas);
    })
  });    

  let z; // CURSOR
  //=====================================================
  //                             FOREGROUND TEXT ELEMENTS
  //=====================================================

  if(isMarried){
    ["wifeName","lovepoints","wifeSince"].forEach(z=>{
      Picto.setAndDraw(ctx,  txt[z]   ,XYZ[z].X, XYZ[z].Y, XYZ[z].W,  XYZ[z].A )
    });  
  }
  ["name","tagline","globalRank","localRank"].forEach(z=>{
    if(!Target.bot|| ["name","tagline"].includes(z) ){
      Picto.setAndDraw(ctx,  txt[z]   ,XYZ[z].X, XYZ[z].Y, XYZ[z].W,  XYZ[z].A )
    }
  });  

  ["persotex"].forEach(z=>{
      ctx.drawImage(txt[z].item  ,XYZ[z].X, XYZ[z].Y)// XYZ[z].W,  XYZ[z].A )
  });  

  z= "commend"
  Picto.setAndDraw(ctx,  txt[z]   ,XYZ[z].X-2, XYZ[z].Y+50, XYZ[z].W, XYZ[z].A)
      
  let THX = Picto.tag(ctx, "THX", "900 30px 'Whitney HTF',Sans", "#ffffff");
  ctx.globalAlpha = .5;
  ctx.drawImage(THX.item, XYZ.commend.X - THX.width / 2, 425)
  ctx.globalAlpha = .8;
  ctx.drawImage(txt.thx.item, XYZ.commend.X - txt.thx.width/2, 455)
  ctx.globalAlpha = 1;

 let foreground = new Promise(async resolveAll=> {

  const canvas = Picto.new(800,600);
  const ctx = canvas.getContext('2d');   

  let flair = img.flair.then(IMG=> ctx.drawImage(IMG, XYZ.flair.X, XYZ.flair.Y, XYZ.flair.W, XYZ.flair.H) );
  let rubine_n_roundel = (async () =>{
    if (!Target.bot){
      ctx.drawImage(txt.rubines.item, XYZ.rubines.X - txt.rubines.width, XYZ.rubines.Y);
      ctx.drawImage( (await img.iconRubine), XYZ.rubines.X +10, XYZ.rubines.Y, 40,32);

      ctx.drawImage(txt.sapphires.item, XYZ.sapphires.X - txt.sapphires.width - txt.rubines.width - 50, XYZ.sapphires.Y);
      ctx.drawImage( (await img.iconSapphire), XYZ.sapphires.X +10 - txt.rubines.width - 50 , XYZ.sapphires.Y, 28,32);
      z="global_roundel"
      ctx.drawImage( (await img[z])  ,XYZ[z].X, XYZ[z].Y )
      return true;
    }else{
      return true;
    }
  })();

  if (USERPROFILE.countryFlag) {    
    img.flag.then(flaggie=>ctx.drawImage(flaggie, XYZ.flag.X, XYZ.flag.Y, 44, 30));
  }

    Promise.all([rubine_n_roundel,flair]).then(arr=>{
      resolveAll(canvas)
    });
 });
    
 if (USERPROFILE.medalsArrangement && USERPROFILE.medalsArrangement.valid.length>0 ){
   valid_medals = USERPROFILE.medalsArrangement.style
   valid  = USERPROFILE.medalsArrangement.valid
    
    if (valid_medals == 1) {
      let x = XYZ.medals.X + (150 / 2 - 50)
      let y = XYZ.medals.Y + (150 / 2 - 50)

      img.medals[valid[0]].canvas.then(IMG=> ctx.drawImage( IMG, x, y, 150, 150 ))

    } else if (valid_medals == 2) {

      let x = XYZ.medals.X
      let y = XYZ.medals.Y + 100
      await Promise.all([   
       img.medals[valid[0]].canvas.then(IMG=> ctx.drawImage( IMG, x, y, 100, 100) ),
       img.medals[valid[1]].canvas.then(IMG=> ctx.drawImage( IMG, x + 100, y, 100, 100) )
      ]);

    } else if (valid_medals == 3) {

      let x = XYZ.medals.X
      let x1 = XYZ.medals.X + (200 / 2 - 50)
      let y = XYZ.medals.Y
      await Promise.all([
       img.medals[valid[0]].canvas.then(IMG=> ctx.drawImage( IMG, x1, y, 100, 100) ),
       img.medals[valid[1]].canvas.then(IMG=> ctx.drawImage( IMG, x, y + 100, 100, 100) ),
       img.medals[valid[2]].canvas.then(IMG=> ctx.drawImage( IMG, x + 100, y + 100, 100, 100) )
      ]);

    } else if (valid_medals == 4) {

      let x = XYZ.medals.X
      let y = XYZ.medals.Y
      await Promise.all([
       img.medals[valid[0]].canvas.then(IMG=> ctx.drawImage( IMG, x, y, 100, 100) ),
       img.medals[valid[1]].canvas.then(IMG=> ctx.drawImage( IMG, x + 100, y, 100, 100) ),
       img.medals[valid[2]].canvas.then(IMG=> ctx.drawImage( IMG, x, y + 100, 100, 100) ),
       img.medals[valid[3]].canvas.then(IMG=> ctx.drawImage( IMG, x + 100, y + 100, 100, 100) )
      ]);

    } else {
      let x = XYZ.medals.X
      let y = XYZ.medals.Y
      
      let ind = 0
      let row = 0
      medalie = await Promise.all(img.medals.map(x=>x.canvas));
      while (ind < 8) {
        let col = 0
        while (col < 3) {          
          if (img.medals[ind]) {            
              ctx.drawImage(medalie[ind], x + 68 * col, y + 68 * row, 64, 64);
          }
          ind = ind + 1;
          ++col;
        }
        ++row;
      }
    } 
  }

  let hexes = new Promise(async resolve=>{
    const canvas3 = Picto.new(800,600);
    const ctx3 = canvas3.getContext('2d');
    ctx3.drawImage(await img.hex_frame, XYZ.avatar.X, XYZ.avatar.Y);
    ctx3.drawImage(await img.hex_pic,   XYZ.avatar.X + XYZ.offset_hex, XYZ.avatar.Y + XYZ.offset_hex);
    if (USERPROFILE.profileFrame) {
      ctx3.drawImage( await img.aviFrame , XYZ.avatar.X-(XYZ.offset_hex+5), 15 + XYZ.avatar.Y - XYZ.offset_hex, 300,284);
      resolve(canvas3);
    }else{
        resolve(canvas3);
    }
  });

    //=========================================
    ///             HONORIFICS
    //=========================================

    
Promise.all([backdrop,foreground,hexes]).then(async arr=>{

  ctx.globalCompositeOperation = "destination-over";
  ctx.drawImage( arr[0] , 0 , 0 )
  
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage( arr[1] , 0 , 0 )
  ctx.drawImage( arr[2] , 0 , 0 )
  

    try {

      const cfg = require(appRoot + '/config.json');
      let bottomTag;
      if (Target_Database.switches && !Target_Database.switches.hideProle) {
        bottomTag = Target_Database.switches.role
      }
      if (cfg.admins.includes(Target_Database.id)) bottomTag = "moderatorplus"
      if (cfg.owner.includes(Target_Database.id)) bottomTag = "owner"

      if (bottomTag) {
        let tierframe = await Picto.getCanvas(paths.BUILD + "profile/bottomtags/" + bottomTag + ".png");
        ctx.drawImage(tierframe, 160 + 268, 565);
      }
     
      if (bottomTag == "translator" && Target_Database.switches.translator) {
        let flag = await Picto.getCanvas(paths.BUILD + "flags/" + Target_Database.switches.translator + ".png");
        ctx.drawImage(flag, 160 + 313, 573, 32, 21);
      }
      
      if (Target_Database.blacklisted && Target_Database.blacklisted != "") {
        let bliste = await Picto.getCanvas(paths.CDN + "/build/bliste.png");
        ctx.drawImage(bliste, -2, 2);
        ctx.globalCompositeOperation = 'saturation';
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
        ctx.fillRect(0, 0, 800, 600)
        ctx.drawImage(bliste, -2, 2);
      }

    } catch (e) {
      console.error(e)
    }

    img = null;
    txt = null;
    Target_Database = null;
    FINALIZE(msg, canvas);

  })
  

  } catch (e) { 
    console.log("ERROR PROFILE")
    console.error(e)
    msg.channel.send("```ml" + `

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
    +-----+------------++=====================++-+--------------+/
  
    
    ` + "```")
    //${(e.stack)}    
  } //end catch 1

}

module.exports = {
  pub: true,
  cmd: "profile",
  perms: 3,
  init: init,
  cat: 'social',
  aliases: ['ppc', 'perfil'],
  cool: 800
};

async function FINALIZE(msg,canvas){  
  console.log(canvas)
  let buff = await canvas.toBuffer();
  await msg.channel.createMessage('', {
    file: buff,
    name: "profile.png"
  })

}
