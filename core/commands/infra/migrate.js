const YesNo = require('../../structures/YesNo.js')
// TODO[epic=translations,seq=1] ?? migrate
 

function SAPPHIREFACTOR(don, pastDon){
let tiers = {
    antimatter: 10,
    astatine: 8,
    uranium: 7,
    zircon: 6,
    palladium: 5,
    lithium: 4,
    carbon: 4,
    iridium: 3,
    iron: 3,
    aluminium: 2,
    plastic: 1,
  }

 return (1+(tiers[don] || 0)) + ( (1+ (tiers[pastDon] || 0)) / 10)
}

const init = async function (msg,args){


    const embed = {};
    const yesNoOptions = {embed,clearReacts:true,time:120e3};

    let userData = await DB.users.get(msg.author.id);

    embed.color = 0x2b2b3F;
    embed.title = "Transfer in progress..."
    embed.description = `
Be sure to read and agree with our new [**Privacy Policy**](${paths.DASH}/privacy) and [**Terms of Service**](${paths.DASH}/terms) before continuing.
Pollux collects usage data for analytics and telemetry purposes and does not store messages. Violation of terms might lead to permanent blacklisting.

**Do you agree with those?**
    `
    embed.footer = {icon_url: msg.author.avatarURL,text: `Progress: 🟦⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛`}

    let prompt = await msg.channel.send({embed});

    let step = await YesNo(prompt,msg,false,false,false,yesNoOptions);
    if (!step) return;

    embed.description = `
 • Your Lootboxes will be capped to **10 of each type**, any exceeding boxes will be **destroyed**.
 • Your **Rubines** will be reset. You'll get to keep 5% of what you have now, + your current Daily Streak × 15.
 • Your **Jades** will be halved.
 • Your **Sapphires** will be increased by **20%** *(if you have an active supporter tier you get +10% per tier level. Max +80%)*.
 • Your **Marriages** will be transferred unless they're with yourself or with a repeated person, if someone you're married to already did the transfer, they will be skipped.
 
 • Your **Inventory** will be kept, but we'll convert it to the new system, this might take a while. Stuff like event boxes might be lost in this step.
 • You will receive a special "Touhou Classic" deck skin for being a pre-Polaris player, thank you~.
 • You will receive 1 Sapphire for every month of daily streak (applied *after* the 20%+ multi).
 

**Are you ready?**
    `
    embed.color = 0x2b2b3F;
    embed.footer = {icon_url: msg.author.avatarURL,text: `Progress: 🟦🟦⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛`}

    await wait(1);
    await prompt.edit({embed});
    await wait(2);
    
    
    step = await YesNo(prompt,msg,false,false,false,yesNoOptions);
    if (!step) return;
    
    
    embed.description = `
${_emoji('loading')} • Transferring marriage
       `
       embed.color = 0x2b2b3F;
       embed.footer = {icon_url: msg.author.avatarURL,text: `Progress: 🟦🟦🟦⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛`}
       
    await wait(1);
    await prompt.edit({embed});
    let marr_mig = require('../misc/mrgt.js');
    let marriage_transfer_res = await new Promise(async (res,rej)=>{
        await marr_mig.init(msg,args,res)
        .catch(err=>{
            console.error(err);
            rej(err);
        });
    }).timeout(15e4).catch(err=>{
        
        embed.color = 0xFF5500;
        embed.title = "Migration Aborted!"
        embed.footer.text = "TIMEOUT"
        prompt.edit({embed})
        return null;
    });

    if(!marriage_transfer_res) return "Something went wrong with your migration process. Please try again.";
     

    embed.description = `
${_emoji('yep')} • Transferring marriages
${_emoji('loading')} • Converting inventory

           `
    embed.color = 0x2b2b3F;
    embed.footer = {icon_url: msg.author.avatarURL,text: `Progress: 🟦🟦🟦🟦⬛⬛⬛⬛⬛⬛⬛⬛⬛`}
    await wait(1);
    await prompt.edit({embed});
    
    
    const oldInventory = userData.modules.inventory;
    const newInventory = [];

    oldInventory.forEach((item) => {
        if(item.id) return;
        const currItem = newInventory.find((sub) => sub.id === item);

        if (currItem){
            if(currItem.id.includes('lootbox') && currItem.count < 10) currItem.count++;
        } 
        else newInventory.push({ id: item, count: 1 });
    });
    
    await DB.users.set(msg.author.id, {$set: {'modules.inventory': newInventory} }).catch(console.error);

    userData.modules.inventory = newInventory; 

    await wait(1);
    



           
    embed.description = `
${_emoji('yep')} • Transferring Marriages
${_emoji('yep')} • Converting Inventory
${_emoji('loading')} • Capping Lootboxes

`
    embed.color = 0x2b2b3F;
    embed.footer = {icon_url: msg.author.avatarURL,text: `Progress: 🟦🟦🟦🟦🟦⬛⬛⬛⬛⬛⬛⬛⬛`}
    await wait(1);
    await prompt.edit({embed});

 
    await wait(1);


           
    embed.description = `
${_emoji('yep')} • Transferring Marriages
${_emoji('yep')} • Converting Inventory
${_emoji('yep')} • Capping Lootboxes
${_emoji('loading')} • Recalculating Gemstones
${_emoji('loading')} • Transferring Daily Streak

`
    embed.color = 0x2b2b3F;
    embed.footer = {icon_url: msg.author.avatarURL,text: `Progress: 🟦🟦🟦🟦🟦🟦⬛⬛⬛⬛⬛⬛⬛`}
    await wait(1);
    await prompt.edit({embed});
    
    let newRubines = Math.min( userData.modules.rubines *.05 + userData.modules.dyStreakHard * 10,50000);
    let oldRubines = userData.modules.rubines;
    let jades      = ~~(userData.modules.jades / 2);
    let saph       = ~~(userData.modules.sapphires * (SAPPHIREFACTOR(userData.donator,userData.formerDonator)) / 10 + 1 );
    
    await DB.users.set(msg.author.id, {$set: 
        {
            'counters.daily.streak' : userData.modules.dyStreakHard,
            'counters.daily.last' : userData.modules.daily,
            'modules.RBN' : newRubines,
            'modules.rubinesOld' : oldRubines,
            'modules.JDE' : jades,
            'modules.SPH' :saph,
        } 
    })
    


    await wait(1);


           
    embed.description = `
${_emoji('yep')} • Transferring Marriages
${_emoji('yep')} • Converting Inventory
${_emoji('yep')} • Capping Lootboxes
${_emoji('yep')} • Recalculating Gemstones
${_emoji('yep')} • Transferring Daily Streak (${userData.modules.dyStreakHard})
${_emoji('loading')} • Baking a Cake`
    embed.color = 0x2b2b3F;
    embed.footer = {icon_url: msg.author.avatarURL,text: `Progress: 🟦🟦🟦🟦🟦🟦🟦⬛⬛⬛⬛⬛⬛`}
    await wait(1);
    await prompt.edit({embed});
    msg.channel.send({embed:{description:`(${newRubines} ${_emoji('RBN')}) (${jades} ${_emoji('JDE')}) (${saph} ${_emoji('SPH')})`,title:"Gemstones Recalculated"}})
    embed.description+= `\n${_emoji('loading')} • Awarding **Touhou Classic** Deck Skin`
    embed.footer = {icon_url: msg.author.avatarURL,text: `Progress: 🟦🟦🟦🟦🟦🟦🟦🟦⬛⬛⬛⬛⬛`}
    await wait(2);

    await DB.users.set(msg.author.id,{$inc:{'modules.SPH': -1 * marriage_transfer_res.cost || 0}})

           
    embed.description = `
${_emoji('yep')} • Transferring Marriages
${_emoji('yep')} • Converting Inventory
${_emoji('yep')} • Capping Lootboxes
${_emoji('yep')} • Recalculating Gemstones
${_emoji('yep')} • Transferring Daily Streak (${userData.modules.dyStreakHard})
${_emoji('loading')} • Baking a Cake
${_emoji('yep')} • Awarding **Touhou Classic** Deck Skin


`

    await DB.users.set(msg.author.id,{$addToSet: {'modules.skinInventory':'casino_touhou-classic' } });


    embed.color = 0x2b2b3F;
    embed.footer = {icon_url: msg.author.avatarURL,text: `Progress: 🟦🟦🟦🟦🟦🟦🟦🟦🟦⬛⬛⬛⬛`}
    await wait(1);
    await prompt.edit({embed});
    await wait(1);
    await wait(1);


           
    embed.description = `
${_emoji('yep')} • Transferring Marriages
${_emoji('yep')} • Converting Inventory
${_emoji('yep')} • Capping Lootboxes
${_emoji('yep')} • Recalculating Gemstones
${_emoji('yep')} • Transferring Daily Streak (${userData.modules.dyStreakHard})
${_emoji('loading')} • Baking a Cake
${_emoji('yep')} • Awarding **Touhou Classic** Deck Skin
${_emoji('loading')} • Declaring Rubines Income Tax 

`
    embed.color = 0x2b2b3F;
    embed.footer = {icon_url: msg.author.avatarURL,text: `Progress: 🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦⬛⬛⬛`}
    await wait(1);
    await prompt.edit({embed});
    await wait(1);


           
    embed.description = `
${_emoji('yep')} • Transferring Marriages
${_emoji('yep')} • Converting Inventory
${_emoji('yep')} • Capping Lootboxes
${_emoji('yep')} • Recalculating Gemstones
${_emoji('yep')} • Transferring Daily Streak (${userData.modules.dyStreakHard})
${_emoji('loading')} • Baking a Cake
${_emoji('yep')} • Awarding **Touhou Classic** Deck Skin
${_emoji('yep')} • Declaring Rubines Income Tax 
${_emoji('loading')} • Converting Cosmetics IDs

`



embed.color = 0x2b2b3F;
embed.footer = {icon_url: msg.author.avatarURL,text: `Progress: 🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦⬛⬛`}
    await wait(1);
    await wait(1);
    await prompt.edit({embed});
    
    let myBGs = userData.modules.bgInventory;
    let myBGsFULL = await DB.cosmetics.find({code:{$in:myBGs}}).lean();

    //await DB.users.set(msg.author.id, {$set:{'modules.bgInventory': myBGsFULL.map(b=>b.id) }});

           
    embed.description = `
${_emoji('yep')} • Transferring Marriages
${_emoji('yep')} • Converting Inventory
${_emoji('yep')} • Capping Lootboxes
${_emoji('yep')} • Recalculating Gemstones
${_emoji('yep')} • Transferring Daily Streak (${userData.modules.dyStreakHard})
${_emoji('loading')} • Baking a Cake
${_emoji('yep')} • Awarding **Touhou Classic** Deck Skin
${_emoji('yep')} • Declaring Rubines Income Tax 
${_emoji('nope')} • Converting Cosmetics IDs (Waiting for BGs sheet)

`
    embed.color = 0x2b2b3F;
    embed.footer = {icon_url: msg.author.avatarURL,text: `Progress: 🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦⬛`}
    await wait(1);
    await wait(1);
    await prompt.edit({embed});
    await wait(1);


           
    embed.description = `
${_emoji('yep')} • Transferring Marriages
${_emoji('yep')} • Converting Inventory
${_emoji('yep')} • Capping Lootboxes
${_emoji('yep')} • Recalculating Gemstones
${_emoji('yep')} • Transferring Daily Streak (${userData.modules.dyStreakHard})
${_emoji('yep')} • Baking a Cake
${_emoji('yep')} • Awarding **Touhou Classic** Deck Skin
${_emoji('yep')} • Declaring Rubines Income Tax 
${_emoji('nope')} • Converting Cosmetics IDs (Waiting for BGs sheet)

`
    embed.color = 0x2b2b3F;
    embed.footer = {icon_url: msg.author.avatarURL,text: `Progress: 🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦`}
    await wait(1);
    await wait(1);
    await prompt.edit({embed});
    await wait(1);
    
    msg.channel.send("All set! Your account has been migrated to the New Super Fancy Pollux Database™ successfully! Enjoy the new features~")
    await wait(1);
    msg.channel.send("*Ah, also. Have this cake!*")
    await wait(1);
    msg.channel.send({
        embed:{
            title: `You received **1 Polaris Cake**`
            ,thumbnail: {url:'https://cdn.discordapp.com/emojis/446901835865784321.png'}
            ,description:`
***Food Items** are used to recover **Stamina**, which is consumed to perform certain actions.
Try using \`${msg.prefix}food info\` to learn more!*`
        }
    })


}


module.exports={
    init
    ,pub:true
    ,cmd:'migrate'
    ,cat:'infra'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:[]
}