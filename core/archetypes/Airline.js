/* eslint-disable arrow-body-style */
const ECO = require('./Economy');

class Airline {
  constructor(id) {
    this.airline = DB.airlines.AIRLINES.findOne({ id });
    this.id = id;
  }

  async buySlot(airport, time) {
    const airportData = await DB.airlines.AIRPORT.findOne({ id: airport });
    if (!airportData) return Promise.reject("Invalid airport ID.");

    await DB.airlines.SLOTS.validate((await (this.airline)).id, airportData.id).then(ok=>{
      return ECO.pay( (await (this.airline)).user, airportData.slotPrice, "airlines_buy_slot").then(async () => {
        return DB.airlines.SLOTS.new((await (this.airline)).id, airportData.id, time);
      }).catch(_ => {
        return Promise.reject("Insufficient Funds");
      });
    }).catch(err=>{
      return Promise.reject("Validation Error:" + err);
    });
  }

  async buyAirplane(id) {
    const airplaneData = await DB.airlines.AIRPLANES.findOne({ id });
    if (!airplaneData) return Promise.reject("Invalid airplane ID.");

    return ECO.pay((await this.airline).user, airplaneData.price, "airlines_buy_plane").then(async () => {
      return DB.airlines.AIRPLANES.buy((await this.airline).id, airplaneData.id);
    });
  }

  createAirline(airlineID, airlineName, ownerID) {
    return DB.airlines.AIRLINES.new(ownerID, airlineID, airlineName);
  }

  async createRoute(departure, destination, airplane, ticketPrice) {
    return DB.airlines.ROUTES.new(departure, destination, this.id, airplane, ticketPrice);
  }

  deleteRoute(route) {
    return DB.airlines.ROUTES.shutdown(route);
  }
}

module.exports = Airline;
