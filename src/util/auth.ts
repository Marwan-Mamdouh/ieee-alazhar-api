import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { openAPI } from "better-auth/plugins";
import type { mongo } from "mongoose";

let auth: any;
const getAuth = (client?: mongo.MongoClient) => {
	if (client) {
		auth ??= betterAuth({
			database: mongodbAdapter(client.db("IEEE"), { client }),
			emailAndPassword: { enabled: true },
			rateLimit: {
				window: 60 * 5,
				max: 10,
			},
			plugins: [openAPI({ disableDefaultReference: true })],
		});
	}
	return auth;
};

export default getAuth;
