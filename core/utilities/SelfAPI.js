const axios = require("axios");
const apiToken = require("../../config.json")["pollux-api-token"];

class SelfAPI {
  constructor(key) {
    this.key = key;
    Object.assign(this, axios.create({
      baseURL: `${paths.API}/`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.key}`,
      },
    }));
  }
}

PLX.api = new SelfAPI(apiToken);
