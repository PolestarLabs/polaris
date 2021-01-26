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
            this.userQuestsCache.get(userID,userData.quests);
            quests = userData.quests;
        }
        return quests;
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
    let quests = await Progression.getUserQuests(msg.author.id);

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


Progression.on("QUEST_COMPLETED",(quest,msg)=>{
    //award rewards;
    //remove quest from list;
    //notify user
})


module.exports = ProgressionManager;



// command
//send params: 
    // Command Label
    // Parameter ID
    // Parameter value
    // MSG
