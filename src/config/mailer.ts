import { createTransport } from "nodemailer";
import env from "./env.js";

const transporter = createTransport({
	service: "gmail",
	auth: {
		user: env.MAIL_USER,
		pass: env.MAIL_APP_PASSWORD,
		// You can generate an App Password in your Google Account settings under
		// "Security" > "App Passwords", app passwords is not your gmail password,
		// it's a special password that allows your application to access your Gmail account securely.
	},
});

export default transporter;
