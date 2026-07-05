import type {
	CreateFeedbackDTO,
	UpdateFeedbackStatusDTO,
} from "./feedback.schema.js";
import { type FeedbackItem, feedbackProps } from "./feedback.types.js";
import FeedbackModel from "./feedback.model.js";
import { toFeedbackDTO } from "./feedback.dto.js";
import { NotFoundError } from "../../errors/app.error.js";
import type { PaginationParams } from "../../util/zod.config.js";

const feedbackService = {
	async createFeedback(feedback: CreateFeedbackDTO) {
		const result = await new FeedbackModel(feedback).save();
		return toFeedbackDTO(result);
	},

	async updateFeedbackStatus(
		id: string,
		updatedStatus: UpdateFeedbackStatusDTO,
	) {
		const feedback = await FeedbackModel.findByIdAndUpdate(
			id,
			{ status: updatedStatus.status },
			{ returnDocument: "after" },
		)
			.select(feedbackProps)
			.lean<FeedbackItem>()
			.exec();
		if (!feedback) {
			throw new NotFoundError("Feedback not found");
		}
		return toFeedbackDTO(feedback);
	},

	async getFeedbacks(validatedQuery: PaginationParams) {
		const { page, limit } = validatedQuery;
		const feedbacks = await FeedbackModel.find()
			.select(feedbackProps)
			.lean<FeedbackItem[]>()
			.sort({ createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(limit)
			.exec();
		return feedbacks.map(toFeedbackDTO);
	},
};

export default feedbackService;
