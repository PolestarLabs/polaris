// const gear = require('../../utilities/Gearbox')
const Picto = require("../../utilities/Picto");
// const locale = require(appRoot+'/utils/i18node');
// const $t = locale.getT();
// const DB = require("../../database/db_ops");
const userDB = DB.users;
const serverDB = DB.servers;

const xp_to_level = (xp, A, B) => ~~Math.sqrt((xp * B) / A);
const level_to_xp = (lv, A, B) => A * Math.pow(lv, 2) / B;

const cmd = "level";

function XPercent(x, l, fa, fb) {
  let exptoNex; let
    exptoThis;

  if (fa === "OLD") {
    const f = 0.0427899;
    exptoNex = Math.trunc(Math.pow((l + 1) / f, 2));
    exptoThis = Math.trunc(Math.pow(l / f, 2));
  } else {
    exptoNex = level_to_xp(l + 1, fa, fb);
    exptoThis = level_to_xp(l, fa, fb);
  }

  const frameofact = exptoNex - exptoThis;
  const levelcoverage = x - exptoThis;
  const percent = levelcoverage / frameofact;
  return percent;
}

const init = async function (msg) {
  const canvas = Picto.new(220, 100);
  const ctx = canvas.getContext("2d");

  const P = { lngs: msg.lang };
  const v = {
    LEVEL: $t("website.level", P),
    GLOBAL: $t("website.global", P),
    SERVER: $t("discord.server", P),
  };

  const Server = msg.guild;

  const Target = await PLX.getTarget(msg.args[0]) || msg.author;
  if (!Target) return msg.channel.send($t("responses.errors.kin404", P));
  const TARGET_DB = await userDB.findOne({ id: Target.id });
  const SV_DB = await serverDB.findOne({ id: Server.id });

  const favcolor = TARGET_DB.modules.favcolor || "#eb11da";

  let avi = Target.displayAvatarURL;
  const propic = avi.replace(/gif/g, "png");
  avi = Server.iconURL;
  const serpic = typeof avi === "string" ? avi.replace(/jpg/g, "png") : false;

  const exp = TARGET_DB.modules.exp || 0;
  const level = TARGET_DB.modules.level || 0;

  const percent = XPercent(exp, level, "OLD");

  const SVFAC = SV_DB?.progression || { upfactorA: 280, upfactorB: 9 };

  let l_exp;
  let l_level;
  let l_exptoNex;
  let l_exptoThis;
  let l_frameofact;
  let l_percent;

  try {
    l_exp = (await DB.localranks.get({ user: Target.id, server: msg.guild.id })).exp || 0;
    l_level = (await DB.localranks.get({ user: Target.id, server: msg.guild.id })).level || 0;

    l_percent = XPercent(l_exp, l_level, SVFAC.upfactorA, SVFAC.upfactorB);
  } catch (e) {
    l_exp = 0;
    l_level = 0;
    l_frameofact = 0;
    l_percent = 0;
  }

  async function XChart(size, pcent, colorX, pic, lvthis, tx) {
    const color = TColor(colorX);
    const pi = Math.PI;
    const startR = pi * 3 / 2; let
      endR = pToR(pcent) * pi;
    if (pcent === "1") { endR = pi * 7 / 2; }
    const rx = size / 2; const
      ry = rx;
    const canvas_proto = Picto.new(size, size);
    const context = canvas_proto.getContext("2d");
    function TColor(rgbColor) {
      rgbColor = rgbColor.replace(/\s/g, "");
      const arrRGB = new Array(3);
      if (rgbColor.indexOf("rgb") > -1) {
        const colorReg = /\s*\d+,\s*\d+,\s*\d+/i;
        const t = colorReg.exec(rgbColor)[0].split(",");
        for (let i = 0; i < arrRGB.length; i++) {
          arrRGB[i] = t[i];
        }
      } else if (rgbColor.indexOf("#") > -1) {
        if (rgbColor.length > 4)// "#fc0,#ffcc00"
        {
          let j = 1;
          for (let i = 0; i < arrRGB.length; i++) {
            arrRGB[i] = parseInt(rgbColor.substr(i + j, 2), 16);
            j += 1;
          }
        } else {
          for (let i = 0; i < arrRGB.length; i++) {
            let t = rgbColor.substr(i + 1, 1);
            t += t;
            arrRGB[i] = parseInt(t, 16);
          }
        }
      }
      return arrRGB.join(",");
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
    context.strokeStyle = `rgba(${color},0.25)`;
    context.lineWidth = 4;
    context.stroke();
    arcDraw(rx - 0, `rgba(${color},1)`);

    context.beginPath();
    context.arc(rx, ry, rx - 7, 0, pi * 2, false);
    context.fillStyle = "rgba(255,255,255,1)";
    context.lineTo(rx, ry);
    context.closePath();
    context.fill();

    if (pic) {
      context.clip();
      const picture = await Picto.getCanvas(pic);
      context.drawImage(picture, 0, 0, size, size);
      context.restore();
    }

    context.fillStyle = "rgba(255,255,255,.5)";
    context.fill();
    context.fillStyle = `rgba(${color},1)`;

    context.font = "900 14px 'Whitney HTF'";

    const t = `${(pcent * 100).toFixed(0)}%`;
    const WW = context.measureText(`${t}%`).width;
    context.fillText(t, size / 2 + 15 - WW / 2, size - 15);

    const label = await Picto.tag(context, tx || v.LEVEL.toUpperCase(), "900 10px WhitneyHTF-Black", "#222");
    const tg = await Picto.tag(context, lvthis, "900 50px 'Whitney HTF'", "#363636");

    const f = 0.8;
    const lx = (size / 2) - (label.width / 2 / f);
    const ly = (size / 2) - (label.height * 1.5);
    const lh = label.height / f;
    const lw = label.width / f;

    const x = (size / 2) - (tg.width / 2);
    const y = (size / 2) - (tg.height / 2);

    await context.drawImage(label.item, lx, 15, lw, lh);
    await context.drawImage(tg.item, x, y, tg.width, tg.height);

    return canvas_proto;
  }

  const global_roundel = await XChart(100, percent, favcolor || "#dd5383", propic, level, v.GLOBAL);
  const local_roundel = await XChart(100, l_percent, Server.member(Target)?.displayHexColor || "#9459af", serpic || false, l_level, v.SERVER);

  ctx.drawImage(local_roundel, 0, 0);
  ctx.drawImage(global_roundel, 120, 0);

  await msg.channel.send("", file(await canvas.toBuffer(), "leveli.png"));
};

module.exports = {
  pub: true, cmd, perms: 3, init, cat: "misc", aliases: [ "lv", "lvl" ],
};
