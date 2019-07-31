class Choice{
    constructor(string,index){
        this.index = index;
        if(/<[A-z]+:[0-9]{11,19}>/.test(string)){
            this.name       = string.replace('<','').split(':')[0];
            this.id         = string.replace('>','').split(':')[1];
            this.reaction   = string.replace('<','').replace('>','');
            this.output     = string;
        } else if(/<a:[A-z]+:[0-9]{11,19}>/.test(string)){
            this.name       = string.replace('<a:','').split(':')[0];
            this.id         = string.replace('>','').split(':')[1];
            this.reaction   = string.replace('<a:','').replace('>','');
            this.output     = string;
        } else if(typeof string === 'object'){
            this.name       = string.name
            this.id         = string.id
            this.reaction   = string.name +":"+ string.id
            this.output     = "<"+(string.animated?"a:":"")+string.name +":"+ string.id+">"
        }else{
            this.name       = string;
            this.reaction   = string;
            this.output     = string;
        }
    }
}


module.exports = function ReactionMenu(menu,msg,choices,options={}){
    return new Promise(async resolve=>{

        
        let time = options.time || 10000
        let embed = options.embed|| (menu.embeds||[])[0] || false;
        let avoidEdit = options.avoidEdit || true;
        let strings = options.strings || {}
            strings.timeout   =strings.timeout|| "TIMEOUT"
        
            let proc=0
        choices = choices.map((v,i,a)=> new Choice(v,i));
        choices.forEach((chc,i,all)=>{
            menu.addReaction(chc.reaction).then(()=>{
                proc++
                if(proc===all.length) startChosing(menu);
            })
        });
        
        async function startChosing(menu){
            
            const reas = await menu.awaitReactions( {
                maxMatches: 1,
                authorOnly:msg.author.id,
                time
            }).catch(e=>{
                menu.removeReactions().catch(e=>null);
                if(embed && !avoidEdit){
                    embed.color =16499716;        
                    embed.footer ={text: strings.timeout};      
                    menu.edit({embed});
                }
            });
            
            if (!reas || reas.length === 0 ) return resolve(null);
            menu.removeReactions().catch(e=>null);
            if (reas.length === 1 && choices.find(c=> reas[0].emoji.name == c.name)  ) {
                let res = choices.find(c=> reas[0].emoji.name == c.name);
                return resolve(res);
            }else{
                return resolve(null);
            }
            
        }
        
    })
}