const { emoji } = require("../inventory/consumable");

module.exports={
    init
    ,pub:true
    ,cmd:'multi'
    ,cat:'utility'
    ,botPerms:['attachFiles','embedLinks','manageMessages']
    ,aliases:[]
}

const createMultiOption=(option)=>{

    const payload = parseEmbed(option.content);

    return {
        componentOption: {
            label: option.label,
            description: option.description,
            emoji: option.emoji,
            value: option.value,
            default: !option.value
        },
        payload
    }

}

const createMultiMenu = (msg,parsed_options)=>{
    const payload = {
        message: msg.id,
        channel: msg.channel.id,
        server:  msg.guild.id,
        type:   "drop-multi",
        options: parsed_options
    }
    return payload;
}
const parseEmbed = (content) => {

    if ( !content.includes("{") ) return {content};
    let embedstr = content.substr(content.indexOf("{") ).trim();

    // Check for hex colour representation
    const match = embedstr.match(/"color":\s*((0[xX]|#)([0-9a-f]{3}(?=[\s}])|[0-9a-f]{6}))/i);
    if (match) { // Parse the match to decimal
      if (match[2].length === 3) match[2] = `0x${match[2][0]}${match[2][0]}${match[2][1]}${match[2][1]}${match[2][2]}${match[2][2]}`;
      const decimal = Math.max(parseInt(match[2]) - 1, 0); // 0xFFF = black
      embedstr = embedstr.replace(match[0], match[0].replace(match[1], decimal.toString()));
    }

    let userEmbed = {};
    try {
      userEmbed = JSON.parse(embedstr);    
      console.log({userEmbed});
      if (userEmbed.embed) userEmbed = { embeds: [userEmbed.embed] };
      if (!userEmbed.embeds) userEmbed = { embeds: [userEmbed] };
    } catch (e) {
        console.error(e)
        userEmbed = content;
        
        /*
        return Promise.reject(
            msg.channel.send(
                { embed: { description: $t("responses.errors.unparsable", { ...P, link: `[Pollux Embed Architect](${paths.DASH}/embedarchitect)` }) } }
            )
        )*/
    }
    return userEmbed;
}

///-------------------------------
///-------------------------------
///-------------------------------


const CREATE_MULTI_WIZARD = async (msg) => {
    
    const embed = {description:"Wait for instructions..."};
    const preview_template = { 
        title: `(${1}/5) Preview`,
 
        fields: [
            {name:"Content",value:"\u200b",inline:false},
            {name:"Emoji",value:"\u200b",inline:true},
            {name:"Label",value:"\u200b",inline:true},
            {name:"Description",value:"\u200b",inline:true},
        ]
    };
    let preview = JSON.parse(JSON.stringify(preview_template));

    const parseFieldName = (field,name,waiting,editing) => {
        return field.name = `${waiting?_emoji('loading'):_emoji('yep')}${name}`;
    }
    
    let waitingEmoji = false;
    let waitingContent = false;
    let waitingLabel = false;
    let waitingDescription = false;

    let currentVal = 0;
    let currentOption = {};
    let allOptions = [];
    let pre_options = [];
console.log(preview)
    let prompt = await msg.reply({
        content: "Creating multi... up to 5 options",
        embeds: [embed,preview],
    });

    const msg_collector = prompt.channel.createMessageCollector( (m)=> m.author.id === msg.author.id ,{idle:5*60e3});
    const emoji_collector = prompt.createReactionCollector( (m)=> m.userID === msg.author.id ,{time: 10*60e3});

    embed.color = numColor(_UI.colors.blue);

    embed.description = `Multis create a message with options that can be seen privately by everyone that selects one of the options. First option is the default one and always visible. Other options will be shown only for people that choose them from the dropdown menu. You can use embeds in all of them. Create them with [Pollux Embed Architect](${paths.DASH}/embedarchitect) and paste in the \`description\` step.

    To see examples of this feature try \`${msg.prefix}multi demo (1 or 2)\`

    **Steps**
    • Write the entire message for the option.
    • React to this message with an emoji if you wish to add one.
    • Afterwards, write the option label, send.
    • Then write the option description and send.
    • Send \`content\`, \`label\` or \`description\` anytime to edit that particular item.
    • ${_emoji('SAVE')} Send \`save\` to save and go to the next item.
    • ${_emoji('yep')} Send \`finish\` when you're done.
    • ${_emoji('nope')} Send \`cancel\` to abort.
    `;

    await prompt.edit({embed:{}, embeds:[embed,preview]});
    waitingEmoji = true;
    waitingContent = true;
    waitingLabel = true;
    waitingDescription = true;

    msg_collector.on("message", async (m)=>{

        m.delete();

        if (m.content === 'cancel') {
            await prompt.edit({embed:{},embeds:[embed]});
            return msg_collector.stop("aborted");
        }
        if (m.content === 'finish' || currentVal === 5) {
            await prompt.edit({embed:{},embeds:[embed]});
            return msg_collector.stop("finished");
        }

        if (m.content === 'save') {
            if (waitingContent || waitingLabel){
                return msg.channel.send("**Please fill all required fields**");
            }
            currentOption.value = currentVal;
            currentVal++;
            allOptions.push(currentOption);
            currentOption = {};
            preview = JSON.parse(JSON.stringify(preview_template));

            waitingEmoji = true;
            waitingContent = true;
            waitingLabel = true;
            waitingDescription = true;
            preview.title = `(${currentVal+1}/5) Preview`
            await prompt.edit({embed:{},embeds:[embed,preview]});
            if (currentVal === 5){
                await prompt.edit({embed:{},embeds:[embed]});
                msg_collector.stop("finished");
            } 
            return;
        }
        
        if (m.content === 'description') {
            waitingDescription = true;
            parseFieldName(preview.fields[3],"Description",waitingDescription );
            prompt.edit({embed:{},embeds:[embed,preview]});
            return
        }
        if (m.content === 'content') {
            waitingContent = true;
            parseFieldName(preview.fields[0],"Content",waitingContent );
            prompt.edit({embed:{},embeds:[embed,preview]});
            return
        }
        if (m.content === 'label') {
            waitingLabel = true;
            parseFieldName(preview.fields[2],"Label",waitingLabel );
            prompt.edit({embed:{},embeds:[embed,preview]});
            return
        }

        if (waitingContent){
            currentOption.content = m.content;
            preview.fields[0].value = currentOption.content;
            waitingContent = false;
            parseFieldName(preview.fields[0],"Content",waitingContent ) 
            await prompt.edit({embed:{},embeds:[embed,preview]});
            return
        };

        if (waitingLabel){
            currentOption.label = m.content.slice(0,50);
            preview.fields[2].value = currentOption.label;
            waitingLabel = false;
            parseFieldName(preview.fields[2],"Label",waitingLabel ) 
            await prompt.edit({embed:{},embeds:[embed,preview]});
            return
        };

        if (waitingDescription){
            currentOption.description = m.content.slice(0,50);
            preview.fields[3].value = currentOption.description;
            waitingDescription = false;
            parseFieldName(preview.fields[3],"Description",waitingDescription )             
            await prompt.edit({embed:{},embeds:[embed,preview]});
            return
        };

       


    });

    emoji_collector.on("emoji", async (emoji)=>{
        if (!waitingEmoji) return;
        currentOption.emoji = emoji.id ? {id:emoji.id} : {name:emoji.name};
        console.log(emoji)
        preview.fields[1].value = emoji.id ? `<:${emoji.name}:${emoji.id}>` : emoji.name;
        prompt.removeReactions();
        await prompt.edit({embed:{},embeds:[embed,preview]});
    });

    msg_collector.on("end",async(c,r)=>{
        console.log({c,r})
        if (r === 'aborted'){
            msg.delete();
            prompt.delete();
            return;
        }

        const parsedOptions = allOptions.map(createMultiOption);
        console.log({parsedOptions});
        const dropMultiObject = createMultiMenu(msg,parsedOptions);
        console.log(dropMultiObject)
        let channelID = msg.channel.id;
        if (msg.channelMentions.length) channelID = msg.channelMentions[0];

        dropMultiObject.channel = channelID;
        let targetMessage = await PLX.createMessage(channelID, {
            embed:{},
            ...(dropMultiObject.options[0].payload),    
            components: [{type:1,components:[{
                type:3,
                custom_id: `drop-multi:${msg.guild.id}:${msg.channel.id}`,
                placeholder: "Select...",
                min_options: 1,
                max_options: 1,
                options: dropMultiObject.options.map(({componentOption:opt})=> opt )                    
            }]}]
        });

        dropMultiObject.message = targetMessage.id;

        await DB.reactRoles.set({
            message: dropMultiObject.message,
            channel: dropMultiObject.channel
        }, {$set:dropMultiObject} );

        msg.delete();
        prompt.delete();

        //msg.channel.send(JSON.stringify(dropMultiObject,0,1))
    })

}



///-------------------------------
///-------------------------------
///-------------------------------

async function init(msg,args){

    if (args[0] === "create"){
        return CREATE_MULTI_WIZARD(msg);
    }

    
    if (args[0] === "demo"){
        const dropMultiObject = (await DB.reactRoles.findOne({
            message: "demo", channel:  "demo"+(args[1]||1), server:  "demo", type:"drop-multi"
        }))?._doc;

        return msg.reply({
            embed:{},
            ...(dropMultiObject.options[0].payload),    
            components: [{type:1,components:[{
                type:3,
                custom_id: `drop-multi:demo:demo${(args[1]||1)}`,
                placeholder: "Select...",
                min_options: 1,
                max_options: 1,
                options: dropMultiObject.options.map(({componentOption:opt})=> opt )                    
            }]}]
        });
    }

    const parseEntry = (entry,i=0,nolink=false) => {
        return `\`${i+1}\`<#${entry.channel}>
        ${entry.options.map(({componentOption:opt})=>
            `\u2002 • **${opt.label}** - ${opt.description||"--no description--"}`
        ).join('\n')}\n` + 
        (nolink===true ? "" : `**[LINK](https://discord.com/channels/${entry.server}/${entry.channel}/${entry.message})**\n`)
    }

    const dropMultiObjects = (await DB.reactRoles.find({server: msg.guild.id,type:"drop-multi"})).map(x=>x?._doc||x);
    if (args[0] === "delete"){
        const index = Math.abs(Number(args[1]) - 1);
        await DB.reactRoles.remove({ _id: dropMultiObjects[index]._id });
        PLX.deleteMessage(
            dropMultiObjects[index].channel,
            dropMultiObjects[index].message,
        ).catch(err=>null);

        return msg.reply({
            embed: {
                title: "Deleted",
                color: numColor(_UI.colors.danger),
                description: parseEntry(dropMultiObjects[index],index,true)
            }
        })
                
    }

    if (args[0] === "list"||args[0] === "ls"){        

        msg.reply({
            embed: {
                title: "Multis in this server",
                color: numColor(_UI.colors.blue),
                description: `Use \`${msg.prefix}multi delete [Number]\` to remove one.\n\n` + dropMultiObjects.map(parseEntry).join('\n')
            }
        })

    }


}


