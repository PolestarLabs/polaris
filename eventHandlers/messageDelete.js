module.exports = async function run(oldMessage) {
  if (!oldMessage?.author) return;
  oldMessage.channel.snipe = {
    msg_old: {
      content: oldMessage.content,
      attachment: oldMessage.attachments?.[0] || oldMessage.attachments,
    },
    author: {
      avatarURL: oldMessage.author.avatarURL,
      tag: oldMessage.author.tag,
    },
    timestamp: new Date(),
  };
};
