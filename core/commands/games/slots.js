const Jackpots = new Map();

const YesNo = require("../../structures/YesNo.js");

const PAYOUT = (barrel,coins,JACKPOT) => {
    if (!coins) return 0;
    const payChip = (a,b,c,play) => play === 1 ? a : play === 2 ? b : c;
    
    switch (true) {
        case barrel === "999":
            return  payChip(1000, 2000, JACKPOT, coins);
            break;
        case barrel === "888":
            return  payChip(1000, 2000, 5000, coins);
            break;
        case barrel === "777":
            return  payChip(1000, 2000, 3000, coins);
            break;
        case barrel === "666":
            return  payChip(1000, 1800, 2500, coins);
            break;
        case barrel === "555":
            return  payChip(500, 1500, 2000, coins);
            break;
        case barrel === "444":
            return  payChip(300, 1250, 1500, coins);
            break;
        case barrel === "222":
            return  payChip(250, 1000, 1250, coins);
            break;
        case barrel === "111":
            return  payChip(15, 75, 150, coins);
            break;
        case barrel === "000":
            return  payChip(0, 0, 0, coins);
            break;
        case barrel.match( /.?3.?3.?/):
            return  payChip(50, 250, 500, coins);
            break;
        case barrel.includes("3"):
            return  payChip(15, 75, 150, coins);
            break;
        
            case barrel.match( /.?6.?6.?/):
            return  payChip(150, 800, 1500, coins);
            break;
        case barrel.match( /.?[89].?[89].?/):
            return  payChip(100, 500, 1000, coins);
            break;
        
        case barrel.match( /.?2.?2.?/):
            return  payChip(11, 51, 101, coins);
            break;

        case barrel.includes("1"):
            return  payChip(5, 25, 50, coins);
            break;
        default:
            return 0;
            break;
      
    }
}
    
const init = async function (msg,args){

    
    if ( Jackpots.get(msg.guild.id) === undefined ) Jackpots.set(msg.guild.id,1000);
    const JACKPOT = Jackpots.get(msg.guild.id);


    if (args[0] === "refill"){
        const prompt = await msg.reply(`Refill ${_emoji('RBN')}**10 000** in the machine for ${_emoji("SPH")}**5** ?`);
        const res = await YesNo(prompt,msg);
        if (res){
            const isPublic = msg.guild.rulesChannelID;
            const isLarge = msg.guild.memberCount > 1000;
            const isSmallButSafe = msg.guild.memberCount > 50 && msg.guild.mfaLevel > 0;
            const isBoosted10 = msg.guild.premiumSubscriptionCount >= 10;

            const ownerData = await DB.users.get(msg.guild.ownerID);
            const serverData = await DB.servers.get(msg.guild.id);

            const serverIsPremium = serverData?.premium;
            const ownerIsCarbonPlus = ownerData.prime.custom_background;

            if (  isLarge || isSmallButSafe || isBoosted10 || ownerIsCarbonPlus ){
                Jackpots.set(msg.guild.id, JACKPOT+ 10000);
                prompt.edit("Done!")
            }else{
                msg.reply({
                    embed:{
                        color: 0xFF0000,
                        description:`
                        **Cannot refill**

                        To refill the Slot Machine you server must meet one of the following:
                        ${_emoji(isLarge?"yep":"nope")} Above 1000 Members
                        ${_emoji(isSmallButSafe?"yep":"nope")} Above 50 Members **and** MFA Set
                        ${_emoji(isBoosted10?"yep":"nope")} Boosted beyond 10 boosts
                        ${_emoji(ownerIsCarbonPlus?"yep":"nope")} Server owner must be a Pollux Prime player ${_emoji("carbon")} **Carbon** or above.
                        `
                    }
                })
            }
        }        
        return;
    }

    const prompt = await msg.channel.send({
        embed:{
            color: 0x8257a8,
            image:{url:"https://cdn.discordapp.com/attachments/488142034776096772/860513604922638356/Comp_1_1.gif"}
        },
        components:[
            {type: 1, components: [
                {type:2, label: "Bet 10", emoji:{id:_emoji('rubineCHIP').id}, custom_id:"bet_10", style:2 },
                {type:2, label: "Bet 50", emoji:{id:_emoji('rubineCHIP').id}, custom_id:"bet_50", style:2 },
                {type:2, label: "Bet 100", emoji:{id:_emoji('rubineCHIP').id}, custom_id:"bet_100", style:2 },
                {type:2, label: "STOP", emoji:{id:"652451953120509974"}, custom_id:"stop", style:4 },

            ]},
            {type: 1, components: [
                {type:2, disabled: true, label: "PAYLINE: 0", emoji:{id:_emoji('chipINFO').id}, custom_id:"rank", style:2 },
                {type:2, disabled: true, label: "POT: 000", emoji:{id:_emoji('RBN').id}, custom_id:"pot", style:1 },
                {type:2, disabled: true, label:  `JACKPOT: ${JACKPOT}`, emoji:{ name:'🌠'}, custom_id:"jackpot", style:3 },
            ]},
            {type: 1, components: [
                {type:2, label:  `Payouts`, emoji:{ name:'💲'}, url:"https://cdn.discordapp.com/attachments/792176688070918194/860534626115780658/unknown.png", style:5 }
            ]}
        ]
    });

    let pot = 0;
    let coin = 0;
    let betsAmt = 0;
    let accum = 0;

    const SlotMachine = prompt.createButtonCollector((i)=> i.userID === msg.author.id, {time: 20e3, idle: 10e3, removeButtons: false} );
    SlotMachine.on("click", async data =>{
        if (data.id === "bet_10"){
            (pot+=10);
            (betsAmt++);
            (accum += 1);
            coin = ~~(accum / betsAmt);

        }
        if (data.id === "bet_50"){
            (pot+=50);
            (betsAmt++);
            (accum += 2);
            coin = ~~(accum / betsAmt);

        }
        if (data.id === "bet_100"){
            (pot+=100);
            (betsAmt++);
            (accum += 3);
            coin = Math.round(accum / betsAmt);

        }
  // msg.channel.send(JSON.stringify({pot,betsAmt,accum,coin}))

        if (data.id.includes("bet")) await prompt.updateButtons([
            {custom_id: "pot" ,label:`POT: ${pot.toString().padStart(3,0)}`},
            {custom_id: "rank" ,label:`PAYLINE: ${ coin }`},
        ])
        
        if (data.id === "stop"){         
            SlotMachine.stop();
        }
    })

    SlotMachine.on("end", async ()=>{
        prompt.updateButtons([{custom_id:"stop",emoji:{id:_emoji('__').id}}]);
        Jackpots.set(msg.guild.id, (JACKPOT + pot));
        await prompt.disableButtons("all");
        await prompt.updateButtons([{custom_id:"jackpot",label:`JACKPOT: ${JACKPOT}`}]);
        
        const icons = [
            "<:Kommunism:381950417329848322> ",
            ":potato: ",
            "🍋",
            "🍒",
            "💈",
            "🔵",
            "<:RBN:765986694717374515>",
            "<:_7:755798586339622972>",
            "🌠",
            "<:plxAngery:604075365350244363>",
        ]

        const result = (randomize(0,999)).toString().padStart(3,0);
        const basePayout =  PAYOUT(result, coin,JACKPOT );
        const fullPayout = Math.min(betsAmt * PAYOUT(result, coin,JACKPOT ), JACKPOT + pot);

        await prompt.edit({embed:{description:` ••• ${result.split('').map(r=>icons[r]).join('')} •••
        (${result}) • 
        **Payout:** ${ basePayout} x ${betsAmt} = ${ fullPayout }
        ${fullPayout >= JACKPOT ? "Can't award more than the jackpot. This machine is now empty.":""}
        `,image:{}}});
        if (result === "000") msg.reply("Comunist Jackpot, everyone wins your Jackpot!")
        console.log(Jackpots.get(msg.guild.id))

        Jackpots.set(msg.guild.id, JACKPOT + pot - fullPayout)
    })

}

module.exports={
    init
    ,pub:false
    ,cmd:'slots'
    ,cat:'games'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:[]
}