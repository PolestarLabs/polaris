const π = Math.PI;
const Canvas = require("canvas");
const wrap = require("canvas-text-wrapper").CanvasTextWrapper;
const { fillTextWithTwemoji } = require("node-canvas-with-twemoji");
const StackBlur = require('stackblur-canvas');

const BLUR = function Blur(rad = 10, x = 0, y = 0, w, h) {
    w ||= this.canvas.width;
    h ||= this.canvas.height;
    return StackBlur.canvasRGB(this.canvas, x, y, w, h, rad);
}

class Picto {
    constructor(width = 800, height = 600) {
        const canvas = Canvas.createCanvas(width, height);
        const c = canvas.getContext("2d");
        c.antialias = "subpixel";
        c.filter = "best";
        c.blur = BLUR;
        return canvas;
    }

    getCanvas(img_path) {
        return Canvas.loadImage(img_path)
            .catch((err) => {
                console.error("• ".red + (img_path.toString()).yellow + " not loaded.");
                console.error(err);
                const canvas = Canvas.createCanvas(250, 250);
                const c = canvas.getContext("2d");
                c.fillStyle = "#F0F";
                c.fillRect(0, 0, 250, 250);
                return canvas;
            })
            .then((img) => {
                const canvas = Canvas.createCanvas(img.width, img.height);
                const c = canvas.getContext("2d");
                c.blur = blur;
                c.drawImage(img, 0, 0);
                return canvas;
            });
    }
}
module.exports = {
    Picto,

    //legacy
    new(w, h) {
        return new Picto(w, h);
    }
}