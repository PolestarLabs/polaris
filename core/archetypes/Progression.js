const EventEmitter = require("events");
const {ACHIEVEMENTS} = require("./Achievements.js");



class ProgressionManager extends EventEmitter {
    constructor(){
        super();
        this.userQuestsCache = new Map();
    }
    emit(event, ...args){                
        super.emit('*',event,...args); // Catch-all
        super.emit(event, ...args);
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
    async updateProgress(userID,questID,value){
        const userData = await DB.users.findOneAndUpdate({id:userID,"quests.id":questID},{$inc:{'quests.$.progress':value}},{new:!0});
        this.userQuestsCache.set(userID,userData.quests);
        return userData.quests;
    }
    async updateAll(userID,quests){
        await DB.users.set(userID,{$set:{quests}});
        this.userQuestsCache.set(userID,quests);
    }
    async checkStatus(userID,msg){
        let userQuests = await this.getUserQuests(userID);
        userQuests.forEach(quest => {
            if(quest.progress >= quest.target) {
                quest.completed = true;                 
                Progression.emit("QUEST_COMPLETED",quest,msg,userQuests)
            };
        });
        await this.updateAll(userID,userQuests);
        return userQuests;
    }
    async assign(questID,userID){
        let quest = await DB.quests.get(questID);
        await DB.users.set(userID,{
            $push:{
                quests: {
                    id: quest.id,
                    target: quest.target,
                    progress: 0,
                    completed: false,
                }
            }
        });
        return quest;
    }

    async available(userID){
        const userData = await DB.users.get(userID);
        return (await DB.quests.find({reveal_level: {$gte: userData.modules.level} }).lean());
    }

}



async function isPartOfAchievement(param,value,options){
    if(!ACHIEVEMENTS.length) await ACHIEVEMENTS;
    return !!ACHIEVEMENTS.find(a=> a.condition.includes(param));
}



global.Progression = new ProgressionManager();



Progression.on("*", async (param,value,msg)=>{
    if(!value.content && !msg.content) return;
    if (isPartOfAchievement(param)) Achievements.check(msg.author.id,true,{msg:msg||value});
    await Progression.checkStatus(msg.author.id,msg);

    //quests.

});
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


Progression.on("QUEST_COMPLETED",(quest,msg,userQuests)=>{
    //DEBUG
    msg.channel.send( "```js\n"+JSON.stringify({quest},0,2)+"```" );
    msg.channel.send( "```js\n"+JSON.stringify({userQuests},0,2)+"```" );
    
    //award rewards;
    msg.channel.send("Quest completed msg")
        .catch(()=>{
            PLX.getDMChannel(msg.author.id).then(DM=>
                DM.createMessage("Dm Quest completed msg")
            ).catchReturn(0);
        });
    if(userQuests?.every(q=>q.completed)){
        //award extra bonus
        msg.channel.send("Extra bonus msg")
    }
    
    //notify user
})


module.exports = ProgressionManager;



// command
//send params: 
    // Command Label
    // Parameter ID
    // Parameter value
    // MSG
