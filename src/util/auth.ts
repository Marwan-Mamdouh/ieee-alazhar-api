import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { emailOTP, openAPI } from "better-auth/plugins";

import env from "../config/env.js";
import mailService from "../modules/mail/mail.service.js";
import connectDb from "../config/db.js";

const { mongoClient: client } = await connectDb();

const auth = betterAuth({
	database: mongodbAdapter(client.db("IEEE"), { client }),
	emailAndPassword: { enabled: true },
	rateLimit: {
		window: 60 * 5,
		max: 10,
	},
  baseUrl: env.BETTER_AUTH_URL,
  trustedOrigins: [
    env.FRONTEND_URL,
    `http://localhost:5173`
    ],
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

export default auth;
