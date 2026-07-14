import { z } from "zod";
import { registry } from "../../util/registry.js";
import { homePageDataSchema } from "./home.schema.js";

registry.registerPath({
  method: "get",
  path: "/api/v1/home",
  tags: ["Home"],
  summary: "Get homepage images from Sanity",
  responses: {
    200: {
      description: "Successful response with homepage image list",
      content: {
        "application/json": {
          schema: z.object({ data: homePageDataSchema }),
        },
      },
    },
    500: { description: "Internal server error" },
  },
});
