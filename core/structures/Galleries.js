const axios = require('axios' )
const {randomize} = require('../utilities/Gearbox')

module.exports = {

    randomOne: async (gallery,dlink)=>{
        URL = paths.CDN+"/random/"+gallery
        
        if(dlink){
            URL = paths.CDN+"/random/redir/"+gallery+"?json=1"
            const response = await axios.get(URL, {
              
            });         
            return response.data; 
        }
        const response = await axios.get(URL, {
            headers: { 'Accept': '*' },
            responseType: 'arraybuffer'
        });         
        return response.data;       
    },
    
    randomOneIndexed: async (gallery,url=false)=>{
        URL = paths.CDN+"/random/"+gallery
        const pre_res = await axios.get(URL+"/size", {
            headers: { 'Accept': 'json' },
            responseType: 'json'
        });
        let rand = randomize(0,pre_res.data-1)
      
        if(url){
            return Promise.resolve({file: URL+"/"+rand, index: rand});            
        }else{
            const response = await axios.get(URL+"/"+rand, {
                headers: { 'Accept': '*' },
                responseType: 'arraybuffer'
            });   
            return Promise.resolve({file: response.data, index: rand});
        }
    },

    indexedOne: async (gallery,index=0)=>{
        URL = paths.CDN+"/random/"+gallery+"/"+index
        const response = await axios.get(URL, {
            headers: { 'Accept': '*' },
            responseType: 'arraybuffer'
        });         
        return response.data;       
    },
    filteredOne: async (gallery,filter)=>{
        URL = paths.CDN+"/random/"+gallery+"/filter/"+filter+"?json=1"
        const response = await axios.get(URL, {
            headers: { 'Accept': 'json' },
            responseType: 'json'
        });         
        return response.data;       
    },


}