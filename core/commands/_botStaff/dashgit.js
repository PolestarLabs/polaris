
const { exec } = require("child_process");

const init = async function (msg,args){
    
    exec("git "+args.join(' '),{
        cwd: '/home/pollux/polaris/dashboard'
    }, (error,stdout,stderr)=>{
        let description =  `
        ${
            error
                ?`${_emoji('nope')}**Oopsie Woopsie:** \`\`\`nginx\n${stderr.slice(0,1900)}\`\`\`` 
                :`${_emoji('yep')} \`${args.join(' ')}\` ${stdout.length?"```nginx\n":"```OK!"}${stdout.slice(0,1900)}${"```"}`
        } 
        `

        msg.channel.send({embed:{description}})
     
    });
 
}

module.exports={
    init
    ,pub:false
    ,cmd:'git'
    ,perms:3
    ,cat:'_botStaff'
    ,aliases: ['dgit','dg','dgt']
    
}