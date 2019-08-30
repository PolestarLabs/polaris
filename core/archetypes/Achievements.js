const {EventEmitter} = require("events");
class AchievementsManager extends EventEmitter{

    constructor(){
        super()
    }

    get(ach){
        return DB.achievements.findOne({id:ach}).lean().exec();
    }

    async give(user,ach){
        await DB.achievements.award(user,ach);
        return this.get(ach);
    }

    has(ach,user){
        return new Promise(async (resolve)=>{
            const userData = await DB.users.get(user.id||user);
            resolve (!!((userData.modules.achievements||[{}]).find(a=>a.id == ach)));
        })
    }
    progress(ach,user){
        return new Promise(async (resolve)=>{
            if(!user || !user.modules && user.id || typeof user == 'string') user = await DB.users.get(user.id||user);
            let statistics  = ((await DB.control.get(user.id)) || {data:{}}).data.statistics;
            let achiev      = await this.get(ach);
            let conditions  = achiev.condition ? achiev.condition.split('>='):0;
            let goal        = conditions?conditions[1]||1:1;
            let current     = eval(`try{${ conditions[0]||0 }}catch(err){0}`);
            let percent     = (Math.floor(current * 100 / goal)/100)||0;

            resolve ( {current, goal, percent } );

        })
    }

    check(userData, beau,awardRightAway){
        return new Promise(async (resolve,reject)=>{
            if(!userData || !userData.modules && userData.id || typeof userData == 'string') userData = await DB.users.get(userData.id||userData);
            if(!userData) reject("[AchievementsManager] UserData is Null");
            let statistics = ((await DB.control.get(userData.id)) || {data:{}}).data.statistics;

            let res = await DB.achievements.find({},{_id:0,id:1,reveal_requisites:1,reveal_level:1,advanced_conditions:1,condition:1}).lean().exec().then(a=>
                Promise.all(
                    a.map(async achiev=>{
                        let user = userData;
                        let revealed = userData.modules.level >= achiev.reveal_level && (achiev.achiev_requisites ? this.has(userData.id, achiev.achiev_requisites)||true : true) && !!eval(achiev.reveal_requisites)
                        let C1 =  eval(`try{${achiev.condition}}catch(err){false}`);
                        let C2;
                        if(achiev.advanced_conditions && achiev.advanced_conditions.length > 0) C2 = achiev.advanced_conditions.every(acv=> { let user = userData; return eval(`try{${acv}}catch(err){false}`);});
                        else C2 = true;
                        let awarded = (userData.modules.achievements.find(a=>a.id==achiev.id)||{unlocked:false}).unlocked;
                        let switcher = (c)=> c?"✔️":"❌" 

                        if(awardRightAway && C1 && C2) this.emit('award', achiev.id, user.id);
                        if(beau) return `${achiev.id.padEnd(20," ")} 👁:${switcher(revealed)}  🔒:${switcher((C1 && C2))} 🏅:${switcher(awarded)} `;
                        
                        return { achievement: achiev.id, revealed, unlocked: (C1 && C2) , awarded, progress: await this.progress(achiev.id,userData)  };
                    })
                )
            );
            return resolve(res);
        })
    }

}



global.Achievements = new AchievementsManager();

Achievements.on('award', async (achievement,uID,options={msg:{},DM : false})=>{
    const {DM,msg} = options;
    let userData = await DB.users.get(uID);
    let awarded = await Achievements.give(userData,achievement);
    DB.users.set(uID, {$inc:{'modules.exp':awarded.exp||100}} );
    let DMchannel = await PLX.getDMChannel(uID);
    let channel = DM?DMchannel:msg.channel||DMchannel;

    if(!channel) return awarded;

    const embed = {
        title: $t('interface.achievementUnlocked'       , {lngs:msg.lang||['dev']}),
        description: "**"+awarded.name+"**\n> *"+$t(`achievements:${awarded.id}.howto`, {lngs:msg.lang||['dev']})+"*",
        thumbnail:   { url: paths.CDN + `/build/achievements/${awarded.icon}.png` },
        timestamp:   new Date(),
        color:      awarded.color || 0xEf9f8a,
        footer:   msg.author?{text: msg.author.tag, icon_url: msg.author.avatarURL}:{}
    }

    if(!((channel.DISABLED||[]).includes("ACHIEVEMENTS")) || (msg||{}).command){
        channel.createMessage({embed}).catch(e=>{
            console.log(e)
            DMchannel.createMessage({embed}).catch(e=>null);
        });
    }else if(userData.allowDMs !== false ){
        console.log("X")
        DMchannel.createMessage({embed}).catch(e=>null);
    }

})

module.exports = AchievementsManager



 