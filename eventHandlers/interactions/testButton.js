module.exports = async (interaction, data)=>{

interaction.reply({
 
        "flags": 64,
        "content": "Item",
        "components": [
            {
                "type": 1,
                "components": [
                    {
                        "type": 3,
                        "placeholder": "Select an item...",
                        "custom_id": "item",
                        "min_values": 1,
                        "max_values": 1,
                        "options": [
                            {
                                "label": "Decent Fishing Rod",
                                "description": "Not technically bad, but not technically great.".slice(0,50),
                                "value": 1,
                                "emoji": {id:"716153099470766154"},
                                "default": true
                            },
                            {
                                "label": "Shovel",
                                "description": "For digging holes, both physical and metaphorical.".slice(0,50),
                                "value": "2",
                                "emoji": {id:"716153099823087677"},
                            },
                             
                        ]
                    }
                ]
            }
        ]
 
})
}