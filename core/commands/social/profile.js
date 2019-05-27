paths.CDN = "https://beta.pollux.gg"

const gear = require('../../utilities/Gearbox.js')


const Canvas = require("canvas");
//const locale = require(appRoot + '/utils/i18node');
//const $t = locale.getT();
const DB = require('../../database/db_ops');

const init = async function run(msg) {

  delete require.cache[require.resolve('../../utilities/Picto.js')]
  const Picto = require('../../utilities/Picto.js')


  let start = Date.now()


  function benchmark(reson) {
    let now = Date.now()
    console.error("checkpoint - `" + (now - start) + "ms` (" + reson + ")")
    //msg.reply("checkpoint - `"+(now-start)+"ms` ("+reson+")")
  }

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

  try {
    const canvas = new Canvas.createCanvas(800, 600);
    const ctx = canvas.getContext('2d');

    const P = {
      lngs: msg.lang
    }
    const v = {
      LEVEL: $t("website.level", P),
      GLOBAL: $t("website.global", P),
      SERVER: $t("discord.server", P)
    }

    let finder = msg.content.split(/ +/).slice(1).join(' ')
    if (!finder) finder = msg.author.id;

    const Server = msg.guild
    const Target = await gear.getTarget(msg);
    let TARGET_DB = (await DB.users.findOne({
      id: Target.id
    }))||(await DB.users.findOne({
      id: msg.author.id
    }));
    const SV_DB = await DB.servers.findOne({id: Server.id},{'modules.UPFACTOR':1});

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

    if (TARGET_DB.modules.medals.length < 9) {
      let lent = 9 - TARGET_DB.modules.medals.length
      for (i = 0; i < lent; i++) {
        await DB.users.set(Target.id, {
          $push: {
            'modules.medals': 0
          }
        });
      }
      TARGET_DB = await DB.users.findOne({
        id: Target.id
      });
    }

    let originals = ["370610552403132416", "271394014358405121"]

    let flair = TARGET_DB.modules.flairTop || 'default';

    let favcolor = "#" + (TARGET_DB.modules.favcolor || "#bb55e0").replace("#", "")
    let PFLD = (TARGET_DB.switches || {
      profiled: false
    }).profiled;
    let backgroundId = (TARGET_DB.modules.bgID || "5zhr3HWlQB4OmyCBFyHbFuoIhxrZY6l6")
    if (Target.bot && !PFLD) backgroundId = "IlyEEDBj0GLLlFl8n6boPLSkADNuBwke";
    let persotex = (TARGET_DB.modules.persotext || "I have no personal text because i'm lazy as a sloth.")
    const nametag = Target.tag
    let nickname;
    let tagline;
    try {
      nickname = Server.member(Target).nick || Target.username
      tagline = TARGET_DB.modules.tagline;
    } catch (e) {
      nickname = (Target || msg.author).username
      tagline = TARGET_DB.modules.tagline || "A fellow Pollux user";
    }

    let rubines = gear.miliarize(TARGET_DB.modules.rubines || 0)
    let serverank;
    let globalrank;
    let svRankData

    if (!Target.bot) {
      svRankData = await DB.localranks.get({user:Target.id,server:msg.guild.id});
      serverank = DB.localranks
      .find({server:svRankData.server,exp:{$gt:svRankData.exp}}).countDocuments();
      globalrank = DB.users
      .find({"modules.exp": {$gt: TARGET_DB.modules.exp},blacklisted: {$exists: false}}).countDocuments();

      await Promise.all([
        serverank = await serverank,
        globalrank = await globalrank
      ])
     serverank++
    }

    let rep = svRankData.thx || 0
    let commend = TARGET_DB.modules.commend || 0
    let propic;
    try {
      propic = (Target.user || Target).displayAvatarURL
    } catch (e) {
      propic = Target.displayAvatarURL;
    }

    let medals = TARGET_DB.modules.medals || [0, 0, 0, 0, 0, 0, 0, 0, 0]
    let sticker = TARGET_DB.modules.sticker

    function XPercent(x, l, f = 0.0427899) {
      let exptoNex = Math.trunc(Math.pow((l + 1) / f, 2));
      let exptoThis = Math.trunc(Math.pow(l / f, 2));
      let frameofact = exptoNex - exptoThis;
      let levelcoverage = x - exptoThis
      let percent = levelcoverage / frameofact;
      return percent;
    }

    let exp = TARGET_DB.modules.exp || 0;
    let level = TARGET_DB.modules.level || 0;

    let percent = XPercent(exp, level)
    const SVFAC = SV_DB.modules.UPFACTOR || 1;


    let l_exp,
      l_level,
      l_exptoNex,
      l_exptoThis,
      l_frameofact,
      l_percent;

    try {
      l_exp =  svRankData.exp || 1
      l_level = svRankData.level || 0
      l_percent = XPercent(l_exp, l_level, SVFAC)
    } catch (e) {
      l_exp = 0
      l_level = 0
      l_frameofact = 0
      l_percent = 0
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
      globalrank = "∞"
      serverank = "∞"
      favcolor = "#b72d5d"
      persotex = "Customise your profile and more at http://www.pollux.fun \nType p!help for commands!"
      medals = [
        "halloween_2017", "ghostling", "discord",
        "brazil", "pollux", "starcraft",
        "adobe", "hallux", "gbusters"
      ]
    }
    if (Target.id == "370610552403132416") {
      backgroundId = "medic";
      nickname = "Lt. Morales | The Medic"
      l_level = 128
      level = 500
      percent = 1
      l_percent = 1
      globalrank = "∞"
      serverank = "∞"
      favcolor = "#ef1942"
      persotex = "Where's the Emergency?"
      medals = [
        0, 0, 0,
        0, "starcraft", "heroes",
        0, 0, 0
      ]
    }

    //==================================================================
    //==================================================================

    const offset_hex  = 20
    const AVATAR_HEX  = {x: 10,   y: 115}
    const G_ROUNDEL   = {x: 680,  y: 2}
    const L_ROUNDEL   = {x: 465,  y: 380}
    const DISPLAYNAME = {x: 0,    y: 0}
    const TAGLINE     = {x: 0,    y: 0}
    const _MEDALS     = {x: 100,  y: 380}
    const _STICKER    = {x: 320,  y: 395}
    const _BG         = {x: 88,   y: 15}
    const G_RANK      = {x: 562,  y: 382 + 80}
    const L_RANK      = {x: 559 + 172, y: 382 + 80}
    const _RUBINES    = {x: 706,  y: 439 +80}
    const _EXP        = {x: 0,    y: 0}
    const _REP        = {x: 53,   y: 460}
    const _STAR       = {x: 53,   y: 25}
    const _FT         = {x: 235,  y: 245}
    const _flag       = {x: 748,  y: 280}

    //=========================================

    let mainframe = Picto.getCanvas(paths.CDN+"/build/profile/" + (Target.bot ? PFLD ? "mainframe_botpart" : "mainframe_bot" : "mainframe") + ".png"),
      _bg = Picto.getCanvas(paths.CDN + "/backdrops/" + backgroundId + ".png"),
      _flairTop = Picto.getCanvas(paths.CDN + "/flairs/" + flair + ".png"),
      iconRubine = Picto.getCanvas(paths.CDN+"/images/gems/rubine_full.png");
      

      const medalCanvases = medals.map(mdl=>  Picto.getCanvas(paths.MEDALS + mdl + ".png") );


    let medallien = [];
    let medlen = medals.length;
    while (medlen--) {
      let md;
      if (medals[medlen]) md = medals[medlen];
      medallien.unshift(Picto.getCanvas(paths.MEDALS + md + ".png"))
    }

    let medals_images = []
    let valid_images = []
    let valid_medals = 0

    let pre_a = "https://orig00.deviantart.net/b86e/f/2016/343/a/e/cosmog_discord_icon_by_zelakantal-dar345n.png"

     const [global_roundel, hex_frame, hex_pic] = await Promise.all( [
       Picto.XChart(120, percent, favcolor || "#dd5383", false, level)
      ,Picto.makeHex(250)
      ,Picto.makeHex(210, propic)
     ]);


    // NICKNAME ============================================================>

    let label = Picto.tag(ctx, nickname, "900 42px 'Whitney HTF'", "#223");
    let tagliney = Picto.tag(ctx, tagline, "600 20px 'Whitney HTF SC'", "#363f5c");

    // THX  ================================================================>

    rep = rep > 999 ? 999 : rep;
    let _rep = Picto.tag(ctx, rep, "40px 'Visitor TT1 BRK'", "#fff");
    let _star = Picto.tag(ctx, commend, "40px 'Visitor TT1 BRK'", "#fff");
    let rep_displace = _rep.width / 2
  

    // LOVEPOINTS ============================================================>
    let lovpoints = TARGET_DB.modules.lovepoints > 999 ? 999 : TARGET_DB.modules.lovepoints;
    let _love = Picto.tag(ctx, lovpoints || "0", "40px 'Visitor TT1 BRK'", "#fff");
    let love_displace = _love.width / 2

    _bg = await _bg;
    ctx.drawImage(_bg, _BG.x, _BG.y, 692, 345);



    //=====================================================
    //                SIDEBAR COLOR
    //=====================================================


    let colorstrap = new Canvas.createCanvas(81, 600)
    let cx = colorstrap.getContext("2d")

    mainframe = await mainframe;

    cx.fillStyle = favcolor
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

    //-------------------------------------------------------------
  
    //-------------------------------------------------------------
    ctx.globalCompositeOperation = "source-over";


    let labw = label.width > 420 ? 420 : label.width
    let taglw = tagliney.width > 440 ? 440 : tagliney.width;
    ctx.drawImage(label.item, 325, 268, labw, label.height)
    ctx.drawImage(tagliney.item, 329, 260 + label.height, taglw, tagliney.height)
    ctx.globalAlpha = .5;
    ctx.drawImage(_rep.item, _REP.x - rep_displace, _REP.y)
    ctx.globalAlpha = 1;
    
    ctx.drawImage(
      (await Picto.getCanvas(paths.CDN+"/build/profile/litostar.png"))
      , _STAR.x - 53, _STAR.y-25
      )
    Picto.setAndDraw(ctx,_star, _STAR.x-2, _STAR.y+50,80,'center')

    if (sticker) {
      let sticky = await Picto.getCanvas(paths.CDN + "/stickers/" + sticker + ".png");
      ctx.drawImage(sticky, _STICKER.x - 10 -10, _STICKER.y - 25 -8, 220, 220)
    } else {
      //let polluxi = await Picto.getCanvas(paths.BUILD + "/polluxi.png");
     // ctx.drawImage(polluxi, _STICKER.x, _STICKER.y - 20)
    }

    let personal = Picto.block(ctx, persotex, "18px 'Whitney HTF Light', sans-serif", "#FFF", 255, 70)
    ctx.drawImage(personal.item, 520, 495 - 128)
    
    let rubicount = Picto.tag(ctx, rubines,
      "900 30px 'Whitney HTF Light',Sans", "#FFF")
      if (!Target.bot) ctx.drawImage(rubicount.item, _RUBINES.x - rubicount.width, _RUBINES.y);
      if (!Target.bot) ctx.drawImage(await iconRubine, _RUBINES.x +10, _RUBINES.y);
      
      ctx.globalAlpha = .6;
    let REP = Picto.tag(ctx, "THX",
      "900 30px 'Whitney HTF',Sans", "#ffffff")
    ctx.drawImage(REP.item, 52 - REP.width / 2, 425)
    ctx.globalAlpha = 1;
    let grank = Picto.tag(ctx, "#" + gear.miliarize((await globalrank) + 1),
      "300 22px 'Whitney HTF Light',Sans", "#FFFFFF")
    if (!Target.bot) {
      Picto.setAndDraw(ctx, grank, G_RANK.x, G_RANK.y, 80, "left")
    }
    let lrank = Picto.tag(ctx, "#" + gear.miliarize(serverank + 0),
      "300 22px 'Whitney HTF Light',Sans", "#FFFFFF")
    if (!Target.bot) {
      Picto.setAndDraw(ctx, lrank, L_RANK.x, L_RANK.y, 80, "right")
    }
    await ctx.drawImage(hex_frame, AVATAR_HEX.x, AVATAR_HEX.y);

    if (valid_medals == 1) {
      let x = _MEDALS.x + (150 / 2 - 50)
      let y = _MEDALS.y + (150 / 2 - 50)

      await ctx.drawImage(await valid_images[0], x, y, 150, 150)

    } else if (valid_medals == 2) {

      let x = _MEDALS.x
      let y = _MEDALS.y + 100

      await ctx.drawImage(await valid_images[0], x, y, 100, 100);
      await ctx.drawImage(await valid_images[1], x + 100, y, 100, 100);

    } else if (valid_medals == 3) {

      let x = _MEDALS.x
      let x1 = _MEDALS.x + (200 / 2 - 50)
      let y = _MEDALS.y
      await ctx.drawImage(await valid_images[0], x1, y, 100, 100);
      await ctx.drawImage(await valid_images[1], x, y + 100, 100, 100);
      await ctx.drawImage(await valid_images[2], x + 100, y + 100, 100, 100);

    } else if (valid_medals == 4) {

      let x = _MEDALS.x
      let y = _MEDALS.y
      await ctx.drawImage(await valid_images[0], x, y, 100, 100);
      await ctx.drawImage(await valid_images[1], x + 100, y, 100, 100);
      await ctx.drawImage(await valid_images[2], x, y + 100, 100, 100);
      await ctx.drawImage(await valid_images[3], x + 100, y + 100, 100, 100);

    } else {

      let x = _MEDALS.x
      let y = _MEDALS.y
      let ind = 0
      let row = 0
      while (ind < 8) {
        let col = 0
        while (col < 3) {
          //console.log({col,ind,row,MEDAL:medals_images[ind]})
          if (medals[ind]) {
            
            let medalie = await medalCanvases[ind];
            await ctx.drawImage(medalie, x + 68 * col, y + 68 * row, 64, 64);
          }
          ind = await ind + 1;
          ++col;
        }
        ++row;
      }
    } 

    //ctx.drawImage(medals_images[1],_MEDALS.x+100,_MEDALS.y)
    try {
      _flairTop = await _flairTop;
      ctx.drawImage(_flairTop, _FT.x, _FT.y, 100, 120);
    } catch (e) {    }

    if (!Target.bot) {
      //ctx.drawImage(local_roundel,L_ROUNDEL.x,L_ROUNDEL.y,96,96);
      ctx.drawImage(global_roundel, G_ROUNDEL.x, G_ROUNDEL.y);
    }
    
    ctx.drawImage(hex_pic, AVATAR_HEX.x + offset_hex, AVATAR_HEX.y + offset_hex);


    if (TARGET_DB.switches && (TARGET_DB.switches.profiled || TARGET_DB.switches.profileFrame)) {
      let Premium = require(appRoot + "/core/utilities/Premium")
      let tier = await Premium.getTier(Target);
      //if(Target.id=='88120564400553984')tier='chalk'
      if (TARGET_DB.switches.profiled) tier = 'chalk'
 
      if (tier) {
        let tierframe = await Picto.getCanvas(paths.CDN + "/build/profile/frames/" + tier + ".png");      
        ctx.drawImage(tierframe, -offset_hex+3, 15 + AVATAR_HEX.y - offset_hex,300,284);
      }
    } 

 console.log('test')
    //=====================================================
    //                MARRIAGE TAG
    //=====================================================

    if((TARGET_DB.married||[]).length > 0 ){

      const moment = require("moment");


      let WIFE = 
      TARGET_DB.married.find(wife=>wife.featured)||
      TARGET_DB.married.find(wife=>wife.ring == "stardust")||
      TARGET_DB.married.find(wife=>wife.ring == "sapphire")||
      TARGET_DB.married.find(wife=>wife.ring == "rubine")||
      TARGET_DB.married.find(wife=>wife.ring == "jade");

      ctx.lineWidth = 2;
      let ringTierColor = "white";
      if(WIFE.ring == "stardust") ringTierColor= "#2d6fe8";
      if(WIFE.ring == "sapphire") ringTierColor= "#DaA905";
      if(WIFE.ring == "rubine") ringTierColor= "#DaA905";
      if(WIFE.ring == "jade") ringTierColor= "#7888a7";

      ctx.shadowBlur = 25;
      ctx.shadowColor = 'rgba(30,30,30,.5)';
      Picto.roundRect(ctx,100,1,314,65,37,"#252833",ringTierColor)
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'rgba(30,30,30,.3)';
      ctx.save();
      
      ctx.drawImage(await Picto.getCanvas( paths.CDN+"/build/profile/marriheart_"+WIFE.ring+".png"),
      115,15)
      let WifeImage = POLLUX.users.get(WIFE.id).avatarURL || pre_a;
      let WifeName = POLLUX.users.get(WIFE.id).username || WIFE.tag.split("#")[0];
      let WifeTime = moment.utc(WIFE.since).fromNow(true)
      ctx.beginPath();
      let thiX = 380 
      ctx.arc(thiX,32, 28, 0, Math.PI*2,true);
      ctx.clip();
      ctx.drawImage(await Picto.getCanvas(WifeImage),thiX-26,6,54,54);
      ctx.closePath();
      ctx.restore();
      Picto.setAndDraw(ctx,Picto.tag(ctx,WifeName,"600 24px 'Whitney HTF'","#fff"),
      165,7,183,'left')
      Picto.setAndDraw(ctx,Picto.tag(ctx,TARGET_DB.modules.lovepoints+" LP","100 20px 'Whitney HTF'","#fff")
      ,165,35,183,'left')
      Picto.setAndDraw(ctx,Picto.tag(ctx,WifeTime ,"100 20px 'Whitney HTF'","#fff")
      ,350,35,183,'right')
  

    }




    //=========================================
    //=========================================
    ///             HONORIFICS
    //=========================================
    //=========================================

    if (TARGET_DB.personal) {
      Picto.getCanvas(paths.BUILD + "/flags/" + TARGET_DB.personal.country + ".png").then(flaggie=>ctx.drawImage(flaggie, _flag.x, _flag.y, 44, 30));
    }
    
    try {

      const cfg = require(appRoot + '/config.json');
      let bottomTag;
      if (TARGET_DB.switches && !TARGET_DB.switches.hideProle) {

        bottomTag = TARGET_DB.switches.role
      }

      if (cfg.admins.includes(TARGET_DB.id)) bottomTag = "moderatorplus"
      if (cfg.owner.includes(TARGET_DB.id)) bottomTag = "owner"

      if (bottomTag) {
        let tierframe = await Picto.getCanvas(paths.BUILD + "profile/bottomtags/" + bottomTag + ".png");
        ctx.drawImage(tierframe, 160 + 268, 565);
      }
     
      if (bottomTag == "translator" && TARGET_DB.switches.translator) {
        let flag = await Picto.getCanvas(paths.BUILD + "flags/" + TARGET_DB.switches.translator + ".png");
        ctx.drawImage(flag, 160 + 313, 567, 32, 21);
      }

    } catch (e) {
      console.error(e)
    }

    if (TARGET_DB.blacklisted && TARGET_DB.blacklisted != "") {

      let bliste = await Picto.getCanvas(paths.BUILD + "blacklisted.png");
      ctx.globalCompositeOperation = 'saturation';
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
      ctx.fillRect(0, 0, 800, 600)
      ctx.drawImage(bliste, -2, 2);
    }

    var stop = Date.now();
    var diff = (stop - start);
    if (msg.channel.id == '433639502465204252') {
      msg.channel.send("|\n\n**" + msg.author.tag + "**")
    }

    let buff = await canvas.toBuffer();
    await msg.channel.createMessage('', {
      file: buff,
      name: "profile-" + Target.id + ".png"
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
    +-----+------------++=====================++-+--------------*/
` + "```")
  } //end catch 1

} //end block


module.exports = {
  pub: true,
  cmd: "profile",
  perms: 3,
  init: init,
  cat: 'social',
  aliases: ['ppc', 'perfil'],
  cool: 800
};