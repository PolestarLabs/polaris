
declare interface databaseConnectOptionsType {
	static useNewUrlParser: boolean;

	static keepAlive: boolean;

	static connectTimeoutMS: number;

	static useUnifiedTopology: boolean;

	static promiseLibrary: any;

	static poolSize: number;
}

declare interface VANILLA_CONNECTION_DATAType {
	static redis: {
	static host: string;

	static port: number;
	};
}
