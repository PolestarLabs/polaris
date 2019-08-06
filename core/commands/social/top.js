const topServer = (m)=>
    require('./leaderboards.js').init(m,["server"]);

const topGlobal = (m)=>
    require('./leaderboards.js').init(m,["global"]);

const topCommend = async (m)=>
    {
        let userData = await DB.users.get(m.author.id);
        let [CommendRank,myRankOut,myRankIn]   =await 
        Promise.all([
            DB.users.find({$or: [ {'modules.commend':{$gt:0}} , {'modules.commended':{$gt:0}} ] },{name:1,id:1,'modules.commend':1,'modules.commended':1 }).lean().exec(),
            DB.users.find({'modules.commended':{$gt: userData.modules.commended || 0 }} ).countDocuments(),
            DB.users.find({'modules.commend'  :{$gt: userData.modules.commend || 0 }} ).countDocuments()

        ]);

 
        CommendRank.forEach(usr => { usr.name = (PLX.findUser(usr.id)||{}).username || usr.name  });


        let commendSort   = CommendRank.sort((a,b)=> (a.modules.commend||0) - (b.modules.commend||0)).reverse().slice(0,10);
        let commendedSort = CommendRank.sort((a,b)=> (a.modules.commended||0) - (b.modules.commended||0)).reverse().slice(0,10);

        let isUsr = (x)=>x.id===m.author.id;

        let listCommend = commendSort.slice(0,3).map( 
            x=> `:reminder_ribbon: *\`\u200b${(x.modules.commend||0).toString().padStart(3,"\u2003")} \`\u2003[${ 
                (isUsr(x)?"**":"")+
                x.name.slice(0,16) + (x.name.length>15?"...":"") 
                +(isUsr(x)?"**":"")
            }](${paths.CDN}/p/${x.id})*`)

        let listCommenders = commendedSort.slice(0,3).map( 
            x=> `${ _emoji('plxcoin')}*\`\u200b${(x.modules.commended||0).toString().padStart(3,"\u2003")} \`\u2003[${ 
                (isUsr(x)?"**":"")+
                x.name.slice(0,16) + (x.name.length>15?"...":"")
                +(isUsr(x)?"**":"")
             }](${paths.CDN}/p/${x.id})*`)

        let listCommend2 = commendSort.slice(3,10).map( 
            x=> `:reminder_ribbon: *\`\u200b${(x.modules.commend||0).toString().padStart(3,"\u2003")} \`\u2003[${ 
                (isUsr(x)?"**":"")+
                x.name.slice(0,16) + (x.name.length>15?"...":"") 
                +(isUsr(x)?"**":"")
            }](${paths.CDN}/p/${x.id})*`)

        let listCommenders2 = commendedSort.slice(3,10).map( 
            x=> `${ _emoji('plxcoin')}*\`\u200b${(x.modules.commended||0).toString().padStart(3,"\u2003")} \`\u2003[${ 
                (isUsr(x)?"**":"")+
                x.name.slice(0,16) + (x.name.length>15?"...":"")
                +(isUsr(x)?"**":"")
             }](${paths.CDN}/p/${x.id})*`)



        return {embed:{
            thumbnail:{url:"https://pollux.fun/build/rank.png"},
            color:0x3b9ea5,
            description: `**Your Score** \u2003 :reminder_ribbon: **#${myRankIn+1}** (${userData.modules.commend||0}) \u2003 | \u2003  ${ _emoji('plxcoin')}**#${myRankOut+1}** (${userData.modules.commended||0})`,
            fields:[
                {name:"Top Commended",  value: listCommend.join('\n').slice(0,1024),inline: true},
                {name:"Top Commenders", value: listCommenders.join('\n').slice(0,1024),inline: true},
                {name:"\u200b",  value: listCommend2.join('\n').slice(0,1024),inline: true},
                {name:"\u200b", value: listCommenders2.join('\n').slice(0,1024),inline: true}
            ]
        }}

    }


module.exports={
    init: topGlobal
    ,pub:true
    ,cmd:'top'
    ,perms:3
    ,cat:'social'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:[]
    ,autoSubs:[
        {
            label: 'commend',
            gen: topCommend,
            options: {
                aliases:['rep','com','rec']
                ,invalidUsageMessage: (msg) => { PLX.autoHelper('force', { msg, cmd: "commend", opt: "social" }) }
            }
        },
        ,{ label: 'server', gen: topServer, options:{aliases:["local","here","sv"]} }
        ,{ label: 'global', gen: topServer, options:{aliases:["all","world"]} }
    ]
}

