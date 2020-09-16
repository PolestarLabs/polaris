const init = async function (msg,args){

    if(PLX.user.id !== "354285599588483082") return;

    if(args[0] === 'rbn'){
        let AMT = Number(args[1])||0
        DB.users.set(msg.author.id,{ $inc: {'modules.rubines': AMT } }).then(x=>{
            msg.channel.send("OK"+`[${AMT} RBN]`)
        })
    }
    if(args[0] === 'sph'){
        let AMT = Number(args[1])||0
        DB.users.set(msg.author.id,{ $inc: {'modules.sapphires': AMT } }).then(x=>{
            msg.channel.send("OK"+`[${AMT} SPH]`)
        })
    }
    if(args[0] === 'jde'){
        let AMT = Number(args[1])||0
        DB.users.set(msg.author.id,{ $inc: {'modules.jades': AMT } }).then(x=>{
            msg.channel.send("OK"+`[${AMT} JDE]`)
        })
    }
    if(args[0] === 'box'){
        let AMT = Number(args[1])||0
        let TYP = (args[2]||"C").toUpperCase();

        DB.users.findOne(msg.author.id).then(x=>{
            x.addItem('lootbox_'+TYP+'_O',AMT).then(x=>{
                msg.channel.send("OK"+`[${AMT} Box ${TYP}]`)
            })
        })
    }
    if(args[0] === 'item'){
        let AMT = Number(args[2])||0
        let ITM = (args[1]||"fork")

        DB.users.findOne(msg.author.id).then(x=>{
            x.addItem(ITM,AMT||0).then(x=>{
                msg.channel.send("OK"+`[${AMT} Box ${TYP}]`)
            })
        })
    }


}
module.exports={
    init
    ,pub:false
    ,cmd:'debug'
    ,cat:'beta'
    ,botPerms:['attachFiles','embedLinks']
    ,aliases:['dbg']
}