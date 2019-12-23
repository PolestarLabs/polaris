// const DB = require('../../../database/db_ops');
// const gear = require('../../../utilities/Gearbox');
const YesNo = require('../../../structures/YesNo');


const init = async function(msg,args){
       
        // buy type id

        let operation   = (args[0]||"").toLowerCase()        //  BUY / SELL
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

        let embed = new Embed
        embed.title = "Marketplace Listing information"
        embed.description = `
        ${ _emoji("RBN") } **Rubine** Listings cost 300 RBN upfront
        ${ _emoji("SPH") } **Sapphire** Listings cost 2 SPH upfront
        To sell for Sapphires you need a [Sapphire License](${paths.CDN+'/crafting/#sph-license'}) that must be crafted 
        (Code: \`sph-license\`). It expires after 10 uses.
        There's a 5% cut from the selling price after it is completed.
        *You cannot sell items currently on sale at the storefront for more than their retail price.*
        `
 
        async function AllChecks(){
            const userData = DB.users.getFull({id:msg.author.id});
            
            const checkItem = function(userData, type,id,transaction){
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
            const checkSales = function(userData,type,id){
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
                _emoji("RBN")+"Rubine Listing Eligibility",
                saleStatus.forRBN?itemStatus.pass?_emoji('yep'):itemStatus.reason:_emoji('nope') ,true)
            embed.field(
                _emoji("SPH")+"Sapphire Listing Eligibility",
                saleStatus.forSPH?itemStatus.pass?_emoji('yep'):itemStatus.reason:_emoji('nope') ,true)

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

        
      let {validOperation , validType , validItem,checkCosmetic, validCurrency, itemStatus,saleStatus} = await AllChecks();

        const confirm = async function(cancellation){
            payload = await AllChecks();
            if(!payload.pass) return;
            if(FULLCHECKS(payload)){
                payload.LISTING = {
                    item_id, item_type: itemType, price, currency, author: msg.author.id,
                    type: operation
                }
                payload.pollux = true;
               
                axios.post(paths.CDN+"/shop/marketplace",payload).then(res=>{
                    if(res.data.status === "OK"){
                        entryId = res.data.payload.id;
                        msg.channel.send(`
${_emoji('yep')} **Done!** You can find your entry here:
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
            **Operation:** ${operation} ${validOperation ? _emoji("yep") :  _emoji("nope")}
            **Item Type:** ${itemType} ${validType ? _emoji("yep") : _emoji("nope")}
            **Item ID:** ${item_id} ${  (checkCosmetic||validItem) ? _emoji("yep") : _emoji("nope")}
            **Price:** ${price} ${ price && price>0 ?  _emoji("yep") :  _emoji("nope")}
            **Currency:** ${currency} ${validCurrency ?  _emoji("yep") :  _emoji("nope")}
            `        
            msg.channel.send({content:` **Invalid Listing Command**
            `,embed})
        }
         
        
        if(FULLCHECKS()){

            if(checkCosmetic||validItem) msg.channel.send({embed:{description:`
            ${operation == 'sell' ? "Selling" : 'Buying'}: \`${itemType}\` **${(checkCosmetic||validItem).name}** for **${price}** ${_emoji(currency)}
            `}}).then(ms=>{
                YesNo(ms,msg,confirm);
            });
            
        }else{
            if (operation == "info") return;
            abort();
     
        }

}

module.exports = {
    init,
    argsRequired: true,
    caseInsensitive: true,
    cooldown: 8000,
    hooks: {
        preCommand: (msg) => msg.author.marketplacing = true,
        postExecution: (msg) => msg.author.marketplacing = false,
    }
}
