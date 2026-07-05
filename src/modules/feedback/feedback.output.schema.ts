import z from "../../util/zod.config.js";
import { FEEDBACK_STATUSES } from "./feedback.types.js";

export const feedbackSchema = z.object({
	id: z.string().openapi({ example: "64a7b9c8e1f2a3b4c5d6e7f" }),
	name: z.string().openapi({ example: "John Doe" }),
	email: z.string().email().openapi({ example: "john.doe@example.com" }),
	phoneNumber: z.string().optional().openapi({ example: "+1234567890" }),
	message: z.string().openapi({ example: "Awesome website!" }),
	status: z.enum(FEEDBACK_STATUSES).openapi({ example: "pending" }),
	createdAt: z.date().or(z.string()).openapi({ example: "2026-07-05T01:00:00Z" }),
}).openapi("Feedback");
