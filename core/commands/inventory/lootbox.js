const INVENTORY = require('../../archetypes/Inventory');

const INVOKERS   = new Map();
const INV_STATUS = new Map();
const LOOTING    = new Map();

const init = async function (msg,args,userID){
    
    if(userID && (args[10]||{}).id != userID) return "Only the owner can see inside";
    msg.lang = msg.lang||[msg.channel.LANG||'en', 'dev'];


    const userInventory = new INVENTORY(userID||msg.author.id,"box");
    const Inventory     = await userInventory.listItems( args[10] );
    
    const embed = {color: 0xd14362 , thumbnail: {url: paths.CDN+"/build/LOOT/lootbox_trans_80.png"} }
    embed.description = 
        Inventory.length > 0 
            ? Inventory.map(i=> `${_emoji(i.rarity)} ${_emoji(i.emoji||i.emoji_alt)} **${i.name}** × ${i.count} \`${msg.prefix||args[11]}open box ${i.rarity}\`` ).join('\n')
            :  `*${rand$t('responses.inventory.emptyJokes',{lngs:msg.lang})}*`
    

    args[0] = msg
    args[1] = Inventory.map(i=>i.rarity)
    INV_STATUS.set(userID || msg.author.id, args[1] );
    
    embed.footer = { 
         text: (args[12]||msg).author.tag
        ,icon_url: (args[12]||msg).author.avatarURL
    }
        

    let response =  {content: `${_emoji('LOOTBOX')} ${$t('responses.inventory.browsingBox',{lngs:msg.lang})}` , embed }; 

    if(userID) return response;
    let res = await msg.channel.send(response);
    INVOKERS.set(userID || msg.author.id, res.id );
    console.log('end')
    return res;
     
}


const open = async function (msg,args,userID){

    args = args.map(a=> typeof a == 'string' ? a.toUpperCase() : a);
    
    INVOKERS.delete(userID||msg.author.id)
    INV_STATUS.delete(userID||msg.author.id)
    
    if(userID && msg.author.id != userID) return "Only the owner can see inside";

    const userInventory = new INVENTORY(userID||msg.author.id,"box");
    const Inventory     = await userInventory.listItems();    
     
    LOOTING.set(userID || msg.author.id, true );
    if(!Inventory.find(bx=>bx.rarity == args[0])) return $t('responses.inventory.noSuchBox',{lngs:msg.lang});  
    require("../cosmetics/loot.js").init(msg,{issuer:"pollux",rarity:args[0]}).catch(console.error).then(done=> LOOTING.delete(userID || msg.author.id, true) );
}

const reactionOption = (rar) => {     
    return {        
        emoji: _emoji(rar).reaction,
        type: "cancel",
        response: (msg,args,uid)=>{
            return open(args[0],[rar,args[1]],uid);            
        },
        filter:(msg,emj,uid)=> INVOKERS.get(uid) == msg.id && INV_STATUS.get(uid).includes(emj.substr(0,2).replace('_','')) && !LOOTING.get(uid)
    }
}

module.exports={
    init, open
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
                invalidUsageMessage:  (msg)=> {PLX.autoHelper( 'force', {msg, cmd: "lootbox", opt: "cosmetics" } )}
            }
        }
    ]
    ,reactionButtons: ["C","U","R","SR","UR"].map(reactionOption)

}

