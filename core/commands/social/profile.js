const UserProfileModel = require("../../archetypes/UserProfileModel");
const Picto = require("../../utilities/Picto.js");

const XYZ = {
  global_roundel: { X: 680, Y: 0 },
  persotex: {
    W: 280, H: 95, X: 500, Y: 395,
  },

  wifeRect: {
    X: 476, Y: 316, W: 314, H: 65, R: 37, // 476 316
  },
  get wifeName() {
    return {
      X: 65 + this.wifeRect.X, Y: 10 + this.wifeRect.Y, W: 183, A: "left",
    };
  },
  get lovepoints() {
    return {
      X: 65 + this.wifeRect.X, Y: 40 + this.wifeRect.Y, W: 183, A: "left",
    };
  },
  get wifeSince() {
    return {
      X: 248 + this.wifeRect.X, Y: 40 + this.wifeRect.Y, W: 183, A: "right",
    };
  },

  commend: {
    X: 40, Y: 25, W: 80, A: "center",
  },
  name: {
    X: 290 + 403, Y: 505 - 7, W: 400, A: "right",
  },
  tagline: {
    X: 300 + 363, Y: 545, W: 400, A: "right",
  },
  medals: { X: 96 - 15, Y: 377 },

  rubines: { X: 706 - 420, Y: 521 - 500, W: 440 },
  sapphires: { X: 706 - 420, Y: 521 - 500, W: 440 },

  ranks: {
    X: 514, Y: 261,
  },

  get globalRank() {
    return {
      X: this.ranks.X + 40, Y: this.ranks.Y + 10, W: 80, A: "left",
    };
  },

  get localRank() {
    return {
      X: this.globalRank.X + 168, Y: this.globalRank.Y, W: 80, A: "right",
    };
  },
  background: {
    X: 70, Y: 15, W: 710, H: 345,
  },
  sticker: {
    X: 286, Y: 350, W: 225, H: 225,
  },
  avatar: { X: 20, Y: 123 }, // 123
  flair: {
    X: 694, Y: 470, W: 100, H: 120,
  },
  flag: { X: 15, Y: 534 },
  offset_hex: 20,
};
const COLORS = {
  PRIMARY_TXT_COLOR: "#2b2b3b",
  PRIMARY_TXT_SIZE: "#2b2b3b",
  PRIMARY_TXT_WEIGHT: "#2b2b3b",
  SECONDARY_TXT_COLOR: "#363f5c",
  SECONDARY_TXT_SIZE: "#2b2b3b",
  SECONDARY_TXT_WEIGHT: "#2b2b3b",
  wifeFill: "#2b2b3b",
};
const TEXT = {
  NAME: {
    SIZE: 44,
    WEIGHT: 900,
    FAMILY: "Panton Black",
    COLOR: "#2b2b3b",
  },
  TAGLINE: {
    SIZE: 18,
    WEIGHT: 900,
    FAMILY: "Panton",
    COLOR: "#2b2b3b",
  },
  WIFENAME: {
    SIZE: 24,
    WEIGHT: 600,
    FAMILY: "Panton",
    COLOR: "#fdfdfd",
  },
  WIFESMALL: {
    SIZE: 18,
    WEIGHT: 100,
    FAMILY: "Panton",
    COLOR: "#fdfdfd",
  },
  RANKS: {
    SIZE: 22,
    WEIGHT: 300,
    FAMILY: "Panton",
    COLOR: "#fdfdfd",
  },
  PERSOTEX: {
    SIZE: 17,
    WEIGHT: "",
    FAMILY: " ",
    COLOR: "#AAC",
  },
  SIDEBAR: {
    SIZE: 40,
    WEIGHT: "",
    FAMILY: "Visitor TT1 BRK",
    COLOR: "#fdfdfd",
  },
  THX: {
    SIZE: 30,
    WEIGHT: 900,
    FAMILY: "Panton Black",
    COLOR: "#ffffff",
  },
  RUBINES: {
    SIZE: 26,
    WEIGHT: 400,
    FAMILY: "Corporate Logo Rounded",
    COLOR: "#CCE",
  },
};

const { performance } = require("perf_hooks");
const { Canvas, Image } = require("canvas");
const { Message } = require("eris");


const init = async (msg) => {
  msg.runtime_internal = performance.now();

  const startimer = Date.now();

  
  const _benchmark = (s) => {
    console.log(`${s.blue + (Date.now() - startimer)}ms`);
  };

  // PROFILE FRAME
  if (msg.content.split(/ +/).slice(1)[0] === "frame") {
    const ag = msg.content.split(/ +/).slice(1)[1];
    const dDATA = await DB.users.get(msg.author.id);
    const frame = dDATA.switches?.profileFrame;

    function switchon() {
      DB.users.set(msg.author.id, {
        $set: {
          "switches.profileFrame": true,
        },
      
      }).then((x) => null); // msg.addReaction(':switchon:343511231434588161'));
    }

    function switchoff() {
      DB.users.set(msg.author.id, {
        $set: {
          "switches.profileFrame": false,
        },
      
      }).then((x) => null); // msg.addReaction(':switchoff:343511248085843968'));
    }

    if (ag === "on") {
      switchon();
    } else if (ag === "off") {
      switchoff();
    } else {
      frame ? switchoff() : switchon();
    }
    return;
  }
  // NORMAL PROFILE -->
  const P = { lngs: msg.lang };
  
  const Target = ((await (PLX.resolveMember(msg.guild, msg.args[0]).catch((e) => null)) || (await PLX.resolveUser(msg.args[0]).catch((e) => console.error(e))))) || msg.member;

  if (!Target) return msg.channel.send($t("responses.errors.kin404", P));
  let Target_Database = await DB.users.get({ id: Target.id });

  if (Target_Database) Target_Database.type = "udata";
  const PFLD = Target_Database.switches?.profiled || false;

  // Strictly accepts UDBData and DiscordUser/DiscordMember
  /** @type {any} */
  const USERPROFILE = new UserProfileModel(Target_Database, Target);

  console.log({ USERPROFILE });

  try {
  //= ===========================  CANVAS START   ===================//

    const canvas = Picto.new(800, 600);
    const ctx = canvas.getContext("2d");

    //= ========================================
    //                            Gather Images
    //= ========================================

    // TODO[epic=bsian] help why doesn't wifeAvatar and wifeHeart show up?
    /** 
     * @typedef img
     * @property {string} wifeAvatar
     * @property {Promise<Canvas|Image>} sidebar
     * @property {Promise<Canvas|Image>} ranks
     * @property {Promise<Canvas|Image>} defaultAvi
     * @property {Promise<Canvas|Image>} mainframe
     * @property {Promise<Canvas|Image>} background
     * @property {Promise<Canvas|Image>} flair
     * @property {Promise<Canvas|Image>} sticker
     * @property {Promise<Canvas|Image>} flag
     * @property {Promise<Canvas|Image>} aviFrame
     * @property {Promise<Canvas|Image>} medals
     * @property {Promise<Canvas|Image>} iconRubine
     * @property {Promise<Canvas|Image>} iconSapphire
     * @property {Promise<Canvas|Image>} global_roundel
     * @property {Promise<Canvas|Image>} hex_frame
     * @property {Promise<Canvas|Image|null>|undefined} wifeAvatar
     * @property {Promise<Canvas|Image|null>|undefined} wifeHeart
     * @property {Promise<Canvas|Image>} hex_pic
    */

    
    let img /** @type {img} */ = {};
    img.sidebar = Picto.getCanvas(`${paths.CDN}/build/profile/sidebar.png`);
    img.ranks = Picto.getCanvas(`${paths.CDN}/build/profile/global-server-tag.png`);
    img.defaultAvi = Picto.getCanvas("https://cdn.discordapp.com/embed/avatars/0.png");
    img.mainframe = Picto.getCanvas(`${paths.CDN}/build/profile/${Target.bot ? PFLD ? "mainframe_bot" : "mainframe_bot" : "mainframe-nex-2"}.png`);
    img.background = Target.bot
      ? Picto.getCanvas(`${paths.CDN}/build/profile/${
        PFLD ? Target.id : "generic-bot"
      }.png`)
      : Picto.getCanvas(`${paths.CDN}/backdrops/${USERPROFILE.background}.png`);

    
    img.flair = Picto.getCanvas(`${paths.CDN}/flairs/${Target.bot ? "bot" : USERPROFILE.flair}.png`).catch((err) => Picto.getCanvas(`${paths.CDN}/flairs/default.png`));
    img.sticker = USERPROFILE.sticker && Picto.getCanvas(`${paths.CDN}/stickers/${USERPROFILE.sticker}.png`);
    img.flag = USERPROFILE.countryFlag && Picto.getCanvas(`${paths.CDN}/build/flags/${USERPROFILE.countryFlag}.png`);
    img.aviFrame = USERPROFILE.profileFrame && Picto.getCanvas(`${paths.CDN}/build/profile/frames/${USERPROFILE.profileFrame}.png`);
    
    img.medals = USERPROFILE.medals.map((mdl) => new Object({
      canvas: Picto.getCanvas(`${paths.CDN}/medals/${mdl}.png`),
      index: USERPROFILE.medals.indexOf(mdl),
    }));
    img.iconRubine = Picto.getCanvas(`https://cdn.discordapp.com/emojis/${_emoji("RBN").id}.png`);
    img.iconSapphire = Picto.getCanvas(`https://cdn.discordapp.com/emojis/${_emoji("SPH").id}.png`);
    img.global_roundel = Picto.XChart(120, USERPROFILE.percent, USERPROFILE.favColor, false, USERPROFILE.level);
    img.hex_frame = Picto.makeHex(250);
    img.hex_pic = Picto.makeHex(210, USERPROFILE.avatar);

    if (!Target_Database) {
      USERPROFILE.tagline = "Not a Pollux user";
      USERPROFILE.personalText = "This user does not play with Pollux :c";
    }
    //= =========================================
    //                      Gather Graphic Text
    //= =========================================

    /** @type {any} */
    let txt = {};
    /** @type {keyof TEXT} */
    let txt_type;

    txt_type = "NAME";
    
    // @ts-ignore
    txt.name = await Picto.tagMoji(ctx, USERPROFILE.localName, `${TEXT[txt_type].WEIGHT} ${TEXT[txt_type].SIZE}px '${TEXT[txt_type].FAMILY}'`, TEXT[txt_type].COLOR);

    txt_type = "TAGLINE";
    
    txt.tagline = Picto.tag(ctx, USERPROFILE.tagline, `${TEXT[txt_type].WEIGHT} ${TEXT[txt_type].SIZE}px '${TEXT[txt_type].FAMILY}'`, TEXT[txt_type].COLOR);

    txt_type = "PERSOTEX";
    txt.persotex = Picto.block(
      ctx, USERPROFILE.personalText,
      
      `${TEXT[txt_type].WEIGHT} ${TEXT[txt_type].SIZE}px '${TEXT[txt_type].FAMILY}'`,
      
      TEXT[txt_type].COLOR,
      XYZ.persotex.W, XYZ.persotex.H, { lineHeight: "20px", paddingY: 5 }, // 255, 70
    );

    txt_type = "RUBINES";
    
    txt.rubines = Picto.tag(ctx, miliarize(USERPROFILE.rubines), `${TEXT[txt_type].WEIGHT} ${TEXT[txt_type].SIZE}px '${TEXT[txt_type].FAMILY}'`, TEXT[txt_type].COLOR);
    
    txt.sapphires = Picto.tag(ctx, miliarize(USERPROFILE.sapphires), `${TEXT[txt_type].WEIGHT} ${TEXT[txt_type].SIZE}px '${TEXT[txt_type].FAMILY}'`, TEXT[txt_type].COLOR);

    txt_type = "RANKS";

    const [, gRank] = await Promise.all([USERPROFILE.localData, USERPROFILE.globalRank, USERPROFILE.wifeData, USERPROFILE.commends]);

    
    USERPROFILE.rank = gRank + 1;
    
    txt.globalRank = Picto.tag(ctx, `#${miliarize(USERPROFILE.rank || 1)}`, `${TEXT[txt_type].WEIGHT} ${TEXT[txt_type].SIZE}px '${TEXT[txt_type].FAMILY}'`, TEXT[txt_type].COLOR);
    
    txt.localRank = Picto.tag(ctx, `#${miliarize(USERPROFILE.localRank || 1)}`, `${TEXT[txt_type].WEIGHT} ${TEXT[txt_type].SIZE}px '${TEXT[txt_type].FAMILY}'`, TEXT[txt_type].COLOR);

    txt_type = "SIDEBAR";
    
    txt.commend = Picto.tag(ctx, USERPROFILE.commend, `${TEXT[txt_type].WEIGHT} ${TEXT[txt_type].SIZE}px '${TEXT[txt_type].FAMILY}'`, TEXT[txt_type].COLOR);
    
    txt.thx = Picto.tag(ctx, USERPROFILE.thx, `${TEXT[txt_type].WEIGHT} ${TEXT[txt_type].SIZE}px '${TEXT[txt_type].FAMILY}'`, TEXT[txt_type].COLOR);

    
    const REP = Picto.tag(ctx, "THX", "900 30px 'Whitney HTF',Sans", "#ffffff");

    const isMarried = (USERPROFILE.marriage && USERPROFILE.wife);
    if (isMarried) { // @ts-expect-error NOTE tsc
      img.wifeAvatar = Picto.getCanvas(USERPROFILE.wife.wifeAvatar).catch((err) => null);
      // img.wifeHeart = Picto.getCanvas( paths.CDN+"/build/profile/marriheart_"+USERPROFILE.wife.ring+".png") // @ts-expect-error NOTE tsc
      img.wifeHeart = Picto.getCanvas(`${paths.CDN}/build/items/ring_${USERPROFILE.wife.ring}.png`);
    }
    if (isMarried) {
      txt_type = "WIFENAME";
      
      txt.wifeName = Picto.tag(ctx, USERPROFILE.wife.wifeName, `${TEXT[txt_type].WEIGHT} ${TEXT[txt_type].SIZE}px '${TEXT[txt_type].FAMILY}'`, TEXT[txt_type].COLOR);

      txt_type = "WIFESMALL";
      
      txt.lovepoints = Picto.tag(ctx, `${USERPROFILE.wife.lovepoints} LVP`, `${TEXT[txt_type].WEIGHT} ${TEXT[txt_type].SIZE}px '${TEXT[txt_type].FAMILY}'`, TEXT[txt_type].COLOR);
      
      txt.wifeSince = Picto.tag(ctx, USERPROFILE.wife.since, `${TEXT[txt_type].WEIGHT} ${TEXT[txt_type].SIZE}px '${TEXT[txt_type].FAMILY}'`, TEXT[txt_type].COLOR);
    }

    //= ========================================
    //                      DRAW BACKROP (IMG)
    //= ========================================

    ctx.globalCompositeOperation = "source-over";

    // FULL I/O PARALLELISM   \m/
    let z; // CURSOR

    const backdrop = new Promise(async (resolveAll) => {
      const backmost = new Promise(async (resolveBack) => {
        const canvas = Picto.new(800, 600);
        const ctx = canvas.getContext("2d");
        const [IMG, mainframe] = await Promise.all([img.background, img.mainframe]);
        const rad = {
          tl: 0, tr: 30, br: 0, bl: 0,
        };
        
        Picto.roundRect(ctx, XYZ.background.X, XYZ.background.Y, XYZ.background.W, XYZ.background.H, rad, IMG);
        ctx.drawImage(mainframe, 0, 0);
        return resolveBack(canvas);
      });

      const canvas = Picto.new(800, 600);
      const ctx = canvas.getContext("2d");
      let sticker;
      if (USERPROFILE.sticker) sticker = img.sticker;
      if (isMarried) {
        ctx.lineWidth = 2;
        
        const picDiameter = 26;
        const rectFill = COLORS.wifeFill;

        const WIFE = USERPROFILE.wife;
        let ringTierColor = "white";
        
        if (WIFE.ring === "stardust") ringTierColor = "#2d6fe8";
        
        if (WIFE.ring === "sapphire") ringTierColor = "#DaA905";
        
        if (WIFE.ring === "rubine") ringTierColor = "#DaA905";
        
        if (WIFE.ring === "jade") ringTierColor = "#7888a7";

        ctx.shadowBlur = 25;
        ctx.shadowColor = "rgba(30,30,30,.5)";

        const wR = XYZ.wifeRect;

        
        Picto.roundRect(ctx, wR.X, wR.Y, wR.W, wR.H, wR.R, rectFill, ringTierColor);

        ctx.shadowBlur = 0;
        ctx.shadowColor = "rgba(30,30,30,.13)";
        ctx.save();

        // @ts-expect-error NOTE tsc
        await img.wifeHeart.then((IMG) => ctx.drawImage(IMG, wR.X + 6, wR.Y + 6, 55, 55));

        try {
          
          Picto.roundRect(ctx, wR.X + wR.W - wR.H + 3, wR.Y + 3, wR.H - 8, wR.H - 8, wR.H / 2, (await img.wifeAvatar));
        } catch (e) {
          
          Picto.roundRect(ctx, wR.X + wR.W - wR.H + 3, wR.Y + 3, wR.H - 8, wR.H - 8, wR.H / 2, (await img.defaultAvi));
        }
        ctx.restore();
      }

      return Promise.all([backmost, sticker]).then((array) => {
        if (array[1]) ctx.drawImage(array[1], XYZ.sticker.X - 10 - 10, XYZ.sticker.Y - 25 - 8, XYZ.sticker.W, XYZ.sticker.H);
        ctx.globalCompositeOperation = "destination-over";
        ctx.drawImage(array[0], 0, 0);
        ctx.globalCompositeOperation = "source-over";
        
        array = null;
        return resolveAll(canvas);
      });
    });

    const foreground = new Promise(async (resolveAll) => {
      const canvas = Picto.new(800, 600);
      const ctx = canvas.getContext("2d");

      const flair = img.flair.then((IMG) => ctx.drawImage(IMG, XYZ.flair.X, XYZ.flair.Y, XYZ.flair.W, XYZ.flair.H));
      const rubine_n_roundel = (async () => {
        if (!Target.bot) {
          ctx.drawImage(txt.rubines.item, XYZ.rubines.X - txt.rubines.width, XYZ.rubines.Y + 3);
          ctx.drawImage(txt.sapphires.item, XYZ.sapphires.X - txt.sapphires.width - txt.rubines.width - 50, XYZ.sapphires.Y + 3);

          z = "global_roundel";
          
          const [imgRND, imgSPH, imgRBN] = await Promise.all([img[z], img.iconSapphire, img.iconRubine]);

          
          ctx.drawImage(imgRND, XYZ[z].X, XYZ[z].Y),
          ctx.drawImage(imgSPH, XYZ.sapphires.X + 5 - txt.rubines.width - 50, XYZ.sapphires.Y - 2, 37, 37),
          ctx.drawImage(imgRBN, XYZ.rubines.X + 5, XYZ.rubines.Y - 5, 37, 37);

          return true;
        }
        return true;
      })();

      if (USERPROFILE.countryFlag) {
        
        img.flag.then((flaggie) => {
          ctx.shadowBlur = 5;
          ctx.shadowColor = "rgba(30,30,38,.3)";
          ctx.drawImage(flaggie, XYZ.flag.X, XYZ.flag.Y, 44, 30);
          ctx.shadowBlur = 0;
        });
      }

      
      await Promise.all([rubine_n_roundel, flair]).then((arr) => {
        resolveAll(canvas);
      });
    });

    if (USERPROFILE.medalsArrangement && USERPROFILE.medalsArrangement.valid.length > 0) {
      /** @type {any} */
      const valid_medals = USERPROFILE.medalsArrangement.style;
      /** @type {any} */
      const valid = USERPROFILE.medalsArrangement.valid;

      
      if (valid_medals === 1) {
        const x = XYZ.medals.X + (150 / 2 - 50);
        const y = XYZ.medals.Y + (150 / 2 - 50);

        img.medals[valid[0]].canvas.then((/** @type {Canvas|Image} */ IMG) => ctx.drawImage(IMG, x, y, 150, 150));
      } else if (valid_medals === 2) {
        const x = XYZ.medals.X;
        const y = XYZ.medals.Y + 100;
        Promise.all([
          img.medals[valid[0]].canvas.then((/** @type {Canvas|Image} */ IMG) => ctx.drawImage(IMG, x, y, 100, 100)),
          img.medals[valid[1]].canvas.then((/** @type {Canvas|Image} */ IMG) => ctx.drawImage(IMG, x + 100, y, 100, 100)),
        ]);
      } else if (valid_medals === 3) {
        const x = XYZ.medals.X;
        const x1 = XYZ.medals.X + (200 / 2 - 50);
        const y = XYZ.medals.Y;
        Promise.all([
          img.medals[valid[0]].canvas.then((/** @type {Canvas|Image} */ IMG) => ctx.drawImage(IMG, x1, y, 100, 100)),
          img.medals[valid[1]].canvas.then((/** @type {Canvas|Image} */ IMG) => ctx.drawImage(IMG, x, y + 100, 100, 100)),
          img.medals[valid[2]].canvas.then((/** @type {Canvas|Image} */ IMG) => ctx.drawImage(IMG, x + 100, y + 100, 100, 100)),
        ]);
      
      } else if (valid_medals === 4) {
        const x = XYZ.medals.X;
        const y = XYZ.medals.Y;
        Promise.all([
          img.medals[valid[0]].canvas.then((/** @type {Canvas|Image} */ IMG) => ctx.drawImage(IMG, x, y, 100, 100)),
          img.medals[valid[1]].canvas.then((/** @type {Canvas|Image} */ IMG) => ctx.drawImage(IMG, x + 100, y, 100, 100)),
          img.medals[valid[2]].canvas.then((/** @type {Canvas|Image} */ IMG) => ctx.drawImage(IMG, x, y + 100, 100, 100)),
          img.medals[valid[3]].canvas.then((/** @type {Canvas|Image} */ IMG) => ctx.drawImage(IMG, x + 100, y + 100, 100, 100)),
        ]);
      } else {
        const x = XYZ.medals.X;
        const y = XYZ.medals.Y;

        let ind = 0;
        let row = 0;
        
        await Promise.all(img.medals.map((x) => x.canvas)).then((medalie) => {
          while (ind < 8) {
            let col = 0;
            while (col < 3) {
              if (img.medals[ind]) {
                ctx.drawImage(medalie[ind], x + 68 * col, y + 68 * row, 64, 64);
              }
              ind += 1;
              ++col;
            }
            ++row;
          }
        });
      }
    }
    const sidebar = await img.sidebar;

    const colorstrap = Picto.new(100, 643);
    const cx = colorstrap.getContext("2d");

    cx.fillStyle = USERPROFILE.favColor;
    
    Picto.roundRect(cx, 0, 0, 80, 643, 10, cx.fillStyle, false);
    cx.globalAlpha = 0.9;
    cx.globalCompositeOperation = "destination-atop";
    cx.drawImage(sidebar, 0, 0);

    cx.globalCompositeOperation = "multiply";
    cx.drawImage(sidebar, 0, 0);

    ctx.drawImage(colorstrap, 0, 0);
    ctx.globalAlpha = 1;

    await Picto.getCanvas(`${paths.CDN}/build/profile/litostar.png`).then((IMG) => {
      ctx.globalAlpha = 0.65;
      ctx.drawImage(IMG, XYZ.commend.X - 53, XYZ.commend.Y - 25);
      ctx.globalAlpha = 1;
    });

    //= ====================================================
    //                             FOREGROUND TEXT ELEMENTS
    //= ====================================================

    if (isMarried) {
      ["wifeName", "lovepoints", "wifeSince"].forEach((/** @type {keyof XYZ} */ z) => {
        Picto.setAndDraw(ctx, txt[z], XYZ[z].X, XYZ[z].Y, XYZ[z].W, XYZ[z].A);
      });
      if (!Target.bot) ctx.drawImage(await img.ranks, XYZ.ranks.X, XYZ.ranks.Y); // 513 265
    } else {
      if (!Target.bot) ctx.drawImage(await img.ranks, XYZ.ranks.X, XYZ.ranks.Y + 80); // 513 265
    }

    ["name", "tagline", "globalRank", "localRank"].forEach((z) => {
      if (!Target.bot || ["name", "tagline"].includes(z)) {
        if (z == "name") {
          // Picto.popOutTxt(ctx,txt[z],XYZ[z].X, XYZ[z].Y,,XYZ[z].W,)

          Picto.setAndDraw(ctx, txt[z], XYZ[z].X, XYZ[z].Y + (z.includes("Rank") && !isMarried ? 80 : 0), XYZ[z].W, XYZ[z].A);
          ctx.globalCompositeOperation = "destination-over";

          const cctx =  txt[z].item.getContext("2d");
          const id = cctx.getImageData(0, 0, txt[z].width, txt[z].height + 50);
          const { data } = id;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            const y = 0.299 * r + 0.587 * g + 0.114 * b;
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
          }
          cctx.putImageData(id, 0, 0);

          Picto.setAndDraw(ctx, txt[z], XYZ[z].X - 3, XYZ[z].Y + 0, XYZ[z].W, XYZ[z].A);
          Picto.setAndDraw(ctx, txt[z], XYZ[z].X - 0, XYZ[z].Y - 3, XYZ[z].W, XYZ[z].A);
          Picto.setAndDraw(ctx, txt[z], XYZ[z].X + 3, XYZ[z].Y - 0, XYZ[z].W, XYZ[z].A);
          Picto.setAndDraw(ctx, txt[z], XYZ[z].X + 0, XYZ[z].Y + 3, XYZ[z].W, XYZ[z].A);
          Picto.setAndDraw(ctx, txt[z], XYZ[z].X - 3, XYZ[z].Y + 3, XYZ[z].W, XYZ[z].A);
          Picto.setAndDraw(ctx, txt[z], XYZ[z].X - 3, XYZ[z].Y - 3, XYZ[z].W, XYZ[z].A);
          Picto.setAndDraw(ctx, txt[z], XYZ[z].X + 3, XYZ[z].Y - 3, XYZ[z].W, XYZ[z].A);
          Picto.setAndDraw(ctx, txt[z], XYZ[z].X + 3, XYZ[z].Y + 3, XYZ[z].W, XYZ[z].A);
          ctx.globalCompositeOperation = "source-over";
          // ctx.filter =  'none'
        } else {
          
          Picto.setAndDraw(ctx, txt[z], XYZ[z].X, XYZ[z].Y + (z.includes("Rank") && !isMarried ? 80 : 0), XYZ[z].W, XYZ[z].A);
        }
      }
    });

    ["persotex"].forEach((z) => {
      
      ctx.drawImage(txt[z].item, XYZ[z].X, XYZ[z].Y);// XYZ[z].W,  XYZ[z].A )
    });

    z = "commend";
    
    Picto.setAndDraw(ctx, txt[z], XYZ[z].X - 2, XYZ[z].Y + 50, XYZ[z].W, XYZ[z].A);

    if (!Target.bot) {
      const THX = Picto.tag(ctx, "THX", "900 30px 'Panton Black',Sans", "#ffffff");
      ctx.globalAlpha = 0.5;
      ctx.drawImage(THX.item, XYZ.commend.X - THX.width / 2, 425);
      ctx.globalAlpha = 0.8;
      ctx.drawImage(txt.thx.item, XYZ.commend.X - txt.thx.width / 2, 455);
      ctx.globalAlpha = 1;
    }

    const hexes = new Promise(async (resolve) => {
      const canvas3 = Picto.new(800, 600);
      const ctx3 = canvas3.getContext("2d");
      ctx3.drawImage(await img.hex_frame, XYZ.avatar.X, XYZ.avatar.Y);
      ctx3.drawImage(await img.hex_pic, XYZ.avatar.X + XYZ.offset_hex, XYZ.avatar.Y + XYZ.offset_hex);
      if (USERPROFILE.profileFrame) {
        try {
        // ctx3.drawImage( await img.aviFrame , XYZ.avatar.X-(XYZ.offset_hex+5), 15 + XYZ.avatar.Y - XYZ.offset_hex, 300,284);
        } catch (e) {}

        resolve(canvas3);
      } else {
        resolve(canvas3);
      }
    });

    //= ========================================
    ///             HONORIFICS
    //= ========================================

    setImmediate(() => {
      Promise.all([backdrop, foreground, hexes]).then(async (arr) => {
        ctx.globalCompositeOperation = "destination-over";
        ctx.drawImage(arr[0], 0, 0);

        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(arr[1], 0, 0);
        ctx.drawImage(arr[2], 0, 0);

        try {
          if (Target_Database) {
            const cfg = require(`${appRoot}/config.json`);
            let bottomTag;
            if (Target_Database.switches?.hideProle) {
              bottomTag = Target_Database.switches.role;
            }
            if (Target_Database.switches?.badges?.template == "artist") bottomTag = "artist";
            if (cfg.mods.includes(Target_Database.id)) bottomTag = "moderator";
            if (cfg.admins.includes(Target_Database.id)) bottomTag = "codes";
            if (cfg.owner.includes(Target_Database.id)) bottomTag = "owner";

            if (bottomTag) {
              const tierframe = await Picto.getCanvas(`${paths.BUILD}profile/bottomtags/${bottomTag}.png`);
              ctx.drawImage(tierframe, 160 + 248, 565);
            }

            if (bottomTag === "translator" && Target_Database.switches.translator) {
              const flag = await Picto.getCanvas(`${paths.BUILD}flags/${Target_Database.switches.translator}.png`);
              ctx.drawImage(flag, 160 + 313, 573, 32, 21);
            }

            if (Target_Database.blacklisted && Target_Database.blacklisted != "") {
              const bliste = await Picto.getCanvas(`${paths.CDN}/build/bliste.png`);
              ctx.drawImage(bliste, -2, 2);
              ctx.globalCompositeOperation = "saturation";
              ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
              ctx.fillRect(0, 0, 800, 600);
              ctx.drawImage(bliste, -2, 2);
            }
          }
        } catch (e) {
          console.error(e);
        }

        
        img = null;
        
        txt = null;
        Target_Database = null;
        
        FINALIZE(msg, canvas);
      });
    });
  } catch (e) {
    console.log("ERROR PROFILE");
    console.error(e);
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
  
    
    ` + "```");
    // ${(e.stack)}
  } // end catch 1
};

module.exports = {
  pub: true,
  cmd: "profile",
  perms: 3,
  
  init,
  cat: "social",
  aliases: ["ppc", "perfil"],
  cool: 800,
};

async function FINALIZE(/** @type {Message} */ msg, /** @type {Canvas} */ canvas) {
    const buff = canvas.toBuffer("image/png", { compressionLevel: 1, filters: canvas.PNG_FILTER_NONE });

    let messageToSend = "";
    let noimg = false;
    let preBuffer = performance.now();

    
    canvas.toBuffer( (err,buff) => {
      if (err) throw err;
      let postBuffer = performance.now() - preBuffer;
      
      if (msg.content.includes("-ni")) noimg = true;
      messageToSend += msg.content.includes('-bm') ?  `  (${(postBuffer).toFixed(3)}ms Buffer)\n` : "";      
      msg.channel.createMessage(messageToSend, noimg ? undefined : {
        file: buff,
        name: "profile.png",
      });
      
    } ,"image/png", { compressionLevel: 1, filters: canvas.PNG_FILTER_NONE });
    
    if (msg.content.includes("-bm")) messageToSend = `${noimg ? "**No-IMG**" : ""} \`⏱️${((performance.now() - msg.runtime_internal) / 1000).toFixed(3)}s\``;
}
