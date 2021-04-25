const EventEmitter = require("events");
let {ACHIEVEMENTS} = require("./Achievements.js");
const moment = require("moment");

class ProgressionManager extends EventEmitter {
    constructor(){
        super();
        this.userQuestsCache = new Map();
    }
    emit(event, ...args){
        const [action,type,condition] = event.split('.');
        hook.info("**PROGRESSION EVENT:** "+ `\`${event}\` - \`\`\`${ JSON.stringify([args[0].userID,args[0].value,args[0].setValue])}\`\`\``)
        super.emit('*',event,...args); // Catch-all
        super.emit(action,event, ...args); // emit top-level
        if (type) super.emit(`${action}.${type}`, event, ...args); // emit specific
        if (condition) super.emit(`${action}.${type}.${condition}`, event, ...args); // emit super specific
    }
    async getUserQuests(userID){
        
        let quests = this.userQuestsCache.get(userID);
        if (!quests){
            const userData = await DB.users.findOne({id:userID}).noCache().lean();
            quests = userData.quests || [];
            this.userQuestsCache.set(userID,quests);            
        }
        
        return quests;
    }
    async updateProgress(userID,questUniqueID,value=1){

        let updateAttempt = await DB.users.updateOne({id:userID,"quests._id":questUniqueID},{$inc:{'quests.$.progress':value}},{new:!0});
        

        const userData = await DB.users.findOne({id:userID}).noCache();
        //console.log({finalQuests: !!userData?.quests})
        this.userQuestsCache.set(userID,userData.quests);
        return userData.quests;
    }
    async overrideProgress(userID,questUniqueID,value=0){
        await DB.users.updateOne({id:userID,"quests._id":questUniqueID},{$set:{'quests.$.progress':value}},{new:!0});
        const userData = await DB.users.findOne({id:userID}).noCache();
        this.userQuestsCache.set(userID,userData.quests);
        return userData.quests;
    }
    async updateAll(userID,quests){
        await DB.users.set(userID,{$set:{quests}});
        this.userQuestsCache.set(userID,quests);
    }
    async checkStatus(userID,msg){
        
        let userQuests = await this.getUserQuests(userID);
        
        if(!userQuests) return [];
        userQuests.forEach((quest,i) => {
           
            

            //DEBUG
            if(msg.content.includes('-dbg')){    
                msg.channel.send( "```js\n"+JSON.stringify({quest},0,2)+"```" );
                //msg.channel.send( "```js\n"+JSON.stringify({userQuests},0,2)+"```" );
            }
            if(quest.progress >= quest.target) {
                if(msg && !quest.completed) Progression.emit("QUEST_COMPLETED", quest, {msg,userQuests});
                quest.completed = true; 
            };
        });
        await this.updateAll(userID,userQuests);
        return userQuests;
    }
    async assign(questID,userID){
        let quest = await DB.quests.get(questID);
        let newQuest = {
            id: quest.id,
            target: quest.target || 1,
            tracker: `${quest.action}.${quest.type}${quest.condition?"."+quest.condition:""}`,
            progress: 0,
            completed: false,
        }
        await DB.users.set(userID,{ $push:{ quests: newQuest } });
        let quests = this.userQuestsCache.get(userID) || [];
        quests.push(newQuest);
        this.userQuestsCache.set(userID,quests);
        return quest;
    }
    async remove(questID,userID){
        await DB.users.set(userID,{ $pull:{ "quests":{id:questID} } });
        const userData = await DB.users.findOne({id:userID}).noCache().lean();
        this.userQuestsCache.set(userID,userData.quests);
    }
    async assignArbitrary(newQuest,userID){
        await DB.users.set(userID,{ $push:{ quests: newQuest } });
        let quests = this.userQuestsCache.get(userID) || [];
        quests.push(newQuest);
        this.userQuestsCache.set(userID,quests);
        return newQuest;
    }

    async available(userID){
        const userData = await DB.users.findOne({id:userID}).noCache().lean();
            return (await DB.quests.find({reveal_level: {$gte: userData.modules.level} }).lean());
    }
    async updateQuestTracker(userID,tracker,value=1,options){

        
        let userQuests = await this.getUserQuests(userID);
        

        if(!userQuests) return [];

        function processQuest(parent,q){           
            if(typeof options?.valueSet == 'number'){
                return parent.overrideProgress(userID, q._id, options.valueSet);
            }else{
                return parent.updateProgress(userID, q._id, value);
            }
        }

        return Promise.all( userQuests.map(async quest => {
            if(quest.tracker === tracker || quest.tracker === "*") {
                await processQuest(this,quest);
            }else if (quest.tracker === tracker.split('.').slice(0,2).join('.') ) {
                await processQuest(this,quest);
            }else if (quest.tracker === tracker.split('.').shift() ) {
                await processQuest(this,quest);
            }
        }) );
    }

}



async function isPartOfAchievement(param,value,options){
    if(!ACHIEVEMENTS.length) await ACHIEVEMENTS;
    if(!ACHIEVEMENTS.length) return false;
    return !!ACHIEVEMENTS.find(a=> a.condition.includes(param));
}



/*
Progression.on("param", async (value,msg)=>{

})
*/

const init = ()=>{

    global.Progression = new ProgressionManager();

    Progression.on("*", async (event,opts)=>{

        const {value,msg,userID} = opts;

        let [action, scope, condition] = event.split('.');
        console.log(`${"•".cyan} Progression:  ${action?.gray || "*".gray} -> ${scope?.yellow || "*".gray} -> ${condition?.blue || "*".gray} ${
            typeof opts.valueSet == 'number' ? " RESET ".bgRed : `[+${value||1}]`.cyan
        }`)
        
        if (!userID && !msg?.author?.id) return;
        await Progression.updateQuestTracker(userID || msg?.author?.id, event, value, opts);

        if(!msg) return;
        if(!value?.content && !msg?.content) return;
        if (isPartOfAchievement(event)) Achievements.check(msg.author.id,true,{msg:msg||value});
        await Progression.checkStatus(msg.author.id,msg);

        //quests. 

    });
    
    
    Progression.on("craft", async (event,opts)=>{
        const { item,amount,userID,msg } = opts;
        const userQuests = await Progression.getUserQuests(userID);
        await Promise.all( userQuests.map(async quest => {        
            const [action,type,condition] = quest.tracker.split('.');
            if(action!=='craft') return;

            if(item[type] === condition){
                await Progression.updateProgress(userID,quest._id,amount);
            }
        }));
        if(!msg) return;
        await Progression.checkStatus(msg.author.id,msg);    
    });
    
    
    
    Progression.on("spend", async (event,opts)=>{
        return;
        let {value,msg,userID} = opts;
        let [,currency] = event.split('.');

        userID ??= msg?.author?.id;
        const userQuests = await Progression.getUserQuests(userID);
        await Promise.all( userQuests.map(async quest => {
            const [action,type,condition] = quest.tracker.split('.');
            if (condition) return;
            if(action!=='spend') return;
            if(currency === type){
                await Progression.updateProgress( userID,quest._id,value);
            }
        }));
        if(!msg) return;
        await Progression.checkStatus(userID,msg);    
    })



    Progression.on("QUEST_COMPLETED", async (event,quest,opts)=>{
        const {msg,userQuests} = opts;
        moment.locale(msg.lang?.[0]||'en');
        //award rewards;
        msg.channel.send( await questCompletedMsg(quest,msg.author.id) )
            .catch(()=>{
                PLX.getDMChannel(msg.author.id).then( async DM=>
                    DM.createMessage( await questCompletedMsg(quest,msg.author.id) )
                ).catchReturn(0);
            });
        if(userQuests?.every(q=>q.completed)){
            //award extra bonus
            msg.channel.send("Extra bonus msg `all quests`")
        }
        
        //notify user
    })
}

async function questCompletedMsg(userQuest,userID){
    
    const quest =  await DB.quests.get(userQuest.id);
    const embed = {};
    await DB.users.set(userID, {$inc: {
        "modules.exp": quest.rewards?.exp || 0
        "modules.RBN": quest.rewards?.RBN || 0
        "modules.SPH": quest.rewards?.SPH || 0
    }});
    const createdAt = new Date(parseInt(userQuest._id.toString().substring(0,8),16) *1000 ).getTime();
    const completion = moment.utc(createdAt).from(Date.now(),true);

    embed.footer = `Completed in: ${completion}`;
    embed.timestamp = new Date();

    embed.description = `${_emoji('yep')} \`COMPLETED\` **${quest.name}**
*${quest.INSTRUCTION}*
Rewards:\n${[
        (quest.rewards?.exp ? `${_emoji('EXP')}**${quest.rewards.exp}**  ` : ""),
        (quest.rewards?.RBN ? `${_emoji('RBN')}**${quest.rewards.RBN}**  ` : ""),
        (quest.rewards?.SPH ? `${_emoji('SPH')}**${quest.rewards.SPH}**  ` : "")
    ].filter(e => !!e).join('\u2002•\u2002')}
    `;
    console.log('returning',embed.description)
    return {embed};
}

module.exports = {ProgressionManager,init};



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
