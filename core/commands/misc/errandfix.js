

const init = async function (msg, args) {
    const userData = await DB.users.get(msg.author.id);
    const errandsData = await DB.quests.find({ id: { $in: userData.quests?.map(e => e.id) } }).noCache().lean();

    userData.quests.forEach(quest=>{
        const current = errandsData.find(q=>q.id === quest.id);
        if ( `${current.action}.${current.type}.${current.condition}` != quest.tracker ) {
            console.log( "Checking" , quest.INSTRUCTION, quest.tracker,  `${current.action}.${current.type}.${current.condition}` )
            msg.reply(`Clearing broken \`${current.INSTRUCTION}\` (${quest.id}) errand.`);
            Progression.remove(quest.id, msg.author.id);
        }
    });

    return msg.addReaction(_emoji('yep').reaction);
    
}

module.exports={
    init
    ,pub:false
    ,cmd:'errandfix'
    ,cat:'misc'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:[]
}