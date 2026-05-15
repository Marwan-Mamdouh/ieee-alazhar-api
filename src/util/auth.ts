import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { emailOTP, openAPI } from "better-auth/plugins";
import type { mongo } from "mongoose";

import env from "../config/env.js";
import mailService from "../modules/mail/mail.service.js";

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
			advanced: {
				disableOriginCheck: env.NODE_ENV !== "production",
			},
			plugins: [
				openAPI(),
				emailOTP({
					overrideDefaultEmailVerification: true,
					async sendVerificationOTP({ email, otp, type }) {
						if (type === "sign-in") {
							// Send the OTP for sign in
							mailService.sendSignInOTP(email, otp).catch(console.error);
						} else if (type === "email-verification") {
							// Send the OTP for email verification
							mailService.sendVerificationOTP(email, otp).catch(console.error);
						} else {
							// Send the OTP for password reset
							mailService.sendResetPasswordOTP(email, otp).catch(console.error);
						}
					},
				}),
			],
		});
	}
	return auth;
};

export default getAuth;
