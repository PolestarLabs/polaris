const EventEmitter = require("events");
let { ACHIEVEMENTS } = require("./Achievements.js");
const formatDistanceToNow = require("date-fns/formatDistanceToNow");
const { setImmediate } = require("timers/promises");
class ProgressionManager extends EventEmitter {
    constructor() {
        super();
        this.userCheckQueue = new Map();
        this.on("*", async (event, opts) => {

            let { value, msg, userID } = opts;
            userID ??= msg?.author?.id

            if (!userID) return;
            if (event === "QUEST_COMPLETED") return;

            let [action, scope, condition] = event.split('.');
            console.log(`${"•".cyan} Progression:  ${action?.gray || "*".gray} -> ${scope?.yellow || "*".gray} -> ${condition?.blue || "*".gray} ${typeof opts.valueSet == 'number' ? " RESET ".bgRed : `[+${value || 1}]`.cyan
                }`);

            await setImmediate(0, { ref: false });
            await this.updateQuestTracker(userID || msg?.author?.id, event, value, opts);

            if (!msg) return;
            if (!value && !value?.content && !msg?.content) return;
            if (isPartOfAchievement(event)) Achievements.check(msg.author.id, true, { msg: msg || value });

            await wait(1);
            //console.log({event,userID})
            //this.checkStatusAll(userID,msg);

            //await this.checkStatus(msg.author.id,msg);
            //quests. 
        });


        this.on("craft", async (event, opts) => {
            const { item, amount, userID, msg } = opts;
            const userQuests = await this.getUserQuests(userID);
            await Promise.all(userQuests.map(async quest => {
                const [action, type, condition] = quest.tracker.split('.');
                if (action !== 'craft') return;

                if (item[type] === condition) {
                    await this.updateProgress(userID, quest._id, amount, msg);
                }
                if (!msg) return;
                //this.checkStatusOne(quest._id,userID,msg);
            }));
        });



        this.on("spend", async (event, opts) => {
            return;
            let { value, msg, userID } = opts;
            let [, currency] = event.split('.');

            userID ??= msg?.author?.id;
            const userQuests = await this.getUserQuests(userID);
            await Promise.all(userQuests.map(async quest => {
                const [action, type, condition] = quest.tracker.split('.');
                if (condition) return;
                if (action !== 'spend') return;
                if (currency === type) {
                    await this.updateProgress(userID, quest._id, value);
                }
            }));
            if (!msg) return;

        })



        this.on("QUEST_COMPLETED", async (event, quest, opts) => {
            const { msg, userQuests, userID } = opts;
            //award rewards;
            msg.channel.send(await questCompletedMsg(quest, userID))
                .catch((err) => {
                    console.error(err)
                    PLX.getDMChannel( userID ).then(async DM =>
                        DM.createMessage(await questCompletedMsg(quest, userID)).catch(console.error)
                    ).catchReturn(0);
                });
            if (userQuests?.every(q => q.completed)) {
                await wait(4);
                //award extra bonus
                msg.channel.send("**Extra bonus:** `All Quests Completed` +100 EXP");
                await DB.users.set(userID, {
                    $inc: {
                        "modules.exp": 100,
                        "modules.SPH": 0
                    }
                });

            }

            //notify user
        })
    }
    emit(event, ...args) {
        const [action, type, condition] = event.split('.');

        //hook.info("**PROGRESSION EVENT:** "+ `\`${event}\` - \`\`\`${ JSON.stringify([args[0].userID,args[0].value,args[0].setValue])}\`\`\``)
        super.emit('*', event, ...args); // Catch-all
        super.emit(action, event, ...args); // emit top-level
        if (type) super.emit(`${action}.${type}`, event, ...args); // emit specific
        if (condition) super.emit(`${action}.${type}.${condition}`, event, ...args); // emit super specific
    }
    async getUserQuests(userID) {

        let quests = (await DB.users.findOne({ id: userID }).noCache().lean())?.quests; //this.userQuestsCache.get(userID);
        if (!quests) {
            const userData = await DB.users.findOne({ id: userID }).noCache().lean() || [];
            quests = userData.quests || [];
            //this.userQuestsCache.set(userID,quests);
        }

        return quests;
    }

    async updateProgress(userID, questUniqueID, value = 1, msg) {
        await DB.users.updateOne({ id: userID, "quests._id": questUniqueID }, { $inc: { 'quests.$.progress': value } }, { new: !0 });
        if (msg) this.checkStatusOne(questUniqueID, userID, msg);
    }

    async overrideProgress(userID, questUniqueID, value = 0, msg) {
        await DB.users.updateOne({ id: userID, "quests._id": questUniqueID }, { $set: { 'quests.$.progress': value } }, { new: !0 });
        if (msg) this.checkStatusOne(questUniqueID, userID, msg);
    }

    async updateAll(userID, quests) {
        await DB.users.set(userID, { $set: { quests } });
        //this.userQuestsCache.set(userID,quests);
    }

    async checkStatusAll(userID, msg) {
 
        //if (this.userCheckQueue.get(userID) === true) return console.log('rejected'.red);
        this.userCheckQueue.set(userID, true);
 

        let userQuests = await this.getUserQuests(userID);

        if (userQuests) {
            for (let i in userQuests) {

                let quest = userQuests[i];
 
                await setImmediate(0, { ref: false });
 


                if (quest.progress >= quest.target) {
                    await DB.users.updateOne({ id: userID, "quests._id": quest._id }, { $set: { 'quests.$.completed': true } }, { new: !0 });
                    if (msg && !quest.completed) return Progression.emit("QUEST_COMPLETED", quest, { msg, userQuests, userID });
                };
                if (quest.progress && !quest.target) {
                    await DB.users.updateOne({ id: userID, "quests._id": quest._id }, { $set: { 'quests.$.completed': true } }, { new: !0 });
                    if (msg && !quest.completed) Progression.emit("QUEST_COMPLETED", quest, { msg, userQuests, userID });
                }
            }
        };
        this.userCheckQueue.set(userID, false);
 
        return userQuests;
    }
    async checkStatusOne(questID, userID, msg) {
        let userQuests = await this.getUserQuests(userID);
        if (!userQuests) return [];

        const quest = userQuests.find(q => q._id == questID.toString());

        await setImmediate(0, { ref: false });

        if (quest.progress >= quest.target) {
            await DB.users.updateOne({ id: userID, "quests._id": quest._id }, { $set: { 'quests.$.completed': true } }, { new: !0 });
            if (msg && !quest.completed) return Progression.emit("QUEST_COMPLETED", quest, { msg, userQuests, userID });
        };
        if (quest.progress && !quest.target) {
            await DB.users.updateOne({ id: userID, "quests._id": quest._id }, { $set: { 'quests.$.completed': true } }, { new: !0 });
            if (msg && !quest.completed) Progression.emit("QUEST_COMPLETED", quest, { msg, userQuests, userID });
        }
    }


    async assign(questID, userID) {
        let quest = await DB.quests.get(questID);
        let newQuest = {
            id: quest.id,
            target: quest.target || 1,
            tracker: `${quest.action}.${quest.type || "*"}${quest.condition ? "." + quest.condition : ""}`,
            progress: 0,
            completed: false,
        }
        await DB.users.set(userID, { $push: { quests: newQuest } });
        let quests = (await DB.users.findOne({ id: userID }).noCache().lean())?.quests; // this.userQuestsCache.get(userID) || [];
        //quests.push(newQuest);
        //this.userQuestsCache.set(userID,quests);
        return quest;
    }
    async remove(questID, userID) {
        await DB.users.set(userID, { $pull: { "quests": { id: questID } } });
        const userData = await DB.users.findOne({ id: userID }).noCache().lean();
        //this.userQuestsCache.set(userID,userData.quests);
    }
    async assignArbitrary(newQuest, userID) {
        await DB.users.set(userID, { $push: { quests: newQuest } });
        let quests = (await DB.users.findOne({ id: userID }).noCache().lean())?.quests; //this.userQuestsCache.get(userID) || [];
        //quests.push(newQuest);
        //this.userQuestsCache.set(userID,quests);
        return newQuest;
    }

    async available(userID) {
        const userData = await DB.users.findOne({ id: userID }).noCache().lean();
        return (await DB.quests.find({ public: true, reveal_level: { $lte: userData.modules.level } }).lean());
    }

    fulfillsTracker(eventTracker, quest) {

        const [questAction, questScope, questCondition, ...questExtras] = quest.tracker.split('.');
        const [eventAction, eventScope, eventCondition, ...eventExtras] = eventTracker.split('.');

        /* NOTE -- INSPECT EVENTS

        console.table({
            quest: [questAction, questScope, questCondition, ...questExtras] ,
            event: [eventAction, eventScope, eventCondition, ...eventExtras]
        })
        //*/
        
        if (eventAction === "streak" && questAction !== "streak") return false;

        if(quest.tracker === eventTracker || quest.tracker === "*" || quest.tracker === "*.*" || quest.tracker === "*.*.*"  ) { // PERFECT MATCH
            console.log("[Progression]".blue, "Perfect Match".green, eventTracker,"/",quest.tracker )
            return true;
        } else if (questAction === eventAction && (((questScope || '*') === (eventScope || '*') && questCondition === eventCondition) || (questScope || '*') === '*')) {
            console.log("[Progression]".blue, "Match Scope (arg 2)".green, eventTracker, "/", quest.tracker)
            return true;
        } else if (questAction === eventAction && questScope === eventScope && ((questCondition || '*') === (eventCondition || '*') || (questCondition || '*') === '*')) {
            console.log("[Progression]".blue, "Match Condition (arg 3)".green, eventTracker, "/", quest.tracker)
            return true;
        }
        return false;
    }

    async updateQuestTracker(userID, eventTracker, value = 1, options) {

        let userQuests = await this.getUserQuests(userID);
        if (!userQuests) return [];

        for (let quest of userQuests) {
            if (this.fulfillsTracker(eventTracker, quest)) {
                await setImmediate((await processQuest(this, quest)), { ref: false });
            }
        }

        function processQuest(parent, q) {
            if (typeof options?.valueSet == 'number')
                return parent.overrideProgress(userID, q._id, options.valueSet, options.msg);
            else
                return parent.updateProgress(userID, q._id, value, options.msg);
        }
    }

}

async function isPartOfAchievement(param, value, options) {
    if (!ACHIEVEMENTS.length) await ACHIEVEMENTS;
    if (!ACHIEVEMENTS.length) return false;
    return !!ACHIEVEMENTS.find(a => a.condition.includes(param));
}


const init = () => {
    global.Progression = new ProgressionManager();
    return global.Progression;
}

async function questCompletedMsg(userQuest, userID) {
    if (!userID) return " • Errand Completed Error";
    let disUser = PLX.resolveUser(userID);
    const quest = await DB.quests.get(userQuest.id);
    const currentUserQuests = (await DB.users.findOne({ id: userID }, { quest: 1 }).noCache())?.quests || [];

    await wait(3);

    // DOUBLE-CHECK
    if (currentUserQuests.find(q => userQuest._id.toString() == q._id)?.completed) return;

    const embed = {};
    await DB.users.set(userID, {
        $inc: {
            "modules.exp": quest.rewards?.exp || 0,
            "modules.RBN": quest.rewards?.RBN || 0,
            "modules.SPH": quest.rewards?.SPH || 0
        }
    });
    const createdAt = new Date(parseInt(userQuest._id.toString().substring(0, 8), 16) * 1000).getTime();
    const completion = formatDistanceToNow(createdAt);
    disUser = await disUser;

    embed.footer = { icon_url: disUser.avatarURL, text: ` ${disUser.tag} • Completed in: ${completion}` };
    embed.timestamp = new Date();

    embed.description = `${_emoji('yep')} \`COMPLETED\` **${quest.name}**
*${quest.INSTRUCTION}*
    ${[
            (quest.rewards?.exp ? `${_emoji('EXP')}**${quest.rewards.exp}**  ` : ""),
            (quest.rewards?.RBN ? `${_emoji('RBN')}**${quest.rewards.RBN}**  ` : ""),
            (quest.rewards?.SPH ? `${_emoji('SPH')}**${quest.rewards.SPH}**  ` : "")
        ].filter(e => !!e).join('\u2002•\u2002')}
    `;

    return { embed };
}

module.exports = { ProgressionManager, init };



// command
//send params: 
    // Command Label
    // Parameter ID
    // Parameter value
    // MSG

/*


spend/earn
    RBN
    SPH
    JDE
    PSM
    TKN
    COS

        <SOURCE>

        example: earn.RBN.blackjack
            ommitting source = any

craft
    <ITEM FIELD NAME> (rarity, id, type)

lootbox
    open
    reroll
buy
    bg
    medal
    market
play
    <COMMAND LABEL>
        <SPECIAL CONDITION>
            | examples:
            |    play.blackjack.insurance
            |    play.roulette.5friends

command
    <COMMAND LABEL>
        <SPECIAL CONDITION> (none if just usage)




EMIT EVENT:
([action* , type* , (condition)], value)
or
("action.type.condition", value)


*/
