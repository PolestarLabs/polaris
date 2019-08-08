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
        let rand = Math.floor(Math.random() * (loc(string,{returnObjects:true}).length));    
        console.log({string,rand,params})   
        return loc(string+"."+rand,params);
    },
};