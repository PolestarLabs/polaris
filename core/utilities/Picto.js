//const cfg = require(appRoot+"/config.json");
const Canvas = require('canvas');
const Pixly = require('pixel-util');
const wrap = require('canvas-text-wrapper').CanvasTextWrapper;
//const md5 = require('md5');

module.exports={

  new:function newPicto(w=800,h=600){
    const canvas = new Canvas.createCanvas(w, h);
    return canvas;
  },
  
  getCanvas: async function getCanvas(path) {
    let img =  new Canvas.Image;
    img.src = await Pixly.createBuffer(path);
    return img;
  },

  getBuffer: async function getBuffer(path) {
    return Pixly.createBuffer(path);
  },

 tag: function tag(base, text, font, color,stroke) {

        font = font || '14px'         
        font += ",'',Product Sans'" //KOREAN SUPPORT
        font += ",'DX아기사랑B' " //KOREAN SUPPORT
        font += ",'Corporate Logo Rounded' " //JAPANESE SUPPORT
        font += ",sans-serif " 
        color = color || '#b4b4b8'
        base.font = font;

        let H = base.measureText(text).emHeightAscent
        let h = base.measureText(text).emHeightDescent + (stroke?stroke.line:0);
        let w = base.measureText(text).width + (stroke?stroke.line:0);
        const item = new Canvas.createCanvas(w, h + H);
            let c = item.getContext("2d")
            c.antialias = 'subpixel';
            c.filter = 'best';
            c.font = base.font;
            if(stroke){
              c.strokeStyle  = stroke.style;
              c.lineWidth   = stroke.line;
              c.strokeText(text, 1+stroke.line/2, H+stroke.line/2);
            }
            c.fillStyle = color;
            c.fillText(text, 1+(stroke?stroke.line/2:0), H+(stroke?stroke.line/2:0) );

        return {item:item,height:h+H,width:w};// <-- same as above
    },

  block: function block(base, text, font, color, W, H, options) {
     
       font = font || '14px Product Sans'
       font += ",'DX아기사랑B' " //KOREAN SUPPORT
       font += ",'Corporate Logo Rounded' " //JAPANESE SUPPORT
       font += ",sans-serif " 
       color = color || '#b4b4b4'
       base.font = font;
       W = W || 300;
       H = H || 200;
       const item = new Canvas.createCanvas(W, H);
       let c = item.getContext("2d");
       c.antialias = 'subpixel';
       c.filter = 'best';
       c.font = font;

       c.fillStyle = color;
       options = Object.assign({
         font: font || "bold 25px Arial, sans-serif",
         textAlign: "left",
         verticalAlign: "top",
         lineBreak: "auto",
       },options||{});

       wrap(item, text, options);
       return {item: item,height: H,width: W}; // <-- i think H and W are redundant, need to check later

   },
   avgColor: async function avgColor(link){

      let blockSize = 5, 
          defaultRGB = {r:0,g:0,b:0};
          imgEl = await this.getCanvas(link);
          canvas = new Canvas.createCanvas(imgEl.width,imgEl.height);
      let context = canvas.getContext('2d'),
          data, width, height,
          i = -4,
          length,
          rgb= {r:0,g:0,b:0},
          count = 0;
  
      if (!context) {
          return defaultRGB;
      }
  
      height = canvas.height = imgEl.naturalHeight || imgEl.offsetHeight || imgEl.height;
      width = canvas.width = imgEl.naturalWidth || imgEl.offsetWidth || imgEl.width;
      try{

        context.drawImage(imgEl, 0, 0);
      }catch(e){
        console.error(e)
        console.error(link)
        console.error('---')
      }
      try {
  

          data = context.getImageData(0, 0, width, height);
      } catch(e) {
          return "#000000";
      }
  
      length = data.data.length;
  
      while ( (i += blockSize * 4) < length ) {
          ++count;
          rgb.r += data.data[i];
          rgb.g += data.data[i+1];
          rgb.b += data.data[i+2];
      }
  
      // ~~ used to floor values
      rgb.r = ~~(rgb.r/count);
      rgb.g = ~~(rgb.g/count);
      rgb.b = ~~(rgb.b/count);
      
      return "#" +
  ("0" + parseInt(rgb.r,10).toString(16)).slice(-2) +
  ("0" + parseInt(rgb.g,10).toString(16)).slice(-2) +
  ("0" + parseInt(rgb.b,10).toString(16)).slice(-2);
   },
   roundRect: function roundRect(ctx, x=0, y=0, width=10, height=10, radius=5, fill="#FFF", stroke=false) {
 
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
  if (typeof fill== 'object' ) {
    ctx.save();
    ctx.clip();
    ctx.drawImage(fill, x,y,width,height)
    ctx.closePath();
    ctx.restore();
  }else{
    ctx.closePath();
  }

  if (typeof fill== "string") {
    ctx.fillStyle = fill 
    ctx.fill();
}
if (stroke) {
    typeof stroke== "string" ? ctx.strokeStyle = stroke : false;
    ctx.stroke();
  }
},
setAndDraw: function setAndDraw(ct,img,x,y,maxW=300,align='left'){
  let w = img.width
      w=w>maxW?maxW:w;
  if(align=="left"){
      ct.drawImage(img.item,x,y,w,img.height);
  }
  if(align=="center"){
      ct.drawImage(img.item,x-w/2,y,w,img.height);
  }
  if(align=="right"){
      ct.drawImage(img.item,x-w,y,w,img.height);
  }
},




XChart: async function XChart(size, pcent, colorX,pic,lvthis,term = "level",font) {
    const color = TColor(colorX);
    const pi = Math.PI;
    let startR = pi * 3 / 2, endR = pToR(pcent) * pi;
    if (pcent == "1") { endR = pi * 7 / 2; }
    const rx = size / 2, ry = rx;
    const canvas_proto = new Canvas.createCanvas(size,size);
    const context = canvas_proto.getContext('2d');
    function TColor(rgbColor) {
        rgbColor = (rgbColor||"#F55595").replace(/\s/g, "");
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
      let a = await this.getCanvas(pic);
      context.drawImage(a, 0, 0,size,size);
      context.restore()
    }

    context.fillStyle = 'rgba(255,255,255,.5)';
    context.fill();
    context.fillStyle = 'rgba(' + color + ',1)'; ;


    context.font = font || "900 18px Panton";

    const t = (pcent * 100).toFixed(0) + "%";
    let WW =  context.measureText(t+"%").width
    context.fillText(t, size/2+15-WW/2, size-15);



    let label = this.tag(context, term.toUpperCase(),false,"#222");
    lvthis = lvthis > 999 ? miliarize(lvthis,false,' ') : lvthis; 
    let tg = this.tag(context,lvthis,"900 56px 'Panton Black'","#363636");

    let f = .8
    let lx = (size/2) - (label.width/2/f)
    let ly = (size/2) - (label.height*1.5)
    let lh=label.height/f
    let lw=label.width/f
    let tW = tg.width;
    if (tW > size) tW = size-12;
    let x = (size/2) - (tW/2)
    let y = (size/2) - (tg.height/2) +7

    context.drawImage(label.item,lx,15,lw,lh);
    context.drawImage(tg.item,x,y,tW,tg.height);

    return canvas_proto

},
  makeHex: async function Hex(size,picture) {
    let globalOffset = 0
    size = size/2
    let x  = size+10
    let y=  -size

    let cw=size
    let ch=size


    let hex= new Canvas.createCanvas (size*2+20,size*2+20)
    let c=hex.getContext("2d")
    c.rotate(1.570)
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
    let a = await this.getCanvas(picture);
      c.rotate(-1.570)
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
    c.shadowColor = "rgba(34, 31, 59, 0.57)"
    c.shadowBlur = 8

 }
       c.fill();

    return hex

  },


  makeRound: async function makeRound(size,pic) {
    const pi = Math.PI;
    let startR = pi * 3 / 2, 
    endR = 1 * pi;
    const rx = size / 2, ry = rx;
    const canvas_proto = new Canvas.createCanvas(size,size);
    const context = canvas_proto.getContext('2d');

    let color="#FFF"
    function arcDraw(r, color="#FFF") {
        context.beginPath();
        context.arc(rx, ry, r, startR, endR, false);
        context.fillStyle = color;
        context.lineTo(rx, ry);
        context.closePath();
        context.fill();
    }
    canvas_proto.width = canvas_proto.height = size;


    context.beginPath();
    context.arc(rx, ry, rx +0, 0, pi * 2, true);
    context.strokeStyle = 'rgba(' + color + ',0.25)';
    context.lineWidth = 4;



    context.fillStyle = 'rgba(255,255,255,1)';
    context.lineTo(rx, ry);
    context.closePath();
    context.fill();
    if(pic){
      context.clip();
      let a = await this.getCanvas(pic);
      context.drawImage(a, 0, 0,size,size);
      context.restore()
    }

    return canvas_proto

  },

  popOutTxt: function popOutTxt(ctx,TXT,X=0,Y=0,font,color,maxWidth =0, stroke={style:"#1b1b2b",line:10},S=0){
    S= S||stroke.line /2 -1;
    stroke.style = stroke.style || "#1b1b2b"
    stroke.line = stroke.line || 10
    let FONT = font || ctx.font || "20pt 'Corporate Logo Rounded'";
      let ctex = this.tag(ctx,TXT,FONT,stroke.style,stroke)
    ctx.drawImage(
      ctex.item,
      X,Y, 
      maxWidth && ctex.width > maxWidth ? maxWidth : ctex.width, ctex.height
    )
      ctex = this.tag(ctx,TXT,FONT,color,stroke)
    ctx.drawImage(
      ctex.item,
      X-S,Y-S, 
      maxWidth && ctex.width > maxWidth ? maxWidth : ctex.width, ctex.height
    )
    return {w:   maxWidth && ctex.width > maxWidth ? maxWidth : ctex.width + stroke.line + S + 2 ,text:TXT }

}


}

