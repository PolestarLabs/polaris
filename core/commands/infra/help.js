const gear = require("../../utilities/Gearbox");
const locale = require(appRoot+'/utils/i18node');
const $t = locale.getT();

const init = async msg => {

    
  const P={
    lngs: msg.lang,
    prefix: msg.prefix
  };


  let helpkey = $t("helpkey", P)
  if (msg.content.split(/ +/)[1] == helpkey || msg.content.split(/ +/)[1] == "?" || msg.content.split(/ +/)[1] == "help") {
  let embed = new gear.Embed
  embed.setDescription($t('usage.askingHelpForHelp',P))
  return msg.channel.send({embed});
  };
    

    let commands = []
    let fs = require('fs')
    let files = fs.readdirSync(appRoot + "/core/commands");
        for (let i = 0; i < files.length; i++) {
            let filedir = appRoot + "/core/commands/" + files[i]
            let morefiles = fs.readdirSync(filedir  )
            morefiles.forEach(file=>{
                let cmdOptions =  require( filedir+"/"+file );
                commands.push({name: file.split('.')[0],cat:cmdOptions.cat ,pub:cmdOptions.pub,group:files[i]}); 
            })
        } 


    
      let helpol    = $t('help.polHelp',  P),
          heldesc   = $t('help.helpText', P),
          supserv   = $t('help.supserv',  P),
          commlist  = $t('help.commlist', P),
          inviteme  = $t('help.inviteme', P),
          useful    = $t('help.useful',   P);
    
      let commlink = "https://www.pollux.fun/commands";
      let suplink = "https://pollux.fun/support";
      let invitelink = "https://pollux.fun/invite";
    

      const hEmbed = new gear.Embed;

  hEmbed.description = `
  **The Basics** - Getting started with me is as easy as building your own parcticle accelerator! ...wait, you never built one yourself? Well, no problem!
These are just a few of the ${commands.length} commands I have!
  `

hEmbed.field(
    "•  Commands you should know from the get-go:",
    `- \`+profile\` | \`+daily\` | \`+balance\` | \`+inventory\` | \`+language\` | \`+rank\` | \`+craft\``
    )
hEmbed.field(
    "•  Commands you might find useful:",
    `- \`+read&translate <IMAGE FILE>\` | \`+background\` | \`+roll <DICE> <MATHS>\` | \`+translate\` | \`+weather\` | \`+exchange\``
)
hEmbed.field(
    "•  Commands you might enjoy playing around with:",
    `- \`+blackjack\` | \`+pickupline\` | \`+alignment\` | \`+slots\` | \`+geiger\` | \`+tarot\` | \`+guessflag\` | \`+marry\` `
)
hEmbed.field(
  "•  Commands you didn't ask for:",
    `- \`+ross\` |\`+cage\` |\`+tea\` |\`+localnews <TEXT> <IMAGE or @USER> \` | \`+slap\` | \`+saltlevel <@USER>\` | \`+akerfeldt\` | \`+airwaifu\``
)
let tex22 = `\u200b

**Greetings! I'm Pollux. The new maid assigned to your server.**
Here's some quick explanations of my abilities:

  •  The Default Prefix is \`+\`, you can change it with \`+prefix <New Prefix>\`. 
      The Global Prefix is \`p!\`, useful for users that don't know your custom prefix, can be disabled at the **Dashboard**. 
      The Universal Prefix is \`plx!\` and cannot be disabled. 

\u200b`

let currencyHelp = new gear.Embed()
        .title("Currency Information")
        .color("#f83255")
        .description(`
My currency system is relatively complex and has several limitations and protective features. Every transaction is logged and can be traced easily, that ensures your hardwork will not be eclipsed by cheaters. We log over 30 thousand transactions every day.   
        
    •  Everyone starts with a bunch of **Jades** and **Rubines**, and with one **Lootbox**.
        \u200b
        `)
        .field("<:rubine:367128893372760064> Rubine Gems",`
        *My main currency, bright-pink gemstones made of special hexagonal scalenohedrons of Al₂O₃:Cr, used for pretty much everything!*
        Can be obtained from Daily Bonuses (\`daily\`), Lootboxes (\`+box\`) and Gambling Games (\`+blackjack\`, \`+slots\`, etc.). As well as from trades with other users once you reach Level 5 and has at least a 10-day Daily Streak.
        `)
        .field("<:jade:367128893716430848> Jades Dust",`
        *Crafting "currency", I use these faint-teal gems - otherwise worthless - to concoct special items just for you!*
        Can be obtained from Lootboxes, destroying Items, donating, or buying.
        `)
        .field("<:sapphire:367128894307827712> Sapphire Shards",`
        *Premium currency, deep-blue pieces of the finest Sapphire gemstones, used to craft special items or as a buying currency to exclusive stuff.*
        Can be only obtained with donations, buying, and from special events. You get one Free Sapphire every 200 and 365 Dailies, and there's a 0.1% chance of getting one from Ultra Rare Lootboxes.
        `)
        .field("<:loot:339957191027195905> Lootboxes",`
        *Special chests that contain many goodies like Backgrounds, Medals, Rubines, and Sticker Boosters*
        Can be only obtained leveling up or from random drops, drops occur based on chat activity.

         **\`⚠ Intentionally Spamming to force Loot Drops, cheating, or exchanging items with Alt-Accounts will get you banned from Pollux and other bots as well.\`** 
        `)
        

let end = `
**The complete list of Commands can be found at <https://pollux.fun/commands>**

Check out our Partners at **<https://pollux.fun/partners>**
See or submit fan-created artwork at **<https://pollux.fun/fanart>**
See your public Profile at **<https://pollux.fun/profile/me>**

**Cosmetics**
Background Shop **https://pollux.fun/bgshop**
Medal Shop **https://pollux.fun/medalshop**
Crafting Workshop **https://pollux.fun/crafting**
Virtual Stickers **<https://pollux.fun/stickers>** (for IRL stickers check Support Server)
Events Information **<https://pollux.fun/events>**

Support me at **<https://patreon.com/Pollux>** or **<https://pollux.fun/donate>**
Follow me on Twitter **<https://twitter.com/maidPollux>**

---

**For anything else, check the __Dashboard__: <https://pollux.fun/dashboard>**
Or join my support server: **\u200b https://discord.gg/rEBCccS \u200b**
Invite me to your server at **<https://pollux.fun/invite>**
`


      let txt3 = `
    **COMMAND LIST:** https://www.pollux.fun/commands
    
    ${$t('help.disableNuisance', P)}
    
    ${$t('help.invite', P )}: https://pollux.fun/invite
    
    ${$t('help.joinSupp', P)}: https://discord.gg/rEBCccS
    `;


if(msg.args[0]==='full'){
    msg.channel.createMessage({content:tex22, embed:hEmbed}).catch(e => {console.log(e);'Fail Silently'})
    msg.channel.createMessage({embed:currencyHelp}).catch(e => {console.log(e);'Fail Silently'})
    msg.channel.createMessage( end ).catch(e => {console.log(e);'Fail Silently'})
    return;
}

if(msg.args[0]==='currency'){
    msg.channel.createMessage({embed:currencyHelp}).catch(e => {console.log(e);'Fail Silently'})
    return;
}

if(msg.args[0]==='links'){
    msg.channel.createMessage( end ).catch(e => {console.log(e);'Fail Silently'})
    return;
}

if(msg.args[0]==='commands'){
    let allcoms = new gear.Embed()
            .title("Available Commands")
            .description("List of commands currently available and supported.")

            commands.map(cmd=>cmd.group).filter((itm,pos,me)=> me.indexOf(itm) == pos).forEach(cmdGroup=>{
                let gComs = "";
                commands.filter(cmd=>cmd.group === cmdGroup).forEach(cmd=>{
                    if(cmd.pub && !cmd.group.startsWith("_")){
                        gComs += " `"+msg.prefix+cmd.name+"` |"
                    }
                })
                allcoms.field(cmdGroup,gComs);
            })

    msg.channel.createMessage( {embed:allcoms} ).catch(e => {console.log(e);'Fail Silently'})
    return;
}

let argCom = commands.find(cmd=> cmd.name === msg.args[0])
if(argCom){
    return gear.autoHelper('force', {cmd:msg.args[0],msg,opt: argCom.cat});
}

    
msg.author.getDMChannel().then(dmChan=>{ 
    dmChan.createMessage({content:tex22, embed:hEmbed}).catch(e => {console.log(e);'Fail Silently'})
    dmChan.createMessage({embed:currencyHelp}).catch(e => {console.log(e);'Fail Silently'})
    dmChan.createMessage( end ).catch(e => {console.log(e);'Fail Silently'})
})


      const embed = new gear.Embed;
    
      embed.title(helpol)
      embed.setColor("#eb4190")
      embed.description(heldesc)
      embed.thumbnail(POLLUX.user.avatarURL)
      embed.field(":sos: " + supserv, suplink, false)
      embed.field(":hash: " + commlist, commlink, false)
      embed.field(":heart_decoration: " + inviteme, invitelink, false)
      embed.field("<a:polluxYAY:482436838523404288> " + "Donate", "https://patreon.com/Pollux", false)
      embed.field("Is this tiny box not enough?",
      "Try one of these: \n[`+help full \u200b`] | [`+help currency \u200b`] \n [`+help links`] | [`+help <COMMAND>`]\n [`+help basics`] | [`+help commands`]")
    
      setTimeout(t => msg.reply({content:'' ,embed}), 1000)


}


module.exports = {
  cmd:"ping",
  init,
  cat: 'infra',
  aliases: ['ajuda','welp','?','???','ayuda']
}
