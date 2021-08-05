module.exports = async (interaction, data) => {
    try {

      INSTR.inc("interactions.components", {cusom_id: data.custom_id.split(":")[0], expand_id: data.custom_id.split(":")[1] } )
      return (require(`./interactions/${data.custom_id.split(":")[0]}.js`))(interaction, data);
        //if (data.component_type === 3) return (require(`./interactions/${data.custom_id.split(":")[0]}.js`))(interaction, data);

    } catch (err) {
 //console.error(err)
    }
}