const { modPass } = require("../../utilities/Gearbox/client")

const init = async function (msg, args) {


  if (!(msg.member.permissions.has('manageMessages') || await modPass(msg.member))) return $t('responses.error.insuPerms');

}
function checkForEmbedResponse(msg, respondError = false) {
  let userEmbed;
  let embedstr = msg.content.substr(msg.content.indexOf("{") - 1).trim();
  try {
    userEmbed = JSON.parse(embedstr);
  } catch (err) {
    if (respondError) msg.reply(_emoji("nope") + " Invalid Embed")
  }
  return userEmbed;
}
function executeCustomResponse(response, msg, noReply = false) {
  if (response.type === 'embed') {
    let responseObj = JSON.parse(response.response);
    if (noReply) return msg.channel.send(responseObj);

    msg.reply(responseObj).catch(err => {
      msg.addReaction(_emoji('nope').reaction);
      console.error(err, responseObj)
      response.trigger = null
    });
  }
  if (response.type === 'image') {
    if (noReply) return msg.channel.send({ embed: { color: 0x2b2b3b, image: { url: response.response } } });

    msg.reply({ embed: { color: 0x2b2b3b, image: { url: response.response } } }).catch(err => {
      msg.addReaction(_emoji('nope').reaction);
      console.error(err, response.response)
      response.trigger = null
    });
  }
  if (response.type === 'string') {
    if (noReply) return msg.channel.send(response.response);

    msg.reply(response.response).catch(err => {
      msg.addReaction(_emoji('nope').reaction);
      console.error(err, response.response)
      response.trigger = null
    });
  }
}
async function sub_add(msg, args) {

  if (!(msg.member.permissions.has('manageMessages') || await modPass(msg.member))) return $t('responses.error.insuPerms');

  const trigger = args.join(' ');

  const serverResps = DB.responses.findOne({ server: msg.guild.id }).noCache();

  let fullCommandRegex = /"([A-z0-9!\. ]+)" {/gm;
  let textCommandRegex = /"([A-z0-9!\. ]+)"\s+[A-z0-9]/gm;
  let fullCommand, userEmbed, respString;

  if (msg.content.match(fullCommandRegex)) {
    fullCommand = fullCommandRegex.exec(msg.content)[1];
    userEmbed = checkForEmbedResponse(msg, true);
    if (!userEmbed) return;
  }

  if (msg.content.match(textCommandRegex)) {
    fullCommand = textCommandRegex.exec(msg.content)[1];
    respString = msg.content.substr(msg.content.indexOf(fullCommand) + fullCommand.length + 1).trim();
  }

  if (fullCommand && userEmbed) {
    let responseObject = {
      trigger: fullCommand,
      response: JSON.stringify(userEmbed),
      type: "embed",
      server: msg.guild.id,
      id: Date.now() + msg.guild.id
    };
    await DB.responses.set(responseObject, { upsert: true });
    msg.guild.customResponses.push(responseObject);
    msg.reply(_emoji("yep") + `All set! Next time soneome says \`${responseObject.trigger}\` I'll say:`);
    return executeCustomResponse(responseObject, msg, true)

  }
  if (fullCommand && respString) {
    let responseObject = {
      trigger: fullCommand,
      response: respString,
      type: respString.startsWith('http') ? "image" : "string",
      server: msg.guild.id,
      id: Date.now() + msg.guild.id
    }
    await DB.responses.set(responseObject, { upsert: true });
    msg.guild.customResponses.push(responseObject);
    msg.reply(_emoji("yep") + `All set! Next time soneome says \`${responseObject.trigger}\` I'll say:`);
    return executeCustomResponse(responseObject, msg, true)

  }

  const prompt = await msg.reply(`\`${trigger}\` will be responded with: ${_emoji('loading')}`);
  const resps = await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { time: 25e3, maxMatches: 1 });

  if (resps[0]) {

    let responseString = checkForEmbedResponse(resps[0]) || resps[0];

    let responseObject = {
      trigger,
      response: typeof responseString == 'string' ? responseString : JSON.stringify(responseString),
      type: typeof responseString == 'string' ? responseString.startsWith('http') ? "image" : "string" : 'embed',
      server: msg.guild.id,
      id: Date.now() + msg.guild.id
    }

    await DB.responses.set(responseObject, { upsert: true });
    msg.guild.customResponses.push(responseObject);
    prompt.delete().catch(err => null);
    resps[0].delete().catch(err => null);
    msg.reply(_emoji("yep") + `All set! Next time soneome says \`${responseObject.trigger}\` I'll say:`);
    return executeCustomResponse(responseObject, msg, true)


  } else {
    prompt.edit(_emoji('nope') + " Cancelled");
  }




  /*
      DB.responses.new({
          trigger: 
      })*/
}

module.exports = {
  init
  , pub: true
  , cmd: 'responses'
  , executeCustomResponse
  , cat: 'fun'
  , botPerms: ['attachFiles', 'embedLinks']
  , aliases: []
  , autoSubs: [
    {
      label: 'add',
      gen: sub_add,
      options: {}
    }
  ]
}

/*
  const responses = new Schema({

    trigger: { type: String, required: true },
    response: String,
    server: { type: String, required: true, index: { unique: false } },
    id: { type: String, required: true, index: { unique: true } },
    embed: Mixed,
    type: String, // EMBED, STRING, FILE

  });


  plx!responses add "wawa" {
  "embed": {
    "color": 16724821,
    "image": {
      "url": ""
    },
    "thumbnail": {
      "url": ""
    }
  }
}

  */