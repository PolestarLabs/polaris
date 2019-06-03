const {file} = require('../../utilities/Gearbox');
const Gal = require('../../structures/Galleries')

const init = async function (msg){

    msg.channel.send('',file(await Gal.randomOne('ross'),'ROSS.jpg'));

}

module.exports={
    init
    ,pub:true
    ,cmd:'ross'
    ,perms:3
    ,cat:'fun'
    ,botPerms:['attachFiles']
    ,aliases:[]
}
