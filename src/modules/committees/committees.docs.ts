import { registry } from "../../util/registry.js";
import { groupedCommitteesSchema } from "./committees.schema.js";

registry.registerPath({
	method: "get",
	path: "/api/v1/committees",
	tags: ["Committees"],
	summary: "Get grouped committees from Sanity",
	responses: {
		200: {
			description: "Successful response with committees grouped by type",
			content: {
				"application/json": {
					schema: groupedCommitteesSchema,
				},
			},
		},
		500: { description: "Internal server error" },
	},
});
