const { image } = require("stackblur-canvas");

module.exports = async ( interaction, data) => {
    try{
        (require(`./interactions/${data.custom_id.split(":")[0]}.js`))(interaction, data)
    } catch (err){
        
    }
}