var reroute;
module.exports = {
    getT: function getT(){
        return reroute;
    },
    setT: function setT(t){
        reroute = t;
    },

    rand: function rand(string,params){
        let loc = reroute
        let options = loc(string,{returnObjects:true},params);
        let rand = Math.floor(Math.random() * (options.length));
        
        return options[rand]
    },
};