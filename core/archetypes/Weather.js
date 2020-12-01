const https = require("https");
const crypto = require("crypto");
const EventEmitter = require("events");
const { appID, key, secret } = require(`${appRoot}/config.json`).weather;
const countries = JSON.parse(require("fs").readFileSync(`${appRoot}/resources/lists/worldISO.json`).toString());

class Weather extends EventEmitter {
    _baseURL = "https://weather-ydn-yql.media.yahoo.com/forecastrss";

    unit = "C";

    _apiResponse;
    locationstr;
    found;

    /**
     * Creates a weather report based on input location
     * @param {string} locationstr
     */
    constructor(locationstr) {
        super();
        if (!locationstr) throw new Error("Constructor needs to be called with location string");
        this.locationstr = locationstr;
        this._initiate();
    }

    /**
     * Returns today's weather forecast object
     * Properties: date, low, high, text, code.
     * @readonly
     */
    get now() {
        const { condition, pubDate: date, wind, atmosphere, astronomy } = this._apiResponse["current_observation"];
        const { text, code, temperature: curr } = condition;
        const { low, high } = this._apiResponse["forecasts"][0];
        const obj = { date, low, curr, high, text, code };
        let forecast = this._parseForecast(obj);
        forecast = Object.assign(forecast, wind, atmosphere, astronomy);
        return forecast;
    }

    /**
     * Returns this weather report's location
     * Warning: country's ISO may not be correct
     * @readonly
     */
    get location() {
        const { location } = this._apiResponse;
        location.country = { name: location.country, iso: this._findISO(location.country) };
        return location;
    }

    /**
     * Retusn an array of forcasts
     * Properties: date, low, high, text, code.
     * @readonly
     */
    get week() {
        return this._apiResponse["forecasts"].map(f => this._parseForecast(f));
    }

    /**
     * Switches unit to (C)elcius or (F)arenheit
     * @param {"C" | "F"} newUnit
     */
    setUnit(newUnit) {
        if (!["C", "F"].includes(newUnit)) throw new Error("Required unit is 'C' or 'F'");
        else this.unit = newUnit;
    }

    /**
     * Private method to find ISO-2 by country name
     * Warning: might not return correct ISO
     * @param {string} name
     * @returns {string} iso
     */
    _findISO(name) {
        const possibilities = [];
        for (const country of countries) {
            if (country["country"] == name) return country["iso"];
            if (country["country"].includes(name)) {
                const charArr1 = country["country"].split("");
                const charArr2 = name.split("");
                let diff = 0;
                for (let i = 0; i < charArr1.length; i++) if (!charArr2[i] || charArr1[i] != charArr2[i]) diff += 1;
                possibilities.push({ name: country["country"], toRet: country["iso"], diff });
            };
        }
        return null;
    }

    /**
     * Private method to parse a forecast
     * @param {object} forecast
     * @return {object} parsed forecast
     */
    _parseForecast(forecast) {
        const { date, low, curr, high, text, code } = forecast;
        const toRet = {
            text, code,
            day: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date(date * 1000).getDay()],
            date: new Date(date * 1000),
            low: low ? this.unit == "F" ? this._convert(low) : low : null,
            high: high ? this.unit == "F" ? this._convert(high) : high : null,
        }
        if (curr) toRet["curr"] = this.unit == "F" ? this._convert(curr) : curr;
        return toRet;
    }

    /**
     * Private method to convert C into F.
     * @param {Number} c temp in C
     * @return {Number} int temp in F
     */
    _convert(c) { return parseInt(c * 1.8 + 32) }

    /**
     * Private method to initiate data to _apiResponse
     */
    _initiate() {
        const query = { location: this.locationstr, format: "json", u: "c" };
        const oauth = {
            "oauth_consumer_key": key,
            "oauth_nonce": Date.now().toString(36),
            "oauth_signature_method": "HMAC-SHA1",
            "oauth_timestamp": parseInt(Date.now() /1000).toString(),
            "oauth_version": "1.0",
        };
        const merge = Object.keys({ ...query, ...oauth }).sort().map(k => [`${k}=${encodeURIComponent(query[k] || oauth[k])}`]);
        const sigstr = `GET&${encodeURIComponent(this._baseURL)}&${encodeURIComponent(merge.join("&"))}`;
        const sig = crypto.createHmac("sha1", encodeURIComponent(secret) + "&").update(sigstr).digest("base64");
        oauth["oauth_signature"] = sig;
        const auth = "OAuth " + Object.keys(oauth).map(k => [`${k}="${oauth[k]}"`]).join(",");

        https.get(`${this._baseURL}?` + Object.keys(query).map(k => `${k}=${query[k]}`).join("&"), 
            {
                headers: {
                    "Authorization": auth,
                    "X-Yahoo-App-Id": appID,
                }
            }, res => {
                if (res.statusCode !== 200) return this.emit("error", res.statusCode);
                res.setEncoding("utf-8");
                let data = "";
                res.on("data", chunk => data += chunk);
                res.on("end", () => { 
                    this._apiResponse = JSON.parse(data);
                    if (Object.keys(this._apiResponse["location"]).length == 0 || this._apiResponse["forecasts"].length == 0) this.found = false;
                    else this.found = true;
                    this.emit("done", this); 
                });
            });
    }
}

module.exports = Weather;