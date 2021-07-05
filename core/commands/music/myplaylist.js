
const axios = require('axios');

const init = async function (msg, args) {

    let res = await PLX.api.get("/playlists/user/" + (args[0] || msg.author.id));

    const makeItPretty = (v, a, l) => {
        return `${v.url.includes('youtube') ? _emoji('youtube') : v.url.includes('soundcloud') ? _emoji('soundcloud') : _emoji("b")}  • [${v.title}](${v.url})`
    }

    msg.channel.send({
        embed: {
            color: numColor(_UI.colors.cyan),
            description: res.data.map(makeItPretty).join('\n')
        }
    })

    //return PLX.sendJSON(msg.channel.id,res.data)

}
module.exports = {
    init
    , pub: true
    , cmd: 'myplaylist'
    , cat: 'music'
    , botPerms: ['attachFiles', 'embedLinks']
    , aliases: []
}