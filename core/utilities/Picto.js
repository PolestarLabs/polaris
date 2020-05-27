const π = Math.PI;
const Canvas = require('canvas');
const wrap = require('canvas-text-wrapper').CanvasTextWrapper;

module.exports = {
  new: function newPicto(w = 800, h = 600) {
    const canvas = new Canvas.createCanvas(w, h);
    let c = canvas.getContext("2d");
        c.antialias = "subpixel";
        c.filter = "best";
    return canvas;
  },

  getCanvas: Canvas.loadImage,

  tag: function tag(ctx, text, font="14px", color="#b4b4b8", stroke) {
    ctx.font = `${font}, "Product Sans", "DX아기사랑B", "Corporate Logo Rounded", sans-serif`;     

    let H = ctx.measureText(text).emHeightAscent;
    let h = ctx.measureText(text).emHeightDescent + (stroke ? stroke.line : 0);
    let w = ctx.measureText(text).width + (stroke ? stroke.line : 0);
    
    const item = new Canvas.createCanvas(w, h + H);
    let c = item.getContext("2d");

    c.font = ctx.font;
    if (stroke) {
      c.strokeStyle = stroke.style;
      c.lineWidth   = stroke.line;
      c.strokeText(text, 1 + stroke.line / 2, H + stroke.line / 2);
    }
    c.fillStyle = color;
    c.fillText(
      text,
      1 + (stroke ? stroke.line / 2 : 0),
      H + (stroke ? stroke.line / 2 : 0)
    );

    return { item, height: h + H, width: w }; // legacy
  },

  block: function block(ctx, text, font="14px", color="#b4b4b8", W=300, H=200, options={}) {
    ctx.font = `${font}, "Product Sans", "DX아기사랑B", "Corporate Logo Rounded", sans-serif`; 

    const item = new Canvas.createCanvas(W, H);
    let c = item.getContext("2d");
    c.antialias = "subpixel";
    c.filter = "best";
    c.font = font;
    c.fillStyle = color;

    options = Object.assign(
      {
        font: font || "bold 25px Quicksand, sans-serif",
        textAlign: "left",
        verticalAlign: "top",
        lineBreak: "auto",
      },
      options
    );

    wrap(item, text, options);
    return { item, height: H, width: W };  // legacy
  },

  avgColor: async function avgColor(link,blockSize = 5) {

    imgEl = await  Canvas.loadImage(link);
    if(!imgEl || !imgEl.width) return "#2b2b3b";
    
    const canvas = new Canvas.createCanvas(imgEl.width, imgEl.height);
    let c = canvas.getContext("2d"),
        width,
        height,
        i = -4,
        length,
        rgb = { r: 0, g: 0, b: 0 },
        count = 0;   

    height = canvas.height =
      imgEl.naturalHeight || imgEl.offsetHeight || imgEl.height;
    width = canvas.width =
      imgEl.naturalWidth || imgEl.offsetWidth || imgEl.width;

    c.drawImage(imgEl, 0, 0);
    
    const {data} = c.getImageData(0, 0, width, height); 

    length = data.length;

    while ((i += blockSize * 4) < length) {
      ++count;
      rgb.r += data[i];
      rgb.g += data[i + 1];
      rgb.b += data[i + 2];
    }

    rgb.r = ~~(rgb.r / count);
    rgb.g = ~~(rgb.g / count);
    rgb.b = ~~(rgb.b / count);

    return (
      "#" +
      ("0" + parseInt(rgb.r, 10).toString(16)).slice(-2) +
      ("0" + parseInt(rgb.g, 10).toString(16)).slice(-2) +
      ("0" + parseInt(rgb.b, 10).toString(16)).slice(-2)
    );
  },

  roundRect: function roundRect(
    ctx,
    x = 0,
    y = 0,
    width = 10,
    height = 10,
    radius = 5,
    fill = "#FFF",
    stroke = false
  ) {
    if (typeof radius === "number") {
      radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
      let defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
      for (side in defaultRadius) {
        radius[side] = radius[side] || defaultRadius[side];
      }
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
      y + height
    );
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    if (fill && typeof fill == "object") {
      ctx.save();
      ctx.clip();
      ctx.drawImage(fill, x, y, width, height);
      ctx.closePath();
      ctx.restore();
    } else {
      ctx.closePath();
    }

    if (fill && typeof fill == "string") {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      typeof stroke == "string" ? (ctx.strokeStyle = stroke) : false;
      ctx.stroke();
    }
  },

  setAndDraw: function setAndDraw(ct, img, x, y, maxW = 300, align = "left") {
    let w = img.width;
        w = w > maxW ? maxW : w;

    if (align == "left") {
      ct.drawImage(img.item, x, y, w, img.height);
    }
    if (align == "center") {
      ct.drawImage(img.item, x - w / 2, y, w, img.height);
    }
    if (align == "right") {
      ct.drawImage(img.item, x - w, y, w, img.height);
    }
  },

  XChart: async function XChart(
    size,
    pcent,
    color="#2b2b3b",
    pic,
    lvthis,
    term = "level",
    font
  ) {
    
    const canvas = new Canvas.createCanvas(size, size);

    let startR = (π * 3) / 2,
        endR = pToR(pcent) * π;
    if (pcent == "1") endR = (π * 7) / 2;

    const rx = size / 2, ry = rx;
    
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.arc(rx, ry, rx - 5, 0, π * 2, true);
    ctx.strokeStyle = "rgba(" + RGBstring(color) + ",0.25)";
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
      let a = await  Canvas.loadImage(pic);
      ctx.drawImage(a, 0, 0, size, size);
      ctx.restore();
    }

    ctx.fillStyle = "rgba(255,255,255,.5)";
    ctx.fill();
    ctx.fillStyle = "color";

    ctx.font = font || "900 18px Panton";

    const t = (pcent * 100).toFixed(0) + "%";
    let WW = ctx.measureText(t + "%").width;
    ctx.fillText(t, size / 2 + 15 - WW / 2, size - 15);

    let label = this.tag(ctx, term.toUpperCase(), false, "#222");
    lvthis = lvthis > 999 ? miliarize(lvthis, false, " ") : lvthis;
    let tg = this.tag(ctx, lvthis, "900 56px 'Panton Black'", "#363636");

    let f = 0.8;
    let lx = size / 2 - label.width / 2 / f;
    let lh = label.height / f;
    let lw = label.width / f;
    let tW = tg.width;
    if (tW > size) tW = size - 12;
    let x = size / 2 - tW / 2;
    let y = size / 2 - tg.height / 2 + 7;

    ctx.drawImage(label.item, lx, 15, lw, lh);
    ctx.drawImage(tg.item, x, y, tW, tg.height);

    return canvas;

    function pToR(p) {
      const r = ((p * 2) % 2) + 1.5;
      if (r >= 0 && r <= 2) return r;
      return Math.abs((2 - r) % 2);
    }

    function arcDraw(r, color) {
      ctx.beginPath();
      ctx.arc(rx, ry, r, startR, endR, false);
      ctx.fillStyle = color;
      ctx.lineTo(rx, ry);
      ctx.closePath();
      ctx.fill();
    }
    
  },

  makeHex: async function Hex(size, picture, color="#FFF") {

    size = size / 2;
    let x = size + 10;
    let y = -size;

    let hex = new Canvas.createCanvas(size * 2 + 20, size * 2 + 20);
    let c = hex.getContext("2d");
    c.rotate(1.57);
    c.save();
    c.beginPath();
    c.moveTo(x + size * Math.cos(0), y + size * Math.sin(0));

    for (side = 0; side < 7; side++) {
      c.lineTo(
        x + size * Math.cos((side * 2 * Math.PI) / 6),
        y + size * Math.sin((side * 2 * Math.PI) / 6)
      );
    }

    c.fillStyle = color;
    c.fill();
    if (picture) {
      c.clip();
      let a = await  Canvas.loadImage(picture);
      c.rotate(-1.57);
      c.drawImage(a, 0, x - size, size * 2, size * 2);
      c.restore();

      c.globalCompositeOperation = "xor";

      c.shadowOffsetX = 0;
      c.shadowOffsetY = 0;
      c.shadowBlur = 10;
      c.shadowColor = "rgba(30,30,30,1)";

      c.beginPath();
      for (side = 0; side < 7; side++) {
        c.lineTo(
          x + size * Math.cos((side * 2 * Math.PI) / 6),
          y + size * Math.sin((side * 2 * Math.PI) / 6)
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

    const rx = size / 2, ry = rx;
    const canvas = new Canvas.createCanvas(size, size);
    const ctx = canvas.getContext("2d");

    let color = "#FFF";

    canvas.width = canvas.height = size;

    ctx.beginPath();
    ctx.arc(rx, ry, rx + 0, 0, π * 2, true);
    ctx.strokeStyle = "rgba(" + color + ",0.25)";
    ctx.lineWidth = 4;

    ctx.fillStyle = "#FFF";
    ctx.lineTo(rx, ry);
    ctx.closePath();
    ctx.fill();
    if (pic) {
      ctx.clip();
      let a = await  Canvas.loadImage(pic);
      ctx.drawImage(a, 0, 0, size, size);
      ctx.restore();
    }

    return canvas;
  },
  circle: this.makeRound,

  popOutTxt: function popOutTxt(
    ctx,
    TXT,
    X = 0,
    Y = 0,
    font,
    color,
    maxWidth = 0,
    stroke = { style: "#1b1b2b", line: 10 },
    shadow = 0
  ) {
    shadow = shadow || stroke.line / 2 - 1;
    stroke.style = stroke.style || "#1b1b2b";
    stroke.line = stroke.line || 10;
    let FONT = font || ctx.font || "20pt 'Corporate Logo Rounded'";
    let ctx = this.tag(ctx, TXT, FONT, stroke.style, stroke);
    ctx.drawImage(
      ctx.item,X,Y,
      maxWidth && ctx.width > maxWidth ? maxWidth : ctx.width,
      ctx.height
    );
    ctx = this.tag(ctx, TXT, FONT, color, stroke);
    ctx.drawImage(
      ctx.item,
      X - shadow,
      Y - shadow,
      maxWidth && ctx.width > maxWidth ? maxWidth : ctx.width,
      ctx.height
    );
    return {
      w:
        maxWidth && ctx.width > maxWidth
          ? maxWidth
          : ctx.width + stroke.line + shadow + 2,
      text: TXT,
    };
  },
};


function RGBstring(rgbColor) {
  rgbColor = (rgbColor || "#F55595").replace(/\s/g, "");
  const arrRGB = new Array(3);
  if (rgbColor.indexOf("rgb") > -1) {
    const colorReg = /\s*\d+,\s*\d+,\s*\d+/i;
    const t = colorReg.exec(rgbColor)[0].split(",");
    for (let i = 0; i < arrRGB.length; i++) {
      arrRGB[i] = t[i];
    }
  } else if (rgbColor.indexOf("#") > -1) {
    if (rgbColor.length > 4) {
      let j = 1;
      for (let i = 0; i < arrRGB.length; i++) {
        arrRGB[i] = parseInt(rgbColor.substr(i + j, 2), 16);
        j += 1;
      }
    } else {
      for (let i = 0; i < arrRGB.length; i++) {
        let t = rgbColor.substr(i + 1, 1);
        t = t + t;
        arrRGB[i] = parseInt(t, 16);
      }
    }
  }
  return arrRGB.join(",");
}