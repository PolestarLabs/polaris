const Picto = require('../../utilities/Picto');
const Premium = require('../../archetypes/Premium');

const init = async function (msg,args){

    const primeStatus = await Premium.checkPrimeStatus(msg.member).catch(err=> ({STATUS:"error",err}));

    if (primeStatus.STATUS === "error"){
        //waiting
        //unverified
        //already-claimed
        if (primeStatus.err === "waiting") 
            return msg.reply({embed:{description: `*Rewards for **${Premium.RUNNING_MONTH_LONG}** are not yet released.`}});
        if (primeStatus.err === "unverified") 
            return msg.reply({embed:{description: `*Verification failed: Check if you're missing the ✅ Role*.`}});
        if (primeStatus.err === "already-claimed") 
            return msg.reply({embed:{description: `*You already claimed rewards for this month.*`}});
        if (primeStatus.err === "dongrading") 
            return msg.reply({embed:{description: `*You have downgraded your subscription. Rewards will update next month.*`}});
    }

    const {interTier,currentTier} = primeStatus;
    let PROCESS_RWD = await Premium.processRewards(msg.author.id, { currentTier, interTier, mansionMember: msg.member, dry_run: args[0]=="--dry-run" ? args[1]||true : false });
    if (args[0]=="--dry-run"){
        return msg.channel.send("",{file:JSON.stringify(PROCESS_RWD,0,2),name:"dry-run.js"});
    }
    const REPORT = PROCESS_RWD.report;

    //-----------------------------------------------------------------------
    const canvas = Picto.new(780,385);
    const ctx = canvas.getContext('2d');

    if (!REPORT.FEAT_STICKER) REPORT.FEAT_STICKER = [...(await Premium.PREMIUM_STICKERS)].pop();
    
    const [base,overlay,sticker,tierIcon] = await Promise.all([
        Picto.getCanvas(`${paths.CDN}/build/rewards/basse.png`),
        Picto.getCanvas(`${paths.CDN}/build/rewards/overlay.png`),
        Picto.getCanvas(`${paths.CDN}/stickers/${REPORT.FEAT_STICKER.id}.png`),
        Picto.getCanvas(`${paths.CDN}/images/donate/icony/${PROCESS_RWD.data.tier}-small.png`),
    ]);
    const tierName = Picto.tag(ctx,capitalize(PROCESS_RWD.data.tier), "600 36px 'AvenirNextRoundedW01-Bold'", "#CCD",{style:"#2b2b3b",line:8});
    const stickerName = Picto.tag(ctx,REPORT.FEAT_STICKER.name, "500 30px 'AvenirNextRoundedW01-Bold'", "#FFF",{style:"#2b2b3b",line:8});

    ctx.globalAlpha = .7;
    ctx.drawImage(base, 0, 0);
    ctx.globalAlpha = 1;
    ctx.drawImage(sticker, 424, 28, 350, 350);
    ctx.drawImage(overlay, 0, 0);

    ctx.drawImage(tierIcon, 55, 124, 60, 60);
    ctx.drawImage(tierName.item, 55+70, 124);

    ctx.drawImage(stickerName.item, 424 - stickerName.width, 178);

    //-----------------------------------------------------------------------

    const embed = {
        title: `${_emoji(PROCESS_RWD.data.tier)} ${capitalize(Premium.RUNNING_MONTH_LONG)} Rewards`,
        description:`${interTier?`***Tier ${primeStatus.STATUS}:** You've claimed rewards of a different tier this month, your reward will be adjusted accordingly*`:"\u200b"}`,
        fields: [],
        image: { url: "attachment://rewards.png" },
        footer: { icon_url: msg.author.avatarURL, text: msg.author.tag },
        timestamp: new Date()
    };

    embed.fields.push({
        name: "\u200b",
        value: 
        `${_emoji("SPH")} Sapphires: **${REPORT.SPH}**
        ${_emoji("JDE")} Jades: **${REPORT.JDE}**`,
        inline: true
    })
    embed.fields.push({
        name: "\u200b",
        value: 
        ` ${_emoji("loot")} Boxes: ${
            REPORT.BOX.map(box=> 
                `**${box.n}**  ${_emoji(box.t)}`
            ).join(' | ')}
        ${_emoji("EVT")} Event Tokens: **${REPORT.EVT}**`,
        inline: true
    });
 
    embed.fields.push({ name: "\u200b", value: "\u200b", inline: true });
 
    let STICKERS_LIST = REPORT.STICKERS.map(s=>` • ${s.name}`);
    if ( STICKERS_LIST.length > 3 ) {
        let others =  STICKERS_LIST.length -3; 
        STICKERS_LIST =  STICKERS_LIST.slice(0,3);
        STICKERS_LIST.push(`... +${others} items.`)
    } 
    embed.fields.push({
        name: "Stickers",
        value: 
        !STICKERS_LIST.length ? " -- *No new Stickers* --" : `
        ${STICKERS_LIST.join('\n')}
        `,
        inline: true
    });
    
    let PACKS_LIST = REPORT.PACKS.map(s=>` • ${s.name}`);
    if ( PACKS_LIST.length > 3 ) {
        let others =  PACKS_LIST.length -3; 
        PACKS_LIST =  PACKS_LIST.slice(0,3);
        PACKS_LIST.push(`... +${others} items.`)
    } 
    embed.fields.push({
        name: "Boosters",       
        value: !PACKS_LIST.length  ? " -- *None* --" : `
        ${PACKS_LIST.join('\n')}
        `,
        inline: true
    });

    /*
    STREAK: 1,
    AS_TIER: 1,
    HAS_FLAIR: true,
    HAS_MEDAL: false,
    AWARD_MEDAL: false,
    PRIME_COUNT: 1
    */

    embed.fields.push({
        name: "\u200b",
        value: `
        ${_emoji("TIME3")} **Streak:** ${REPORT.STREAK} (${REPORT.AS_TIER} as ${capitalize(PROCESS_RWD.data.tier)})
        ${REPORT.HAS_MEDAL 
            ? _emoji("yep")
            : _emoji("maybe")
        } **Medal:** ${ REPORT.AS_TIER < 3 ? `Tier Medal will be awarded at the 3rd month. (${REPORT.AS_TIER}/3)` : REPORT.AWARD_MEDAL ? `**${capitalize(PROCESS_RWD.data.tier)} Medal Added!**` : "*Medal has already been awarded.*" }
        ${REPORT.HAS_FLAIR 
            ? _emoji("yep") + ` **Flair:** ${capitalize(PROCESS_RWD.data.tier)}\n` 
            :" "
        }${_emoji("gradeSSS")} **Prime Servers:** ${REPORT.PRIME_COUNT}
        `,
        inline: false
    })

    if (REPORT.IS_BOOSTER) {
        embed.fields.push({
            name: "Server Booster Bonus",
            value: `${_emoji("PSM")} Prisms: **${REPORT.BPSM}**` +
            (REPORT.BBOX.length ? 
            `${_emoji("loot")} Boxes: ${
                REPORT.BBOX.map(box=> 
                    `**${box.n}**  ${_emoji(box.t)}`
                ).join(' | ')}`
            : ""),
            inline: false
        })
    }

    msg.channel.send({embed},{file: canvas.toBuffer(), name:"rewards.png"})



}

module.exports={
    init
    ,pub:true
    ,cmd:'rewards'
    ,cat:'pollux'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:[]
}