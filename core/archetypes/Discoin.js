const request 	= require("request");
const rescodes 	= [200, 201, 400, 401, 403];
const ROOT 		= "https://discoin.zws.im";

module.exports = class Discoin {
	constructor (token){
		this.token = token;
		this.rest = (METHOD, route, payload, query ) => {
			if(typeof payload === 'string') query = payload, payload = null;
			return new Promise((resolve,reject)=>{
				(request[METHOD])({url: `${ROOT}/${route}${query?"?s="+encodeURIComponent(query):""}`, headers: {"Authorization": "Bearer " + this.token}, json: payload }, (err, res, body) => {
					if (err || rescodes.indexOf(res.statusCode) === -1)
						return reject(`[${res.statusCode}] :: API failure`);
					if ( ![200,201].includes(res.statusCode) )
						return reject({body,request: `${METHOD.toUpperCase()}: /${route}`,payload});
					return resolve(body);
				});
			});
		};
		this.currencies = () => new Promise((resolve,reject)=>{
			request.get({url:"https://pollux.gg/api/discoin/currencies"}, (err,res,body)=>{
				if ( res.statusCode === 200 ) resolve(JSON.parse(body));
				else reject(res.statusCode);
			});
		});
	}
	rates	() 				{return this.rest("get",   `currencies` ); }
	fetch	(filter) 				{return this.rest("get", "transactions", filter ? filter : `{"to.id": "RBN", "handled": false}`); } 
	create 	(user,amt,toId) {return this.rest("post",  "transactions",{user, amount: Number(amt), toId} ); }
	process	(receipt) 		{return this.rest("patch", `transactions/${receipt}`, {handled: true} ); }
	info	(receipt) 		{return this.rest("get",   `transactions/${receipt}` );}
	reject	(receipt) 		{
		return this.rest("patch", `transactions/${receipt}`, {handled: true} ).then(res=> this.rest("post",  "transactions",{user: res.user, amount: Number(res.amount), toId: res.from.id} ));
	}
};
