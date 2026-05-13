import z from "../../config/zod.config.js";
import {
	BOARD_POSITIONS,
	BOARD_TYPES,
	OFFICER_POSITIONS,
	TECHNICAL_POSITIONS,
} from "./board.types.js";

const validateMembersRoles = <T extends readonly string[]>(roles: T) => {
	return z
		.string()
		.transform((val) => val.toLowerCase())
		.pipe(z.enum(roles))
		.openapi({ example: "officer" });
};

const boardMemberSchema = z.discriminatedUnion("memberType", [
	// Branch 1: If memberType is "officer"
	z
		.object({
			memberType: z.literal("officer"),
			position: validateMembersRoles(OFFICER_POSITIONS),
		})
		.openapi({ example: { memberType: "officer", position: "chair" } }),
	// Branch 2: If memberType is anything else
	z
		.object({
			memberType: z.enum(["technical", "branding", "operation"]),
			position: validateMembersRoles(TECHNICAL_POSITIONS),
		})
		.openapi({ example: { memberType: "technical", position: "vice" } }),
]);

export const addBoardMemberSchema = z
	.object({
		name: z.string().openapi({ example: "John Doe" }),
		bio: z.string().optional().openapi({
			example: "A passionate IEEE member with a love for technology.",
		}),
		linkedin_url: z
			.url()
			.optional()
			.openapi({ example: "https://www.linkedin.com/in/johndoe" }),
		boardYear: z
			.string()
			.optional()
			.transform(Number)
			.pipe(z.number().int().min(2017, "page must be >= 2017"))
			.default(new Date().getFullYear())
			.openapi({ example: 2024 }),
		createdAt: z
			.date()
			.optional()
			.openapi({ example: "2024-01-01T00:00:00.000Z" }),
	})
	.and(boardMemberSchema)
	.openapi("addBoardMemberSchema");

export const getBoardSchema = z
	.object({
		boardYear: z
			.string()
			.optional()
			.transform(Number)
			.pipe(z.number().int().min(2017, "page must be >= 2017"))
			.default(new Date().getFullYear())
			.openapi({ example: 2024 }),
		position: z
			.string()
			.transform((val) => val.split(","))
			.pipe(z.array(z.enum(BOARD_POSITIONS)))
			.optional()
			.openapi({
				example: [
					"chair",
					"treasurer",
					"secretary",
					"vice technical",
					"vice branding",
					"head",
					"vice",
				],
			}),
		memberType: z
			.string()
			.transform((val) => val.split(","))
			.pipe(z.array(z.enum(BOARD_TYPES)))
			.openapi({ example: ["officer", "technical", "branding", "operation"] }),
	})
	.openapi("getBoardSchema");

export const boardIdSchema = z
	.object({
		boardId: z.string().openapi({ example: "64a7b9c8e1f2a3b4c5d6e7f" }),
	})
	.openapi("boardIdSchema");

export const updateBoardMemberSchema = z
	.object({
		name: z.string().optional().openapi({ example: "John Doe" }),
		bio: z.string().optional().openapi({
			example: "A passionate IEEE member with a love for technology.",
		}),
		linkedin_url: z
			.url()
			.optional()
			.openapi({ example: "https://www.linkedin.com/in/johndoe" }),
		boardYear: z
			.string()
			.optional()
			.transform(Number)
			.pipe(z.number().int().min(2017, "page must be >= 2017"))
			.default(new Date().getFullYear())
			.openapi({ example: 2024 }),
		position: z
			.string()
			.transform((val) => val.split(","))
			.pipe(z.array(z.enum(BOARD_POSITIONS)))
			.optional()
			.openapi({
				example: ["chair", "vice technical", "vice"],
			}),
		memberType: z
			.string()
			.transform((val) => val.split(","))
			.pipe(z.array(z.enum(BOARD_TYPES)))
			.optional()
			.openapi({ example: ["officer", "operation"] }),
		updatedAt: z
			.date()
			.optional()
			.openapi({ example: "2024-01-01T00:00:00.000Z" }),
	})
	.openapi("updateBoardMemberSchema");

export const boardMemberDTO = z
	.object({
		id: z.string().openapi({ example: "64a7b9c8e1f2a3b4c5d6e7f" }),
		name: z.string().openapi({ example: "John Doe" }),
		bio: z.string().openapi({
			example: "A passionate IEEE member with a love for technology.",
		}),
		image: z
			.object({
				url: z.url().openapi({
					example:
						"https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
				}),
				public_id: z.string().openapi({ example: "demo/sample" }),
			})
			.optional(),
		linkedin: z
			.url()
			.openapi({ example: "https://www.linkedin.com/in/johndoe" }),
		position: z.string().openapi({ example: "chair" }),
		member_type: z.string().openapi({ example: "officer" }),
		year: z.number().openapi({ example: 2024 }),
	})
	.openapi("BoardMemberDTO");

export type AddBoardMember = z.infer<typeof addBoardMemberSchema>;
export type GetBoard = z.infer<typeof getBoardSchema>;
export type BoardId = z.infer<typeof boardIdSchema>;
export type UpdateBoardMember = z.infer<typeof updateBoardMemberSchema>;
export type BoardMemberDTO = z.infer<typeof boardMemberDTO>;
