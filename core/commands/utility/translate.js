const TranslateBlob = require("../../structures/TranslationBlob");
const cmd = 'translate';

const init = async function (msg) {        
        let pre = await TranslateBlob.grabLang(msg);
        let result = await TranslateBlob.translate(pre.textToTrans,pre.langFrom,pre.langTo);
        msg.channel.send(result);
}

 module.exports = {
    pub:true,
    cmd: cmd,
    perms: 3,
    init: init,
    cat: 'bot'
};

