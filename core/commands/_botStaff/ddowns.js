const init = async function (msg,args){

    let components;
    if(args[0]=='rlt'){
        const OPTIONS = [
            
           
        {label:"Split",  description:"Bet between 2 numbers. [Payout: X]",     emoji: { id: _emoji("split").id }   ,   value: "split"},
        {label:"Street",  description:"Bet across 3 numbers in a row",     emoji: { id: _emoji("street").id }  ,   value: "street"},
        {label:"Square",  description:"Bet on 4 adjacent numbers",     emoji: { id: _emoji("square").id }  ,   value: "square"},
        {label:"Basket",  description:"Bet on the first 3 numbers and the zeroes",     emoji: { id: _emoji("basket").id }  ,   value: "basket"},
        {label:"Double Street",  description:"Bet on 6 numbers across 2 adjacent rows",     emoji: { id: _emoji("dstreet").id } ,   value: "dstreet"},
        {label:"First Dozen",  description:"Bet on numbers 1 to 12",     emoji: { id: _emoji(`dozen1`).id }  ,   value: "dozen1"},
        {label:"Second Dozen",  description:"Bet on numbers 13 to 24",     emoji: { id: _emoji(`dozen2`).id }  ,   value: "dozen2"},
        {label:"Third Dozen",  description:"Bet on numbers 25 to 36",     emoji: { id: _emoji(`dozen3`).id }  ,   value: "dozen3"},
        {label:"First Column",  description:"Bet on 12 numbers top-down",     emoji: { id: _emoji(`column1`).id } ,   value: "column1"},
        {label:"Second Column",  description:"Bet on 12 numbers top-down",     emoji: { id: _emoji(`column2`).id } ,   value: "column2"},
        {label:"Third Column",  description:"Bet on 12 numbers top-down",     emoji: { id: _emoji(`column3`).id } ,   value: "column3"},
        {label:"Snake",  description:"Bet on the Snake Pattern (Yellow numbers)",     emoji: { id: _emoji("snake").id }   ,   value: "snake"},
        {label:"Manque / Low",  description:"Bet on the bottom half of the board (1-18)",     emoji: { id: _emoji("manque").id }  ,   value: "manque"},
        {label:"Passe / High",  description:"Bet on the top half of the board (19-36)",     emoji: { id: _emoji("passe").id }   ,   value: "passe"},
        {label:"Noir / Black",  description:"Bet on all Blacks",     emoji: { id: _emoji("noir").id }    ,   value: "colour1"},
        {label:"Rouge / Red",  description:"Bet on all Reds",     emoji: { id: _emoji("rouge").id }   ,   value: "colour2"},
        {label:"Impair / Odd",  description:"Bet on all Odd numbers",     emoji: { id: _emoji("odd").id }     ,   value: "parity1"},
        {label:"Pair / Even",  description:"Bet on all Even numbers",     emoji: { id: _emoji("even").id }    ,   value: "parity2"},

        ]


        components = [
            {
                type:1,
                components:[
                   {
                    type: 3,
					placeholder: "Select...",
					custom_id: `1`,
					min_values: 0,
					max_values: 10,
					disabled: false,
					options: OPTIONS.map((O) => {						
						return O
					}).slice(0,25)

                   }
                ]
            }
        ]
        

    }

    msg.reply({
        content:".",
        components
    })


}
module.exports={
    init
    ,pub:false
    ,cmd:'ddowns'
    ,cat:'_botStaff'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['dd']
}