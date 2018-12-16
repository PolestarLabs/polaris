const i2b = require("imageurl-base64");
const gear = require("../../utilities/Gearbox");
const Vision = require('@google-cloud/vision/')

const cmd = 'read';
const init = async function (message) {
 
    i2b(message.args[0], async function (err, img) {
        if (err){
            let nwurl = await gear.getChannelImg(message);
             if (!nwurl) return message.channel.send("`INVALID IMAGE URL`");
            return i2b(nwurl,(err,b64)=> vere(b64.base64,message))
        }
        vere(img.base64,message);
    });
  
}

function vere(base64,message){

        const vision = new Vision.ImageAnnotatorClient({
        
            projectId: 'pollux-172700',
            keyFilename: './Pollux-7f990738909e.json'
        });
        vision.annotateImage({
            image: {
                content: base64
            },
            "features": [
                {
                  "type": "TEXT_DETECTION"
                }]
            
        })
            .then(async(results) => {
                const detections = results[0].textAnnotations[0].description
                const lang = results[0].textAnnotations[0].locale
                
                const TranslateBlob = require('../../structures/TranslationBlob')

                const embed = new gear.Embed;
                embed.title("Read Results")
                embed.description(detections)
                L = TranslateBlob.flagFromLang(lang)
                embed.field("lang",L.flag+L.name)
                message.channel.send({embed})
            })
            .catch((err) => {
                message.channel.send("`Error::VisionAPI Unreachable`")
                console.error('ERROR:', err);
            });

    }


module.exports = {
    pub: true,
    cmd: cmd,
    perms: 3,
    init: init,
    cat: 'util',
    aliases: ["ocr","eye"]
};
