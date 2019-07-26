// const gear = require("../../utilities/Gearbox");
const DB = require("../../database/db_ops");
const {Embed}= require('eris');
const clean = (text) => {
  return typeof text === "string" ? text
    .replace(/`/g, `\`${String.fromCharCode(8203)}`)
    .replace(/@/g, `@${String.fromCharCode(8203)}`)
    .replace(/[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g, "[OWO WHAT IS THIS]") :
    text;
}



const init = async (msg) => {
let depth_param = 0
  if(msg.args[0] === "-depth"){
    depth_param = parseInt(msg.args[1]);
     msg.args.shift()    
     msg.args.shift() 
  }

let invisibar = `\u200b\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u200b`
  let code = msg.args.join(" ");

   if(code.includes('child_process') && msg.author.id !== "88120564400553984") return;
   if(code.includes('.leave(')       && msg.author.id !== "88120564400553984") return;
   if(code.includes('.drop')         && msg.author.id !== "88120564400553984") return;
   if(code.includes('process.')      && msg.author.id !== "88120564400553984") return;

  if (!code) return;
  
  if(code == 'process.exit()'){
    let output ="<:maybe:476214608592633866>"+invisibar+ `\`\`\`js\n${clean("Terminating Node Process...")}\`\`\``;
    let embed = new Embed({description:output});
    msg.channel.createMessage({embed}).then(x=>{
      process.exit(1);
    });
  }
  
  try {
    let evaled = eval(code);
    if (evaled instanceof Promise) evaled = await evaled;
    if (typeof evaled !== "string") evaled = require("util").inspect(evaled, {
      depth: 0 + depth_param
    });
     let output ="<:yep:339398829050953728>"+invisibar+ `\`\`\`js\n${clean(evaled)}\`\`\``;
     let embed = new Embed({description:output});
     embed.setColor("#2bce64")
     return msg.channel.createMessage({embed})
  } catch (e) {
     let output ="<:nope:339398829088571402>"+invisibar+ `\`\`\`ml\n${clean(e)}\`\`\``;
     let embed = new Embed({description:output});
     embed.color(0xe03b3b)
     embed.footer("Check Logs for detailed Error stack")
    console.error(e)
     return msg.channel.createMessage({embed})
  }

}

module.exports = {
  init,
  aliases: ["ev","ee"],
  cat: 'dev'
}
