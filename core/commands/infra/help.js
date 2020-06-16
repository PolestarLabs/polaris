
//const locale = require(appRoot+'/utils/i18node');
//const $t = locale.getT();

const init = async msg => {

    
  const P={
    lngs: msg.lang,
    prefix: msg.prefix
  };


  let helpkey = $t("helpkey", P)
  if (msg.content.split(/ +/)[1] == helpkey || msg.content.split(/ +/)[1] == "?" || msg.content.split(/ +/)[1] == "help") {
  let embed = new Embed
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
                commands.push( Object.assign({name: file.split('.')[0],group:files[i]},cmdOptions) ); 
            })
        } 

    
      let helpol    = $t('help.polHelp',  P),
          heldesc   = $t('help.helpText', P),
          supserv   = $t('help.supserv',  P),
          commlist  = $t('help.commlist', P),
          inviteme  = $t('help.inviteme', P),
          useful    = $t('help.useful',   P);
    
      let commlink = paths.CDN+"/commands";
      let suplink = paths.CDN+"/support";
      let invitelink = paths.CDN+"/invite";
    

      const hEmbed = new Embed;

      P.commandcount=commands.filter(x=>x.pub).length
  hEmbed.description = $t('interface.help.basics',P)

hEmbed.field(
    "• "+  $t('interface.help.quick_getgo',P)    +":",
    `- \`+profile\` | \`+daily\` | \`+balance\` | \`+inventory\` | \`+language\` | \`+rank\` | \`+craft\``
    )
hEmbed.field(
    "• "+  $t('interface.help.quick_useful',P)    +":",
    `- \`+read&translate <IMAGE FILE>\` | \`+background\` | \`+roll <DICE> <MATHS>\` | \`+translate\` | \`+weather\` | \`+exchange\``
)
hEmbed.field(
    "• "+  $t('interface.help.quick_enjoy',P)    +":",
    `- \`+blackjack\` | \`+pickupline\` | \`+alignment\` | \`+slots\` | \`+geiger\` | \`+tarot\` | \`+guessflag\` | \`+marry\` `
)
hEmbed.field(
    "• "+  $t('interface.help.quick_didntask',P)  +":",
    `- \`+ross\` |\`+cage\` |\`+tea\` |\`+localnews <TXT> <IMG or @USER> \` | \`+slap\` | \`+saltlevel <@USER>\` | \`+akerfeldt\` | \`+airwaifu\``
)
let tex22 = `\u200b
${$t('interface.help.greetings',P)}
\u200b`

let currencyHelp = new Embed()
        .title($t('interface.help.curr_info',P))
        .color("#f83255")
        .description($t('interface.help.currency_overview',P))
        .field("<:rubine_fulllarge:550389035835588638>  "+$t('keywords.RBN_fullname',P),$t('interface.help.rubines_desc',P))
        .field("<:jade_fulllarge:550389035906891789> "+$t('keywords.JDE_fullname'),$t('interface.help.jades_desc',P))
        .field("<:sapphire_fulllarge:550389035848171523>  "+$t('keywords.SPH_fullname',P),$t('interface.help.sapphires_desc',P))
        .field("<:loot:339957191027195905> "+$t('keywords.lootbox_plural',P),$t('interface.help.lootboxes_desc',P))



      let txt3 = `
    **${$t('interface.help.cmdlist',P)}:** https://www.pollux.gg/commands
    
    ${$t('help.disableNuisance', P)}
    
    ${$t('help.invite', P )}: https://pollux.gg/invite
    
    ${$t('help.joinSupp', P)}: https://discord.gg/rEBCccS
    `;


if(msg.args[0]==='full'){
    msg.channel.createMessage({content:tex22, embed:hEmbed}).catch(e => {console.log(e);'Fail Silently'})
    msg.channel.createMessage({embed:currencyHelp}).catch(e => {console.log(e);'Fail Silently'})
    msg.channel.createMessage( $t('interface.help.end',P) ).catch(e => {console.log(e);'Fail Silently'})
    return;
}

if(msg.args[0]==='currency'){
    msg.channel.createMessage({embed:currencyHelp}).catch(e => {console.log(e);'Fail Silently'})
    return;
}

if(msg.args[0]==='links'){
    msg.channel.createMessage( $t('interface.help.end',P) ).catch(e => {console.log(e);'Fail Silently'})
    return;
}

if(msg.args[0]==='commands'){
    let allcoms = new Embed()
            .title( $t('interface.help.avail_cmd',P))
            .description( $t('interface.help.avail_cmdlist',P))

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
    console.log(argCom)
    return PLX.autoHelper('force',  Object.assign({cmd:msg.args[0],msg,opt: argCom.cat},argCom) ) && undefined;
}

    
msg.author.getDMChannel().then(dmChan=>{ 
    dmChan.createMessage({content:tex22, embed:hEmbed}).catch(e => {console.log(e);'Fail Silently'})
    dmChan.createMessage({embed:currencyHelp}).catch(e => {console.log(e);'Fail Silently'})
    dmChan.createMessage( $t('interface.help.end',P) ).catch(e => {console.log(e);'Fail Silently'})
})
 

      const embed = new Embed;
    
      embed.title(helpol)
      embed.color = 0xeb4190
      embed.description(heldesc)
      embed.thumbnail(PLX.user.avatarURL)
      embed.field(":sos: " + supserv, `https://discord.gg/pollux`, false)
      embed.field(":hash: " + commlist, `${commlink}`, false)
      embed.field(":heart_decoration: " + inviteme, invitelink, false)
      embed.field("<a:polluxYAY:482436838523404288> " + "Donate", " [Patreon](https://patreon.com/join/Pollux) <:patreon:684734175986712613> • [Paypal](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=8JDLAY5TFU9D6&source=url) <:Paypal:338329328947429378> ", false)
      embed.field($t('interface.help.notenough',P),
      $t('interface.help.trythese',P)+": \n[`+help full \u200b`] | [`+help currency \u200b`] \n [`+help links`] | [`+help <COMMAND>`]\n [`+help basics`] | [`+help commands`]")
    
      setTimeout(t => msg.reply({content:'' ,embed}), 1000)


}


module.exports = {
    init, 
    cmd:"help",
    pub: true,
    botPerms:['embedLinks'],
    cat: 'infra',
    aliases: ['welp','?','???']
}
