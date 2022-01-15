const ECO = require("../../archetypes/Economy");

/* eslint-disable arrow-body-style */
const init = async (msg, args) => {
  return;
  const marriages = await DB.relationships.find({ type: "marriage", users: msg.author.id });
  if (!marriages) return msg.channel.send(`<@${msg.author.id}> you are not married! :broken_heart:`);

  if (marriages.length === 1) {
    const userID = marriages[0].users.filter((id) => id !== msg.author.id)[0];
    promptDivorce(msg, userID);
  } else {
    const select = {
      type: 3,
      custom_id: "divorce_select",
      options: await Promise.all(marriages.map(async (obj) => {
        const uID = obj.users.filter((id) => id !== msg.author.id)[0];
        return {
          label: (await DB.users.getFull(uID)).tag,
          value: uID,
          description: new Date(obj.since).toDateString(),
        };
      })),
    };

    const prompt = await msg.channel.send({
      content: "Oh, well, you are married to multiple people. Which one do you want to divorce?",
      components: [{ type: 1, components: [select] }],
    });

    const choice = await prompt.awaitButtonClick((i) => i.userID === msg.author.id, { maxMatches: 1, time: 30000, disableButtons: true });
    prompt.delete();
    promptDivorce(msg, choice[0].data.values[0]);
  }
};

const promptDivorce = async (msg, userID) => {
  const embed = {
    description: `The process will cost ${_emoji("RBN")} 2500 for each of you.\n${_emoji("polluxloading")}`,
    color: 0xe02850,
  };
  const buttons = [
    {
      type: 2,
      style: 3,
      label: "Yes",
      custom_id: "divorce_accept",
      emoji: { name: "YEP", id: "763616714914922527" },
    },
    {
      type: 2,
      style: 4,
      label: "No",
      custom_id: "divorce_reject",
      emoji: { name: "NOPE", id: "763616715036033084" },
    },
  ];

  const prompt = await msg.channel.send({
    content: `<@${userID}>, ${msg.author.username} has asked you to divorce. Do you accept?`,
    embed,
    components: [{ type: 1, components: buttons }],
  });

  const user = await DB.users.getFull(msg.author.id);
  const partner = await DB.users.getFull(userID);
  try {
    const [choice] = await prompt.awaitButtonClick((i) => i.userID === userID, { maxMatches: 1, time: 30000, disableButtons: true });
    if (choice.data.custom_id === "divorce_accept") {
      if (user.modules.RBN < 2500) {
        return msg.channel.send(`<@${msg.author.id}>, you need at least ${_emoji("RBN")} 2500 to divorce.`);
      }

      if (partner.modules.RBN < 2500) {
        return msg.channel.send(`<@${userID}>, you need at least ${_emoji("RBN")} 2500 to divorce.`);
      }

      // TODO user dashboard API to divorce
      await ECO.pay(msg.author.id, 2500);
      await ECO.pay(userID, 2500);
      msg.channel.send(`The ending of a story: <@${msg.author.id}> and **${partner.username}** are now divorced. :broken_heart:`);
    } else if (choice.data.custom_id === "divorce_reject") {
      const rejectPrompt = {
        title: "Divorce request denied",
        // eslint-disable-next-line max-len
        description: `${partner.name} has rejected your divorce request. You can still pay me ${_emoji("RBN")} 5000 to find a lawyer and divorce for you. Do you want to proceed?\n\n${_emoji("polluxloading")}`,
        color: 0xe02850,
      };
      buttons[0].custom_id = "divorce_lawyer_accept";
      buttons[1].custom_id = "divorce_lawyer_reject";
      const prompt2 = await prompt.edit({
        content: "",
        embed: rejectPrompt,
        components: [{ type: 1, components: buttons }],
      });

      const choice2 = await prompt2.awaitButtonClick((i) => i.userID === msg.author.id, { maxMatches: 1, time: 30000, disableButtons: true });
      if (choice2[0].data.custom_id === "divorce_lawyer_accept") {
        await rejectFlow(user, msg, partner);
      } else {
        await prompt2.delete();
        msg.channel.send(`<@${msg.author.id}>, alright, I won't divorce you.`);
      }
    }
  } catch (e) {
    const rejectPrompt = {
      title: "Divorce request timed out",
      // eslint-disable-next-line max-len
      description: `${partner.name} didn't respond in time. You can still pay me ${_emoji("RBN")} 5000 to find a lawyer and divorce for you. Do you want to proceed?\n\n${_emoji("polluxloading")}`,
      color: 0xe02850,
    };
    buttons[0].custom_id = "divorce_lawyer_accept";
    buttons[1].custom_id = "divorce_lawyer_reject";
    await prompt.edit({
      content: "",
      embed: rejectPrompt,
      components: [{ type: 1, components: buttons }],
    });

    const choice2 = await prompt.awaitButtonClick((i) => i.userID === msg.author.id, { maxMatches: 1, time: 30000, disableButtons: true });
    if (choice2[0].data.custom_id === "divorce_lawyer_accept") {
      await rejectFlow(user, msg, partner);
    } else {
      await prompt.delete();
      msg.channel.send(`<@${msg.author.id}>, alright, I won't divorce you.`);
    }
  }
};

const rejectFlow = async (user, msg, partner) => {
  if (user.modules.RBN < 5000) {
    return msg.channel.send(`<@${msg.author.id}>, you need at least ${_emoji("RBN")} 5000.`);
  }
  await ECO.pay(msg.author.id, 5000);
  // TODO use dashboard API to divorce
  // eslint-disable-next-line max-len
  msg.channel.send(`Happy loner: <@${msg.author.id}> has paid ${_emoji("RBN")} 5000 to find a lawyer and divorced **${partner.name}**. :broken_heart:`);
};

module.exports = {
  init,
  cmd: "divorce",
  perms: 3,
  pub: false,
  cat: "social",
  botPerms: [ "attachFiles", "embedLinks" ],
};
