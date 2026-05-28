import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { Types } from "mongoose";
import { z } from "zod";

extendZodWithOpenApi(z); // must be before any schema files are imported

export const idSchema = (example: string) =>
	z
		.string()
		.length(24, "ObjectId must be exactly 24 characters long")
		.refine((val) => Types.ObjectId.isValid(val), {
			message: "Invalid MongoDB ObjectId format",
		})
		.openapi({ example });

export const paginationSchema = z.object({
	page: z
		.string()
		.min(1)
		.transform(Number)
		.pipe(z.number().int().positive())
		.default(1)
		.openapi({
			description: "Page number for pagination (default: 1)",
		}),
	limit: z
		.string()
		.min(1)
		.max(2)
		.transform(Number)
		.pipe(z.number().int().positive().max(50))
		.default(10)
		.openapi({
			description: "Number of items per page for pagination (default: 10)",
		}),
});

export type PaginationParams = z.infer<typeof paginationSchema>;
export default z;
