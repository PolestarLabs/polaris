const {Embed} = require('../../utilities/Gearbox');
const INVENTORY = require('../../archetypes/Inventory');




const init = async function (msg,args,userID){
    if(userID && (args[0]||{}).id != userID) return "Only the owner can see inside";

    const userInventory = new INVENTORY(userID||msg.author.id,"box");
    const Inventory     = await userInventory.listItems( args[0] );

    let embed =
    {
        description: Inventory.map(i=> `${_emoji(i.rarity)} ${_emoji(i.emoji||i.emoji_alt)} **${i.name}** × ${i.count} \`${msg.prefix||args[1]}open box ${i.rarity}\`` ).join('\n')
    }


    return {content: `${_emoji('LOOTBOX')} Browsing **Lootbox** Inventory` , embed } 
 
}


const open = async function (msg,args,userID){

    console.log(args)
    try{

        if(userID && (args[1]||{}).id != userID) return "Only the owner can see inside";
    }catch(e){
        console.log(e)
    }
    console.log("papa")
    
    const userInventory = new INVENTORY(userID||msg.author.id,"box");
    const Inventory     = await userInventory.listItems();
    console.log("tutu")
    
    if(!Inventory.find(bx=>bx.rarity == args[0])) return "No such box";
    

    (require("../cosmetics/loot.js")).init(msg,{rarity:args[0]})

 
}


module.exports={
    init
    ,pub:true
    ,cmd:'lootbox'
    ,perms:3
    ,cat:'inventory'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['box']
    ,autoSubs:[
        {
            label: 'open',
            gen: open,
            options: {
                argsRequired:true,
                invalidUsageMessage:  (msg)=> {gear.autoHelper( 'force', {msg, cmd: "lootbox", opt: "cosmetics" } )}
            }
        }
    ]
    ,reactionButtons:[
        {
            emoji: _emoji("UR").reaction,
            type: "edit",
            response: async (msg,args,uid)=>{
                console.log('wa')
                msg.author.id = uid;
                await open(msg,["UR"]);
                console.log('wu')
                return "ok"
            },
        }
    ]

}