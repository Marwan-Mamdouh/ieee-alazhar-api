import z, { idSchema } from "../../util/zod.config.js";
import { FEEDBACK_STATUSES } from "./feedback.types.js";

export const createFeedbackSchema = z.object({
	name: z.string().min(2).max(80),
	email: z.email().max(255),
	phoneNumber: z.string().max(15).optional(),
	message: z.string().min(2).max(1000),
});

export const updateFeedbackStatusSchema = z.object({
	status: z.enum(FEEDBACK_STATUSES),
});

export const feedbackIdSchema = z.object({
	id: idSchema("64a7b9c8e1f2a3b4c5d6e7f").openapi({
		description: "MongoDB ObjectId of the feedback entry",
	}),
});

export type CreateFeedbackDTO = z.infer<typeof createFeedbackSchema>;
export type UpdateFeedbackStatusDTO = z.infer<
	typeof updateFeedbackStatusSchema
>;
export type FeedbackId = z.infer<typeof feedbackIdSchema>;
