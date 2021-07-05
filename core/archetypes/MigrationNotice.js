module.exports = {
    async notice(msg){
        const olduser = await vDB.users.get(msg.author.id);

        if (!olduser.migrated){

            msg.reply({
                embed: {
                    description: `**ACCOUNT MIGRATION PENDING**\n`
                    +`\nPollux received a major update and all users are required to migrate their accounts. We found data for this account in our old Database so you must migrate if you want to keep your previous account!\n`
                    +`\n__Please be sure to migrate it before September 25th 2021.__`
                    +`\n• **__read__ instructions carrefully, you only have one-shot**`
                    +`\n• use \`plx!migrate\` and follow the instructions.`
                    +`\n• be wary that **daily streak expiration is down to __40 hours__**`
                    +`\n• read instructions`
                    +`\n• this cannot be undone`
                    +`\n• we won't transfer different discord accounts until 2022`
                    +`\n• blacklisted users can't migrate.`
                    +`\n• did I mention read instructions? yeah, **read** the instructions`,

                    color: numColor(_UI.colors.red)
                }
            });
            
        }
        if (olduser.blacklisted !== "false" && olduser.blacklisted?.length){
            vDB.users.set(msg.author.id,{migrated:true});
            DB.users.set(msg.author.id,{formerBlacklisted:true});
        }
    },
    streakAlert(msg){
        msg.reply({
            embed: {
                description: `**Notice:** Daily streaks are now lost after **40 hours**.`,
                color: numColor(_UI.colors.red)
            }
        });
    }
}