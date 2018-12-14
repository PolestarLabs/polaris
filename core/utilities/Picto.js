const cfg = require(appRoot+"/config.json");
const Canvas = require('canvas');
const Pixly = require('pixel-util');
//const md5 = require('md5');

module.exports={

  new:function newPicto(w=800,h=600){
    const canvas = new Canvas.createCanvas(w, h);
    return canvas;
  },
  
  getCanvas: async function getCanvas(path) {
    let img = await new Canvas.Image;
    img.src = await Pixly.createBuffer(path);
    return img;
  },

  getBuffer: async function getBuffer(path) {
    return Pixly.createBuffer(path);
  },

 tag: function tag(base, text, font, color) {

        font = font || '14px Product,Sans'
        color = color || '#b4b4b8'
        base.font = font;

        let H = base.measureText(text).emHeightAscent
        let h = base.measureText(text).emHeightDescent;
        let w = base.measureText(text).width;
        const item = new Canvas.createCanvas(w, h + H);
            let c = item.getContext("2d")
            c.antialias = 'subpixel';
            c.filter = 'best';
            c.font = font;
            c.fillStyle = color;
            c.fillText(text, 0, H);
        return {item:item,height:h+H,width:w};// <-- same as above
    },

  block: function block(base, text, font, color, W, H, options) {
       const wrap = require('canvas-text-wrapper').CanvasTextWrapper;
       font = font || '14px Product,Sans'
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
       options = options || {
         font: font || "bold 25px Arial, sans-serif",
         textAlign: "left",
         verticalAlign: "top",
         lineBreak: "auto",
       };

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
  
      context.drawImage(imgEl, 0, 0);
  
      try {

          data = context.getImageData(0, 0, width, height);
      } catch(e) {
          return defaultRGB;
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
   }
}
