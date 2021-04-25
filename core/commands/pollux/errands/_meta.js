
const FORFEIT  = 6 * 60 * 60e3 // 8 Hours

function parseQuestItem(errandsData, errand, mini=false) {
    const thisErrand = errandsData.find(e => e.id === errand.id);
    const progress = ((Math.min(errand.progress, errand.target || 1)) / (errand.target || 1));
    if (mini){
        return `${errand.completed ? _emoji('yep') : errand.progress ? _emoji('maybe') : _emoji('nope')} ${"`" + [...Array(10).keys()].map((b) => b > ~~(progress * 10) ? ' ' : '|').join('') + "`"} • **${thisErrand.INSTRUCTION || "UNK"}**`;
    }
    return ({
        inline: 0,
        name: `${errand.completed ? _emoji('yep') : errand.progress ? _emoji('maybe') : _emoji('nope')} **${thisErrand.INSTRUCTION || "UNK"}**`,
        value: `${_emoji('__')} ${"`" + [...Array(10).keys()].map((b) => b > ~~(progress * 10) ? ' ' : '|').join('') + "`"} ${progress * 100}% \n${_emoji('__')} Rewards: ${[
                (thisErrand.rewards?.exp ? `${_emoji('EXP')}**${thisErrand.rewards.exp}**  ` : ""),
                (thisErrand.rewards?.RBN ? `${_emoji('RBN')}**${thisErrand.rewards.RBN}**  ` : ""),
                (thisErrand.rewards?.SPH ? `${_emoji('SPH')}**${thisErrand.rewards.SPH}**  ` : "")
            ].filter(e => !!e).join('\u2002•\u2002')}`
    });
}


module.exports = {FORFEIT, parseQuestItem}