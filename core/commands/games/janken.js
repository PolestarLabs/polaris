const Ongoing = new Map();

const init = async function (msg, args) {

    if (!args[0]) return msg.reply("You must tag someone.");
    let Target;
    try {
        Target = await PLX.resolveMember(msg.guild, args[0]);
    } catch (e) {
        return msg.reply(_emoji('nope') + "You must tag someone **valid**.");
    }

    if (Target.id === msg.author.id) return msg.reply(_emoji('nope') + "You can't play with yourself, duh.");
    if (Target.bot) return msg.reply(_emoji('nope') + "You can't play with bots...");
    // if (!Target) return msg.reply(_emoji('nope') + "You must tag someone **valid**.");

    if (Ongoing.get(Target.id)) {
        return msg.reply({
            embed: {
                description: _emoji('nope') + `Sorry, this player is already playing [**here**](${Ongoing.get(Target.id)}).
            If there's no ongoing game try again in 30 seconds...`
            }
        });
    }
    if (Ongoing.get(msg.author.id)) {
        return msg.reply({
            embed: {
                description: _emoji('nope') + `Sorry, you are already playing [**here**](${Ongoing.get(msg.author.id)}).
            If there's no ongoing game try again in 30 seconds...`
            }
        });
    }

    const rpsComponents = [
        {
            type: 2,
            style: 2,
            label: "Rock",
            custom_id: "rock",
            emoji: {
                name: "🪨"
            }
        },
        {
            type: 2,
            style: 2,
            label: "Paper",
            custom_id: "paper",
            emoji: {
                name: "🧻"
            }
        },
        {
            type: 2,
            style: 2,
            label: "Scissors",
            custom_id: "scissors",
            emoji: {
                name: "✂"
            }
        }
    ];

    if (randomize(1, 100) === 55) {
        rpsComponents.push({
            type: 2,
            style: 4,
            //label: "",
            emoji: {
                name: "🖕"
            },
            custom_id: "fuckoff"
        })
    }

    Ongoing.set(msg.author.id, msg.jumpLink);
    Ongoing.set(Target.id, msg.jumpLink);
    setTimeout(() => {
        Ongoing.set(msg.author.id, false);
        Ongoing.set(Target.id, false);
    }, 30e3)

    let prompt = await msg.channel.send({
        content: `${Target.nick || Target.user.username}, you've been challenged for a match of RockPaperScissors by **${msg.author.username}**.`,
        components: [{
            type: 1,
            components: rpsComponents
        }]
    });

    let participants = [msg.author.id, Target.id];

    const embed = {};
    embed.description = matchWaiting();
    const matchResultsMsg = await msg.channel.send({ content: 'Choose Your weapon!', embed });

    let res = await prompt.awaitButtonClick(int => {
        let res = participants.includes(int.userID);
        participants = participants.filter(x => x !== int.userID);
        console.log({ res })
        if (res) {
            embed.description = matchWaiting(...[
                !participants.includes(msg.author.id),
                !participants.includes(Target.id),
            ]);
            matchResultsMsg.edit({ embed });
            return res;
        }
    }, { removeButtons: false, maxMatches: 2, time: 30e3 }).catch(err => {
        return msg.reply("No one choosed...");
    });

    prompt.edit({
        content: prompt.content,
        components: [{
            type: 1, components: rpsComponents.map(x => {
                x.disabled = true
                return x;
            })
        }]
    });

    if (!res[0]) return;
    if (res.find(r => r.id === 'fuckoff')) return msg.reply(`Someone sent a 🖕... Looks like ${Target.nick || Target.user.username} doesn't want to play... just sayin'`);
    if (res.length !== 2) return msg.reply("Someone seems to have ran away...");

    embed.description = matchResults();

    await matchResultsMsg.edit({ content: "", embed });
    await wait(2);
    embed.description = matchResults(res.find(b => b.userID === msg.author.id).id);
    await matchResultsMsg.edit({ embed });
    await wait(2);
    console.log({ res });
    embed.description = matchResults(
        res.find(b => b.userID === msg.author.id).id,
        res.find(b => b.userID === Target.id).id
    );

    await matchResultsMsg.edit({ embed });
    await wait(1);

    let winner = getWinner(res);
    if (winner === -1) {
        return matchResultsMsg.edit({
            content: `Oh that was a tie!`,
            embed
        });
    }

    return matchResultsMsg.edit({
        content: `<@${res[winner].userID}> was the winner!`,
        embed
    });


    function matchResults(a, b) {
        return `**Game Results!**
    ${msg.member.nick || msg.author.username} chose... ${a ? (a + "!") : ""}
    ${Target.nick || Target.user.username} chose... ${b ? (b + "!") : ""}
    `
    }
    function matchWaiting(a, b) {
        return `**Waiting...**
    ${msg.member.nick || msg.author.username} ${a ? "is ready!" : "is choosing..."}
    ${Target.nick || Target.user.username} ${b ? "is ready!" : "is choosing..."}
    `
    }

}

function getWinner(res) {
    if (res[0].id === "rock" && res[1].id === "rock") return -1;
    if (res[0].id === "paper" && res[1].id === "rock") return 0;
    if (res[0].id === "scissors" && res[1].id === "rock") return 1;

    if (res[0].id === "rock" && res[1].id === "paper") return 1;
    if (res[0].id === "paper" && res[1].id === "paper") return -1;
    if (res[0].id === "scissors" && res[1].id === "paper") return 0;

    if (res[0].id === "rock" && res[1].id === "scissors") return 0;
    if (res[0].id === "paper" && res[1].id === "scissors") return 1;
    if (res[0].id === "scissors" && res[1].id === "scissors") return -1;
}

module.exports = {
    init
    , pub: true
    , cmd: 'janken'
    , cat: 'games'
    , botPerms: ['attachFiles', 'embedLinks']
    , aliases: ['rps', 'rockpaperscissors', 'ppt']
}