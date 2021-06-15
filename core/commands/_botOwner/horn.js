
const init = async function (msg) {
    msg.delete();
    msg.channel.send({
        content: _emoji("__") + "",
        components: [{
            type: 1, components: [
                { type: 2, style: 4, emoji: { name: "🎺" }, custom_id: "playHorn:horn" },
                { type: 2, style: 2, emoji: { id: "334654028535431168" }, custom_id: "playHorn:verstappen" },
                { type: 2, style: 2, emoji: { name: "⛳" }, custom_id: "playHorn:bolinha" },
                { type: 2, disabled: true, style: 2, emoji: { id: "434743628800458793" }, custom_id: "playHorn:noot" },
                { type: 2, disabled: true, style: 2, emoji: { id: "601288252867084318" }, custom_id: "playHorn:noot" },
                { type: 2, disabled: true, style: 2, emoji: { id: "601288252867084318" }, custom_id: "playHorn:noot" },
            ]
        },
        { type: 1, components: [{ type: 2, disabled: true, style: 2, emoji: { id: "601288252867084318" }, custom_id: "playHorn:noot" }, { type: 2, disabled: true, style: 2, emoji: { id: "601288252867084318" }, custom_id: "playHorn:noot" }, { type: 2, disabled: true, style: 2, emoji: { id: "601288252867084318" }, custom_id: "playHorn:noot" }, { type: 2, disabled: true, style: 2, emoji: { id: "601288252867084318" }, custom_id: "playHorn:noot" }, { type: 2, disabled: true, style: 2, emoji: { id: "601288252867084318" }, custom_id: "playHorn:noot" },] },
        { type: 1, components: [{ type: 2, disabled: true, style: 2, emoji: { id: "601288252867084318" }, custom_id: "playHorn:noot" }, { type: 2, disabled: true, style: 2, emoji: { id: "601288252867084318" }, custom_id: "playHorn:noot" }, { type: 2, disabled: true, style: 2, emoji: { id: "601288252867084318" }, custom_id: "playHorn:noot" }, { type: 2, disabled: true, style: 2, emoji: { id: "601288252867084318" }, custom_id: "playHorn:noot" }, { type: 2, disabled: true, style: 2, emoji: { id: "601288252867084318" }, custom_id: "playHorn:noot" },] },
        { type: 1, components: [{ type: 2, disabled: true, style: 2, emoji: { id: "601288252867084318" }, custom_id: "playHorn:noot" }, { type: 2, disabled: true, style: 2, emoji: { id: "601288252867084318" }, custom_id: "playHorn:noot" }, { type: 2, disabled: true, style: 2, emoji: { id: "601288252867084318" }, custom_id: "playHorn:noot" }, { type: 2, disabled: true, style: 2, emoji: { id: "601288252867084318" }, custom_id: "playHorn:noot" }, { type: 2, disabled: true, style: 2, emoji: { id: "601288252867084318" }, custom_id: "playHorn:noot" },] },
        { type: 1, components: [{ type: 2, disabled: true, style: 2, emoji: { id: "601288252867084318" }, custom_id: "playHorn:noot" }, { type: 2, disabled: true, style: 2, emoji: { id: "601288252867084318" }, custom_id: "playHorn:noot" }, { type: 2, disabled: true, style: 2, emoji: { id: "601288252867084318" }, custom_id: "playHorn:noot" }, { type: 2, disabled: true, style: 2, emoji: { id: "601288252867084318" }, custom_id: "playHorn:noot" }, { type: 2, disabled: true, style: 2, emoji: { id: "601288252867084318" }, custom_id: "playHorn:noot" },] },
        ]
    })
};

module.exports = {
    init,
    pub: false,
    cmd: "stuck",
    cat: "sound",
    botPerms: ["attachFiles", "embedLinks"],
    aliases: ["buzina"],
};
