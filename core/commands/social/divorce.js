const ECO = require("../../archetypes/Economy");

async function init(msg, args) {
  const marriages = await DB.relationships.find({
    type: "marriage",
    users: msg.author.id,
  });
  if (!marriages)
    return msg.channel.send(
      `<@${msg.author.id}> you are not married! :broken_heart:`
    );

  if (marriages.length === 1) {
    await promptDivorce(msg, marriages[0]);
  } else {
    await promptChoice(msg);
  }
}

async function promptChoice(msg) {
  const select = {
    type: 3,
    custom_id: "divorce_select",
    options: await Promise.all(
      marriages.map(async (obj) => {
        const uID = obj.users.filter((id) => id !== msg.author.id)[0];
        return {
          label: (await DB.users.getFull(uID)).tag,
          value: uID,
          description: new Date(obj.since).toDateString(),
        };
      })
    ),
  };

  const prompt = await msg.channel.send({
    content:
      "Oh, well, you are married to multiple people. Which one do you want to divorce?",
    components: [{ type: 1, components: [select] }],
  });

  const choice = await prompt.awaitButtonClick(
    (i) => i.userID === msg.author.id,
    { maxMatches: 1, time: 30000, disableButtons: true }
  );
  prompt.delete();

  promptDivorce(msg, choice[0]);
}

async function promptDivorce(msg, marriage) {
  const toDivorceUserId = marriage.users.filter(
    (id) => id !== msg.author.id
  )[0];

  const embed = {
    description: `The process will cost ${_emoji(
      "RBN"
    )} 2500 for each of you.\n${_emoji("polluxloading")}`,
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
    content: `<@${toDivorceUserId}>, ${msg.author.username} has asked you to divorce. Do you accept?`,
    embed,
    components: [{ type: 1, components: buttons }],
  });

  const user = await DB.users.getFull(msg.author.id);
  const partner = await DB.users.getFull(toDivorceUserId);
  try {
    const [choice] = await prompt.awaitButtonClick(
      (i) => i.userID === toDivorceUserId,
      {
        maxMatches: 1,
        time: 30000,
        disableButtons: true,
      }
    );

    if (choice.data.custom_id === "divorce_accept") {
      await divorce_accepted(msg, toDivorceUserId, user, partner, marriage);
    } else if (choice.data.custom_id === "divorce_reject") {
      await divorce_denied(msg, user, partner, marriage);
    }
  } catch (e) {
    const rejectPrompt = {
      title: "Divorce request timed out",
      // eslint-disable-next-line max-len
      description: `${
        partner.name
      } didn't respond in time. You can still pay me ${_emoji(
        "RBN"
      )} 5000 to find a lawyer and divorce for you. Do you want to proceed?\n\n${_emoji(
        "polluxloading"
      )}`,
      color: 0xe02850,
    };
    buttons[0].custom_id = "divorce_lawyer_accept";
    buttons[1].custom_id = "divorce_lawyer_reject";
    await prompt.edit({
      content: "",
      embed: rejectPrompt,
      components: [{ type: 1, components: buttons }],
    });

    const choice2 = await prompt.awaitButtonClick(
      (i) => i.userID === msg.author.id,
      { maxMatches: 1, time: 30000, disableButtons: true }
    );

    if (choice2[0].data.custom_id === "divorce_lawyer_accept") {
      await rejectFlow(user, msg, partner, marriage);
    } else {
      await prompt.delete();
      await msg.channel.send(
        `<@${msg.author.id}>, alright, I won't divorce you.`
      );
    }
  }
}

async function divorce_accepted(msg, toDivorceId, user, toDivorceUser) {
  if (user.modules.RBN < 2500) {
    return msg.channel.send(
      `<@${msg.author.id}>, you need at least ${_emoji("RBN")} 2500 to divorce.`
    );
  }

  if (partner.modules.RBN < 2500) {
    return msg.channel.send(
      `<@${toDivorceId}>, you need at least ${_emoji("RBN")} 2500 to divorce.`
    );
  }

  await ECO.pay(msg.author.id, 2500, "divorce");
  await ECO.pay(toDivorceId, 2500, "divorce");
  await DB.relationships.delete(marriage._id);

  await msg.channel.send(
    `The ending of a story: <@${msg.author.id}> and **${toDivorceUser.username}** are now divorced. :broken_heart:`
  );
}

async function divorce_denied(msg, user, toDivorceUser, marriage) {
  const rejectPrompt = {
    title: "Divorce request denied",
    // eslint-disable-next-line max-len
    description: `${
      toDivorceUser.name
    } has rejected your divorce request. You can still pay me ${_emoji(
      "RBN"
    )} 5000 to find a lawyer and divorce for you. Do you want to proceed?\n\n${_emoji(
      "polluxloading"
    )}`,
    color: 0xe02850,
  };
  buttons[0].custom_id = "divorce_lawyer_accept";
  buttons[1].custom_id = "divorce_lawyer_reject";
  const prompt2 = await prompt.edit({
    content: "",
    embed: rejectPrompt,
    components: [{ type: 1, components: buttons }],
  });

  const choice2 = await prompt2.awaitButtonClick(
    (i) => i.userID === msg.author.id,
    { maxMatches: 1, time: 30000, disableButtons: true }
  );
  if (choice2[0].data.custom_id === "divorce_lawyer_accept") {
    await rejectFlow(user, msg, toDivorceUser, marriage);
  } else {
    await prompt2.delete();
    await msg.channel.send(
      `<@${msg.author.id}>, alright, I won't divorce you.`
    );
  }
}

async function rejectFlow(user, msg, partner, marriage) {
  if (user.modules.RBN < 5000) {
    await msg.channel.send(
      `<@${msg.author.id}>, you need at least ${_emoji("RBN")} 5000.`
    );
    return;
  }

  await ECO.pay(msg.author.id, 5000, "divorce.lawyer");
  await DB.relationships.delete(marriage._id);

  await msg.channel.send(
    `Happy loner: <@${msg.author.id}> has paid ${_emoji(
      "RBN"
    )} 5000 to find a lawyer and divorced **${partner.name}**. :broken_heart:`
  );
}

module.exports = {
  init,
  cmd: "divorce",
  perms: 3,
  pub: false,
  cat: "social",
  botPerms: ["attachFiles", "embedLinks"],
};
