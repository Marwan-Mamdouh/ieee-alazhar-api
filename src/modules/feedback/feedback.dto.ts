import type { Feedback } from "./feedback.model.js";
import type { FeedbackItem } from "./feedback.types.js";

export const toFeedbackDTO = (data: FeedbackItem | Feedback) => {
	return {
		id: data._id.toString(),
		name: data.name,
		email: data.email,
		phoneNumber: data.phoneNumber,
		message: data.message,
		status: data.status,
		createdAt: data.createdAt,
		updatedAt: data.updatedAt,
		handledAt: data.handledAt,
	};
};
