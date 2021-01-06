const ECO = require('./Economy');
class Airline {
  constructor (id) {
    this.airline = DB.airlines.AIRLINES.findOne({ id })
  }
  
  async buySlot (airport, time) {
    const airportData = await DB.airlines.AIRPORT.findOne({ id: airport });
    if (!airportData) return Promise.reject("Invalid airport ID.");
    
    return ECO.pay((await this.airline).user, airportData.slotPrice, "AIRLINES").then(async () => {
      return DB.airlines.SLOTS.new((await this.airline).id, airportData.id, time);
    });
  }

  async buyAirplane (id) {
    const airplaneData = await DB.airlines.AIRPLANES.findOne({ id });
    if (!airplaneData) return Promise.reject("Invalid airplane ID.");
    
    return ECO.pay((await this.airline).user, airplaneData.price, "AIRLINES").then(async () => {
      return DB.airlines.AIRPLANES.buy((await this.airline).id, airplaneData.id);
    });
  }

  async createAirline (airlineID, airlineName, ownerID) {
    if (airlineName.length > 20) return Promise.reject("Airline name can't be longer than 20 chars.");
    if (airlineID.length !== 4) return Promise.reject("Airline ID should have 4 chars.");
    
    return DB.airlines.AIRLINES.new(ownerID, airlineID, airlineName);
  }

  async createRoute (departure, destination, airplane, ticketPrice) {
    return DB.airlines.ROUTES.new(departure, destination, (await this.airline).id, airplane, ticketPrice);
  }
  
  deleteRoute (route) {
    return DB.airlines.ROUTES.shutdown(route);
  }
}

module.exports = Airline;