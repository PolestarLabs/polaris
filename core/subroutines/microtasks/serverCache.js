const DB = require("../../database/db_ops")

module.exports = {

    update: async function ServerCacheUPDATE(body,url,res){
        if(res && !body.id){ 
            res.statusCode = 400
            res.end("No ID provided")
        }
        const query = {id: {$in: POLLUX.guilds.map(g=>g.id) }}
        if( (body.id||body) != 'all' ) query.id = body.id; 

        return DB.servers.find(query).lean().exec().then(servers=>{
            let map = servers.map(sv=>{
                let thisServer = POLLUX.guilds.find(_s=>_s.id === sv.id);
                if(!thisServer) return;
                thisServer.LANG = sv.modules.LANGUAGE;
                thisServer.DISABLED = sv.modules.DISABLED;         
                POLLUX.registerGuildPrefix(sv.id ,[sv.modules.PREFIX||'+',(sv.globalPrefix?'p!':'plx!'),'plx!'])
                if(!sv.cluster) DB.servers.set({id:sv.id},{cluster:POLLUX.cluster.id});
                return {meta: thisServer.name, id: sv.id}
            })
            if(res) res.end(JSON.stringify(map));
        });

        
    },
    reload: async function ServerCacheRELOAD(){
        let setserv = await POLLUX.updatePrefixes(DB);
        res.statusCode = 200
        res.end(JSON.stringify(setserv))
    },
    updateChannels: async function ServerCacheUPDATE_CHANNEL(body,url,res){
        console.log("query")
        console.log(POLLUX.channels.map(c=>c.id))
        if(res && !body.id){ 
            res.statusCode = 400
            res.end("No ID provided")
        }
  
        const query = {id: {$in: POLLUX.channels.map(c=>c.id) }}
        if( (body.id||body) != 'all' ) query.id = body.id; 
        
        console.log(query)
        return DB.channels.find(query).lean().exec().then(channels=>{
            let map = channels.map(ch=>{
                let thisChannel = POLLUX.getChannel(ch.id);
                if(!thisChannel) return;
                thisChannel.LANG = ch.LANGUAGE;
                thisChannel.DISABLED = ch.modules.DISABLED;         
                return {meta: thisChannel.name, id: ch.id}
            })
            if(res) res.end(JSON.stringify(map));
        });

        
    },


}