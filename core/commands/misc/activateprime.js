

const init = async (msg) => {

    const USERDATA = await DB.users.findOne({id:msg.author.id}).lean().exec();
    const UNCLAIMED = new Date().getMonth() !==  new Date(USERDATA.prime?.lastClaimed).getMonth();

    let MAXPREM = USERDATA.prime?.maxServers || 0;
    

    let userPremiumCount = USERDATA.prime?.servers?.length || 0;
    let DD = new Date();
    let NN = DD.getMonth(); 

    
    if(msg.args[0] === "info"){
        if( MAXPREM < 1 ) return msg.channel.send(_emoji('nope')+"**Not eligible**");
        if( UNCLAIMED ) msg.channel.send(_emoji('nope')+"**Rewards unclaimed** \n*Please try `+rewards`.");
        return msg.channel.send(_emoji(USERDATA.prime?.tier)+" **Prime Servers Info:** `"+`${userPremiumCount}/${MAXPREM}\` \`\`\`${USERDATA.prime?.servers?.join(' ')||"-- No Servers --"}`+"```");
    }

    const SVdata = await DB.servers.findOne({id: msg.args[0]}).lean().exec();



   

    if(msg.author.id == "88120564400553984") MAXPREM = 999;

    let unwelcome = ["462316885195882508","322455878336905216 "]
   

    if( msg.guild.id != '277391723322408960' ) return msg.channel.send(_emoji('nope')+"**Must be used in Pollux's official server** | Server not Activated");
    if( MAXPREM < 1 ) return msg.channel.send(_emoji('nope')+"**Not eligible** | Server not Activated");

    if( !SVdata ) return msg.channel.send(_emoji('nope')+"**Server not found** | Server not Activated");
    if (unwelcome.includes(SVdata.id)) return msg.channel.send(_emoji('nope')+"**Server ineligible for Premium** | Server not Activated");
    if( USERDATA.prime?.servers?.includes(SVdata.id) ) return msg.channel.send(_emoji('nope')+"**Server already activated** | Nothing has changed");
 
    if( UNCLAIMED) return msg.channel.send(_emoji('nope')+"**Rewards unclaimed** | Server not Activated\n*Please try `+rewards` before trying this.");
    if( userPremiumCount >= MAXPREM ) return msg.channel.send(_emoji('nope')+"**Max Servers Activated** `["+`${userPremiumCount}/${MAXPREM} : ${(USERDATA.switches||{}).premiumServers}`+"]` | Server not Activated");
  
    

    //await DB.servers.set(SVdata.id,{$set:{'premium' : true}});
    //await DB.users.set(msg.author.id,{$inc:{'prime.servers' : 1}});
    await DB.users.set(msg.author.id,{$set:{'prime.maxServers': MAXPREM}});
    await DB.users.set(msg.author.id,{$push:{'prime.servers' : SVdata.id}});

    

    msg.channel.send(
        
        {
            content: _emoji('yep')+"**All Set!** | Server **"+(SVdata.name||(SVdata.meta||{}).name)+"** Activated!"+` (${1+userPremiumCount}/${MAXPREM})`,
            embed: {description: "Invite Prime Pollux [HERE](https://pollux.gg/invite/prime?sv="+ SVdata.id +")"}
        });


  }

module.exports={
    init
    ,pub:true
    ,cmd:'activateprime'
    ,cat:'misc'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:[]
}