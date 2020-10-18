const YesNo = require('../../structures/YesNo.js')

const init = async function (msg,args){


    const embed = {};
    const yesNoOptions = {embed,clearReacts:true,time:120e3}

    embed.color = 0x2b2b3F;
    embed.title = "Transfer in progress..."
    embed.description = `
Be sure to read and agree with our new [**Privacy Policy**](${paths.DASH}/privacy) and [**Terms of Service**](${paths.DASH}/terms) before continuing.
Pollux collects usage data for analytics and telemetry purposes and does not store messages. Violation of terms might lead to permanent blacklisting.

**Do you agree with those?**
    `
    embed.footer = {icon_url: msg.author.avatarURL,text: `Progress: 🟦⬛⬛⬛⬛⬛⬛`}

    let prompt = await msg.channel.send({embed});

    let step = await YesNo(prompt,msg,false,false,false,yesNoOptions);
    if (!step) return;

    embed.description = `
 • Your Lootboxes will be capped to **10 of each type**, any exceeding boxes will be **destroyed**.
 • Your **Rubines** will be reset. You'll get to keep your current Daily Streak × 15.
 • Your **Jades** will be halved.
 • Your **Sapphires** will be increased by **20%** *(if you have an active supporter tier you get +10% per tier level. Max +80%)*.
 • Your **Marriages** will be transfered unless they're with yourself or with a repeated person, if someone you're married to already did the transfer, they will be skipped.
 
 • Your **Inventory** will be kept, but we'll convert it to the new system, this might take a while. Stuff like event boxes might be lost in this step.
 • You will receive a special "Touhou Classic" deck skin for being a pre-Polaris player, thank you~.
 • You will receive 1 Sapphire for every month of daily streak (applied *after* the 10%+ multi).
 

**Are you ready?**
    `
    embed.color = 0x2b2b3F;
    embed.footer = {icon_url: msg.author.avatarURL,text: `Progress: 🟦🟦⬛⬛⬛⬛⬛`}

    await wait(1);
    await prompt.edit({embed});
    await wait(2);
    
    
    step = await YesNo(prompt,msg,false,false,false,yesNoOptions);
    if (!step) return;
    
    
    embed.description = `
${_emoji('loading')} • Transferring marriage
       `
       embed.color = 0x2b2b3F;
       embed.footer = {icon_url: msg.author.avatarURL,text: `Progress: 🟦🟦🟦⬛⬛⬛⬛`}
       
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
    embed.footer = {icon_url: msg.author.avatarURL,text: `Progress: 🟦🟦🟦🟦⬛⬛⬛`}
    await wait(1);
    await prompt.edit({embed});
    await wait(1);


           
    embed.description = `
${_emoji('yep')} • Transferring Marriages
${_emoji('yep')} • Converting Inventory
${_emoji('loading')} • Capping Lootboxes

`
    embed.color = 0x2b2b3F;
    embed.footer = {icon_url: msg.author.avatarURL,text: `Progress: 🟦🟦🟦🟦🟦⬛⬛`}
    await wait(1);
    await prompt.edit({embed});
    await wait(1);


           
    embed.description = `
${_emoji('yep')} • Transferring Marriages
${_emoji('yep')} • Converting Inventory
${_emoji('yep')} • Capping Lootboxes
${_emoji('loading')} • Recalculating Rubines

`
    embed.color = 0x2b2b3F;
    embed.footer = {icon_url: msg.author.avatarURL,text: `Progress: 🟦🟦🟦🟦🟦🟦⬛`}
    await wait(1);
    await prompt.edit({embed});
    await wait(1);


           
    embed.description = `
${_emoji('yep')} • Transferring Marriages
${_emoji('yep')} • Converting Inventory
${_emoji('yep')} • Capping Lootboxes
${_emoji('yep')} • Recalculating Rubines
${_emoji('loading')} • Baking a Cake
${_emoji('loading')} • Awarding **Touhou Classic** Deck Skin

`
    embed.color = 0x2b2b3F;
    embed.footer = {icon_url: msg.author.avatarURL,text: `Progress: 🟦🟦🟦🟦🟦🟦🟦`}
    await wait(1);
    await prompt.edit({embed});
    await wait(1);


           
    embed.description = `
${_emoji('yep')} • Transferring Marriages
${_emoji('yep')} • Converting Inventory
${_emoji('yep')} • Capping Lootboxes
${_emoji('yep')} • Recalculating Rubines
${_emoji('loading')} • Baking a Cake
${_emoji('yep')} • Awarding **Touhou Classic** Deck Skin
${_emoji('loading')} • Awarding Bonus Sapphires

`
    embed.color = 0x2b2b3F;
    embed.footer = {icon_url: msg.author.avatarURL,text: `Progress: 🟦🟦🟦🟦🟦🟦🟦`}
    await wait(1);
    await prompt.edit({embed});
    await wait(1);
    await wait(1);


           
    embed.description = `
${_emoji('yep')} • Transferring Marriages
${_emoji('yep')} • Converting Inventory
${_emoji('yep')} • Capping Lootboxes
${_emoji('yep')} • Recalculating Rubines
${_emoji('loading')} • Baking a Cake
${_emoji('yep')} • Awarding **Touhou Classic** Deck Skin
${_emoji('yep')} • Awarding Bonus Sapphires
${_emoji('loading')} • Declaring Rubines Income Tax 

`
    embed.color = 0x2b2b3F;
    embed.footer = {icon_url: msg.author.avatarURL,text: `Progress: 🟦🟦🟦🟦🟦🟦🟦`}
    await wait(1);
    await prompt.edit({embed});
    await wait(1);


           
    embed.description = `
${_emoji('yep')} • Transferring Marriages
${_emoji('yep')} • Converting Inventory
${_emoji('yep')} • Capping Lootboxes
${_emoji('yep')} • Recalculating Rubines
${_emoji('loading')} • Baking a Cake
${_emoji('yep')} • Awarding **Touhou Classic** Deck Skin
${_emoji('yep')} • Awarding Bonus Sapphires
${_emoji('yep')} • Declaring Rubines Income Tax 

`
    embed.color = 0x2b2b3F;
    embed.footer = {icon_url: msg.author.avatarURL,text: `Progress: 🟦🟦🟦🟦🟦🟦🟦`}
    await wait(1);
    await prompt.edit({embed});
    await wait(2);


           
    embed.description = `
${_emoji('yep')} • Transferring Marriages
${_emoji('yep')} • Converting Inventory
${_emoji('yep')} • Capping Lootboxes
${_emoji('yep')} • Recalculating Rubines
${_emoji('yep')} • Baking a Cake
${_emoji('yep')} • Awarding **Touhou Classic** Deck Skin
${_emoji('yep')} • Awarding Bonus Sapphires
${_emoji('yep')} • Declaring Rubines Income Tax 

`
    embed.color = 0x2b2b3F;
    embed.footer = {icon_url: msg.author.avatarURL,text: `Progress: 🟦🟦🟦🟦🟦🟦🟦`}
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
    ,cmd:'transfer'
    ,cat:'infra'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:[]
}