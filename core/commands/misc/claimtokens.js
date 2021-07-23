const init = async function (msg) {

    const oldUser = await vDB.findOne({ id: msg.author.id });
    if (!oldUser || oldUser.switches?.tokensMigrated)
        return msg.addReaction(_emoji('nope').reaction);

    await DB.users.set(msg.author.id, { $set: { "modules.EVT": oldUser.modules.EVT } });
    await vDB.users.set(msg.author.id, { $set: { "switches.tokensMigrated": true } });

    return msg.addReaction(_emoji('yep').reaction);

}
module.exports = {
    init
    , pub: false
    , cmd: 'claimtokens'
    , cat: 'misc'
    , botPerms: ['attachFiles', 'embedLinks']
    , aliases: ["migratetoken"]
}