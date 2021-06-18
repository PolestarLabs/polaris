module.exports = async (user, old) => {
    PLX.redis.set(`discord.users.${user.id}`, JSON.stringify(user));
};
