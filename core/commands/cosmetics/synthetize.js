const cmd = 'synthetize';
const fs = require("fs");
const gear = require("../../utilities/Gearbox");
const DB = require("../../database/db_ops");
const ECO = require("../../archetypes/Economy.js");
//const locale = require(appRoot + '/utils/i18node');
//const $t = locale.getT();
const Picto = require(appRoot + '/core/utilities/Picto');

var init = async function (message) {

    let [BGBASE,MEDALBASE] = await Promise.all ( [ 
        DB.cosmetics.find({type:'background',rarity:{$ne:"XR"},exclusive:{$exists:false},$or:[{buyable:true},{synth:true} ] }).lean().exec(),
        DB.cosmetics.find({type:'medal',rarity:{$ne:"XR"},exclusive:{$exists:false},$or:[{buyable:true},{synth:true} ] }).lean().exec()
      //  DB.cosmetics.find({type:'background',rarity:{$ne:"XR"},exclusive:{$exists:false},$or:[{buyable:true},{synth:true} ] })
    ]);

    console.log(1)

    const MSG = message.content
    let args = message.args.slice(1).join(' ');
    let helpkey = $t("helpkey", {
        lngs: message.lang
    });
    if (MSG.split(/ +/)[1] == helpkey || MSG.split(/ +/)[1] == "?" || MSG.split(/ +/)[1] == "help") {
        return gear.usage(cmd, message, this.cat);
    }

    let YA = {
        r: ":yep:339398829050953728",
        id: '339398829050953728'
    }
    let NA = {
        r: ":nope:339398829088571402",
        id: '339398829088571402'
    }

    const canvas = Picto.new(400,150);
    const ctx = canvas.getContext('2d');

    let operation = message.args[0] || "bg";
    let target = message.args[1] || "random";
    const userData = await DB.users.findOne({id:message.author.id});
    const embed = new gear.Embed;
    let hasIt, affordsIt, canBuy, payCoin, selectedItem, positive,obtainable;

    function gemCount(rar){
        return `${selectedItem.rarity==rar?" __**":""}${gear.emoji(rar)} ${userData.amtItem("cosmo_gem_"+rar)}${selectedItem.rarity==rar?"**__ ":""}`      
     }
   
    if (operation == "bg") {
        BGBASE = gear.shuffle(BGBASE)
        selectedItem = BGBASE.find(bg => {
            if(!["c","u","r","sr","ur"].includes(target)){
                if (bg.id === args) return true;
                if (bg.code === args) return true;
                if (args.includes(bg.code)) return true;
                if (message.args.some(arg => bg.name.toLowerCase().includes(arg))) return true;
                if (message.args.some(arg => (bg.tags || "").toLowerCase().includes(arg))) return true;
            }
            if (bg.rarity.toLowerCase() === target) return true;
            return false;
        });
        if (!selectedItem || target == "random") selectedItem = gear.shuffle(BGBASE)[28];
        
        payCoin = "cosmo_gem_" + selectedItem.rarity
        hasIt = userData.modules.bgInventory.includes(selectedItem.code)
        canBuy = selectedItem.buyable && !selectedItem.event;
        affordsIt = userData.modules.inventory.find(itm => (itm.id == "cosmo_gem_" + selectedItem.rarity) && itm.count >= 1)
        obtainable =  selectedItem.buyable && !selectedItem.event 

        positive = async function positiveForBGs(cancellation) {
            if (!hasIt && affordsIt) {
                userData.removeItem(payCoin, 1)
            };
            if (!affordsIt) return cancellation();
            await DB.users.set({
                id: message.author.id
            }, {
                $set: {"modules.bgID": selectedItem.code},
                $addToSet: {"modules.bgInventory": selectedItem.code}
            });
        }

        /* EMBED BUILD payCoin */

        embed.author("Cosmetic Item Synthesis", paths.CDN+"/images/tiers/" + selectedItem.rarity + ".png");
        embed.description = `
   **${ selectedItem.name}**  \`${ selectedItem.code}\` **[\`INFO\`](${paths.CDN}/bgshop "Background Shop" )**
  `


        if (hasIt) {
            embed.footer( "You already have this Background.");
        } else {
            if (obtainable) {
                if (affordsIt)
                    embed.footer( "Synthetize this Background?");
                else
                    embed.footer( "You don't have gems for this Background");
            }
        }

        let imageLink = paths.CDN+"/backdrops/" + selectedItem.code + ".png";
        const [synthBoard,synthCircle,bgImage] = await Promise.all([ 
            Picto.getCanvas(paths.CDN+"/build/synthesis/frame.png"),
            Picto.getCanvas(paths.CDN+"/build/synthesis/"+ (obtainable?("circle_"+selectedItem.rarity):"nosynth" )+".png"),
            Picto.getCanvas(imageLink)
        ]);



        ctx.drawImage(synthCircle,85,15);
        ctx.rotate(-.261799)
        ctx.drawImage(bgImage,170,100,180,90)
        ctx.rotate(.261799)
        ctx.drawImage(synthBoard,0,0)

        embed.setColor(await Picto.avgColor(imageLink));
    }
    
    
    if (operation == "medal") {
        MEDALBASE = gear.shuffle(MEDALBASE)
        selectedItem = MEDALBASE.find(mdl => {
            if(!["c","u","r","sr","ur"].includes(target)){
                if (mdl.id === args) return true;
                if (mdl.icon === args) return true;
                if (args.includes(mdl.icon)) return true;
                if (message.args.some(arg => mdl.name.toLowerCase().includes(arg))) return true;
                if (message.args.some(arg => (mdl.tags || "").toLowerCase().includes(arg))) return true;
            }
            if (mdl.rarity.toLowerCase() === target) return true;
            return false;
        });
        if (!selectedItem || target == "random") selectedItem = gear.shuffle(MEDALBASE)[28];
        
        payCoin = "cosmo_gem_" + selectedItem.rarity
        hasIt = userData.modules.medalInventory.includes(selectedItem.icon)
        canBuy = selectedItem.buyable && !selectedItem.event;
        affordsIt = userData.modules.inventory.find(itm => (itm.id == "cosmo_gem_" + selectedItem.rarity) && itm.count >= 1)
        obtainable =  selectedItem.buyable && !selectedItem.event 

        positive = async function positiveForBGs(cancellation) {
            if (!hasIt && affordsIt) {
                userData.removeItem(payCoin, 1)
            };
            if (!affordsIt) return cancellation();
            await DB.users.set({
                id: message.author.id
            }, {
                $addToSet: {"modules.medalInventory": selectedItem.icon}
            });
        }

        /* EMBED BUILD payCoin */

        embed.author("Cosmetic Item Synthesis", paths.CDN + "/images/tiers/" + selectedItem.rarity + ".png");
        embed.description = `
   **${ selectedItem.name}**  \`${ selectedItem.icon}\` **[\`INFO\`](${paths.CDN}/medalshop "Medal Shop" )**
  `
        if (hasIt) {
            embed.footer( "You already have this Medal.");
        } else {
            if (obtainable) {
                if (affordsIt)
                    embed.footer( "Synthetize this Medal?");
                else
                    embed.footer( "You don't have gems for this Medal");
            }
        }

        let imageLink = paths.CDN + "/medals/" + selectedItem.icon + ".png";
        const [synthBoard,synthCircle,mdlImage] = await Promise.all([ 
            Picto.getCanvas(paths.CDN+"/build/synthesis/frame_medal.png"),
            Picto.getCanvas(paths.CDN+"/build/synthesis/"+ (obtainable?("circle_"+selectedItem.rarity):"nosynth" )+".png"),
            Picto.getCanvas(imageLink)
        ]);
        embed.setColor(await Picto.avgColor(imageLink));



        ctx.drawImage(synthCircle,130,15);
        ctx.rotate(-.261799)
        ctx.drawImage(mdlImage,250,110,100,100)
        ctx.rotate(.261799)
        ctx.drawImage(synthBoard,0,0)

    }
    
    
    embed.field( obtainable?"Synthesis Gems":"\u200b", obtainable
    ? `  ${gemCount("C")} ${gemCount("U")} ${gemCount("R")} ${gemCount("SR")} ${gemCount("UR")}` 
    : "`Can't be synthetized 😦`", true)
    embed.image("attachment://synth.png")

    const file = gear.file(await canvas.toBuffer(),"synth.png")
    const YesNo = require('../../structures/YesNo');

    message.channel.send({embed},file).then(async m => {
        if (!hasIt && affordsIt && canBuy) {
            YesNo.run(m, message, positive, null, null, {
                embed,
                strings: {
                    cancel: "Cancelled!",
                    confirm: "Background acquired and equipped! 😉 ",
                    timeout: "Timeout!"
                }
            })
        };
    });

}

module.exports = {
    pub: true,
    cmd: cmd,
    perms: 3,
    init: init,
    cat: 'cosmetics',
    aliases: ["synth"]
};