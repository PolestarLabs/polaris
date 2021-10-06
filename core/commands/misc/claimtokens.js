//FIXME(epoc="post-migration-period") Delete this

const init = async function (msg) {

    const oldUser = await vDB.userDB.findOne({ id: msg.author.id });
    if (!oldUser || oldUser.switches?.tokensMigrated2)
        return msg.addReaction(_emoji('nope').reaction);

    await DB.users.set(msg.author.id, { $set: { "modules.EVT": oldUser.eventGoodie } });
    await vDB.users.set(msg.author.id, { $set: { "switches.tokensMigrated3": true } });

    return msg.addReaction(_emoji('yep').reaction);

}
module.exports = {
    init
    , pub: false
    , cmd: 'claimtokens'
    , cat: 'misc'
    , botPerms: ['attachFiles', 'embedLinks']
    , aliases: ["migratetokens"]
}