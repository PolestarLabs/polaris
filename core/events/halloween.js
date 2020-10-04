const upref = "https://pollux.amarok.kr/build/"

/// PORTED FROM VANILLA GEARBOX
const getRandomRarity = function(type="unshuffle"){
    
  let shuffled = shuffle(["UR","SR","SR","R","R","R","R","U","U","U","U","U","U","U","U","C","C","C","C","C","C","C","C","C","C","C","C","C",
  "UR","SR","SR","R","R","R","R","U","U","U","U","U","U","C","C","C","C","C","C","C","C","C","C"]);
  let result;
  if (type == "shuffle"){
    result =  (shuffled[randomize(0,shuffled.length-1)]);
  }
let rand = randomize(0,1000);
  result = "C";
  if(rand<=700) result = "U";
  if(rand<=450) result = "R";
  if(rand<=250) result = "SR";
  if(rand<=100) result = "UR";
  //40 20 15 10 5  
  if (type == "debug"){
    result =  { shuffld : (shuffled[randomize(0,shuffled.length-1)]), enum: result, rand,array:JSON.stringify(shuffled)};
  }
  return result;  
}

module.exports = {
  

userData: async function(Author){
  const USERDATA = await DB.users.findOne({id:Author.id}).lean().exec();
  let eventData = (USERDATA.eventData||{}).halloween18;  
  if(!eventData) {
    //return message.channel.send(noEventPart);
    eventData = {
      inventory:[],
      candy: 0,
      head: null,
      body: null,
      feet: null,
      caskets:0
    }
    await DB.users.set(Author.id,{$set:{'eventData.halloween18':eventData}});
  }
    return eventData;
},
  
  phabricate: function (Author) {
    let rarity = getRandomRarity();
    let type =  shuffle(["head","body","legs","head","body","legs"])[randomize(0,5)]
    let costume =  this._costumes()
    let costumeName =  this._costumes('name',costume)
    let aspect = this._adjectives();
    let aspectBonus =  Math.ceil((this._adjectives(true).indexOf(aspect)));
    
    let item =
    { name : aspect+" "+costumeName+" "+(type=="head"?"Hat":type=="body"?"Vest":"Legs")
    , id : Author.id+"|"+Date.now()
    , rarity
    , spook : this.getSpook(rarity)
    , augment : 0
    , aspect 
    , aspectBonus 
    , costume
    , type 
    }
    
    return item;
    
  },
  
  emoji: {
    candy1:"<:candy1:366437119658557440> "
  },
  
   _costumes: function(operation,ex){
     if(operation){
       if (operation == "name"){
         
         let items ={
           nurse: "Nurse",
            wizard: "Wizard",
            devil: "Devil",
            vamp: "Vampire",
            frank: "Frank",
            chicken: "Chicken",
            cow: "Cow",
            mummy: "Mummy",
            scrow: "Scarecrow",
         }
         
         return items[ex]
       }
     }
     
  let list = [
    "nurse",
    "nurse",
    "vamp",
    "vamp",
    
    "wizard",
    "wizard",
    
    "devil",
    "devil",
    
    "frank",
    
    "chicken",
    
    
    "cow",

    
    "mummy",


    
    "scrow"

 
    
  ]
  list = shuffle(list)
  list = shuffle(list)
  list = shuffle(list)
  let index = randomize(0,list.length-1)
  return list[index];
   },
  
 _adjectives: function(arg=false){
  const list = [

    
    "Silly"

    ,"Risible"
    ,"Ridiculous"
    ,"Ludicrous"
    ,"Absurd"
    ,"Shameful"
    ,"Unpleasant"
    ,"Unnerving"
    ,"Creepy"
    ,"Eerie"
    ,"Shuddersome"
    ,"Disturbing"
    ,"Dreadful"
    ,"Scary"
    ,"Distressing"
    ,"Tragic"
    ,"Grim"
    ,"Ghastly"
    ,"Egregious"
    ,"Atrocious"
    ,"Gruesome"
    ,"Nightmarish"
    ,"Horrific"
    ,"Macabre"
    ,"Morbid"
    ,"Lurid"
    ,"Appalling"
    ,"Hideous"
    ,"Sinister"
    ,"Abominable"
    ,"Dire"
    ,"Ominous"
    ,"Grievous"
    ,"Deplorable"
    ,"Calamitous"
    ,"Bloodcurdling"
    ,"Wicked"
    ,"Horrifying"
    ,"Spoopty"
    ,"Spoopy"
    ,"Spooky Scary"
  ] 
  let index = randomize(0,list.length-1)
  if(arg)return list;
  return list[index];
 },
  
  getSpook: function(rar){
    
    if(rar=="C")  return randomize(02,15);
    if(rar=="U")  return randomize(10,25);
    if(rar=="R")  return randomize(20,35);
    if(rar=="SR") return randomize(32,60);
    if(rar=="UR") return randomize(55,99);
    if(rar=="XR") return randomize(75,95);
    
  }
   
 
  
  
}