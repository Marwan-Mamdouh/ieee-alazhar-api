import Transporter from "../../config/mailer.js";
import env from "../../config/env.js";

export interface MailOptions {
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
};

export default mailService;
