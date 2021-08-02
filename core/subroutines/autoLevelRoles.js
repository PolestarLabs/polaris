const sorting = (a, b) => b[1] - a[1];
module.exports = (servData,userID,curLevelLocal) => {

	if (!msg.guild.permissionsOf(PLX.user.id).has("manageRoles")) return;
	if (!servData.modules || !userID ) return;

	const AUTOS = servData.modules.AUTOROLES.sort(sorting);
	const roleStack = servData.modules.autoRoleStack !== false;
	let errored = 0;

	for (role in AUTOS){
		const [Level,RoleID] = role;

		// Add Current
		if (Level === curLevelLocal)
			PLX.addGuildMemberRole(
				servData.id, userID, RoleID,
				`Level Up (${Level}) -> Level ${curLevelLocal}`
			).catch(err=>errored++);				
		
		// Add Retroactive
		if (Level  <= curLevelLocal && roleStack === true)
			PLX.addGuildMemberRole(
				servData.id, userID, RoleID,
				`Retroactive Level Stack (${Level}) -> Level ${curLevelLocal}`
			).catch(err=>errored++);				
		
		// Remove Higher Levels
		if (Level  > curLevelLocal)
			PLX.removeGuildMemberRole(
				servData.id, userID, RoleID,
				`Delevel (${Level}) -> Level ${curLevelLocal}`
			).catch(err=> null);
		
		// Remove All Diff levels
		if (Level !== curLevelLocal && roleStack === false )
			PLX.removeGuildMemberRole(
				servData.id, userID, RoleID,
				`Clear Level Stack (${Level}) -> Level ${curLevelLocal}`
			).catch(err=>errored++);

	}
	
	setTimeout(()=> errored ? console.error("Local Level Up Roles:".yellow, errored, "errors.", `Sv: ${servData.id}` ) : null, 3000 );

}