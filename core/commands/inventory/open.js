const init = async function (msg,args){
      
      let embed = {};
      embed.description = `
     **\\ℹ  -  Available options for \`${msg.prefix}open\`:**
    
    *\`${msg.prefix}open \u200b\`*\u200b**\`booster [name]\`** = Boosterpacks
    *\`${msg.prefix}open \u200b\`*\u200b**\`box [tier]\`** \t = Lootboxes
    \u200b`
      let openMsg
      if(!args[0]) openMsg = $t("responses.warnings.open1",{lngs:msg.lang}) ;
        else openMsg = $t("responses.warnings.open2",{lngs:msg.lang}) ;
      
      return {content: openMsg, embed};
      

}



module.exports={
    init
    ,pub:false
    ,cmd:'open'
    ,perms:3
    ,cat:'inventory'
    ,botPerms:['attachFiles','embedLinks','manageMessages']
    ,aliases:[]
    ,autoSubs:[
        {
            label: 'box',
            gen: require("./lootbox.js").open,
            options: {
                argsRequired:true,
                invalidUsageMessage:  (msg)=> {PLX.autoHelper( 'force', {msg, cmd: "lootbox", opt: "cosmetics" } )}
            }
        },
        {
            label: 'booster',
            gen: require("./boosterpack.js").open,
            options: {
                argsRequired: true,
                invalidUsageMessage: (msg) => { PLX.autoHelper('force', { msg, cmd: "boosterpack", opt: "cosmetics" }) }
            }
        }
    ]
}