const GIFEncoder = require("gif-encoder");
const EventEmitter = require("events");
const { createWriteStream } = require("fs");

class Animation extends EventEmitter {
  constructor(options) {
    super();
    this.gif = new GIFEncoder(options.w || 100, options.h || 100);
    this.gif.writeHeader();
    this.gif.setRepeat(options.repeat || 0);
    this.gif.highWaterMark = options.highWaterMark || 128000;
    this.gif.setTransparent(options.transparentColor);
    this.gif.setFrameRate(options.framerate || 30);
    this.options = options;

    this.buffers = [];
    if (options.cache) {
      const resFile = createWriteStream(`./${options.filename || Date.now()}.gif`);
      this.gif.pipe(resFile);
    }

    this.lastFrame = options.lastFrame;
    this.gif.on("data", (data) => this.buffers.push(data));
    this.gif.once("end", async () => {
      this.emit("done", file(Buffer.concat(this.buffers), `${options.filename}.gif`));
      this.gif = null;
    });
  }

  async generate(fun) {
    let frameNumber = 0;
    renderedFrames = [];
    // Array(this.lastFrame).fill(null).forEach(async (n, frameNumber) => {
    
    Array(this.lastFrame-1).fill(" ").map((_,frame)=>{
      const frame = fun(frameNumber);
      renderedFrames.push(frame);
    });
    renderedFrames.forEach(frame=>{
      this.gif.addFrame(frame.getImageData(0, 0, this.options.w, this.options.h).data);
    });

    this.gif.finish();
    // });
  }
}

module.exports = Animation;
