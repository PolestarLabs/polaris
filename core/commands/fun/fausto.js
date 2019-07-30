const DspHook = require ("../../structures/DisposableWebhook.js")
const init = async function (msg){

    const avatars = [
        "https://www.folhamax.com/storage/webdisco/2019/05/11/395x253/63761de61ec13163ff1f2bb999dd30bd.jpg"
        ,"https://static.otvfoco.com.br/2019/03/Fausto.jpg"
        ,"https://www.emaisgoias.com.br/wp-content/uploads/2017/12/faustao-e1513620084743.jpg"
    ]
    const phrases = [
        "ERROOOU!",
        "TÁ PEGANDO FOGO BICHO!",
        "ESSA FERA AÍ MEU!",
        "OLOCO!",
        "ELE MORREU!",
        "NO PASSADO INVADIU O BRASIL!",
        "DERROTOU O BRASIL NA ÚLTIMA COPA!",
        "SEU IDIOMA É O HOLANDES!",
        "ESSA FERA "+(msg.member.nick||msg.author.username).toUpperCase()+" AQUI NO DOMINGÃO!",
        "ESSA FERA "+(msg.guild.members.random().nick||msg.guild.members.random().user.username).toUpperCase()+" AQUI NO DOMINGÃO!",
        "QUEM SABE FAZ AO VIVO!",
        "VOCÊ DESTRUIU O **MEU** OVO!",
        "NINGUÉM ACERTOU!",
        "É UM PAÍS DA EUROPA!",
        "ORRA MEU!",
        "CHURRASQUEIRA DE CONTROLE REMOTO!",
    ]

    new DspHook(msg,"Faustão",shuffle(avatars)[0],{payload:{content:shuffle(phrases)[0]},once:true,reason: "+fausto ["+msg.author.tag+"]"});


}
module.exports={
    init
    ,pub:true
    ,cmd:'fausto'
    ,perms:3
    ,cat:'fun'
    ,botPerms:['attachFiles','embedLinks','manageWebhooks']
    ,aliases:['faustão']
}