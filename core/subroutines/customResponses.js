const { executeCustomResponse } = require("../commands/fun/responses.js");
const activateResponse = (msg) => {
	if (!msg.guild.customResponses) return false;
	const response = msg.guild.customResponses.find((res) => res.trigger === msg.content);
	if (response) {
		executeCustomResponse(response, msg);
		return true;
	}
	return false;
}
	
module.exports = async (msg) => {
	if (activateResponse(msg)) return;
		
	const gResps = await DB.responses.find({ server: msg.guild.id }).noCache() || [];
	msg.guild.customResponses = gResps;
	
	return activateResponse(msg);	
}