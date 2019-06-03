const gear = require('../../utilities/Gearbox');
const DB = require('../../database/db_ops');
const ECO = require('../../archetypes/Economy');
const A = paths.CDN + "/build/coins/befli_heads.gif"
const A1= paths.CDN + "/build/coins/befli_h_s.png"
const B = paths.CDN + "/build/coins/befli_tails.gif"
const B1= paths.CDN + "/build/coins/befli_t_s.png"

const init = async function (msg){
    const userData = DB.users.get(msg.author.id);

    let P={lngs:msg.lang,prefix:msg.prefix}
    if(gear.autoHelper([$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;

    const bet  = Math.abs(parseInt(msg.args[0]))
    let   call = msg.args[1] ? msg.args[1].toUpperCase() : null
    let   currency = msg.args[2] ? msg.args[2].toUpperCase() : "RBN"

    if (!bet || !call){
        return msg.channel.send("insufficient args");
    }
    if(!['HEADS','TAILS',$t('terms.coinHeads',P).toUpperCase(),$t('terms.coinTails',P).toUpperCase()].includes(call)){
        return msg.channel.send("invalid face called");
    }

    call = ['HEADS',$t('terms.coinHeads',P).toUpperCase()].includes(call) ? "HEADS" : "TAILS"

    if(currency && currency != "RBN"){
        if( (await userData).donator ){
            //ok
        }else{
            msg.channel.send ( "Betting different currencies is a donators-only feature. Type `+donate` for info." )
            currency = "RBN"
        }
    }
    
    let rand = gear.randomize(1,99)
    let countercall = call == "HEADS" ? "TAILS" : "HEADS";
    let R  =    bet > 2500 
                    ? rand  > 60 + (bet/100>30?30:bet/100) 
                        ? call 
                        : countercall 
                    : bet < 2000 
                        ? rand%2==0
                            ? call
                            : countercall 
                        : rand >60 
                            ? call 
                            : countercall;

    let win = R == call; 

    if ( await ECO.checkFunds(msg.author,bet,currency)){
        ECO.pay(msg.author,bet,"Gambling : Betflip",currency)
        if(win)
            ECO.receive(msg.author,Math.ceil(bet*1.5),"Gambling : Betflip",currency);

    }else{
        return msg.channel.send( `Cannot afford. ${await userData.modules[(currency?currency=='RBN'?'rubines':currency=='JDE'?'jades':currency=='SPH'?'sapphires':'rubines':'rubines')]}/${bet}` )
    }


    let res  = R == "HEADS" ? A : B
    let res2 = R == "HEADS" ? A1 : B1
    let face = R == "HEADS" ? $t('terms.coinHeads',P) : $t('terms.coinTails',P)

    let embed = new gear.Embed()
    embed.author(msg.author.tag + " flips a coin...",msg.author.avatarURL)
    embed.color("#eec60c")
    embed.thumbnail(res)
    embed.description = `... calling for **${call}**
    betting **${bet} ${currency}**
    \u200b` 
    
    msg.channel.send({embed}).then(async x=>{
        embed.setColor(win?"#0cc6ee":"#ee0c2c")
        embed.description = `... calling for **${call}**
betting **${bet} ${currency}**
and landed **${face}**!
` 
        embed.thumbnail.url = res2
        await gear.wait(5.5);
        P.prize = Math.ceil(bet * 1.5)
        P.currency = currency
        P.interjection = win ? rand$t('responses.verbose.interjections.yatta',P) : rand$t('responses.verbose.interjections.ohmy_negative',P)
        x.edit({content: win ? $t('games.coinflip.coinVictory',P) : $t('games.coinflip.coinDefeat',P), embed})
        

    })



}
module.exports={
    init
    ,pub:true
    ,cmd:'betflip'
    ,perms:3
    ,cat:'gambling'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:[]
    ,ratelimit:{times:30,hours:1}
}