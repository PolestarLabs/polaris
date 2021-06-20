const DICTS = {
    adjective: require('./adjectives.json'),
    animal: require('./animals.json'),
    food: require('./food.json'),
    color: require('./colors.json'),    
}

module.exports = function (formation){    
    // formation =  [dict, [dict,dict]]
    return formation.map(dict=>{
        DICTS.number = [randomize(100,999).toString()];
        if (typeof dict !== 'string' && dict.length) {
            return capitalize(shuffle( DICTS[ shuffle(dict||[])[0] || 'number' ])[0] );
        }else{
            return capitalize(shuffle( DICTS[dict] || ['wa'] )[0] );
        }
    }).join('');
}