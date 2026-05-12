import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { openAPI } from "better-auth/plugins";
import type { mongo } from "mongoose";
import mailService from "../modules/mail/mail.service.js";

let auth: any;
const getAuth = (client?: mongo.MongoClient) => {
	if (client) {
		auth ??= betterAuth({
			database: mongodbAdapter(client.db("IEEE"), { client }),
			emailAndPassword: {
				enabled: true,
				sendResetPassword: async ({ user, url, token }, request) => {
					mailService
						.sendMail({
							to: user.email,
							subject: "Reset your password",
							message: `Click the link to reset your password: ${url}`,
						})
						.catch(console.error);
				},
				onPasswordReset: async ({ user }, request) => {
					// your logic here
					mailService
						.sendMail({
							to: user.email,
							subject: "Reset your password",
							message: `Your password has been reset successfully.`,
						})
						.then(() => {
							console.log(`Password for user ${user.email} has been reset.`);
						})
						.catch(console.error);
				},
			},
			rateLimit: {
				window: 60 * 5,
				max: 10,
			},
			emailVerification: {
				sendVerificationEmail: async ({ user, url, token }, req) => {
					mailService
						.sendMail({
							to: user.email,
							subject: "Verify your email address",
							message: `Click the link to verify your email: ${url}`,
						})
						.catch(console.error);
				},
			},
			plugins: [openAPI()],
		});
	}
	return auth;
};

export default getAuth;
