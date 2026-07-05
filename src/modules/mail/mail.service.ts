import Transporter from "../../config/mailer.js";
import env from "../../config/env.js";

interface MailOptions {
	to: string;
	subject: string;
	message: string;
}

const mailService = {
	sendMail: async ({ to, subject, message }: MailOptions) => {
		await Transporter.sendMail({
			from: env.MAIL_USER,
			to,
			subject,
			text: message,
		});
	},

	sendSignInOTP: async (to: string, otp: string) => {
		await mailService.sendMail({
			to,
			subject: "Your OTP for Sign In",
			message: `Your OTP for signing in into your account in IEEE is: ${otp}`,
		});
	},

	sendVerificationOTP: async (to: string, otp: string) => {
		await mailService.sendMail({
			to,
			subject: "Your OTP for Email Verification",
			message: `Your OTP for verifying your email in IEEE is: ${otp}`,
		});
	},

	sendResetPasswordOTP: async (to: string, otp: string) => {
		await mailService.sendMail({
			to,
			subject: "Your OTP for Password Reset",
			message: `Your OTP for resetting your password in IEEE is: ${otp}`,
		});
	},
};

export default mailService;
