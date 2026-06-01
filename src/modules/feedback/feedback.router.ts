import { Router, type Request, type Response } from "express";

import asyncHandler from "../../util/async.handler.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import { validate } from "../../middlewares/validate.js";
import {
	createFeedbackSchema,
	feedbackIdSchema,
	updateFeedbackStatusSchema,
	type CreateFeedbackDTO,
	type UpdateFeedbackStatusDTO,
	type FeedbackId,
} from "./feedback.schema.js";
import type { TypedRequest } from "../../types/TypedRequest.js";
import feedbackService from "./feedback.service.js";
import {
	paginationSchema,
	type PaginationParams,
} from "../../util/zod.config.js";

const router = Router();

router.post(
	"/",
	validate(createFeedbackSchema, "body"),
	asyncHandler(async (req: TypedRequest<CreateFeedbackDTO>, res: Response) => {
		await feedbackService.createFeedback(req.validatedBody!);
		res.status(201).json({ message: "Feedback received" });
	}),
);

router.get(
	"/",
	isAuthenticated,
	validate(paginationSchema, "query"),
	asyncHandler(
		async (
			req: TypedRequest<unknown, unknown, PaginationParams>,
			res: Response,
		) => {
			const result = await feedbackService.getFeedbacks(req.validatedQuery!);
			res.json({ data: result });
		},
	),
);

router.patch(
	"/:id/status",
	isAuthenticated,
	validate(feedbackIdSchema, "params"),
	validate(updateFeedbackStatusSchema, "body"),
	asyncHandler(
		async (
			req: TypedRequest<UpdateFeedbackStatusDTO, FeedbackId>,
			res: Response,
		) => {
			const result = await feedbackService.updateFeedbackStatus(
				req.validatedParams!.id,
				req.validatedBody!,
			);

			res.json({ data: result });
		},
	),
);

export default router;
