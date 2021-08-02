
const { xp_to_level,	level_to_xp } = require("./_consts");
const getLocalRank = (UID,GID) => DB.localranks.findOne({ user: UID, server: GID }).cache();

module.exports = async (servData,msg) => {

	if (!msg.channel.permissionsOf(PLX.user.id).has("sendMessages")) return;
	if (!servData || !servData.modules || !servData.switches) return;
	if (servData.switches.chExpOff?.includes(channelID)) return;
	//---

	const channelID = msg.channel.id,
			serverID  = servData.id,
			userID 	 = msg.author.id;
	
	const LOCAL_RANK = await getLocalRank(serverID ,userID);
	if (!LOCAL_RANK) return DB.localranks.new({ U: userID, S: serverID, level: 0, exp: 0 });
	//---
	
	const { upfactorA, upfactorB } = servData.progression || { upfactorA: 280, upfactorB: 9 };
	const currentCalculatedLevel = xp_to_level(LOCAL_RANK.exp, upfactorA, upfactorB);	

	if (currentCalculatedLevel !== LOCAL_RANK.level) {
		DB.localranks.set({ user: userID, server: serverID }, { $set: { level: currentCalculatedLevel } });
	}

	DB.localranks.incrementExp({ U: userID, S: serverID });

	if (!servData.modules.LVUP_local || !servData.switches.chLvlUpOff?.includes(channelID)) return;
	//---

	if (currentCalculatedLevel > LOCAL_RANK.level) {
		DB.localranks.set({ user: userID, server: serverID }, { $set: { level: currentCalculatedLevel } });
		const lvupText = servData.modules.LVUP_text?.replaceAll("%lv%", currentCalculatedLevel);	

		msg.reply({embed:{
			color: numColor(_UI.colors.blue),
			description: lvupText || `:tada: **Level Up!** >> ${currentCalculatedLevel}`,
			footer: { icon_url: msg.author.avatarURL, text: msg.author.tag },		
		}});
	}

}
