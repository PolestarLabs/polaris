const gear = require('../../utilities/Gearbox');
const locale = require('../../../utils/i18node');
const $t = locale.getT();
const fs = require("fs");

const init = async function (message) {

    let MSG = message.content


    //HELP TRIGGER
    let helpkey = $t("helpkey", {
        lngs: message.lang
    })
    if (MSG.split(" ")[1] == helpkey || MSG.split(" ")[1] == "?" || MSG.split(" ")[1] == "help") {
        return gear.usage(cmd, message, this.cat);
    }
    //------------

    fs.readdir(paths.BUILD + "frenes/vsauce/", function (err, files) {
        let rand = gear.randomize(0, files.length - 1);
        var filepath = paths.BUILD + "frenes/vsauce/" + files[rand]


        message.channel.send(":vs: **HEY VSAUCE!** Pollux here!", gear.file(filepath,'vsauce.mp4'))

    })
}


module.exports = {
    init,
    pub: true,
    cmd: 'vsauce',
    perms: 3,
    cat: 'fun',
    botPerms: ['attachFiles', 'embedLinks'],
    aliases: []
}