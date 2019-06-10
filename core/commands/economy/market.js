const gear = require('../../utilities/Gearbox');
const navigator = require('../../structures/ReactionNavigator');
const YesNo = require('../../structures/YesNo').run;
const DB = require('../../database/db_ops');
const ReactionMenu = require('../../structures/ReactionMenu');

//const locale = require('../../../utils/i18node');
//const $t = locale.getT();


const init = async function (msg){

    let Target = gear.getTarget(msg);
console.log({Target})
    
    let P={lngs:msg.lang,prefix:msg.prefix}
    if(gear.autoHelper([$t('helpkey',P)],{cmd:this.cmd,msg,opt:this.cat}))return;


    
    /*
    { 
        "_id" : ObjectId("5c8b224929c868299c676d19"), 
        "id" : "1", 
        "item_id" : "daianpanmercy", 
        "item_type" : "sticker", 
        "price" : 3000.0, 
        "currency" : "SPH", 
        "author" : "88120564400553984", 
        "timestamp" : 1552678207818.0, 
        "type" : "sell"
    }
    */

    const subcommand = msg.args[0]
    const filter = msg.args[1]
    const marketbase = (await DB.marketbase({fullbase:1})).fullbase;
    let itemcount  = DB.marketplace.find({}).countDocuments();

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
    setTimeout(()=>msg.author.marketplacing = false, 20000);

    if(subcommand === "post"){
        
        // buy type id

        let operation   = filter        //  BUY / SELL
        let itemType    = msg.args[2]   //  BG / MEDAL / STICKER / etc.
        let item_id     = msg.args[3]   //  Item ID / Code / Icon

        const Helpers = 
        {
             background: "`+market post [sell/buy] background [ID]` - IDs can be found at BG Shop and BG Inventory (Website)"
            ,medal:      "`+market post [sell/buy] medal [ID]` - IDs can be found at Medal Shop and Medal Inventory (Website)"
            ,sticker:    "`+market post [sell/buy] sticker [ID]` - IDs can be found at Sticker Collections and Stickers Inventory (Website)"
            ,boosterpack:"`+market post [sell/buy] booster [ID]` - IDs can be found at Boosterpack Collection (`+boosterpack`)"
            ,item:       "`+market post [sell/buy] item [ID]` - IDs can be found at Inventory (`+inventory`)"

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

