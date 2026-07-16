import { registry } from "../../util/registry.js";
import { groupedCommitteesSchema } from "./committees.schema.js";

registry.registerPath({
  method: "get",
  path: "/api/v1/committees",
  tags: ["Committees"],
  summary:
    "Get committees grouped by type. Technical committees are further grouped by track category.",
  responses: {
    200: {
      description:
        "Technical committees are grouped into cs-fundamentals, software-development, systems-and-data, and engineering. Branding and operation are flat arrays. Groups with no current committees return empty arrays.",
      content: {
        "application/json": {
          schema: groupedCommitteesSchema,
        },
      },
    },
    500: { description: "Internal server error" },
  },
});
