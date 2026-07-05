import { z } from "zod";
import { registry } from "../../util/registry.js";
import { eventIdSchema, sanityEventSchema, sanityEventSummarySchema } from "./events.schema.js";

registry.registerPath({
	method: "get",
	path: "/api/v1/events",
	tags: ["Events"],
	summary: "Get events list from Sanity",
	responses: {
		200: {
			description: "Successful response with list of events",
			content: {
				"application/json": {
					schema: z.object({
						data: z.array(sanityEventSummarySchema),
					}),
				},
			},
		},
		500: { description: "Internal server error" },
	},
});

registry.registerPath({
	method: "get",
	path: "/api/v1/events/{id}",
	tags: ["Events"],
	summary: "Get single event from Sanity by ID",
	request: {
		params: eventIdSchema,
	},
	responses: {
		200: {
			description: "Successful response with single event details",
			content: {
				"application/json": {
					schema: z.object({
						data: sanityEventSchema,
					}),
				},
			},
		},
		400: { description: "Bad request due to invalid event ID (must be UUID)" },
		404: { description: "Event not found" },
		500: { description: "Internal server error" },
	},
});
