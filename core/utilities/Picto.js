const π = Math.PI;
const Canvas = require("canvas");
const OGCanvas = require("canvas");
const wrap = require("./canvaswrapper");
const { fillTextWithTwemoji } = require("node-canvas-with-twemoji");
const StackBlur = require('stackblur-canvas');
const KnownErrors = new Map();

function RGBstring(rgbColor) {
  rgbColor = (rgbColor || "#F55595").replace(/\s/g, "");
  const arrRGB = new Array(3);
  if (rgbColor.indexOf("rgb") > -1) {
    const colorReg = /\s*\d+,\s*\d+,\s*\d+/i;
    const t = colorReg.exec(rgbColor)[0].split(",");
    for (let i = 0; i < arrRGB.length; i += 1) {
      arrRGB[i] = t[i];
    }
  } else if (rgbColor.indexOf("#") > -1) {
    if (rgbColor.length > 4) {
      let j = 1;
      for (let i = 0; i < arrRGB.length; i += 1) {
        arrRGB[i] = parseInt(rgbColor.substr(i + j, 2), 16);
        j += 1;
      }
    } else {
      for (let i = 0; i < arrRGB.length; i += 1) {
        let t = rgbColor.substr(i + 1, 1);
        t += t;
        arrRGB[i] = parseInt(t, 16);
      }
    }
  }
  return arrRGB.join(",");
}

function unshitify(text){
  return text?.toString()?.replace(/[\u032A-\u034A\u20D0-\u20FF]/g,"");
}

const blur = function Blur(rad = 10, x = 0, y = 0, w, h) {
  w = w || this.canvas.width;
  h = h || this.canvas.height;
  return StackBlur.canvasRGB(this.canvas, x, y, w, h, rad);
}

module.exports = {
  new: function newPicto(w = 800, h = 600) {
    const canvas = Canvas.createCanvas(w,h);
    const c = canvas.getContext("2d");
    c.antialias = "subpixel";
    c.filter = "best";
    c.blur = blur;
    return canvas;
  },

  getCanvas: function getCanvas(img_path,fallback_url="") {
    return Canvas.loadImage(img_path).catch((err) => {
      return Canvas.loadImage(fallback_url).catch(err=> {  
      let errorMsg = "• ".red + (img_path.toString().replace("undefined", "?")).split('/').map(w => w.includes('.') ? w.yellow : w).join("/") + " not loaded.".gray;

      if (!KnownErrors.get(errorMsg)) {
        console.error(errorMsg);
        KnownErrors.set(errorMsg, 1);
      }

      const canvas = Canvas.createCanvas(250, 250);
      const c = canvas.getContext("2d");
      c.fillStyle = "#F0F";
      c.fillRect(0, 0, 250, 250);
      c.blur = blur;
      canvas.failed = true;
      return canvas;
    });
    });
  },

  getFullCanvas: function getCanvas(...args) {
    return Canvas.loadImage(...args).catch((err) => {
      console.error(...args);
      throw new Error(err);
    }).then((img) => {
      const canvas = Canvas.createCanvas(img.width, img.height);
      const c = canvas.getContext("2d");
      c.blur = blur;
      c.drawImage(img, 0, 0);
      return canvas;
    });
  },

  tag: function tag(ctx, text, font = "14px", color = "#b4b4b8", stroke) {
    text = unshitify(text);
    const ogc = OGCanvas.createCanvas(100,100);
    const ogcctx = ogc.getContext("2d");

    ogcctx.font = `${font}, "Quicksand", "DX아기사랑B", "Corporate Logo Rounded", sans-serif`.trim();
    ctx.font = `${font}, "Quicksand", "DX아기사랑B", "Corporate Logo Rounded", sans-serif`.trim();


    const H = ogcctx.measureText(text).emHeightAscent;
    const h = ogcctx.measureText(text).emHeightDescent + (stroke ? stroke.line : 0);
    let w = ogcctx.measureText(text).width + (stroke ? stroke.line : 0);

    if (font.toLowerCase().includes("italic")) w += ((w / text?.length||1) * 0.32);

    const item = Canvas.createCanvas(w, h + H);
    const c = item.getContext("2d");

    c.font = ctx.font;
    if (stroke) {
      c.strokeStyle = stroke.style;
      c.lineWidth = stroke.line;
      c.strokeText(text, 1 + stroke.line / 2, H + stroke.line / 2);
    }
    c.fillStyle = color;
    c.fillText(
      text,
      1 + (stroke ? stroke.line / 2 : 0),
      H + (stroke ? stroke.line / 2 : 0),
    );

    return { item, height: h + H, width: w }; // legacy
  },

  tagMoji: async function tagmoji(ctx, text, font = "14px", color = "#b4b4b8", stroke) {
    text = unshitify(text);
    const ogc = OGCanvas.createCanvas(100,100);
    const ogcctx = ogc.getContext("2d");

    ogcctx.font = `${font}, "Quicksand", "DX아기사랑B", "Corporate Logo Rounded", sans-serif`.trim();
    ctx.font = `${font}, "Quicksand", "DX아기사랑B", "Corporate Logo Rounded", sans-serif`.trim();

    text = text?.toString();
    const H = ogcctx.measureText(text).emHeightAscent;
    const h = ogcctx.measureText(text).emHeightDescent + (stroke ? stroke.line : 0);
    let w = ogcctx.measureText(text).width + (stroke ? stroke.line : 0);

    if (font.toLowerCase().includes("italic")) w += ((w / text.length) * 0.32);

    const item = Canvas.createCanvas(w, 1.1 * (h + H));
    const c = item.getContext("2d");
    c.font = ctx.font;

    if (stroke) {
      c.strokeStyle = stroke.style;
      c.lineWidth = stroke.line;
      c.strokeText(text, 1 + stroke.line / 2, H + stroke.line / 2);
    }
    c.fillStyle = color;
    await fillTextWithTwemoji(c,
      text,
      1 + (stroke ? stroke.line / 2 : 0),
      H + (stroke ? stroke.line / 2 : 0) + ((h + H) * 0.1), { maxWidth: w });

    return { item, height: h + H, width: w }; // legacy
  },

  block2: function block(ctx, text, font = "14px", color = "#b4b4b8", W = 300, H = 200, options = {}) {
    text = unshitify(text);
    
    const item = Canvas.createCanvas(W,H);
    const c = item.getContext("2d");
    c.antialias = "subpixel";
    c.filter = "best";
    c.font = (`${font}, "Quicksand", "DX아기사랑B", "Corporate Logo Rounded", sans-serif`).trim();
    
    const { stroke } = options;

    if (stroke) {
      c.strokeStyle = stroke.style;
      c.lineWidth = stroke.line;
    }

    c.fillStyle = color;   
 
    c.textWrap = true;
    const initialH = ~~(1+c.measureText(text).fontBoundingBoxAscent);
    console.log(c.font);
    c.font = `${font}, "Quicksand", "DX아기사랑B", "Corporate Logo Rounded", sans-serif`.trim();
    
    console.log(c.font);
    if (stroke) c.strokeText( text, 0, initialH, W );
    c.fillText( text, 0, initialH, W );

    return { item, height: H, width: W };
  },

  block: function block(ctx, text, font = "14px", color = "#b4b4b8", W = 300, H = 200, options = {}) {
    text = unshitify(text);
    ctx.font = `${font}, "Quicksand", "DX아기사랑B", "Corporate Logo Rounded", sans-serif`.trim();

    console.log(font,'---',ctx.font,{options})

    const item = Canvas.createCanvas(W,H);
    const c = item.getContext("2d");
    c.antialias = "subpixel";
    c.filter = "best";
    c.font = ctx.font;

    const { stroke } = options;

    if (stroke) {
      c.strokeStyle = stroke.style;
      c.lineWidth = stroke.line;
    }
    c.fillStyle = color;
    console.log({font},ctx.font)

    options = {
      strokeText: !!stroke,
      font: ctx.font || "bold 25px Quicksand, sans-serif",
      textAlign: "left",
      verticalAlign: "top",
      lineBreak: "auto",
      ...options,
    };

    wrap(item, text, options);
    return { item, height: H, width: W }; // legacy
  },

  avgColor: async function avgColor(link, blockSize = 5) {
    let imgEl;
    try {
      imgEl = await Canvas.loadImage(link);
    } catch (err) {
      console.error(err);
      return 0;
    }
    if (!imgEl || !imgEl.width) return "#2b2b3b";

    const canvas = Canvas.createCanvas(imgEl.width, imgEl.height);
    const c = canvas.getContext("2d");
    const width = imgEl.naturalWidth || imgEl.offsetWidth || imgEl.width;
    const height = imgEl.naturalHeight || imgEl.offsetHeight || imgEl.height;
    let i = -4;
    const rgb = { r: 0, g: 0, b: 0 };
    let count = 0;

    canvas.height = height;
    canvas.width = width;

    c.drawImage(imgEl, 0, 0);

    const { data } = c.getImageData(0, 0, width, height);

    const { length } = data;

    i += (blockSize * 4);
    while (i < length) {
      count += 1;
      rgb.r += data[i];
      rgb.g += data[i + 1];
      rgb.b += data[i + 2];
      i += (blockSize * 4);
    }

    rgb.r = ~(rgb.r / count);
    rgb.g = ~~(rgb.g / count);
    rgb.b = ~~(rgb.b / count);

    return (
      `#${(`0${parseInt(rgb.r, 10).toString(16)}`).slice(-2)
      }${(`0${parseInt(rgb.g, 10).toString(16)}`).slice(-2)
      }${(`0${parseInt(rgb.b, 10).toString(16)}`).slice(-2)}`
    );
  },

  roundRect: function roundRect(
    ctx,
    x = 0,
    y = 0,
    width = 10,
    height = 10,
    radius = 5,
    fill,
    stroke = false,
    lineWidth = 3,
  ) {
    if (typeof radius === "number") {
      radius = {
        tl: radius, tr: radius, br: radius, bl: radius,
      };
    } else {
      const defaultRadius = {
        tl: 0, tr: 0, br: 0, bl: 0,
      };
      Object.keys(defaultRadius).forEach((side) => { radius[side] = radius[side] || defaultRadius[side]; });
    }

    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radius.br,
      y + height,
    );
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    if (fill && typeof fill === "object" && !(fill instanceof Canvas.CanvasGradient)) {
      ctx.save();
      ctx.clip();
      ctx.drawImage(fill, x, y, width, height);
      ctx.closePath();
      ctx.restore();
    } else {
      ctx.closePath();
    }

    if (fill && typeof fill === "string") {
      ctx.fillStyle = fill;
      ctx.fill();
    }

    if (stroke) {
      ctx.strokeStyle = typeof stroke === "string" ? stroke : ctx.strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  },

  setAndDraw: function setAndDraw(ct, img, x, y, maxW = 300, align = "left") {
    let w = img.w || img.width;
    w = w > maxW ? maxW : w;

    if (align === "left") {
      ct.drawImage(img.item, x, y, w, img.height);
    }
    if (align === "center") {
      ct.drawImage(img.item, x - w / 2, y, w, img.height);
    }
    if (align === "right") {
      ct.drawImage(img.item, x - w, y, w, img.height);
    }
  },

  XChart: async function XChart(
    size,
    pcent,
    color = "#2b2b3b",
    pic,
    lvthis,
    term = "level",
    font,
  ) {
    const canvas = Canvas.createCanvas(size, size);
    const ctx = canvas.getContext("2d");
    const rx = size / 2; const
      ry = rx;

    function pToR(p) {
      const r = ((p * 2) % 2) + 1.5;
      if (r >= 0 && r <= 2) return r;
      return Math.abs((2 - r) % 2);
    }

    const startR = (π * 3) / 2;
    let endR = pToR(pcent) * π;
    if (pcent === "1") endR = (π * 7) / 2;
    function arcDraw(r, clr) {
      ctx.beginPath();
      ctx.arc(rx, ry, r, startR, endR, false);
      ctx.fillStyle = clr;
      ctx.lineTo(rx, ry);
      ctx.closePath();
      ctx.fill();
    }
    canvas.width = size;
    canvas.height = size;

    ctx.beginPath();
    ctx.arc(rx, ry, rx - 5, 0, π * 2, true);
    ctx.strokeStyle = `rgba(${RGBstring(color)},0.25)`;
    ctx.lineWidth = 4;
    ctx.stroke();
    arcDraw(rx - 0, color);

    ctx.beginPath();
    ctx.arc(rx, ry, rx - 7, 0, π * 2, false);
    ctx.fillStyle = "#FFF";
    ctx.lineTo(rx, ry);
    ctx.closePath();
    ctx.fill();

    if (pic) {
      ctx.clip();
      const a = await Canvas.loadImage(pic);
      ctx.drawImage(a, 0, 0, size, size);
      ctx.restore();
    }

    ctx.fillStyle = "rgba(255,255,255,.5)";
    ctx.fill();
    ctx.fillStyle = "color";

    ctx.font = (font || "900 18px Panton").trim();

    const t = `${(pcent * 100).toFixed(0)}%`;
    const WW = ctx.measureText(`${t}%`).width;
    ctx.fillText(t, size / 2 + 15 - WW / 2, size - 15);

    const label = this.tag(ctx, term.toUpperCase(), undefined, "#222");
    lvthis = lvthis > 999 ? miliarize(lvthis, undefined, " ") : lvthis;
    const tg = this.tag(ctx, lvthis, "900 56px 'Panton Black'", "#363636");

    const f = 0.8;
    const lx = size / 2 - label.width / 2 / f;
    const lh = label.height / f;
    const lw = label.width / f;
    let tW = tg.width;
    if (tW > size) tW = size - 12;
    const x = size / 2 - tW / 2;
    const y = size / 2 - tg.height / 2 + 7;

    ctx.drawImage(label.item, lx, 15, lw, lh);
    ctx.drawImage(tg.item, x, y, tW, tg.height);

    return canvas;
  },

  makeHex: async function Hex(size, picture, color = "#FFF") {
    size /= 2;
    const x = size + 10;
    const y = -size;

    const hex = Canvas.createCanvas(size * 2 + 20, size * 2 + 20);
    const c = hex.getContext("2d");
    c.rotate(1.57);
    c.save();
    c.beginPath();
    c.moveTo(x + size * Math.cos(0), y + size * Math.sin(0));

    for (side = 0; side < 7; side += 1) {
      c.lineTo(
        x + size * Math.cos((side * 2 * Math.PI) / 6),
        y + size * Math.sin((side * 2 * Math.PI) / 6),
      );
    }

    c.fillStyle = color;
    c.fill();
    if (picture) {
      c.clip();
      const a = await Canvas.loadImage(picture);
      c.rotate(-1.57);
      c.drawImage(a, 0, x - size, size * 2, size * 2);
      c.restore();

      c.globalCompositeOperation = "xor";

      c.shadowOffsetX = 0;
      c.shadowOffsetY = 0;
      c.shadowBlur = 10;
      c.shadowColor = "rgba(30,30,30,1)";

      c.beginPath();
      for (side = 0; side < 7; side += 1) {
        c.lineTo(
          x + size * Math.cos((side * 2 * Math.PI) / 6),
          y + size * Math.sin((side * 2 * Math.PI) / 6),
        );
      }
      c.stroke();
      c.stroke();
      c.stroke();

      c.globalCompositeOperation = "destination-atop";
    } else {
      c.shadowColor = "rgba(34, 31, 59, 0.57)";
      c.shadowBlur = 8;
    }
    c.fill();

    return hex;
  },

  makeRound: async function makeRound(size, pic) {
    const rx = size / 2; const
      ry = rx;
    const canvas = Canvas.createCanvas(size, size);
    const ctx = canvas.getContext("2d");

    const color = "#FFF";

    canvas.width = size;
    canvas.height = size;

    ctx.beginPath();
    ctx.arc(rx, ry, rx + 0, 0, π * 2, true);
    ctx.strokeStyle = `rgba(${color},0.25)`;
    ctx.lineWidth = 4;

    ctx.fillStyle = "#FFF";
    ctx.lineTo(rx, ry);
    ctx.closePath();
    ctx.fill();
    if (pic) {
      ctx.clip();
      const a = await Canvas.loadImage(pic);
      ctx.drawImage(a, 0, 0, size, size);
      ctx.restore();
    }

    return canvas;
  },
  circle: this.makeRound,

  popOutTxt: function popOutTxt(ctx,TXT,X = 0,Y = 0,font,color,maxWidth = 0,stroke = { style: "#1b1b2b", line: 10 },shadow = 0,) {
    TXT = unshitify(TXT);
    shadow = shadow || stroke.line / 2 - 1;
    stroke.style = stroke.style || "#1b1b2b";
    stroke.line = stroke.line || 10;
    const FONT = (font || ctx.font || "20pt 'Corporate Logo Rounded'").trim();
    let ctx_2 = this.tag(ctx, TXT, FONT, stroke.style, stroke);
    ctx.drawImage(
      ctx_2.item, X, Y,
      maxWidth && ctx_2.width > maxWidth ? maxWidth : ctx_2.width,
      ctx_2.height,
    );
    ctx_2 = this.tag(ctx, TXT, FONT, color, stroke);
    ctx.drawImage(
      ctx_2.item,
      X - shadow,
      Y - shadow,
      maxWidth && ctx_2.width > maxWidth ? maxWidth : ctx_2.width,
      ctx_2.height,
    );
    return {
      w:
        maxWidth && ctx_2.width > maxWidth
          ? maxWidth
          : ctx_2.width + stroke.line + shadow + 2,
      text: TXT,
    };
  },
};
