
const Picto = require('../../utilities/Picto.js');

const init = async function (msg,args){

    const TARGET =  PLX.findMember(args[0],msg.guild.members) || PLX.findUser(args[0]) || msg.member;

    const canvas = Picto.new(800,600);
    const ctx = canvas.getContext('2d');

    const [frame,userAvatar,isbot] = await Promise.all([
        Picto.getCanvas(paths.CDN + '/build/assorted/whois.png'),
        Picto.getCanvas(TARGET.avatarURL), 
        Picto.getCanvas(paths.CDN + '/build/assorted/bot_stamp.png'),
    ]);

    const typeColor = '#40353f'    
    
    ctx.translate(-115,50)
    ctx.rotate(-.13872)
    ctx.drawImage(userAvatar,500,70,200,200)
    ctx.drawImage(frame,0,0,870,1080)

    ctx.rotate(.14982)
    Picto.setAndDraw(ctx,
        Picto.tag(ctx,"#"+(TARGET.user||TARGET).discriminator,'600 20pt "JMHTypewriter"',typeColor)
        ,650,160,350,'right'
    )
    ctx.rotate(-.14982)

    Picto.setAndDraw(ctx,
        Picto.block(ctx,
        (TARGET.user||TARGET).username
            ,'600 30px "JMH Typewriter"', typeColor,350,110,
            {   
                sizeToFill: true,
                paddingY: 15,
                verticalAlign: 'top',
                textAlign: "left"
            })
        ,137,120,350,'left'
    );

    Picto.setAndDraw(ctx,
        Picto.tag(ctx,TARGET.id,      '600 21pt "JMH Typewriter"',typeColor)
        ,137,245,500,'left'
    )
    
    Picto.setAndDraw(ctx,
        Picto.tag(ctx,
            new Date((TARGET.user||TARGET).createdAt).toLocaleString(msg.lang[0]||'en',{dateStyle:'full',timeStyle:'short'})
            ,'600 20pt "JMH Typewriter"',typeColor)
            ,137,318,550,'left'
            )
            
            Picto.setAndDraw(ctx,
                Picto.tag(ctx,
                    new Date(TARGET.joinedAt).toLocaleString(msg.lang[0]||'en',{dateStyle:'full',timeStyle:'short'})
            ,'600 20pt "JMH Typewriter"',typeColor)
        ,137,368,550,'left'
    )

    Picto.setAndDraw(ctx,
        Picto.block(ctx,
        TARGET.nick || "--N/A--"
            ,'600 20px "JMH Typewriter"', typeColor,290,90,
            {
                sizeToFill: true,
                paddingY: 10,
                verticalAlign: 'top',
                textAlign: "left"
            })
        ,137,435,500,'left'
    );


    const {web,desktop,mobile} = TARGET.clientStatus||{web:'offline',desktop:'offline',mobile:'offline'};
    Picto.setAndDraw(ctx,
        Picto.tag(ctx, mobile ,'600 18pt "JMH Typewriter"', mobile == 'offline' ? '#322': mobile == 'online' ? '#151' : mobile == 'dnd' ? '#511' :'#551')
        ,606,438,300,'center'
    )

    Picto.setAndDraw(ctx,
        Picto.tag(ctx, desktop ,'600 18pt "JMH Typewriter"', desktop == 'offline' ? '#322': desktop == 'online' ? '#151' : desktop == 'dnd' ? '#511' :'#551')
        ,606,478,300,'center'
    )

    Picto.setAndDraw(ctx,
        Picto.tag(ctx, web ,'600 18pt "JMH Typewriter"', web == 'offline' ? '#322': web == 'online' ? '#151' : web == 'dnd' ? '#511' :'#551')
        ,606,516,300,'center'
    )

    Picto.setAndDraw(ctx,
        Picto.tag(ctx, (TARGET.roles||{length:"N/A"}).length ,'600 26pt "JMH Typewriter"', typeColor)
        ,245,505,300,'center'
    )

    TARGET.bot ? ctx.drawImage(isbot,250,450) : null;

    
    const buff = canvas.toBuffer('image/png', { compressionLevel: 1, filters: canvas.PNG_FILTER_NONE });

    return msg.channel.createMessage('',{file: buff,name: "whois.png"});

}

module.exports={
    init
    ,pub:true
    ,cmd:'whois'
    ,perms:3
    ,cat:'utility'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:["who's","user","uinfo"]
    ,reactionButtonTimeout: 10e3
    ,reactionButtons: [
        {
            emoji: '🗄️',
            type: 'edit',
            response: (msg,args,u) => {
                const TARGET =  PLX.findMember(args[0]||u,msg.guild.members) || PLX.findUser(args[0]||u) ;
                if(msg.embeds.length>0) return {content:'',embed:null};
                return {embed:{
                    author: {icon_url: TARGET.avatarURL, name: (TARGET.user||TARGET).tag, url: `${paths.CDN}/profile/${TARGET.id}` },
                    fields: [
                        {name: 'Roles', value: (TARGET.roles||[]).map(x=>`<@&${x}>`).join() || 'N/A'},
                        {name: 'Pollux Blacklisted?', value: PLX.blacklistedUsers.includes(TARGET.id)?"Yes":"No", inline: !0 },
                        {name: 'Status', value: _emoji(TARGET.status) + " " + (TARGET.status || "unknown"), inline: !0 },
                        {name: 'Tag', value:` <@${TARGET.id}>`, inline: !0 },
                    ],
                    image:{url:"attachment://whois.png"}
                }}
            }
        }
    ]
}