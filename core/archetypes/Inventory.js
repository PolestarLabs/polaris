// const DB = require('../database/db_ops');

class InventoryCommand{
    
    constructor(user,invType,options){
        //                                 DEFAULT
        this.userID  = user.id          || user;
        this.invType = invType          || ""
        this.db      = options ? options.db || "inventory" : "inventory";
        this.Items   = new Promise(resolve => {
            DB.items.find({type:this.invType}).lean().exec().then(boxes=> resolve(boxes));
        });

    }
    getUserData() { return DB.users.get(this.userID) };
    async listItems(uD) {
        if(!uD) uD = await this.getUserData();
        let inv= (await this.Items).map(itm=> {
            let thisItem = uD.modules[this.db].find(it=> it.id == itm.id && it.count>0);
            return thisItem ? (itm.count = thisItem.count,itm) : null;
        }).filter(i=>i!=null);
        return inv;
    };

}

module.exports = InventoryCommand