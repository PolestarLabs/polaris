const GIFEncoder = require('gif-encoder');
const EventEmitter = require('events');
const {createWriteStream} = require('fs');
const fs =  require('fs');
const cacheDir = "/home/pollux/polaris/gifcache"
const {setImmediate} = require("timers/promises");

class Animation extends EventEmitter {
    constructor(options){
        super();
        this.gif = new GIFEncoder(options.w||100,options.h||100);
        this.gif.writeHeader();
        this.gif.setRepeat(options.repeat || 0);
        this.gif.highWaterMark = options.highWaterMark || 1280000;
        this.gif.setTransparent(options.transparentColor);
        this.gif.setFrameRate(options.framerate || 30);
        this.options = options ;
        this.buffers = [];

        if (options.cache){
            if (!fs.existsSync(cacheDir)){
              fs.mkdir(cacheDir,{recursive:true});
            }
            this.cacheFilePath = `${cacheDir}/${options.filename || Date.now()}.gif`;
            if (fs.existsSync(this.cacheFilePath) && options.cache != "overwrite"){
                this.cacheAbort = true;
                this.gif.flushData();
                this.gif = fs.createReadStream(this.cacheFilePath);
                this.emit("done", {file: fs.readFileSync(this.cacheFilePath) , name: options.filename+".gif"} );
            }
        }
        this.lastFrame = options.lastFrame
        this.gif.on('data', data => this.buffers.push(data) );
        this.gif.once('end', async () => {
            let concatBuff = Buffer.concat(this.buffers);
            this.emit("done", {file: concatBuff , name: options.filename+".gif"} );
            if (options.cache){
                fs.writeFileSync(this.cacheFilePath, concatBuff);
            }
            //this.gif = null;
        });
    }

    async generate(fun){
        if (this.cacheAbort) return false;
        let currentFrame = 0;      
        while( this.lastFrame > currentFrame++ ){
            console.log({currentFrame})
            let frame = await setImmediate( fun(currentFrame), {ref:false});
            this.gif.addFrame(frame.getImageData(0, 0, this.options.w, this.options.h).data);
            await setImmediate();
        }        
        this.gif.finish();         
    }

}

module.exports = Animation;