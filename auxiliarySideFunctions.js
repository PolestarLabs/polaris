const axios = require("axios");

module.exports = auxiliarySideFunctions;

function auxiliarySideFunctions(Client) {
    Client.getOrCreateUser = async (user) => {
        let udata = await DB.users.findOne({ id: user.id });
        if (!udata) udata = await DB.users.new(user);
        return udata;
    };

    Client.softKill = (msg) => {
        console.log("Soft killing".bgBlue);
        Client.restarting = true;
        Client.removeListener("messageCreate", Client.eventHandlerFunctions.messageCreate);

        Promise.all(Client.execQueue)
            .then(async () => {
                if (msg) {
                    await msg.reply(`${_emoji("yep")} Queue consumed. Rebooting now...`);
                }
                Client.disconnect({ reconnect: false });
                process.exit(0);
            })
            .timeout(30e3)
            .catch(async (error) => {
                if (msg) {
                    await msg.reply(
                        `${_emoji("nope")} Queue errored or timed out. Hard-rebooting now...`
                    );
                }
                console.error(error);
                process.exit(1);
            });
    };

    Client.hardKill = () => {
        console.log("Hard killing".red);
        Client.removeListener("messageCreate", () => null);
        Client.disconnect({ reconnect: false });
        process.exit(1);
    };

    Client.setAvatar = async (url) => {
        try {
            const response = await axios.get(url, {
                headers: { Accept: "image/*" },
                responseType: "arraybuffer",
            });
            await Client.editSelf({
                avatar: `data:${response.headers["content-type"]
                    };base64,${response.data.toString("base64")}`,
            });
        } catch (err) {
            console.error(err);
        }
    };

    Client.bean = async (
        guild,
        user,
        delete_message_days = 0,
        reason = "No reason specified"
    ) => {
        await axios.put(
            `https://discord.com/api/guilds/${guild}/bans/${user}`,
            { delete_message_days, reason },
            { headers: { Authorization: Client._token } }
        );
    };

    Client.unbean = async (
        guild,
        user,
        delete_message_days = 0,
        reason = "No reason specified"
    ) => {
        await axios.delete(
            `https://discord.com/api/guilds/${guild}/bans/${user}`,
            { delete_message_days, reason },
            { headers: { Authorization: Client._token } }
        );
    };
    
    Client.reply = async (msg, content, ping = false) => {
        const payload = {
            allowed_mentions: { replied_user: ping },
            message_reference: {
                channel_id: msg.channel.id,
                guild_id: msg.guild.id,
                message_id: msg.id,
            },
        };
        if (typeof content === "string") payload.content = content;
        else Object.assign(payload, content);

        const result = await axios.post(
            `https://discord.com/api/v8/channels/${msg.channel.id}/messages`,
            payload,
            { headers: { Authorization: Client._token } }
        );
        return result;
    };
}