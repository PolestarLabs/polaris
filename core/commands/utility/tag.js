const { modPass } = require("../../utilities/Gearbox/client")

const init = async function (msg, [tag]) {

  if (!tag) return;

  const tagObj = await DB.responses.findOne({server:msg.guild.id,tag});

  if (!tagObj) return `Tag \`${tag}\` not found!`;

  executeCustomResponse(tagObj,msg);

}
function checkForEmbedResponse(msg, respondError = false) {
  let userEmbed;
  const bracketIndex = msg.content.indexOf("{") - 1;

  if (bracketIndex < 0) return null;
  let embedstr = msg.content.substr(bracketIndex).trim();
  try {
    userEmbed = JSON.parse(embedstr);
  } catch (err) {
    console.error(err)
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
      response.tag = null
    });
  }
  if (response.type === 'image') {
    if (noReply) return msg.channel.send({ embed: { color: 0x2b2b3b, image: { url: response.response } } });

    msg.reply({ embed: { color: 0x2b2b3b, image: { url: response.response } } }).catch(err => {
      msg.addReaction(_emoji('nope').reaction);
      console.error(err, response.response)
      response.tag = null
    });
  }
  if (response.type === 'string') {
    if (noReply) return msg.channel.send(response.response);

    msg.reply(response.response).catch(err => {
      msg.addReaction(_emoji('nope').reaction);
      console.error(err, response.response)
      response.tag = null
    });
  }
}

async function sub_remove(msg,[tag]){
  if (!(msg.member.permissions.has('manageMessages') || await modPass(msg.member))) return $t('responses.error.insuPerms');
  const serverResps = await DB.responses.findOne({ server:msg.guild.id, tag }).noCache();
  if (!serverResps) msg.channel.send( `Tag \`${tag}\` not found!` );

  await DB.responses.deleteOne({ server:msg.guild.id, tag });

  return msg.channel.send( `Tag \`${tag}\` deleted!` )


}

async function sub_add(msg, args) {

  if (!(msg.member.permissions.has('manageMessages') || await modPass(msg.member))) return $t('responses.error.insuPerms');


  const tag = args.join(' ');
  if (tag.length > 10) return msg.channel.send( "Tag names can't contain more than 10 characters" );

  const serverResps = await DB.responses.findOne({ server:msg.guild.id, tag }).noCache();

  console.log({serverResps})

  if (serverResps) msg.channel.send( "This tag has already been assigned. Continuing will overwrite it!" );


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
      tag: fullCommand,
      response: JSON.stringify(userEmbed),
      type: "embed",
      server: msg.guild.id,
      id: Date.now() + msg.guild.id
    };
    await DB.responses.set(responseObject, { upsert: true });
    msg.guild.customResponses.push(responseObject);
    msg.reply(_emoji("yep") + `All set! The tag \`${responseObject.tag}\` will return:`);
    return executeCustomResponse(responseObject, msg, true)

  }
  if (fullCommand && respString) {
    let responseObject = {
      tag: fullCommand,
      response: respString,
      type: respString.startsWith('http') ? "image" : "string",
      server: msg.guild.id,
      id: Date.now() + msg.guild.id
    }
    await DB.responses.set(responseObject, { upsert: true });
    msg.guild.customResponses.push(responseObject);
    msg.reply(_emoji("yep") + `All set! The tag \`${responseObject.tag}\` will return:`);
    return executeCustomResponse(responseObject, msg, true)

  }

  const prompt = await msg.reply(`\`${tag}\` will be responded with: ${_emoji('loading')}`);
  const resps = await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { time: 25e3, maxMatches: 1 });

  if (resps[0]) {

    let responseString = checkForEmbedResponse(resps[0]) || resps[0];

    let responseObject = {
      tag,
      response: typeof responseString == 'string' ? responseString : JSON.stringify(responseString),
      type: typeof responseString == 'string' ? responseString.startsWith('http') ? "image" : "string" : 'embed',
      server: msg.guild.id,
      id: Date.now() + msg.guild.id
    }

    await DB.responses.set(responseObject, { upsert: true });
    msg.guild.customResponses.push(responseObject);
    prompt.delete().catch(err => null);
    resps[0].delete().catch(err => null);
    msg.reply(_emoji("yep") + `All set! Next time soneome says \`${responseObject.tag}\` I'll say:`);
    return executeCustomResponse(responseObject, msg, true)


  } else {
    prompt.edit(_emoji('nope') + " Cancelled");
  }




  /*
      DB.responses.new({
          tag: 
      })*/
}

module.exports = {
  init
  , pub: true
  , cmd: 'tag'
  , argsRequired: true
  , executeCustomResponse
  , cat: 'utility'
  , botPerms: ['attachFiles', 'embedLinks']
  , aliases: ["t"]
  , autoSubs: [
    {
      label: 'add',
      gen: sub_add,      
      options: {
        argsRequired: true,
      }
    },
    {
      label: 'remove',
      gen: sub_remove,      
      options: {
        argsRequired: true,
      }
    }
  ]
}

/*
  const responses = new Schema({

    tag: { type: String, required: true },
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