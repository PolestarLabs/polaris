const Picto = require('../../utilities/Picto.js');
const Anim = require('../../structures/Animation.js');
const RANGE = [...Array(31).keys()].slice(1);
let cacheReady = false;
let lvupFramesCache = Promise.all(RANGE.map(async x => await Picto.getCanvas(`${paths.BUILD}/level up_frames/transp/lvup_frame_${x}.png`))).then(res => { cacheReady = true; lvupFramesCache = res });
//let lvupMaskCache = Promise.all( RANGE.map(async x => await Picto.getCanvas(`${paths.BUILD}/level up_frames/mask/mk_${x}.gif`))).then(res=> {cacheStatus++; lvupMaskCache = res});


const init = async function (msg, args) {

    const [argLv, user] = args;

    if (argLv == 'fromgen')
        return msg.channel.send(
            { messageReferenceID: msg.id }, { file: await resolveFile(`${paths.GENERATORS}/levelup.gif`), name: "levelUp.gif" }
        );

    const canvas = Picto.new(800, 300);
    const ctx = canvas.getContext('2d');

    const avatar = await Picto.getCanvas((await PLX.resolveUser(user || msg.author.id)).avatarURL);

    if (!cacheReady) await lvupFramesCache;


    let GIF = new Anim({
        w: 800, h: 300,
        filename: 'test',
        lastFrame: 57 * 2 + 20,
        transparentColor: 0x00ff00,
        framerate: 35,
        //repeat: -1,
        cache: false
    });

    const userData = await DB.users.get(msg.author.id);
    if (!userData) return;


    let LV_SIZE = 42; //52  
    GIF.generate(function (actualFrame) {

        let frame = actualFrame > 56 ? 57 * 2 - actualFrame : actualFrame;

        if (actualFrame > 56 * 2) {
            ctx.fillStyle = '#00FF00'
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            return ctx
        }
        //ctx.save();
        //let canvas2 = Picto.new(600,600);
        //ctx2 = canvas2.getContext('2d');

        ctx.drawImage(avatar, 15 + Math.min((10000 / Math.pow(20 + frame, 2)), 45), 0, 320, 320);
        ctx.shadowColor = 'red'
        ctx.shadowBlur = '15px'

        const FRAME = Picto.tag(ctx, "Frame: " + frame, "600 30px 'Quicksand'", "#F00").item;


        if (frame < 22) LV_SIZE = 42 - 22 + frame * 2;
        if (frame == 22) LV_SIZE = 44;
        if (frame == 23) LV_SIZE = 48;
        if (frame == 24) LV_SIZE = 52;
        if (frame == 25) LV_SIZE = 60;
        if (frame == 26) LV_SIZE = 70;
        if (frame == 27) LV_SIZE = 65;
        if (frame == 28) LV_SIZE = 60;
        if (frame == 29) LV_SIZE = 55;
        if (frame == 30) LV_SIZE = 52;

        if (frame > 30) LV_SIZE = 52;

        const lvTag = Picto.tag(ctx, $t("terms.levelUp", { lngs: msg.lang }), "600 30px 'Quicksand'", "#223").item;
        const Level = Picto.tag(ctx, argLv || userData.modules.level, "900 " + LV_SIZE + "px 'Panton Black'", "#223").item;
        const lvWidth = Math.min(118, Level.width);
        const lvtWidth = Math.min(150, lvTag.width);

        //ctx2.globalCompositeOperation = "multiply";
        //ctx.drawImage(lvupMaskCache[frame],0,0);


        //ctx.globalCompositeOperation = "source-atop";
        //ctx.drawImage(canvas2,0,0)
        ctx.drawImage(lvupFramesCache[Math.min(frame, 29)], 0, 0);
        //ctx.restore();
        if (frame > 20) {
            ctx.drawImage(lvTag, 590 - lvtWidth, 124, lvtWidth, lvTag.height);
        }
        if (frame > 22) {
            ctx.drawImage(Level, 660 - lvWidth / 2, (105 + 20) - (LV_SIZE / 3), lvWidth, Level.height);
        }

        //ctx.drawImage(FRAME,0,0);

        return ctx
    })

    GIF.on('done', (gif) => {
        msg.channel.createMessage({ content: ' ' }, gif);
    })

}
module.exports = {
    init
    , pub: false
    , cmd: 'lvup'
    , cat: 'experimental'
    , botPerms: ['attachFiles', 'embedLinks']
    , aliases: []
}