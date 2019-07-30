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
            DB.users.find({'modules.commended':{$gt: userData.modules.commended }} ).countDocuments(),
            DB.users.find({'modules.commend'  :{$gt: userData.modules.commend }} ).countDocuments()

        ]);

 
        CommendRank.forEach(usr => { usr.name = (PLX.findUser(usr.id)||{}).username || usr.name  });


        let commendSort   = CommendRank.sort((a,b)=> (a.modules.commend||0) - (b.modules.commend||0)).reverse().slice(0,10);
        let commendedSort = CommendRank.sort((a,b)=> (a.modules.commended||0) - (b.modules.commended||0)).reverse().slice(0,10);

        let isUsr = (x)=>x.id===m.author.id;

        let listCommend = commendSort.map( 
            x=> `:reminder_ribbon: *\`\u200b${(x.modules.commend||0).toString().padStart(3,"\u2003")} \`\u2003[${ 
                (isUsr(x)?"**":"")+
                x.name.slice(0,16) + (x.name.length>15?"...":"") 
                +(isUsr(x)?"**":"")
            }](${paths.CDN}/p/${x.id})*`)

        let listCommenders = commendedSort.map( 
            x=> `${ _emoji('token')}*\`\u200b${(x.modules.commended||0).toString().padStart(3,"\u2003")} \`\u2003[${ 
                (isUsr(x)?"**":"")+
                x.name.slice(0,16) + (x.name.length>15?"...":"")
                +(isUsr(x)?"**":"")
             }](${paths.CDN}/p/${x.id})*`)



        return {embed:{
            color:0x3b9ea5,
            description: `:reminder_ribbon: **#${myRankOut}** (${userData.modules.commended}) | ${ _emoji('token')}**#${myRankIn}** (${userData.modules.commend})`,
            fields:[
                {name:"Top Commended",  value: listCommend.join('\n'),inline: true},
                {name:"Top Commenders", value: listCommenders.join('\n'),inline: true}
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

