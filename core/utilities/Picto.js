const cfg = require(appRoot+"/config.json");
const Canvas = require('canvas');
const Pixly = require('pixel-util');
//const md5 = require('md5');

module.exports={


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

   }



}
