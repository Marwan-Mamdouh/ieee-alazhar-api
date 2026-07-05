import { z } from "zod";
import { registry } from "../../util/registry.js";
import { createFeedbackSchema, feedbackIdSchema, updateFeedbackStatusSchema } from "./feedback.schema.js";
import { feedbackSchema } from "./feedback.output.schema.js";

registry.registerPath({
	method: "post",
	path: "/api/v1/feedback",
	tags: ["Feedback"],
	summary: "Submit user feedback",
	request: {
		body: {
			content: {
				"application/json": {
					schema: createFeedbackSchema,
				},
			},
		},
	},
	responses: {
		201: {
			description: "Feedback received successfully",
			content: {
				"application/json": {
					schema: z.object({
						message: z.string().openapi({ example: "Feedback received" }),
					}),
				},
			},
		},
		400: { description: "Bad request due to invalid fields" },
		500: { description: "Internal server error" },
	},
});

registry.registerPath({
	method: "get",
	path: "/api/v1/feedback",
	tags: ["Feedback"],
	summary: "Get paginated list of feedback (Admin only)",
	security: [{ cookieAuth: [] }],
	responses: {
		200: {
			description: "Successful response with list of feedback",
			content: {
				"application/json": {
					schema: z.object({
						data: z.array(feedbackSchema),
					}),
				},
			},
		},
		401: { description: "Unauthorized" },
		500: { description: "Internal server error" },
	},
});

registry.registerPath({
	method: "patch",
	path: "/api/v1/feedback/{id}/status",
	tags: ["Feedback"],
	summary: "Update feedback status (Admin only)",
	security: [{ cookieAuth: [] }],
	request: {
		params: feedbackIdSchema,
		body: {
			content: {
				"application/json": {
					schema: updateFeedbackStatusSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Status updated successfully",
			content: {
				"application/json": {
					schema: z.object({
						data: feedbackSchema,
					}),
				},
			},
		},
		400: { description: "Bad request due to invalid payload" },
		401: { description: "Unauthorized" },
		404: { description: "Feedback not found" },
		500: { description: "Internal server error" },
	},
});
