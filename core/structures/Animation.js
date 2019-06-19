const GIFEncoder = require('gif-encoder');
const EventEmitter = require('events');
const {createWriteStream} = require('fs')
const {file} = require('../utilities/Gearbox');

class Animation extends EventEmitter {
    constructor(options){
        super();
        this.gif = new GIFEncoder(options.w||100,options.h||100);
        this.gif.writeHeader();
        this.gif.setRepeat(options.repeat || 0);
        this.gif.highWaterMark = options.highWaterMark || 128000;
        this.gif.setTransparent(options.transparentColor || 0xFF00FF);
        this.gif.setFrameRate(options.framerate || 30);

        this.buffers = []
        if (options.cache){
            let resFile = createWriteStream(`cache/${options.filename || Date.now()}.gif`);
            this.gif.pipe(resFile);
        }

        this.lastFrame = options.lastFrame
        this.gif.on('data', data => this.buffers.push(data) );
        this.gif.once('end', async () => {
            this.emit("done", file( Buffer.concat(this.buffers) , options.filename+".gif") );            
            this.gif = null;
        });
    }

    generate(fun){
        this.framesDone = 0
        Array(this.lastFrame).fill(null).forEach(async (n, frameNumber) => {
            let frame = await fun(frameNumber);
            this.gif.addFrame(frame.getImageData(0, 0, 350, 250).data);
            this.framesDone++
            if (this.framesDone === this.lastFrame) this.gif.finish();
        });
    }

}

module.exports = Animation;