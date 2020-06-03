const ECO = require("../../archetypes/Economy");

const init = async function() {

};

module.exports = {
	init
	,pub:true
	,cmd:"roulette"
	,cooldown: 5 * 60e4
	,perms:3
	,cat:"gambling"
	,botPerms:["attachFiles","embedLinks"]
	,aliases:[]
};
