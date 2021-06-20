const {ITEM_TYPES} = require("./_meta.js");

const init = async (msg, args) => {
    const inventory = await DB.gifts.find({ holder: msg.author.id }).lean().exec();
    if (inventory.length < 1) return "No gifts here!";
  
    const userData = await DB.users.get(msg.author.id);
    const gift = inventory.find(g=>g.friendlyID?.toLowerCase() == args[0]?.toLowerCase()) || inventory[Number(args[0] || 1) - 1 || inventory.length - 1];
    if (gift.creator == msg.author.id){
        const response = await msg.reply({
            content: `Click here to see what's inside of ${gift.emoji} **${gift.friendlyID||gift._id}**.\nOnly you will be able to see its contents.`,
            components: [{type:1,components:[
                {
                    type: 2,
                    style: 1,
                    emoji: {name:"👁"},
                    label: "Peek",
                    custom_id: "peek"
                }
            ]}]
        });

        const Collector = response.createButtonCollector(c=>c.userID === msg.author.id, {time:10e3,maxMatches:1});
        Collector.on("click", async interaction => {
            await interaction.followup({
                content: "These are the contents of your gift:",
                embed: {
                    title: gift.friendlyID || gift._id,
                    description: `*\`\`\`${giftItem.message}\`\`\`*`,
                    thumbnail: { url: `https://cdn.discordapp.com/emojis/${gift.emoji.replace(/[^0-9]/g,'')}.png` },
                    image: { url: `${paths.CDN}/${gift.type}s/${gift.item}.png` },
                },
                flags: 64
             });
        })

    }else{
        return "You can only peek at gifts you packed yourself!";
    }
}   

module.exports = {
    init,
    argsRequired: false,
    aliases: ["op", "unwrap"],
};
  