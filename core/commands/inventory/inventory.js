// const gear = require('../../utilities/Gearbox');
// const DB = require('../../database/db_ops');
const Picto = require("../../utilities/Picto");

const INVOKERS   = new Map();

const init = async (msg, args) => {
  const P = { lngs: msg.lang, prefix: msg.prefix };

  const canvas = Picto.new(800, 600);
  ctx = canvas.getContext("2d");

  XYZ = {
    // majors
    LBX: {
      y: 160, x: 710, w: 140, h: 37,
    },
    BPK: {
      y: 244, x: 710, w: 140, h: 0,
    },
    KEY: {
      y: 323, x: 710, w: 140, h: 0,
    },
    MTL: {
      y: 322, x: 180, w: 140, h: 37,
    },
    CSM: {
      y: 405, x: 180, w: 140, h: 0,
    },
    JNK: {
      y: 482, x: 180, w: 140, h: 0,
    },
    // minis
    mBG: { y: 255, x: 390 },
    mMD: { y: 220, x: 390 },
    mST: { y: 220, x: 285 },
    mFL: { y: 255, x: 285 },
    // meta
    uname: { y: 122, x: 227 },

    color1: {
      y: 127, x: 154, w: 505, h: 418, mw: 0,
    },
  };

  const Target = msg.mentions[0] || msg.author;

  const [_baseline, hex, userData, itemData] = await Promise.all([
    Picto.getCanvas(`${paths.CDN}/build/invent/inventframe.png`),
    Picto.makeHex(175, Target.avatarURL),
    DB.users.getFull({ id: Target.id }, {
      "modules.inventory": 1,
      "modules.flairsInventory": 1,
      "modules.bgInventory": 1,
      "modules.medalInventory": 1,
      "modules.stickerInventory": 1,
      "modules.favcolor": 1,
      id: 1,
    }),
    DB.items.find().lean().exec(),
  ]);

  ctx.fillStyle = userData.modules.favcolor || "#FFF";
  ctx.fillRect(154, 127, 500, 408);
  ctx.fillRect(427, 516, 132, 60);

  ctx.drawImage(hex, 25, 25);

  ctx.drawImage(_baseline, 0, 0);

  ctx.rotate(-0.10);

  const fSize = 40;
  const uname_w = Picto.popOutTxt(ctx, Target.username, XYZ.uname.x - 10, XYZ.uname.y + 00, `${fSize}pt 'Panton Black','Corporate Logo Rounded' `, "#FFF", 400, { style: "#1f1d25", line: 14 }).w;
  Picto.popOutTxt(ctx, `#${Target.discriminator}`, XYZ.uname.x + uname_w - 30, XYZ.uname.y + 20, "24pt 'Panton Light'", "#FFF", 100, { style: "#1f1d25", line: 8 }).w;
  ctx.rotate(0.10);

  Picto.setAndDraw(ctx, Picto.tag(ctx, $t("keywords.lootbox", P), "400 22pt 'Panton'", "#FFF"), XYZ.LBX.x, XYZ.LBX.y, XYZ.LBX.w, "right");
  Picto.setAndDraw(ctx, Picto.tag(ctx, $t("keywords.boosterpack", P), "400 22pt 'Panton'", "#FFF"), XYZ.BPK.x, XYZ.BPK.y, XYZ.BPK.w, "right");
  Picto.setAndDraw(ctx, Picto.tag(ctx, $t("keywords.consumable", P), "400 22pt 'Panton'", "#FFF"), XYZ.CSM.x, XYZ.CSM.y, XYZ.CSM.w, "left");

  Picto.setAndDraw(ctx, Picto.tag(ctx, $t("keywords.material", P), "400 22pt 'Panton'", "#FFF"), XYZ.MTL.x, XYZ.MTL.y, XYZ.MTL.w, "left");
  Picto.setAndDraw(ctx, Picto.tag(ctx, $t("keywords.key", P), "400 22pt 'Panton'", "#FFF"), XYZ.KEY.x, XYZ.KEY.y, XYZ.KEY.w, "right");
  Picto.setAndDraw(ctx, Picto.tag(ctx, $t("keywords.junk", P), "400 22pt 'Panton'", "#FFF"), XYZ.JNK.x, XYZ.JNK.y, XYZ.JNK.w, "left");

  types = {};
  userData.modules.inventory.forEach((itm) => {
    let itemType;
    try {
      itemType = itemData.find((i) => (itm.id || itm) == i.id).type || "other";
    } catch (err) {
      console.error(`${" BAD INVENTORY ITEM ".bgRed} ${itm} - ${err.message.red}${" inventory.js :80".yellow}`);

      itemType = "other";
    }
    if (!types[itemType]) types[itemType] = 0;
    types[itemType] += (itm.count || 0);
  });

  const a_csm = xlr99(types.consumable || 0, "L");
  const a_key = xlr99(types.key || 0);
  const a_mtl = xlr99(types.material || 0);
  const a_jnk = xlr99(types.junk || 0);
  const a_bpk = xlr99(types.boosterpack || 0, "L");
  const a_lbx = xlr99(types.box || 0, "L");

  function xlr99(x, LR = "R") {
    x = LR === "R" ? x > 99 ? "+99" : x
      : x > 99 ? "99+" : x;
    return x;
  }

  const a_bg = userData.modules.bgInventory.length;
  const a_md = userData.modules.medalInventory.length;
  const a_st = userData.modules.stickerInventory.length;
  const a_fl = userData.modules.flairsInventory.length;

  ctx.globalAlpha = 0.7;
  Picto.setAndDraw(ctx, Picto.tag(ctx, a_st, "600 18pt 'Panton'", "#FFF"), XYZ.mST.x, XYZ.mST.y, 100, "right");
  Picto.setAndDraw(ctx, Picto.tag(ctx, a_fl, "600 18pt 'Panton'", "#FFF"), XYZ.mFL.x, XYZ.mFL.y, 100, "right");
  Picto.setAndDraw(ctx, Picto.tag(ctx, a_md, "600 18pt 'Panton'", "#FFF"), XYZ.mMD.x, XYZ.mMD.y, 100, "right");
  Picto.setAndDraw(ctx, Picto.tag(ctx, a_bg, "600 18pt 'Panton'", "#FFF"), XYZ.mBG.x, XYZ.mBG.y, 100, "right");
  ctx.globalAlpha = 1;

  Picto.setAndDraw(ctx, Picto.tag(ctx, a_jnk, "100 20pt 'Panton Light'", "#FFF"), XYZ.JNK.x + 180, XYZ.JNK.y, XYZ.JNK.w, "right");
  Picto.setAndDraw(ctx, Picto.tag(ctx, a_mtl, "100 20pt 'Panton Light'", "#FFF"), XYZ.MTL.x + 180, XYZ.MTL.y, XYZ.MTL.w, "right");
  Picto.setAndDraw(ctx, Picto.tag(ctx, a_csm, "100 20pt 'Panton Light'", "#FFF"), XYZ.CSM.x + 180, XYZ.CSM.y, XYZ.CSM.w, "right");
  Picto.setAndDraw(ctx, Picto.tag(ctx, a_key, "100 24pt 'Panton Light'", "#FFF"), XYZ.KEY.x - 200, XYZ.KEY.y, XYZ.KEY.w, "left");
  Picto.setAndDraw(ctx, Picto.tag(ctx, a_bpk, "100 24pt 'Panton Light'", "#FFF"), XYZ.BPK.x - 200, XYZ.BPK.y, XYZ.BPK.w, "left");
  Picto.setAndDraw(ctx, Picto.tag(ctx, a_lbx, "100 24pt 'Panton Light'", "#FFF"), XYZ.LBX.x - 200, XYZ.LBX.y, XYZ.LBX.w, "left");


  const inventoryButtons = [
    [
      { style: 2, label: ""??"MATERIAL", custom_id: `invButton:MATERIAL:${msg.author.id}`, emoji: {id: _emoji("MATERIAL").id}},
      { style: 2, label: ""??"CONSUMABLE", custom_id: `invButton:CONSUMABLE:${msg.author.id}`, emoji: {id: _emoji("CONSUMABLE").id}},
      { style: 2, label: ""??"JUNK", custom_id: `invButton:JUNK:${msg.author.id}`, emoji: {id: _emoji("JUNK").id}},
      { style: 2, label: ""??"LOOTBOX", custom_id: `invButton:LOOTBOX:${msg.author.id}`, emoji: {id: _emoji("LOOTBOX").id}},
      { style: 2, label: ""??"BOOSTER", custom_id: `invButton:BOOSTER:${msg.author.id}`, emoji: {id: _emoji("BOOSTER").id}},
    ],[
      { style: 2, label: ""??"KEY", custom_id: `invButton:KEY:${msg.author.id}`, emoji: {id: _emoji("KEY").id}},
    //],[
      { style: 2, custom_id: `invButton:CLOSE:${msg.author.id}`, disabled: true, emoji: {id: _emoji("__").id}},
      { style: 2, custom_id: `invButton:CLOSE:${msg.author.id}`, disabled: true, emoji: {id: _emoji("__").id}},
      { style: 2, custom_id: `invButton:CLOSE:${msg.author.id}`, disabled: true, emoji: {id: _emoji("__").id}},
      { style: 4, label: ""??"CLOSE", custom_id: `invButton:CLOSE:${msg.author.id}`, emoji: {id: _emoji("nope").id}},
    ]
  ];

  let invbuts = await msg.setButtons(inventoryButtons,1);
  console.log({invbuts});
  

  menumes = await msg.channel.send({
    components: msg.setButtons(inventoryButtons,1)
  }, file(canvas.toBuffer(), "inventory.png"));
  menumes.target = Target;
  args[10] = userData;
  args[11] = msg.prefix;
  args[12] = msg;
  INVOKERS.set(msg.author.id, menumes.id);
  return menumes;
  // menumes.addReaction(_emoji("LOOTBOX").replace(/(\<:|\>)/g,'') )
  // menumes.addReaction(_emoji("BOOSTER").replace(/(\<:|\>)/g,'') )
  // menumes.addReaction(_emoji("CONSUMABLE").replace(/(\<:|\>)/g,'') )
  // menumes.addReaction(_emoji("MATERIAL").replace(/(\<:|\>)/g,'') )
  // menumes.addReaction(_emoji("KEY").replace(/(\<:|\>)/g,'') )
  // menumes.addReaction(_emoji("JUNK").replace(/(\<:|\>)/g,'') )
};



module.exports = {
  init,
  pub: true,
  cmd: "inventory",
  perms: 3,
  cat: "inventory",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: ["inv"],
  /*
  reactionButtons: [
    {
      emoji: _emoji("LOOTBOX").reaction,
      type: "edit",
      response: require("./lootbox.js").init,
      filter: (msg, emj, uid) => INVOKERS.get(uid) === msg.id && msg.removeReaction(emj, uid),

    }, {
      emoji: _emoji("BOOSTER").reaction,
      type: "edit",
      response: require("./boosterpack.js").init,
      filter: (msg, emj, uid) => INVOKERS.get(uid) === msg.id && msg.removeReaction(emj, uid),

    }, {
      emoji: _emoji("KEY").reaction,
      type: "edit",
      response: require("./key.js").init,
      filter: (msg, emj, uid) => INVOKERS.get(uid) === msg.id && msg.removeReaction(emj, uid),

    }, {
      emoji: _emoji("MATERIAL").reaction,
      type: "edit",
      response: require("./material.js").init,
      filter: (msg, emj, uid) => INVOKERS.get(uid) === msg.id && msg.removeReaction(emj, uid),

    }, {
      emoji: _emoji("CONSUMABLE").reaction,
      type: "edit",
      response: require("./consumable.js").init,
      filter: (msg, emj, uid) => INVOKERS.get(uid) === msg.id && msg.removeReaction(emj, uid),

    }, {
      emoji: _emoji("JUNK").reaction,
      type: "edit",
      response: require("./junk.js").init,
      filter: (msg, emj, uid) => INVOKERS.get(uid) === msg.id && msg.removeReaction(emj, uid),

    }, {
      emoji: "❌",
      type: "cancel",
      filter: (msg, emj, uid) => INVOKERS.get(uid) === msg.id && msg.removeReaction(emj, uid),

    },
  ],*/
  reactionButtonTimeout: 30e3,
  postCommand: (m, a, r) => setTimeout(() => INVOKERS.delete(m.author.id), 32e3),
};


PLX.on("inventoryButton", async(int,data)=>{
  console.log({data})
  let destination;
  if (data.custom_id.includes("LOOTBOX") ) destination = require("./lootbox.js").init;
  if (data.custom_id.includes("BOOSTER") ) destination = require("./boosterpack.js").init;
  if (data.custom_id.includes("KEY") ) destination = require("./key.js").init;
  if (data.custom_id.includes("MATERIAL") ) destination = require("./material.js").init;
  if (data.custom_id.includes("CONSUMABLE") ) destination = require("./consumable.js").init;
  if (data.custom_id.includes("JUNK") ) destination = require("./junk.js").init;

  const fakeMsg = Object.assign({}, int.message, {
    author: await PLX.resolveUser(int.userID)
  })
let args = [];
args[10] = int.userID;
  const payload = await destination(fakeMsg,args ,int.userID);

  console.log({payload})
  int.ack();
  let stashComponents;
  if (payload.components) {
    stashComponents = payload.components;
    payload.components = undefined;
  }

  int.message.edit( payload ).then(m=>{
    if (stashComponents) m.addButtons(stashComponents[0].components,2);
    else int.message.removeComponentRow(2);
  });

})