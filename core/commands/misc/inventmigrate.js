const init = async function (msg){

    const userData = await DB.users.get(msg.author.id);
    const oldInventory = userData.modules.inventory;

    const newInventory = []
    
    oldInventory.forEach(item=>{
        let currItem = newInventory.find(sub => sub.id == item)
        if( currItem ) currItem.count++;
        else newInventory.push( { id: item, count: 1 } );
    })

    console.log(newInventory)
    msg.channel.send("```js\n"+JSON.stringify(newInventory).replace(/},/g,'},\n').slice(0,1990)+"```")

}
module.exports={
    init
    ,pub:true
    ,cmd:'inventmigrate'
    ,perms:3
    ,cat:'misc'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:[]
}