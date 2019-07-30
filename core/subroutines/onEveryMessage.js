



// const DB = require('../database/db_ops');
// const gear = require('../utilities/Gearbox');
const Drops = require('./boxDrops').lootbox;

module.exports = async msg => {
  PLX.execQueue=PLX.execQueue.filter(itm=>itm.constructor != Promise);
  PLX.execQueue.push(
    Promise.all([
      levelChecks(msg),
      Drops(msg)
    ]) 
  )

};

async function incrementLocal(msg) {  
  DB.localranks.get({user:msg.author.id,server:msg.guild.id}).then(async data=>{
    if (!data) await DB.localranks.new({U:msg.author,S:msg.guild});
    await DB.localranks.incrementExp({U:msg.author.id,S:msg.guild.id});
  });  
}

async function incrementGlobal(msg) {  
  if(randomize(0,5)==3 && msg.content.length > 20){
    await DB.users.set(msg.author.id,{$inc:{'modules.exp':1}});
  };  
}

async function levelChecks(msg) {

  if (msg.author.bot) return;

  if (msg.guild.id === "110373943822540800") return;



  let   userData    = DB.users.get(msg.author.id);
  let   servData    = DB.servers.get(msg.guild.id);
  let   chanData    = DB.channels.get(msg.channel.id);

  await Promise.all([
    userData = (await userData) || (await DB.users.new(msg.user)),
    servData = (await servData) || (await DB.servers.new(msg.guild)),
    chanData = (await chanData) || (await DB.channels.new(msg.channel))
  ]);



  if(chanData && !chanData.modules.LVUP || !userData ) {
    userData = null;
    servData = null;
    chanData = null;
    return;
  }


  const _FACTOR =  servData.modules.UPFACTOR||0.5;
  const _CURVE = 0.0427899

  const LOCAL_RANK  = (await DB.localranks.get({user:msg.author.id,server:msg.guild.id}))
                    || {user:msg.author.id,server:msg.guild.id,exp:0,level:0};

  let curLevel_G = Math.floor(_CURVE * Math.sqrt(userData.modules.exp));
  //let forNext_G = Math.trunc(Math.pow((userData.modules.level + 1) / _CURVE, 2));
  let curLevel_local = Math.floor(_FACTOR * Math.sqrt(LOCAL_RANK.exp));
  //let forNext_local = Math.trunc(Math.pow(((LOCAL_RANK.level||0) + 1) / _FACTOR, 2));

  if (!(servData.modules.BYPASS || chanData.modules.BYPASS)){
    incrementLocal(msg);
    incrementGlobal(msg);
  };
  
  if(global.piggyback) return;

  ///=======  [LOCAL LVUP] ========///
  if (curLevel_local < LOCAL_RANK.level) {
    //console.log("DELEVEL");
    await DB.localranks.set({server:msg.guild.id,user:msg.author.id},{$set:LOCAL_RANK});
  }

  if (curLevel_local > LOCAL_RANK.level) {
    await DB.localranks.set({user:msg.author.id,server:msg.guild.id},{$set:{level:curLevel_local}});
    
      if(servData.modules.LVUP_local && chanData.modules.LVUP) msg.channel.send("Level Up! >> "+curLevel_local);
      if(servData.modules.AUTOROLES){

        //ADD AUTOROLES
        let AUTOS = servData.modules.AUTOROLES
        let sorting = function(a,b){return b[1]-a[1]};
        AUTOS.sort(sorting);
        let levels = AUTOS.map(r=>r[1]); // 1 5 10 25
        let addinrole;
        let addinrole_lv = 0;

        const roleStack = servData.modules.autoRoleStack === false ? false : true;

        for(let i = 0; i < levels.length; i++){
          msg.member.addRole(AUTOS.find(r=>r[1]==curLevel_local)[0]).catch(e=>"noperms");
          if(roleStack===true){
            msg.member.addRole(AUTOS.find(r=>r[1]<=curLevel_local)[0]).catch(e=>"noperms");
          }else if (roleStack === false){
            msg.member.removeRole(AUTOS.find(r=>r[1]!=curLevel_local)[0]).catch(e=>"noperms");
          }
        }
      }

    //-------------------------------//
  }

  if(servData.modules.LVUP===true){
    ///======= [GLOBAL LVUP] ========///
    if (curLevel_G < userData.modules.level) {
      return;
      //console.log("DELEVEL");
      //await userDB.set(message.author.id,{$set:{'modules.level':curLevel}});
}
    if (curLevel_G > userData.modules.level) {
      await DB.userDB.set(msg.author.id,{$set:{'modules.level':curLevel_G}});
      console.log("[GLOBAL LEVEL UP]".blue,(msg.author.tag).orange, msg.author.id);


      let polizei;
      if(curLevel_G%25==0){
        polizei = "UR"
        await userData.addItem('lootbox_UR_O');
      }
      else if(curLevel_G%15==0){
        polizei = "SR"
        await userData.addItem('lootbox_SR_O');
      }
      else if(curLevel_G%10==0){
        polizei = "R"
        await userData.addItem('lootbox_R_O');
      }
      else if(curLevel_G%5==0){
        polizei = "U"
        await userData.addItem('lootbox_U_O');
      }
      else {
        polizei = "C"
        await userData.addItem('lootbox_C_O');
      }

      servData=null;

      //delete require.cache[require.resolve("./modules/dev/levelUp_infra.js")]
      msg.author.getDMChannel().then(dmChan=>{
        if (userData.switches.LVUPDMoptout===true) return;
        dmChan.createMessage("**+1** x "+_emoji('loot')+_emoji(polizei)+' Level Up Bonus!');
      })
      //require("./modules/dev/levelUp_infra.js").init(msg);
}
    //-------------------------------//
  }

    userData = null;
    servData = null;
    chanData = null;


}
