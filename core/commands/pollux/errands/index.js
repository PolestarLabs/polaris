const {FORFEIT,parseQuestItem} = require('./_meta.js');
const { TimedUsage } = require("@polestar/timed-usage");
const moment = require("moment");
//const Progression = require("../../archetypes/Progression.js");

const INTERVAL = 8 * 60 * 60e3 // 8 Hours


const init = async function (msg){

    moment.locale(msg.lang[0])

    const newErrand = await new TimedUsage( "errands", { day: INTERVAL } ).loadUser(msg.author);
    const newForfeit = await new TimedUsage( "errandForfeit", { day: FORFEIT } ).loadUser(msg.author);
    let userErrands = await Progression.getUserQuests(msg.author.id);
    let completed = userErrands.filter(e=> e.completed);

    console.log(userErrands.length,"availableErrands") // 3
    console.log(completed.length,"completed") // 1 
    console.log(  newErrand.available ," newErrand.available ")// false

    if(newErrand.available){
        let availableErrands = await Progression.available(msg.author.id);
        availableErrands = shuffle(availableErrands.filter(e=> !userErrands.map(x=>x.id).includes(e.id)));


        if(userErrands.length >= 5 && completed.length){
            await Progression.remove(completed[0].id,msg.author.id);
        }
        if(userErrands.length - completed.length < 5 ){
            await Progression.assign(availableErrands[0].id,msg.author.id);
            await newErrand.process();
            msg.channel.send(`⭐ **New Errand Available:** \`#${availableErrands[0].id}\` ${availableErrands[0].INSTRUCTION || "UNK"}`);
        }

       
    }

   
    let errandsData = await DB.quests.find({id: {$in: userErrands.map(e=>e.id)} }).noCache().lean();

 
    const embed = {};    
    
    embed.description = "**Errands Pool**" + ` [${userErrands.filter(e=>e.completed).length}/${Math.min(5,userErrands.length)}]`
    const parseQuest = ( errand ) => {
        return parseQuestItem(errandsData, errand);
    };

    embed.fields = [];
    embed.fields.push({name:'\u200b',value:'Ongoing',inline:false});
    embed.fields.push( ...userErrands.filter(e=>e.progress>0 && !e.completed).map(parseQuest) );

    embed.fields.push({name:'\u200b',value:'Not Started',inline:false});
    embed.fields.push( ...userErrands.filter(e=>e.progress==0).map(parseQuest) );

    embed.fields.push({name:'\u200b',value:'Completed',inline:false});
    embed.fields.push( ...userErrands.filter(e=>e.completed).map(parseQuest) );
    console.log({newForfeit})
    embed.fields.push({name:'\u200b',value:`
\`${msg.prefix}errands forfeit\` Abandon one ongoing Errand ${newForfeit.available?`${_emoji('ONL')} **Available**`:`${_emoji('AWY')}${moment.utc(newForfeit.availableAt).fromNow(true)}`}
    `,inline:false});


    //TRANSLATE[epic=translations] Errand Cooldown
    embed.footer =  {
        text: 
            newErrand.available 
            ? `A new Errand is available now. You can have 5 active errands at a time`
            : `A new errand will be available in ${moment.utc(newErrand.availableAt).fromNow(true)}. You can have 5 active errands at a time`
    }

    return {embed,messageReferenceID:msg.id}

}
module.exports={
    init
    ,pub:true
    ,cmd:'errands'
    ,cat:'pollux'
    ,botPerms:['attachFiles','embedLinks']
    ,TEST: true
    // NAME PENDING
    ,aliases:['devoirs','quests','tasks']
    ,subs: ["forfeit"]
}

