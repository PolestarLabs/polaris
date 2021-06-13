const https = require("https");
const crypto = require("crypto");

const { appId, client, secret } = require(`${appRoot}/config.json`).yahooAPI;
const countries = require("@polestar/constants/countries").default;

class Weather {
	#baseURL = "https://weather-ydn-yql.media.yahoo.com/forecastrss";

	#unit = "C";

	#apiResponse;

	locationstr;

	found;

	/**
	 * Creates a weather report based on input location
	 */
	constructor() {	}

	/**
	 * Returns today's weather forecast object
	 * Properties: date, low, high, text, code.
	 * @readonly
	 */
	get now() {
		const {
			condition, pubDate: date, wind, atmosphere, astronomy,
		} = this.#apiResponse.current_observation;
		const { text, code, temperature: curr } = condition;
		const { low, high } = this.#apiResponse.forecasts[0];
		const obj = {
			date, low, curr, high, text, code,
		};
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
		const { location } = this.#apiResponse;
		if (typeof location.country == 'string') location.country = { name: location.country, iso: this._findISO(location.country) };
		return location;
	}

	/**
	 * Returns an array of forcasts
	 * Properties: date, low, high, text, code.
	 * @readonly
	 */
	get week() {
		return this.#apiResponse.forecasts.map((f) => this._parseForecast(f));
	}

	/**
	 * Switches unit to (C)elcius or (F)arenheit
	 * @param {"C" | "F"} newUnit
	 */
	setUnit(newUnit) {
		if (!["C", "F"].includes(newUnit)) throw new Error("Required unit is 'C' or 'F'");
		else this.#unit = newUnit;
	}

	/**
	 * Private method to find ISO-2 by country name
	 * Warning: might not return correct ISO
	 * @param {string} name
	 * @returns {string?} iso
	 */
	_findISO(name) {
		const possibilities = [];
		const ctrys = Object.values(countries);
		for (const country of ctrys) {
			if (country === name) return countries[country];
			if (country.includes(name)) {
				const charArr1 = country.split("");
				const charArr2 = name.split("");

				let diff = 0;
				for (let i = 0; i < charArr1.length; i++) 
					if (!charArr2[i] || charArr1[i] != charArr2[i]) 
						diff += 1;

				possibilities.push({ name: country, toRet: countries[country], diff });
			}
		}
		return null;
	}

	/**
	 * Private method to parse a forecast
	 * @param {object} forecast
	 * @return {object} parsed forecast
	 */
	_parseForecast(forecast) {
		const {
			date, low, curr, high, text, code,
		} = forecast;
		const toRet = {
			text,
			code,
			day: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date(date * 1000).getDay()],
			date: new Date(date * 1000),
			low: typeof low === "number" ? (this.#unit == "F" ? this._convert(low) : low) : null,
			high: typeof high === "number" ? (this.#unit == "F" ? this._convert(high) : high) : null,
		};
		if (typeof curr === "number") toRet.curr = (this.#unit == "F" ? this._convert(curr) : curr);
		return toRet;
	}

	/**
	 * Private method to convert C into F.
	 * @param {Number} c temp in C
	 * @return {Number} int temp in F
	 */
	_convert(c) { return parseInt(c * 1.8 + 32); }

	/**
	 * Retrieves data from Yahoo API.
	 * @param {string} location the location to get weather of
	 * @returns {Promise<this|number>} this or HTTP error code.
	 * @throws Bad input string (either none, empty or only illegal characters)
	 */
	initiate(locationstr = "") {
		if (!locationstr) throw new Error("Initiate needs to be called with location string");
		locationstr = locationstr.replace(/[']/, ""); // Yahoo can't handle these chars
		if (!locationstr) throw new Error("Bad location string");
		this.locationstr = locationstr;

		return new Promise((resolve, reject) => {
			const query = { location: this.locationstr, format: "json", u: "c" };
			const oauth = {
				oauth_consumer_key: client,
				oauth_nonce: Date.now().toString(36),
				oauth_signature_method: "HMAC-SHA1",
				oauth_timestamp: parseInt(Date.now() / 1000).toString(),
				oauth_version: "1.0",
			};
			const merge = Object.entries({ ...query, ...oauth }).sort().map(([k, v]) => [`${encodeURIComponent(k)}=${encodeURIComponent(v)}`]);
			const sigstr = `GET&${encodeURIComponent(this.#baseURL)}&${encodeURIComponent(merge.join("&"))}`;
			const sig = crypto.createHmac("sha1", `${encodeURIComponent(secret)}&`).update(sigstr).digest("base64");
			oauth.oauth_signature = sig;
			const auth = `OAuth ${Object.keys(oauth).map((k) => [`${k}="${oauth[k]}"`]).join(",")}`;
			const url = `${this.#baseURL}?${Object.keys(query).map((k) => `${k}=${query[k]}`).join("&")}`;

			https.get(url,
				{
					headers: {
						Authorization: auth,
						"X-Yahoo-App-Id": appId,
					},
				}, (res) => {
					if (res.statusCode !== 200) return reject(res.statusCode);
					res.setEncoding("utf-8");
					let data = "";
					res.on("data", (chunk) => data += chunk);
					res.on("end", () => {
						//console.log(data);
						this.#apiResponse = JSON.parse(data);
						if (Object.keys(this.#apiResponse.location).length == 0 || this.#apiResponse.forecasts.length == 0) this.found = false;
						else this.found = true;
						resolve(this);
					});
				});
		});
	}
}

module.exports = Weather;
