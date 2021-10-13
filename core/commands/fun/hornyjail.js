const Picto = require("../../utilities/Picto.js");

const init = async function (msg,args){

	const Target = (await PLX.resolveMember(msg.guild.id,args[0]).catch(e=>null)) || msg.member;

	const canvas = Picto.new(700, 484);
	const ctx = canvas.getContext('2d');

	console.log(Target.avatarURL)
	console.log(`${paths.CDN}/build/hornyjail.png`)

	const hornyjail = await Picto.getCanvas(`${paths.CDN}/build/hornyjail.png`);
	const avi = await Picto.getCanvas(Target.avatarURL);

	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect(0,0,700,500);
	ctx.drawImage(avi,335,161,370,370);
	ctx.drawImage(hornyjail,0,0);

	return msg.channel.send( "Go to horny jail!", file(await canvas.toBuffer(), "horny.png"));

}

module.exports={
 init
 ,pub:true
 ,cmd:'hornyjail'
 ,cat:'fun'
 ,botPerms:['attachFiles','embedLinks']
 ,aliases:[]
}