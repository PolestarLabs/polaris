module.exports = {
    init: (msg)=>null,
    argsRequired: false,
    caseInsensitive: true,
    cooldown: 5000,
    hooks: {
        preCommand: (msg) => msg.author.marketplacing = true,
        postExecution: (msg) => msg.author.marketplacing = false,
    }
}
