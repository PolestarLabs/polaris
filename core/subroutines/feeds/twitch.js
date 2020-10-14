const cfg = require(`${appRoot}/config.json`);
const axios = require('axios')


exports.run = async (feed,serverLang="en") => {

    const response = await axios.get(
        `https://api.twitch.tv/helix/streams?user_login=${feed.url}`,
        { headers: { "User-Agent": "Pollux@Polaris.beta-0.1", "Client-ID": cfg.twitch } },
    ).timeout(3000).catch(() => null);
    
    if (!response) return;
    const StreamData = response.data?.data[0];
    
    if (!StreamData) return;
    if (
        !(
        feed.last.type === StreamData.type
        && feed.last.title === StreamData.title
        && feed.last.started_at === StreamData.started_at
        )
    ) {
        const res = await axios.get(
        `https://api.twitch.tv/helix/users?login=${feed.url}`,
        { headers: { "User-Agent": "Pollux@Polaris.beta-0.1", "Client-ID": cfg.twitch } },
        ).timeout(3000).catch(() => null);
        if (!res) return;
        
        const streamer = res.data[0] || res.data.data[0];
        const P = { lngs: [serverLang || "en", "dev"], streamer: streamer.display_name };
        const embed = {};
        embed.thumbnail = { url: streamer.profile_image_url };
        embed.author    = { name:StreamData.title };
        embed.image     = { 
            url: StreamData.thumbnail_url.replace("{width}", "400").replace("{height}", "240")
        };
        embed.timestamp = StreamData.started_at;
        embed.color =0x6441A4;
        const ping = feed.pings || feed.pings || "";
    
        await DB.feed.updateOne(
            { server: feed.server, url: feed.url },
            { $set: { last: StreamData, thumb: streamer.profile_image_url } },
        ).catch(console.error);
    
        PLX.getChannel(feed.channel).send({
            content: `${ping}${$t("interface.feed.newTwitchStatus", P)} <https://twitch.tv/${streamer.login}>`,
            embed,
        });
    }

}
