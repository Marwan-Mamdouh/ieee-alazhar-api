import z from "../../config/zod.config.js";
import {
	BOARD_POSITIONS,
	BOARD_TYPES,
	OFFICER_POSITIONS,
	COMMITTEE_POSITIONS,
	TECHNICAL_TRACKS,
	BRANDING_TRACKS,
	OPERATION_TRACKS,
	ALL_TRACKS,
} from "./board.types.js";

const ALLOWED_POSITIONS = {
	officer: OFFICER_POSITIONS,
	technical: COMMITTEE_POSITIONS,
	branding: COMMITTEE_POSITIONS,
	operation: COMMITTEE_POSITIONS,
} as const;

const ALLOWED_TRACKS = {
	technical: TECHNICAL_TRACKS,
	branding: BRANDING_TRACKS,
	operation: OPERATION_TRACKS,
} as const;

type CrossFieldUpdatePayload = {
	memberType?: (typeof BOARD_TYPES)[number] | undefined;
	position?: (typeof BOARD_POSITIONS)[number] | undefined;
	track?: (typeof ALL_TRACKS)[number] | null | undefined;
};

/**
 * Validates cross-field dependency alignments for member updates.
 */
const verifyStructuralAlignment = (
	data: CrossFieldUpdatePayload,
	ctx: z.RefinementCtx,
) => {
	const { memberType, position, track } = data;
	// Rule 1: No structural fields being modified? Exit early.
	if (!memberType && !position && !track) return;

	// Rule 2: Cannot update child values without knowing the overarching member type.
	if ((position || track) && !memberType) {
		return ctx.addIssue({
			code: "custom",
			message:
				"You must provide 'memberType' when updating 'position' or 'track' to ensure alignment.",
			path: ["memberType"],
		});
	}

	// Rule 3: Officers cannot have tracks.
	if (memberType === "officer" && track) {
		ctx.addIssue({
			code: "custom",
			message: "Officers cannot be assigned to a specialized track.",
			path: ["track"],
		});
	}

	// Rule 4: Match position against allowed list for that specific member type.
	const validPositions = ALLOWED_POSITIONS[memberType!];
	if (
		position &&
		!(validPositions as ReadonlyArray<string>).includes(position)
	) {
		ctx.addIssue({
			code: "custom",
			message: `Invalid position for ${memberType}. Allowed: ${validPositions.join(", ")}`,
			path: ["position"],
		});
	}

	// Rule 5: Match track against allowed list for committee types.
	if (memberType !== "officer" && track) {
		const validTracks =
			ALLOWED_TRACKS[memberType as keyof typeof ALLOWED_TRACKS];
		if (
			!validTracks ||
			!(validTracks as ReadonlyArray<string>).includes(track)
		) {
			ctx.addIssue({
				code: "custom",
				message: `Invalid track selection for ${memberType} committee.`,
				path: ["track"],
			});
		}
	}
};

// Generic helper to normalize string inputs (trim, lowercase, and validate enum)
const validateEnumString = <T extends readonly string[]>(values: T) => {
	return z
		.string()
		.transform((val) => val.toLowerCase().trim())
		.pipe(z.enum(values))
		.openapi({ example: values[0] });
};

const parseQueryArray = <T extends readonly string[]>(enumArray: T) => {
	return z
		.string()
		.max(500) // General query string ceiling protection
		.transform((val) => val.split(",").map((item) => item.toLowerCase().trim()))
		.pipe(z.array(z.enum(enumArray)))
		.optional();
};

const boardMemberRoleSchema = z.discriminatedUnion("memberType", [
	// 1. Officer Branch
	z.object({
		memberType: z.literal("officer"),
		position: validateEnumString(OFFICER_POSITIONS),
		track: z
			.string()
			.optional()
			.transform(() => undefined),
	}),
	// 2. Technical Branch
	z.object({
		memberType: z.literal("technical"),
		position: validateEnumString(COMMITTEE_POSITIONS),
		track: validateEnumString(TECHNICAL_TRACKS),
	}),
	// 3. Branding Branch
	z.object({
		memberType: z.literal("branding"),
		position: validateEnumString(COMMITTEE_POSITIONS),
		track: validateEnumString(BRANDING_TRACKS),
	}),
	// 4. Operation Branch
	z.object({
		memberType: z.literal("operation"),
		position: validateEnumString(COMMITTEE_POSITIONS),
		track: validateEnumString(OPERATION_TRACKS),
	}),
]);

const linkedin_url = z.url().min(2).max(1024).optional().openapi({
	example: "https://www.linkedin.com/in/johndoe",
});

const boardYear = z
	.string()
	.min(2)
	.max(4)
	.transform(Number)
	.pipe(
		z
			.number()
			.int()
			.min(2017, "Year must be >= 2017")
			.max(
				new Date().getFullYear() + 5,
				"Year cannot be more than 5 years in the future",
			),
	)
	.default(new Date().getFullYear())
	.openapi({ example: 2026 });

const baseBoardMemberSchema = z.object({
	name: z.string().min(1, "Name is required").openapi({ example: "John Doe" }),
	bio: z.string().min(2).max(100).optional().openapi({
		example: "A passionate IEEE member with a love for technology.",
	}),
	linkedin_url,
	boardYear,
	createdAt: z.date().optional(),
});

export const addBoardMemberSchema = baseBoardMemberSchema
	.and(boardMemberRoleSchema)
	.openapi("addBoardMemberSchema");

export const getBoardSchema = z
	.object({
		boardYear,
		position: parseQueryArray(BOARD_POSITIONS).openapi({
			example: ["chair", "head"],
		}),
		memberType: parseQueryArray(BOARD_TYPES).openapi({
			example: ["officer", "technical"],
		}),
		track: parseQueryArray(ALL_TRACKS).openapi({ example: ["back end", "hr"] }),
	})
	.openapi("getBoardSchema");

export const boardIdSchema = z
	.object({
		boardId: z
			.string()
			.min(2)
			.max(100)
			.openapi({ example: "64a7b9c8e1f2a3b4c5d6e7f" }),
	})
	.openapi("boardIdSchema");

/**
 * PATCH Update Schema
 * Uses a superRefine validation block. If a client attempts to modify
 * tracking, roles, or types, we validate their combined state.
 */
export const updateBoardMemberSchema = z
	.object({
		name: z
			.string()
			.min(2)
			.max(100)
			.optional()
			.openapi({ example: "John Doe" }),
		bio: z
			.string()
			.min(2)
			.max(100)
			.optional()
			.openapi({ example: "Updated biography text." }),
		linkedin_url,
		boardYear,
		memberType: z
			.enum(BOARD_TYPES)
			.optional()
			.openapi({ example: "technical" }),
		position: z.enum(BOARD_POSITIONS).optional().openapi({ example: "head" }),
		track: z
			.enum(ALL_TRACKS)
			.optional()
			.nullable()
			.openapi({ example: "back end" }),
		updatedAt: z.date().optional(),
	})
	.superRefine(verifyStructuralAlignment) // Clean callback injection
	.openapi("updateBoardMemberSchema");

// Clean Outbound Data Transfer Object
export const boardMemberDTO = z
	.object({
		id: z
			.string()
			.min(2)
			.max(100)
			.openapi({ example: "64a7b9c8e1f2a3b4c5d6e7f" }),
		name: z.string().min(2).max(100).openapi({ example: "John Doe" }),
		bio: z
			.string()
			.min(2)
			.max(100)
			.openapi({ example: "A passionate IEEE member." }),
		image: z
			.object({
				url: z.url().min(2).max(1024).openapi({
					example:
						"https://res.cloudinary.com/ieee-vm/image/upload/v1692200000/sample.jpg",
				}),
				public_id: z.string().min(2).max(100),
			})
			.optional(),
		linkedin_url,
		position: z.string().min(2).max(100).openapi({ example: "head" }),
		member_type: z.string().min(2).max(100).openapi({ example: "technical" }),
		track: z
			.string()
			.min(2)
			.max(100)
			.optional()
			.openapi({ example: "back end" }), // Included track in payload
		boardYear,
	})
	.openapi("BoardMemberDTO");

export type AddBoardMember = z.infer<typeof addBoardMemberSchema>;
export type GetBoard = z.infer<typeof getBoardSchema>;
export type BoardId = z.infer<typeof boardIdSchema>;
export type UpdateBoardMember = z.infer<typeof updateBoardMemberSchema>;
export type BoardMemberDTO = z.infer<typeof boardMemberDTO>;
