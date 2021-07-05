module.exports = async (interaction, data) => {
    try {
      console.log(data)
        return (require(`./interactions/${data.custom_id.split(":")[0]}.js`))(interaction, data);
        //if (data.component_type === 3) return (require(`./interactions/${data.custom_id.split(":")[0]}.js`))(interaction, data);

    } catch (err) {
 //console.error(err)
    }
}