
const { xp_to_level,	level_to_xp } = require("./_consts");
const getLocalRank = (GID,UID) => DB.localranks.findOne({ user: UID, server: GID }).cache();
const autoLevelRoles = require("./autoLevelRoles");

module.exports = async (servData,msg) => {

	
	if (!servData) return;
	if(!servData.modules) console.log("SERVDATA WITH NO MODULES".red, servData);
	
	const channelID = msg.channel.id,
			serverID  = servData.id,
			userID 	 = msg.author.id;
			
	if (servData.switches?.chExpOff?.includes(channelID)) return;
	//---

	
	
	const LOCAL_RANK = await getLocalRank(serverID ,userID);
	if (!LOCAL_RANK) return DB.localranks.new({ U: userID, S: serverID, level: 0, exp: 0 });
	//---
	
	const { upfactorA, upfactorB } = servData.progression || { upfactorA: 280, upfactorB: 9 };
	const currentCalculatedLevel = xp_to_level(LOCAL_RANK.exp, upfactorA, upfactorB);	


	if (currentCalculatedLevel !== LOCAL_RANK.level) {
		DB.localranks.set({ user: userID, server: serverID }, { $set: { level: currentCalculatedLevel } });
	}

	DB.localranks.incrementExp({ U: userID, S: serverID });

	if (!servData.modules.LVUP_local || servData.switches?.chLvlUpOff?.includes(channelID)) return;
	//---

	if (currentCalculatedLevel > LOCAL_RANK.level) {
		
		if (servData.modules.AUTOROLES) autoLevelRoles(servData,msg.author.id,currentCalculatedLevel);

		await DB.localranks.set({ user: userID, server: serverID }, { $set: { level: currentCalculatedLevel } });
		
		const lvupText = servData.modules.LVUP_text?.replaceAll("%lv%", currentCalculatedLevel);	
		
		if (!msg.channel.permissionsOf(PLX.user.id).has("sendMessages")) return;
		msg.reply({embed:{
			color: numColor(_UI.colors.blue),
			description: lvupText || `:tada: **Level Up!** >> ${currentCalculatedLevel}`,
			footer: { icon_url: msg.author.avatarURL, text: msg.author.tag },		
		}});
	}

}
