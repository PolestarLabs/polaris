const gear = require('../../utilities/Gearbox');
const navigator = require('../../structures/ReactionNavigator');
const YesNo = require('../../structures/YesNo').run;
const axios = require('axios')
const DB = require('../../database/db_ops');
const ReactionMenu = require('../../structures/ReactionMenu');

//const locale = require('../../../utils/i18node');
//const $t = locale.getT();


const init = async function (msg){

    let Target = gear.getTarget(msg);
console.log({Target})
    
    let P={lngs:msg.lang,prefix:msg.prefix}
    if(gear.autoHelper([$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;


    



    const subcommand = msg.args[0]
    const filter = msg.args[1]
    const marketbase = (await DB.marketbase({fullbase:1})).fullbase;
    let itemcount  = DB.marketplace.find({}).countDocuments();
    let userData = DB.users.get(msg.author.id)

    if(subcommand === "list"){
        msg.author.marketplacing = false;
        let thispage = parseInt(filter) ? Math.abs(filter) : 1;
        let query={}

        if(filter && !parseInt(filter)){
            switch(filter){
                case "bg":
                case "bgs":
                case "background":
                case "backgrounds":
                    query = {item_type:'background'}
                    break;
                case "booster":
                case "boosters":
                case "boostepack":
                case "boostepacks":
                    query = {item_type:'boosterpack'}
                case "sticker":
                case "stickers":
                    query = {item_type:'sticker'}
                    break;
                case "medal":
                case "medals":
                    query = {item_type:'medal'}
                    break;
                case "junk":
                    query = {item_type:'junk'}
                    break;
                case "key":
                case "ring":
                    query = {item_type:'key'}
                    break;
                case "material":
                case "materials":
                    query = {item_type:'material'}
                    break;
                case "item":
                case "items":
                    query = {item_type: { $in: ["key","junk","material"] } }
                    break;
                case "mine":
                    query = {author: msg.author.id}
                    break;
                case "user":
                    if(msg.args[2]){
                        Target = gear.getTarget(msg,2);
                        query = {author:Target.id}
                    }else{
                        query = {author:msg.author.id}
                    }
                    break;
                default:
                    query = {item_id: filter}
                    break;
            }
        }         

        itemcount  = await DB.marketplace.find(query).countDocuments();
        async function Pagination(page,mss,recursion=0){
                let tot_pages = Math.ceil(itemcount/12);
                page = page > tot_pages ? tot_pages : page < 1 ? 1 : page;
                let pagecontent = await DB.marketplace.find(query).limit(12).skip( 12 * ((page||1)-1) );
                let procedure = function(...args){
                    if(mss)
                        return mss.edit(...args);
                    else
                        return msg.channel.send(...args);
                }
                let embed = new gear.Embed
                embed.author("User Marketplace Listings","",paths.CDN)
                if(tot_pages > 0){

                    embed.description = `Showing entries (${page}/${tot_pages})
                    *Type **\`${msg.prefix}market list [PAGE]\`** for a specific page*`
                }else{
                    embed.description = `No Entries were found, please check your search`

                }
                let i = 0
                    
                while (i++ < 12){
                    let offer = pagecontent[i-1]
                    if(!offer){
                        embed.field("\u200b","\u200b",true);
                        continue;
                    }
                    let item = marketbase.find(it=> offer.item_id === it.id && offer.item_type === it.type ) 
                    if(!item) {
                        embed.field("---","`BAD ENTRY`",true);
                        continue;
                    }
                    console.log( Object.keys(offer) )
                    embed.field(
                        gear.emoji(item.rarity)+item.name,
                    `
        **\`${filter === 'mine' ? offer.id : item.type.toUpperCase()}\`**
        ${offer._doc.type=="sell"?"Selling for: ":"Buying for: "} **${gear.miliarize(offer.price,'soft')}**${gear.emoji(offer.currency)}
        [\\🔗 See entry on web](https://beta.pollux.gg/shop/marketplace/entry/${offer.id})
                    `,true)
                }
        
                let mes = await procedure({embed});
                let options = {
                    page,
                    tot_pages
                }
                navigator(mes,msg,Pagination,options,recursion);       
                pagecontent = null;
                mes = null;
                mss = null;
        }
        
        
        
        Pagination(thispage).then(res=>{
           console.log('ok')
        });

    };       

    if(msg.author.marketplacing) return msg.channel.send("Please Wait Before making another Marketplace Action");
    msg.author.marketplacing = true
    setTimeout(()=>msg.author.marketplacing = false, 2000);

    if(subcommand === "post"){
        
        // buy type id

        let operation   = (filter||"").toLowerCase()        //  BUY / SELL
        if(operation && !['buy','sell','info'].includes(operation.toLowerCase())) {
            msg.args.unshift(' ')
            operation = "sell"
        }; //defaults to SELL
        let itemType    = msg.args[2]   //  BG / MEDAL / STICKER / etc.
        let item_id     = msg.args[3]   //  Item ID / Code / Icon
        let price       = Math.abs(parseInt(msg.args[4]))   //  #
        let currency    = msg.args[5] || "RBN"   //  RBN / SPH
        if(currency & !["RBN","SPH"].includes(currency.toUpperCase())) currency = "RBN";
                

        const Helpers = 
        {
             background: "`+market post [sell/buy] background [ID] [PRICE] [SPH/RBN]` - IDs can be found at BG Shop and BG Inventory (Website)"
            ,medal:      "`+market post [sell/buy] medal [ID] [PRICE] [SPH/RBN]` - IDs can be found at Medal Shop and Medal Inventory (Website)"
            ,sticker:    "`+market post [sell/buy] sticker [ID] [PRICE] [SPH/RBN]` - IDs can be found at Sticker Collections and Stickers Inventory (Website)"
            ,boosterpack:"`+market post [sell/buy] booster [ID] [PRICE] [SPH/RBN]` - IDs can be found at Boosterpack Collection (`+boosterpack`)"
            ,item:       "`+market post [sell/buy] item [ID] [PRICE] [SPH/RBN]` - IDs can be found at Inventory (`+inventory`)"

        }

        let embed = new gear.Embed
        embed.title = "Marketplace Listing information"
        embed.description = `
        ${ gear.emoji("RBN") } **Rubine** Listings cost 300 RBN upfront
        ${ gear.emoji("SPH") } **Sapphire** Listings cost 2 SPH upfront
        To sell for Sapphires you need a [Sapphire License](${paths.CDN+'/crafting/#sph-license'}) that must be crafted 
        (Code: \`sph-license\`). It expires after 10 uses.
        There's a 5% cut from the selling price after it is completed.
        *You cannot sell items currently on sale at the storefront for more than their retail price.*
        `
 
        async function AllChecks(){
            userData = DB.users.get(msg.author.id);
            
            checkItem = function(userData, type,id,transaction){
                pass = true;
                reason = "";
                prequery = false;
                query = false;

                if(type == "background"){
                    if(!userData.modules.bgInventory.includes(id)){
                        pass = false
                        reason = "Background not in Inventory"

                    }else{
                        query = {$pull:{'modules.bgInventory':id}}
                    }
                }
                if(type == "medal"){
                    if(!userData.modules.medalInventory.includes(id)){
                        pass = false
                        reason = "Medal not in Inventory"

                    }else{
                        query = {$pull:{'modules.medalInventory':id}}
                    }
                }
                if(type == "boosterpack"){
                    if(!userData.modules.inventory.filter(itm=>itm.id === id+"_booster" && itm.count > 0)){
                        pass = false
                        reason = "Booster not in Inventory"
                    }else{
                        prequery = {id:userData.id, 'modules.inventory.id':id}
                        query = {$inc:{'modules.inventory.$.count':-1}}
                    }
                }
                if (transaction == "buy") {
                    pass = true;                  
                }

                return {pass,reason,prequery, query }
            }
            checkSales = function(userData,type,id){
                let forRBN = true;
                let forSPH = true;
                if(userData.modules.rubines < 300)      forRBN = false;
                if(userData.amtItem('sph-license') < 1) forSPH = false;
                if(userData.modules.sapphires < 2)      forSPH = false;

                return {forRBN,forSPH};           
            }

            let saleStatus = checkSales(await userData, itemType, item_id);
            let itemStatus = checkItem(await userData, itemType, item_id, operation);

            embed.field(
                gear.emoji("RBN")+"Rubine Listing Eligibility",
                saleStatus.forRBN?itemStatus.pass?gear.emoji('yep'):itemStatus.reason:gear.emoji('nope') ,true)
            embed.field(
                gear.emoji("SPH")+"Sapphire Listing Eligibility",
                saleStatus.forSPH?itemStatus.pass?gear.emoji('yep'):itemStatus.reason:gear.emoji('nope') ,true)

            if(operation == "info"){
                return msg.channel.send({embed})
            }

            const validOperation = ['sell','buy'].includes(operation);
            const validType = ["background","medal","boosterpack","sticker","skin","key","consumable","junk"].includes(itemType);
            const validCurrency = ['RBN','SPH'].includes(currency);
            const validItem     = await DB.items.findOne({type:itemType, $or:[{id:item_id},{icon:item_id }] });
            const checkCosmetic = await DB.cosmetics.findOne({
                type:itemType, 
                $or:[
                    {id:item_id},
                    {icon:item_id},
                    {code:item_id},
                    {localizer:item_id}
                ]
            });

            return {validOperation , validType , item_id, validItem,checkCosmetic,price , validCurrency, itemStatus,saleStatus};
        }


        function FULLCHECKS(complete=false){
            if(complete){
                console.log(complete)
                return complete.validOperation && complete.validType && complete.item_id && (complete.validItem||complete.checkCosmetic) && complete.price && complete.validCurrency && complete.itemStatus.pass && complete.saleStatus["for"+currency]
            }
            return validOperation && validType && item_id && (validItem||checkCosmetic) && price && validCurrency && itemStatus.pass && saleStatus["for"+currency]
        }

        console.log(await AllChecks())
        
      let {validOperation , validType , validItem,checkCosmetic, validCurrency, itemStatus,saleStatus} = await AllChecks();

        const confirm = async function(cancellation){
            payload = await AllChecks();
            if(FULLCHECKS(payload)){
                payload.LISTING = {
                    id: require('md5')(Date.now()),
                    item_id, item_type: itemType, price, currency, author: msg.author.id,
                    timestamp: Date.now(), type: operation
                }
                payload.pollux = true;
               
                axios.post(paths.CDN+"/shop/marketplace",payload).then(res=>{
                    if(res.data.status === "OK"){
                        entryId = res.data.payload.id;
                        msg.channel.send(`
${gear.emoji('yep')} **Done!** You can find your entry here:
${paths.CDN+"/shop/marketplace/entry/"+entryId}
Use it to share your listing elsewhere! 
                        `)
                    }else{
                        cancellation();
                    }
                });


            }else{
                msg.channel.send("Listing Invalidated")
                abort();
                cancellation();
            }
        }
        const abort = function(){
            embed.title = ""
            embed.description = `
            **Operation:** ${operation} ${validOperation ? gear.emoji("yep") :  gear.emoji("nope")}
            **Item Type:** ${itemType} ${validType ? gear.emoji("yep") : gear.emoji("nope")}
            **Item ID:** ${item_id} ${  (checkCosmetic||validItem) ? gear.emoji("yep") : gear.emoji("nope")}
            **Price:** ${price} ${ price && price>0 ?  gear.emoji("yep") :  gear.emoji("nope")}
            **Currency:** ${currency} ${validCurrency ?  gear.emoji("yep") :  gear.emoji("nope")}
            `        
            msg.channel.send({content:` **Invalid Listing Command**
            `,embed})
        }
         
        
        if(FULLCHECKS()){

            if(checkCosmetic||validItem) msg.channel.send({embed:{description:`
            ${operation == 'sell' ? "Selling" : 'Buying'}: \`${itemType}\` **${(checkCosmetic||validItem).name}** for **${price}** ${gear.emoji(currency)}
            `}}).then(ms=>{
                YesNo(ms,msg,confirm);
            });
            
        }else{

            abort();
     
        }


    }

    if(subcommand === "delete"){
        if(filter){
            let offer = await DB.marketplace.get({id:filter, author: msg.author.id});
            if(!offer){
                return msg.channel.send(gear.emoji('nope')+"`ITEM NOT FOUND`");
            }else{
                function deleteIt(){
                    DB.marketplace.remove({id:offer.id}).then(res=>{
                        msg.channel.send(gear.emoji('yep')+"`Entry Deleted`");
                    })
                }
                let item = marketbase.find(it=> offer.item_id === it.id && offer.item_type === it.type ) 
                let embed = new gear.Embed
                    embed.title = "Confirm deletion of item";
                    embed.description = `\`${offer.id}\``;
                    embed.thumbnail("http://beta.pollux.gg"+item.img)
     
                
                embed.field(
                    gear.emoji(item.rarity)+item.name,
                `
    **\`${item.type.toUpperCase()}\`**
    ${offer.price}${gear.emoji(offer.currency)}
                `,true)

                msg.channel.send({embed}).then(m=>
                    YesNo(m,msg,deleteIt,null,null,{
                        deleteFields:false,
                        strings:{
                            confirm: "Entry deleted",
                            timeout: "Timeout - Item was not deleted",
                            cancel:  "Cancelled - Item was not deleted"
                        }
                    })
                );
            }

        }
    };




 
}
module.exports={
    init
    ,pub:true
    ,cmd:'market'
    ,perms:3
    ,cat:'economy'
    ,botPerms:['attachFiles','embedLinks','manageMessages']
    ,aliases:[]
}

