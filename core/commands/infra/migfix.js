//FIXME(epoc="post-migration-period") Delete this

const init = async function (msg,args){
    let embed = {};
    const userData_OLD = await vDB.users.findOne({ id: msg.author.id }).noCache().lean();
    const userData_NEW = await DB.users.findOne({ id: msg.author.id }).noCache();
    //return "Not ready Yet";
    if (userData_OLD.blacklisted?.length > 1 && userData_OLD.blacklisted != "false") return msg.reply(`${_emoji('nope')} • Blacklisted accounts will have to start over!`);  

    if (args[0] === "inv"){
        return "Closed";
        if (userData_NEW.switches?.migrateFix?.inv) return msg.reply(`${_emoji('nope')} • Your inventory has already been fixed!`);
        const m = await msg.reply(" • Fixing Inventory...");
        

        const oldInventory = userData_OLD.modules.inventory;
        const newInventory = userData_NEW.modules.inventory;
       


        oldInventory.forEach((item) => {
            if (item.id) return;
            const currItem = newInventory.find((sub) => sub.id === item);

            if (currItem) {
                if (!currItem.id.includes("lootbox")) currItem.count++;           
            } else newInventory.push({ id: item, count: 1 });
        });
        await userData_NEW.addItem('streakfix',1);
        await m.edit(" • Fixing Inventory... Streakfix added!" + _emoji('maybe'));
        await wait(3);
        await DB.users.set(msg.author.id, { $set: { "switches.migrateFix.inv":true, "modules.inventory": Object.assign(newInventory,oldInventory) } }).catch(console.error);
        return m.edit(" • Fixing Inventory... **Done**" + _emoji('yep'));
        
    }

    if (args[0] === 'marriage'){
    
        const marryFixes = 1+userData_NEW.switches?.migrateFix?.marry;

        const prompt = await msg.reply(" • Fixing Marriages...");

        const marr_mig = require("../misc/mrgt.js");
        const marriage_transfer_res = await new Promise(async (res, rej) => {
            await marr_mig.init(msg, args, res)
            .catch((err) => {
                console.error(err);
                rej(err);
            });
        }).timeout(15e4).catch((err) => {
            embed.color = 0xFF5500;
            embed.title = "Migration Aborted!";
            embed.footer = {text : "TIMEOUT"};
            prompt.edit({ embed });
            return null;
        });

        if (!marriage_transfer_res) {
            msg.channel.send("Something went wrong with your migration process. Please try again.");
            return false;
        }

        const { size, imported, cost } = marriage_transfer_res;
        await DB.users.set(msg.author.id, { $inc: { "modules.SPH": -1 * (cost+(5*marryFixes||0)) || 0 } });
        this.name += ` (${imported}/${size} - ${_emoji('SPH')}**-${cost+(5*marryFixes||0)}**)`;
        marriage_message = marriage_transfer_res.res;
        
     
        prompt.edit(" • Fixing Marriages... **Done**" + _emoji('yep'));
    }


}
module.exports={
    init
    ,pub:false
    ,cmd:'migfix'
    ,cat:'infra'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:[]
}