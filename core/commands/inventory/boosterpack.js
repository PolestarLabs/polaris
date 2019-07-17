const {Embed} = require('../../utilities/Gearbox');
const DB = require('../../database/db_ops');
const Boxes = DB.items.find({type:"boosterpack"}).lean().exec();

const getUserData = (m)=> DB.users.get(m.author.id);

const listBoxes = async (uD)=>{
    let boxes = await Boxes; 
    let Inventory =  boxes.map(box=> {
        let thisItem = uD.modules.inventory.find(itm=> itm.id == box.id && itm.count>0);
        if(thisItem) box.count = thisItem.count;
        else box = null;
        return box;
     }).filter(i=>i!=null);
     return Inventory;
}

const init = async function (msg,args,userID){
    if(userID && (args[0]||{}).id != userID) return "Only the owner can see inside";

    const userData= args[0] || await getUserData(msg);
    const Inventory = await listBoxes(userData);
    let embed = new Embed();

    let invmap = Inventory.map(i=> `${_emoji(i.rarity)}  **${i.name}** × ${i.count} \`${msg.prefix||args[1]}open booster ${i.rarity}\`` ).join('\n');

    embed.description = ""+invmap



    return {content: `${_emoji('BOOSTER')} Browsing **Boosterpack** Inventory` , embed } 
 
}
const open = async function (msg,args){

    const userData= await getUserData(msg);
    const Inventory = await listBoxes(userData);

    if(!Inventory.find(bx=>bx.rarity == args[0])) return "No such booster";

    (require("../cosmetics/openbooster.js/index.js")).init(msg,{rarity:args[0]})

 
}


module.exports={
    init
    ,pub:true
    ,cmd:'boosterpack'
    ,perms:3
    ,cat:'inventory'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['booster']
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
}