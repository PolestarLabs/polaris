  var reroute;
module.exports = {
    getT: function getT(){
        return reroute;
    },
    setT: function setT(t){
        reroute = t;
    },

    rand: function rand(string, fun,params){
        let loc = this.getT()
        let rand = Math.floor(Math.random() * (loc(string,{returnObjects:true}).length));       
        return loc(string+"."+rand,params);
    },
};