module.exports = async function ReactionNavigator(m,msg,pagefun,options={},rec){
   

if(rec>30) return msg.reply("`Navigation Limit Reached`");

    let time = options.time || 10000
    let content = options.content|| (m.content||[])[0] || "";
    let embed = options.embed|| (m.embeds||[])[0] || false;
    let avoidEdit = options.avoidEdit || true;
    let strings = options.strings || {}
        strings.timeout   =strings.timeout|| "TIMEOUT"

    let page = options.page || 1
    let tot_pages = options.tot_pages || 1

    let isFirst = page == 1
    let isLast  = page == tot_pages 

    if(!isFirst) m.addReaction("◀")
    if(!isLast)  m.addReaction("▶")
   
    
    
    const reas = await m.awaitReactions( {
        maxMatches: 1,
        authorOnly:msg.author.id,
        time
    }).catch(e=>{
        m.removeReactions().catch();
        if(embed && !avoidEdit){
            embed.color =16499716;        
            embed.footer ={text: strings.timeout};      
            m.edit({content,embed});
        }
    });

    if (!reas || reas.length === 0 ) return;
    m.removeReactions().catch();

    if (!isFirst && reas.length === 1 && reas[0].emoji.name == "◀") {
        options=null;
        pagefun(page-1,m,rec++);
        m = null;
        msg = null;
    }

    if (!isLast && reas.length === 1 && reas[0].emoji.name == "▶") {
        pagefun(page+1,m,rec++);
        options=null;
        m = null;
        msg = null;
    }

}