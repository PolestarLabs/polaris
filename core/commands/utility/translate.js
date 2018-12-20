const TranslateBlob = require("../../structures/TranslationBlob");
const {getMessage} = require("../../utilities/Gearbox");
const cmd = 'translate';

const init = async function (msg) {

        let pre = await TranslateBlob.grabLang(msg);
        let ttt = pre.textToTrans;
        if(msg.args.length===0 || [msg.args[0],msg.args[1],msg.args[2]].some(a=>a==="^")) {
                let messageGrab = await getMessage(msg);
                if(messageGrab) ttt = messageGrab.content;
        }
        let messagebyID = [msg.args[0],msg.args[1],msg.args[2]].filter(arg=> arg&&!isNaN(arg)&&arg.length>10);
        if(messagebyID.length>0){
                let newmes = await getMessage(msg,messagebyID[0]);
                if(newmes) ttt = newmes.content;                
        }

        let result = await TranslateBlob.translate(ttt,pre.langFrom,pre.langTo);
        msg.channel.send(result);
}

 module.exports = {
    pub:true,
    cmd: cmd,
    perms: 3,
    init: init,
    cat: 'bot'
};

