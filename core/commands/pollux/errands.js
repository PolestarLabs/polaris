const { TimedUsage } = require("@polestar/timed-usage");
const { ProgressionManager } = require("../../archetypes/Progression");
const moment = require("moment");
//const Progression = require("../../archetypes/Progression.js");

const INTERVAL = 8 * 60 * 60e3 // 8 Hours


const init = async function (msg){

    const newErrand = await new TimedUsage( "errands", { day: INTERVAL } ).loadUser(msg.author);
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
    
    embed.description = "**Errands Pool**"
    embed.fields = userErrands.map( errand => {
        const thisErrand = errandsData.find(e=>e.id===errand.id);
        const progress = ((Math.min(errand.progress , errand.target || 1)) / (errand.target || 1) );
        return ({
        name: `${errand.completed?_emoji('yep'):errand.progress?_emoji('maybe'):_emoji('nope') } **${ thisErrand.INSTRUCTION ||"UNK" }**`,
        value: `${_emoji('__')} Progress: ${
                "`"+ [...Array(10).keys()].map((b)=> b > ~~(progress*10) ? ' ' : '❚'  ).join('') +"`"
           } ${ progress * 100 }% \n${_emoji('__')} Rewards: ${  
                [
                   (thisErrand.rewards?.exp ? `${_emoji('EXP')}**${thisErrand.rewards.exp}**  ` : ""),
                   (thisErrand.rewards?.RBN ? `${_emoji('RBN')}**${thisErrand.rewards.RBN}**  ` : ""),
                   (thisErrand.rewards?.SPH ? `${_emoji('SPH')}**${thisErrand.rewards.SPH}**  ` : "") 
                ].filter(e=>!!e).join('\u2002•\u2002')
           }`
    })});

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
    
    // NAME PENDING
    ,aliases:['devoirs','quests','tasks']
}