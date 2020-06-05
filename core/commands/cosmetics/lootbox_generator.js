const {Lootbox,rates} = require("../../archetypes/Lootbox.js");
const Picto = require('../../utilities/Picto.js');
const Canvas = require("canvas");
const ECO = require("../../archetypes/Economy");

const LootingUsers = new Map();

const staticAssets = {}

const VisualsCache = new Map()

const CARD_WIDTH = 270;
const BASELINE_REROLLS = 3;

staticAssets.load = Promise.all([
    Picto.getCanvas(paths.CDN + '/build/LOOT/frame_C.png'),
    Picto.getCanvas(paths.CDN + '/build/LOOT/frame_U.png'),
    Picto.getCanvas(paths.CDN + '/build/LOOT/frame_R.png'),
    Picto.getCanvas(paths.CDN + '/build/LOOT/frame_SR.png'),
    Picto.getCanvas(paths.CDN + '/build/LOOT/frame_UR.png'),
    Picto.getCanvas(paths.CDN + '/build/LOOT/frame_XR.png'),
    Picto.getCanvas(paths.CDN + '/build/LOOT/dupe-tag.png'),
    Picto.getCanvas(paths.CDN + '/build/LOOT/bgC.png'),
    Picto.getCanvas(paths.CDN + '/build/LOOT/bgU.png'),
    Picto.getCanvas(paths.CDN + '/build/LOOT/bgR.png'),
    Picto.getCanvas(paths.CDN + '/build/LOOT/bgSR.png'),
    Picto.getCanvas(paths.CDN + '/build/LOOT/bgUR.png'),
    Picto.getCanvas(paths.CDN + '/build/LOOT/sparles_0.png'),
    Picto.getCanvas(paths.CDN + '/build/LOOT/sparles_1.png'),
    Picto.getCanvas(paths.CDN + '/build/LOOT/sparles_2.png'),
    Picto.getCanvas(paths.CDN + '/build/LOOT/bonusbar.png'),
]).then(res=>{
    let [
        frame_C,frame_U,frame_R,frame_SR,frame_UR,frame_XR,dupe_tag,
        bgC,bgU,bgR,bgSR,bgUR,
        sparles_0,sparles_1,sparles_2,bonusbar,
    ] = res;
    Object.assign(staticAssets,{
        frame_C,frame_U,frame_R,frame_SR,frame_UR,frame_XR,dupe_tag,
        bgC,bgU,bgR,bgSR,bgUR,
        sparles_0,sparles_1,sparles_2,bonusbar,
        loaded:true});
    delete staticAssets.load
})


const init = async function (msg,args){
 
    if(!staticAssets.loaded) await staticAssets.load;
    if(VisualsCache.size > 800) VisualsCache.clear();
 
    
    const USERDATA = await DB.users.getFull({ id: msg.author.id });

    if(LootingUsers.get(msg.author.id)){
        await DB.users.set(msg.author.id, {$inc: {'counters.cross_server_box_attempts':1} });
        return {
            embed:{
                description: `**You are already Looting in another server.** 
                Bear in mind that exploiting loopholes can get you banned from using my services!
                \`- This incident will be reported to the moderators -\``
                ,color: 0xFF9060
            }
        }
    }
    LootingUsers.set(msg.author.id,msg.guild.id);


   
 
 
    const P = {lngs:msg.lang}
    const boxparams = await DB.items.findOne({ id: 'lootbox_SR_O' });

    let currentRoll = 0

    async function process(){
        const lootbox = new Lootbox(boxparams.rarity,boxparams);
        await lootbox.compileVisuals;

        let firstRoll = await compileBox(msg,lootbox,USERDATA,{P,currentRoll});
        let message = await msg.channel.send(...firstRoll);
    

        message.addReaction('⭐').catch(e=>null)
        message.addReaction('🔁').catch(e=>null)
        message.awaitReactions( reaction=>{    
            if(reaction.author.id == PLX.user.id) return false;
            if(reaction.emoji.name == "🔁"){            
                return true;
            }
            
        }, {time: 15000, maxMatches:1} ).catch(e=>{
            console.error(e)
            message.removeReaction('🔁')
            
        }).then(reas=>{
            if (!reas || reas.length === 0 ) return;
            
            message.delete();
            currentRoll++
            return process();
            
        })
    }
    process()
    
}




function renderCard(item,visual,P){ 

    const canvas = Picto.new(CARD_WIDTH,567)
    const ctx = canvas.getContext('2d')

    const itemVisual = VisualsCache.get(visual);
    const backFrame = staticAssets["frame_"+item.rarity];

    ctx.drawImage(backFrame,CARD_WIDTH/2-backFrame.width/2,0);

    ctx.globalCompositeOperation ='overlay'
    ctx.rotate(-1.5708)
    P.count= item.type == 'gems'? 2 : 1;
    let itemTypePrint = (item.type !== 'gems' ? $t("keywords."+item.type ,P) : $t("keywords."+item.currency ,P)).toUpperCase()
    Picto.setAndDraw(ctx, 
        Picto.tag(ctx, itemTypePrint, "600 50px 'AvenirNextRoundedW01-Bold'", "#FFF" )
        ,-468,(CARD_WIDTH-backFrame.width)/2+10,460
    )
    ctx.rotate(1.5708)
    ctx.globalCompositeOperation ='source-over'
    
    ctx.shadowColor = '#2248';
    ctx.shadowOffsetY = 5;
    ctx.shadowBlur = 10

    if(item.type == 'background'){
        let ox= -25
        let oy= 125
        let odx= 240
        let ody= 135

        let offset= 10

        ctx.rotate(-.2)
        ctx.translate(0,10)
        Picto.roundRect(ctx, ox,oy ,240,135,15,"#FFF","#1b1b2b",5)
        ctx.shadowBlur = 0
        Picto.roundRect(ctx, ox+offset, oy+offset, odx - (offset*2) ,ody - (offset*2), offset/2 ,itemVisual)
        ctx.shadowBlur = 10
        ctx.translate(0,-10)
        ctx.rotate(.2)
    }else if(item.type == 'medal'){
        let itemW= 150        
        ctx.drawImage(itemVisual,CARD_WIDTH/2-itemW/2,190-itemW/2,itemW,itemW)

    }else if(item.type == 'boosterpack'){        
        let itemW= 210
        ctx.translate((CARD_WIDTH/2-itemW/2+30), (190-300/2))
        ctx.rotate(.17)
        ctx.drawImage(itemVisual,0,0,itemW,300)
        ctx.rotate(-.17)
        ctx.translate(-(CARD_WIDTH/2-itemW/2+30), -(190-300/2))

    }else{        
        let itemW= 200        
        ctx.drawImage(itemVisual,CARD_WIDTH/2-itemW/2,190-itemW/2,itemW,itemW)
        
    }

    ctx.shadowBlur = 5

    let itemTitle   =  (item.name || item.amount + "").toUpperCase()
    let itemFont    = "900 italic 50px 'Panton Black'"
    let itemOptions = {
        textAlign:          "center",
        verticalAlign:      "middle",
        lineHeight:         1.1,
        sizeToFill:         true,
        maxFontSizeToFill:  80,
        paddingY:           15,
        paddingX:           15,
        stroke:  {
            style:          "#121225",
            line:           15
        }
    }
    
    ctx.drawImage(Picto.block(ctx,itemTitle,itemFont,"#FFF",230,100,itemOptions).item,15,220);
    
    itemOptions.stroke = null

    ctx.drawImage(Picto.block(ctx,itemTitle,itemFont,"#FFF",230,100,itemOptions).item,15,220);
    
    Picto.setAndDraw(ctx, 
        Picto.tag(ctx,  $t("keywords."+item.rarity,P) +" ", "900 32px AvenirNextRoundedW01-Bold", "#FFF" )
        ,CARD_WIDTH/2,20,230,'center'
    )

    return canvas;

}

function renderDupeTag(rarity,P){
    const canvas = Picto.new(staticAssets.dupe_tag.width,staticAssets.dupe_tag.width)
    const ctx = canvas.getContext('2d')
    ctx.translate(canvas.width-staticAssets.dupe_tag.width +10,canvas.height/2)
    ctx.rotate(.22)
    let cosmoAward = rates.gems[rarity];
    ctx.shadowColor = '#53F8';
    ctx.shadowBlur = 10
    ctx.drawImage(staticAssets.dupe_tag,0,0)
    ctx.shadowBlur = 0
    Picto.setAndDraw(ctx,Picto.tag(ctx,$t('loot.duplicate',P)+" ! ","900 italic 32px 'PantonBlack'","#ffca82",{line:8,style:'#1b1b32'}),49,5,235)
    Picto.setAndDraw(ctx,Picto.tag(ctx, "+"+cosmoAward ,"900 italic 25px 'PantonBlack'","#FFF",{line:6,style:'#1b1b32'}),175,40,125,'right')
    Picto.setAndDraw(ctx,Picto.tag(ctx,$t('keywords.cosmoFragment_plural',P).toUpperCase(),"900 17px 'Panton'","#DDF8"),175,48,150)
    
    return canvas

}

function getPrize(loot,USERDATA){

    if(['boosterpack','item'].includes(loot.type))
        return USERDATA.addItem(loot.id);
    
    if(loot.type == 'gems')
        return ECO.pay(USERDATA.id,loot.amount,'lootbox',this.currency);
    
    if(loot.type == 'background')
        return  DB.users.set(USERDATA.id, {$addToSet: {'modules.bgInventory':(loot.code||loot.id)} });
        
    if(loot.type == 'medal')
        return  DB.users.set(USERDATA.id, {$addToSet: {'modules.medalInventory':(loot.icon||loot.id)} });
    
}

function determineRerollCost(box,rollNum,USERDATA){

    let stake = Math.round(
        (USERDATA.modules.bgInventory.length || 100)
        + (USERDATA.modules.bgInventory.length || 100)
        + (USERDATA.modules.inventory.length || 100)
    )
    stake = stake < 50 ? 50 : stake;

    let factors = ["C", "U", "R", "SR", "UR"].indexOf(box.rarity) || 0;
    return ((rollNum || 0) + 1) * Math.ceil(factors * 1.2 + 1) * (stake + 50);

}

async function finalize(USERDATA,box,options = {}){
    const {rerollcosts} = options;
    DB.control.set(USERDATA.id,{$inc:{'data.boxesOpened':1 , 'data.rerolls': rerollcosts||0}});
    await USERDATA.removeItem(box.id);
    if(rerollcosts) await ECO.pay(USERDATA.id,rerollcosts, "lootbox_reroll", 'RBN');
}

async function compileBox(msg,lootbox,USERDATA,options){

    

    await Promise.all(
        lootbox.visuals.map(async vis =>
            VisualsCache.get(vis) || VisualsCache.set(vis, await Picto.getCanvas(vis) ) && VisualsCache.get(vis)
        )
    );

    const {currentRoll,P} = options;
    const rerollCost = determineRerollCost(lootbox,currentRoll,USERDATA);
    const totalRerolls = BASELINE_REROLLS + (USERDATA.modules.powerups?.rerollBonus || 0);
    
    const canvas = Picto.new(800,600)
    const ctx = canvas.getContext('2d')
    let back = staticAssets[`bg${lootbox.rarity}`];
    ctx.drawImage(back,0,0,800,600)
    ctx.translate(0,20)

    let itemCards = lootbox.content.map((item,i)=> renderCard(item,lootbox.visuals[i],P) );

    itemCards.forEach((card,i)=> ctx.drawImage(card,8+i*(CARD_WIDTH-15)+2,0) );

    lootbox.content.forEach((loot,i)=>{

        let isDupe = false;

        if(loot.type === 'background')
            isDupe = USERDATA.modules.bgInventory.includes( loot.id || loot.code); // <- ID/CODE backwards compat
        if(loot.type === 'medal')
            isDupe = USERDATA.modules.medalInventory.includes( loot.id || loot.icon); // <- ID/ICON backwards compat
        
    
        if(isDupe){
            let dupe= renderDupeTag(loot.rarity,P);
            ctx.drawImage(dupe, -6+i*(CARD_WIDTH-15), -80,CARD_WIDTH+40,CARD_WIDTH+40)
        }

    })

    return   [{
        embed:{
            description:`
${_emoji(lootbox.rarity)} **${$t(`items:${lootbox.id}.name`,P)}**

    Reroll Cost: **${rerollCost}** ${_emoji('RBN')}
    Rerolls Available: **${totalRerolls-currentRoll}/${totalRerolls}** 🔁

            `,
            image:{
                url:"attachment://Lootbox.png",
            },
            thumbnail:{url:paths.CDN+(currentRoll?"/build/LOOT/rerollbox.gif":"/build/LOOT/openbox.gif")}
            ,color: 0x3585F0
            ,footer:{
                icon_url: msg.author.avatarURL
                ,text: msg.author.tag
            }
            ,timestamp: new Date()
        }
    }, {
        file: canvas.toBuffer(),
        name: "Lootbox.png"
    }];

}


module.exports={
    init
    ,pub:false
    ,cmd:'lootbox_generator'
    ,perms:3
    ,cat:'cosmetics'
    ,botPerms:['attachFiles','embedLinks','manageMessages','addReactions']
    ,aliases:['lgen']
    ,hooks:{
        postCommand: (m) => LootingUsers.delete(m.author.id)
    }
    ,errorMessage: (msg,err)=>{
        LootingUsers.delete(msg.author.id);
        return {
            embed:{
                description: "Something went wrong...\nIf this issue persists, please stop by our [Support Channel](https://discord.gg/TTNWgE5) to sort this out!\n \n***Your Lootbox __was not__ removed from your inventory!***"
                ,thumbnail:{url:paths.CDN+'/build/assorted/error_aaa.gif?'}
                ,color: 0xFF9060
            }
        }
    }
}