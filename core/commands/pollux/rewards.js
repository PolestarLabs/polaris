const Picto = require('../../utilities/Picto');
const Premium = require('../../archetypes/Premium');

const init = async function (msg){

    let primeStatus = await Premium.checkPrimeStatus(msg.member);
    ;console.log( {primeStatus} );
    const {interTier} = primeStatus;
    let PROCESS_RWD = await Premium.processRewards(msg.author.id, { interTier, mansionMember: msg.member, dry_run: 1 });
    const REPORT = PROCESS_RWD.report;

    //-----------------------------------------------------------------------
    const canvas = Picto.new(780,385);
    const ctx = canvas.getContext('2d');
    
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
        description:`${interTier?"***Tier Upgrade:** You've claimed rewards of a different tier this month, your reward will be adjusted accordingly*":"\u200b"}`,
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
 

    embed.fields.push({
        name: "Extra Booster Bonus",
        value: `${_emoji("PSM")}**${REPORT.BPSM}**
        ${_emoji("loot")} Boxes: ${
            REPORT.BBOX.map(box=> 
                `**${box.n}**  ${_emoji(box.t)}`
            ).join(' | ')}`,
        inline: false
    })

    let STICKERS_LIST = REPORT.STICKERS.map(s=>` • ${s.name}`);
    if ( STICKERS_LIST.length > 3 ) {
        let others =  STICKERS_LIST.length -3; 
        STICKERS_LIST =  STICKERS_LIST.slice(0,3);
        STICKERS_LIST.push(`... +${others} items.`)
    } 
    embed.fields.push({
        name: "Stickers",
        value: `
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
        value: `
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
        name: "Extras",
        value: `
        **Streak:** ${REPORT.STREAK}
        `,
        inline: false
    })

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