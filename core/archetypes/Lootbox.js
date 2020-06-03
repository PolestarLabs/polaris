/**************************/
//          ODDS          //
/**************************/

const {LootRates: RATES} = require(appRoot+"/GlobalNumbers.js")

const itmODDS  = RATES.itemType
const rarODDS  = RATES.rarity
const gemRATES = RATES.gems

const POPULATE = (pile,no,pushee)=>{while(no--) pile.push(pushee); return pile};

const itmPILE = []
Object.keys(itmODDS).forEach(i=> POPULATE(itmPILE,itmODDS[i],i) );
const rarPILE = []
Object.keys(rarODDS).forEach(i=> POPULATE(rarPILE,rarODDS[i],i) );

//=================================================================

class LootboxItem{
  #filter;
  #bypass;
  constructor(t,r,p){
    this.type   = t == "BKG"  ? "background" 
                    : t == "MDL" ? "medal"
                      : t == "BPK" ? (this.collection="items", "boosterpack")
                        : t == "ITM" ? (this.collection="items", p.itemType)
                          : ["RBN","JDE","SPH"].includes(t) ? "gems" : null;

    this.rarity = r || "C";
    this.exclusive  = p.exclusive || null;
    this.event   = p.event  || null;
    this.#filter = p.filter || null;
    this.#bypass = p.bypass || [];

  }
  
  fetchFrom(collection){
    collection = collection || this.collection || "cosmetics";
    this.loaded= new Promise(resolve=>{
      const query = {rarity: this.rarity};
      this.event   ? query.filter = this.event  : null;
      this.#filter ? query.event  = this.#filter : '';
      query.droppable = !this.#bypass.includes("droppable");
      if(this.type != 'boosterpack')
        query.public  = !this.#bypass.includes("public");

      query.type      = this.type;
      let queries = [query];
      if (this.exclusive) queries.push({exclusive:this.exclusive});
      DB[collection].aggregate([
        { $match: {$or:queries} },
        { $sample: {size: 1}}
      ]).then(res=>{
        res = res[0] ||{}
        if(!res) this.content = null;
        res.id    ?this.id   = res.id             : res._id;
        res.name  ?this.name = res.name           : null;
        res.code  ?this.code = res.code           : null;
        res.icon  ?this.icon = res.icon           : null;
        res.BUNDLE?this.release_pack = res.BUNDLE : null;
        this.isPublic = res.public;
        resolve(this);
        this.loaded = true;        
      })
    });
    return this.loaded;
  }

  calculateGems(gem){
    let noise = randomize(-250,250);
    this.amount = gem === "SPH" ? 1 : Math.floor( (gemRATES[this.rarity] + noise) * (gem=='JDE'?8:1));
    this.currency = gem
    return this.amount;
  }

  getOne(col){
    this.item = shuffle(shuffle(col))[0];
  }

}

class Lootbox{
  #size;
  #filter;     
  constructor(rar,options={}){
    this.rarity     = rar;
    this.content    = [];
    this.timestamp  = Date.now();
    this.event      = options.event  || false;
    this.#size      = options.size   || 3;
    this.#filter    = options.filter || false;

    let rarArray = Lootbox._shuffle(rarPILE).slice(0,2).concat(rar);
    let eveArray = Lootbox._shuffle([false,this.event,false]);
    let itmArray = Lootbox._shuffle(itmPILE).slice(0,3);
    let fltArray = Lootbox._shuffle([false,this.#filter,false]);

    let contentBlueprint = []
    for (let i=0; i<this.#size; i++){
      contentBlueprint.push({ rarity: rarArray[i], event: eveArray[i], item: itmArray[i], filter: fltArray[i] })
    }

    contentBlueprint = Lootbox._shuffle(contentBlueprint)       
    
    this.content = contentBlueprint.map(cbl=>{
      let Item = new LootboxItem(cbl.item,cbl.rarity,cbl);
      if(Item.collection) Item.fetchFrom(Item.collection);
      else if(Item.type != "gems") Item.fetchFrom();
      else Item.calculateGems(cbl.item)
      return Item;
    })
    
    
    this.compileVisuals = new Promise(resolve=>{
      this.visuals = new Array(3);
      let completed = 0
      this.content.forEach(async (ct,i,a)=>{
        await ct.loaded;
        if(ct.type == 'background')  this.visuals[i] = (paths.CDN+`/backdrops/${ct.code}.png`);
        if(ct.type == 'medal')       this.visuals[i] = (paths.CDN+`/medals/${ct.icon}.png`);
        if(ct.collection == 'items') this.visuals[i] = (paths.CDN+`/build/items/${ct.icon}.png`);
        if(ct.type == 'boosterpack') this.visuals[i] = (paths.CDN+`/build/boosters/${ct.icon}.png`);
        if(ct.type == 'gems')        this.visuals[i] = (paths.CDN+`/build/LOOT/${ct.currency}_${ct.rarity}.png`);
        
        if(++completed ==a.length){
          resolve(null)
          delete this.compileVisuals;
        }
      })
    })


    this.legacyfy = new Promise(resolve=>{
      this.legacy = []
      let completed = 0
      console.log(this)
      this.content.forEach(async (ct,i,a)=>{
        await ct.loaded;
        console.log({ct})
        this.legacy.push({
          item:   ct.type == "boosterpack"?ct.id: ct.code || ct.icon ||ct.id || ct.amount ,
          rarity: ct.rarity,
          emblem: legacyEmblem(ct),
          type:   legacyEmblem(ct,true),
          name:   ct.name ||ct.amount|| ct.icon || ct.code || ct.id,
        })
        if( ++completed == a.length){
          resolve(this.legacy)
          delete this.legacyfy
        }
      })
    })     
  }  
  
  static _shuffle(arr) {
    const newArr = arr.slice();
    arr.forEach((_,i)=>{
      const j = Math.floor(Math.random() * (i + 1));
      const temp = newArr[i];
      newArr[i] = newArr[j];
      newArr[j] = temp;
    })
    return newArr;
  }  

}


function legacyEmblem(ct,mini){
  if(ct.type == "medal")       return "MEDAL";
  if(ct.type == "background")  return "BG";
  if(ct.type == "boosterpack") return mini ? "BOOSTER"    : "STAMP";
  if(ct.currency == "RBN")     return mini ? "RUBINES"  : "RUBINE_"   +ct.rarity;
  if(ct.currency == "JDE")     return mini ? "JADES"    : "JADE_"     +ct.rarity;
  if(ct.currency == "SPH")     return mini ? "SAPPHIRE" : "SAPPHIRE_" +ct.rarity;
}


module.exports={Lootbox,LootboxItem}