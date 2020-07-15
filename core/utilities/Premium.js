const baseline = 125;
// const DB = require(appRoot+"/core/database/db_ops");

module.exports = {

  getTier: function getTier(user) {
    return new Promise((resolve) => {
      DB.users.get(user.id).then((usr) => {
        const tier = usr.donator;
        // if((usr.premium||{}).active)
        resolve(tier || false);
        // else resolve (false);
      });
    });
  },
  getDaily: function getDaily(user) {
    return new Promise((resolve) => {
      this.getTier(user).then((Tier) => {
        if (!Tier) return resolve(baseline);

        switch (Tier.toLowerCase()) {
          case "antimatter": // 250
            extra = 1000;
            break;

          case "astatine": // 100
            extra = 800;
            break;

          case "uranium": // 50
            extra = 500;
            break;

          case "zirconium": // 25
            extra = 300;
            break;

          case "palladium": // 15
            extra = 200;
            break;

          case "lithium": //  10
          case "carbon": //  10
            extra = 150;
            break;

          case "iridium": // 5
            extra = 100;
            break;

          case "aluminium": // 5
            extra = 50;
            break;

          default:
            extra = 10;
            break;
        }

        return resolve(baseline + extra);
      });
    });
  },

};
