const DICTS = {
    adjective: require('./adjectives.json'),
    animal: require('./animals.json'),
    fruit: require('./fruit.json'),
    color: require('./colors.json'),    
}

module.exports = function (formation,join=''){    
    // formation =  [dict, [dict,dict]]
    return formation.map(dict=>{
        DICTS.number = [randomize(100,999).toString()];
        if (typeof dict !== 'string' && dict.length) {
            try{
                return capitalize(shuffle( DICTS[ shuffle(dict||["number"])[0] ])[0] );
            }catch(e){
                console.error(e);
                console.log({dict,formation});
                return "Bonk"
            }

        }else{
            return capitalize(shuffle( DICTS[dict] || ['wa'] )[0] );
        }
    }).join(join);
}