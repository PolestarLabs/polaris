//TODO constants level curve

const _CURVE = 0.0427899;
const xp_to_lv = (xp) => Math.floor(_CURVE * Math.sqrt(xp));
//Math.trunc(Math.pow((userData.modules.level + 1) / _CURVE, 2)); 			=> REVERSE

const notifyUser = (userData,prize) => {
	if (await PLX.redis.aget(`noDMs.${userData.id}`)) return;
	if (!userData?.switches || userData.switches?.LVUPDMoptout === true) return;
	
	PLX.getDMChannel(userData.id).then(async (dmChan) => {
	  dmChan.createMessage(`**+1** x ${_emoji("loot")}${_emoji(prize)} Level Up Bonus!`)
		  .catch((err) => {
			  PLX.redis.set(`noDMs.${userData.id}`, true);
			  PLX.redis.expire(`noDMs.${userData.id}`, 30 * 60);
		  });
	});
}

 const levelUpPrizeMail = (userData, level) => {
	
	let awardTier;
	switch(true){
		case level % 25: awardTier = "UR"; break;
		case level % 15: awardTier = "SR"; break;
		case level % 10: awardTier = "R";  break;
		case level %  5: awardTier = "U";  break;
		default: awardTier = "C"
	}

	return [
		notifyUser(userData,awardTier),
		userData.addItem(`lootbox_${awardTier}_O`),
	];
}

const commitLevel = (U,L) => DB.users.set(U, { $set: { "modules.level": L } });



async function globalLevelUp(msg,userData) {	

	if (!msg.channel.permissionsOf(PLX.user.id).has("sendMessages")) return;

	const userData = userData || await DB.users.get(msg.author.id);
	if (!userData) return;
	const curLevelG = xp_to_lv(userData.modules.exp);

	setImmediate(()=>{
		if (curLevelG > userData.modules.level){
			commitLevel(userData.id,curLevelG);
			Promise.all(levelUpPrizeMail(userData,curLevelG))
		}
	});

	setImmediate(()=>{
		console.log("[GLOBAL LEVEL UP]".blue, msg.author.tag.yellow, msg.author.id);
		resolveFile(`${paths.GENERATORS}/levelup.gif?level=${curLevelG}&cache=1&avatar=${msg.author.avatarURL}&uid=${msg.author.id}`)
			.then(img=> msg.reply("",{ file: img, name: "level_up.gif" }) );
	});

}