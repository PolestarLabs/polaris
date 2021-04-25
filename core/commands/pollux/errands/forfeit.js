const {FORFEIT,parseQuestItem} = require('./_meta.js');
const { TimedUsage } = require("@polestar/timed-usage");
const moment = require("moment");

const init = async function (msg,args){

    moment.locale(msg.lang[0]);
    
    const newForfeit = await new TimedUsage( "errandForfeit", { day: FORFEIT } ).loadUser(msg.author);
    let userErrands = await Progression.getUserQuests(msg.author.id);
    let notCompleted = userErrands.filter(e=> !e.completed);

    let errandsData = await DB.quests.find({id: {$in: notCompleted.map(e=>e.id)} }).noCache().lean();

    



    if (newForfeit.available){

    }else{

    }

}

module.exports={
    init
    //,argsRequired
    //,aliases:[]
}