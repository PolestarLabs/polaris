// const gear = require('../../utilities/Gearbox');
//const locale = require('../../../utils/i18node');
//const $t = locale.getT();
const Gal = require('../../structures/Galleries')

const init = async function (message) {

    //HELP TRIGGER
    let helpkey = $t("helpkey", {
        lngs: message.lang
    })
    if (message.content.split(" ")[1] == helpkey || message.content.split(" ")[1] == "?" || message.content.split(" ")[1] == "help") {
        return PLX.usage(cmd, message, this.cat);
    }
    //------------
    message.channel.send(
        ":vs: **HEY VSAUCE!** Pollux here!",
         file(await Gal.randomOne('vsauce'),'vsauce.mp4')
         )
}


module.exports = {
    init,
    pub: true,
    cmd: 'vsauce',
    perms: 3,
    cat: 'img',
    botPerms: ['attachFiles', 'embedLinks'],
    aliases: []
}