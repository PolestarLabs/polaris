const EventEmitter = require("events");
let {ACHIEVEMENTS} = require("./Achievements.js");



class ProgressionManager extends EventEmitter {
    constructor(){
        super();
        this.userQuestsCache = new Map();
    }
    emit(event, ...args){                
        const [action,type,condition] = event.split('.');
        hook.info("**PROGRESSION EVENT:** "+ `\`${event}\` - \`\`\`${ JSON.stringify([...args])}\`\`\``)
        console.log({action,type,condition})
        super.emit('*',event,...args); // Catch-all
        super.emit(action,event, ...args); // emit top-level
        if (type) super.emit(`${action}.${type}`, event, ...args); // emit specific
        if (condition) super.emit(`${action}.${type}.${condition}`, event, ...args); // emit super specific
    }
    async getUserQuests(userID){
        let quests = this.userQuestsCache.get(userID);
        if (!quests){
            const userData = await DB.users.get(userID);
            this.userQuestsCache.set(userID,userData.quests);
            quests = userData.quests;
        }
        return quests;
    }
    async updateProgress(userID,questUniqueID,value){
        const userData = await DB.users.findOneAndUpdate({id:userID,"quests._id":questUniqueID},{$inc:{'quests.$.progress':value}},{new:!0});
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
        userQuests.forEach(quest => {
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
            target: quest.target,
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
        const userData = await DB.users.get(userID);
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
        const userData = await DB.users.get(userID);
        return (await DB.quests.find({reveal_level: {$gte: userData.modules.level} }).lean());
    }
    async updateQuestTracker(userID,tracker,value=1){
        let userQuests = await this.getUserQuests(userID);
        if(!userQuests) return [];

        userQuests.forEach(quest => {
            if(quest.tracker === tracker) this.updateProgress(userID,quest._id,value);
        });
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
        Progression.updateQuestTracker(userID || msg?.author?.id,event,value);
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
    
    /*
    
    Progression.on("spend", async (event,opts)=>{
        let {currency,value,msg,userID} = opts;
        userID = msg?.author?.id || userID;
        const userQuests = await Progression.getUserQuests(userID);
        await Promise.all( userQuests.map(async quest => {        
            const [action,type,condition] = quest.tracker.split('.');
            if(action!=='spend') return;
            if(currency === type){
                await Progression.updateProgress( userID,quest._id,value);
            }
        }));
        if(!msg) return;
        await Progression.checkStatus(userID,msg);    
    })
*/


    Progression.on("QUEST_COMPLETED",(event,quest,opts)=>{
        const {msg,userQuests} = opts;
        console.log({event,quest,opts})

        
        //award rewards;
        msg.channel.send("Quest completed msg `"+quest.id+"`")
            .catch(()=>{
                PLX.getDMChannel(msg.author.id).then(DM=>
                    DM.createMessage("Dm Quest completed msg")
                ).catchReturn(0);
            });
        if(userQuests?.every(q=>q.completed)){
            //award extra bonus
            msg.channel.send("Extra bonus msg `all quests`")
        }
        
        //notify user
    })
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
