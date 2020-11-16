const axios = require('axios');
const apiToken = require('../../config.json')["pollux-api-token"];
const ROOT = paths.CDN;
 
class SelfAPI{
    constructor(key){
        this.key = key
        this.request = axios.create({
            baseURL: ROOT + "/api/",
            headers:{
                "Content-Type": "application/json",
                "Authorization": "Bearer " + this.key
            }            
        });
    }
}

PLX.api = new SelfAPI(apiToken);