import { z } from "zod";
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
    .pipe(z.enum(roles));
};

const boardMemberSchema = z.discriminatedUnion("memberType", [
  // Branch 1: If memberType is "officer"
  z.object({
    memberType: z.literal("officer"),
    position: validateMembersRoles(OFFICER_POSITIONS),
  }),
  // Branch 2: If memberType is anything else
  z.object({
    memberType: z.enum(["technical", "branding", "operation"]),
    position: validateMembersRoles(TECHNICAL_POSITIONS),
  }),
]);

export const addBoardMemberSchema = z
  .object({
    name: z.string(),
    bio: z.string().optional(),
    linkedin_url: z.url().optional(),
    boardYear: z
      .string()
      .optional()
      .transform(Number)
      .pipe(z.number().int().min(2017, "page must be >= 2017"))
      .default(new Date().getFullYear()),
    createdAt: z.date().optional(),
  })
  .and(boardMemberSchema);

export const getBoardSchema = z.object({
  boardYear: z
    .string()
    .optional()
    .transform(Number)
    .pipe(z.number().int().min(2017, "page must be >= 2017"))
    .default(new Date().getFullYear()),
  position: z
    .string()
    .transform((val) => val.split(","))
    .pipe(z.array(z.enum(BOARD_POSITIONS)))
    .optional(),
  memberType: z
    .string()
    .transform((val) => val.split(","))
    .pipe(z.array(z.enum(BOARD_TYPES))),
});

export const boardIdSchema = z.object({
  boardId: z.string(),
});

export const updateBoardMemberSchema = z.object({
  name: z.string().optional(),
  bio: z.string().optional(),
  linkedin_url: z.url().optional(),
  boardYear: z
    .string()
    .optional()
    .transform(Number)
    .pipe(z.number().int().min(2017, "page must be >= 2017"))
    .default(new Date().getFullYear()),
  position: z
    .string()
    .transform((val) => val.split(","))
    .pipe(z.array(z.enum(BOARD_POSITIONS)))
    .optional(),
  memberType: z
    .string()
    .transform((val) => val.split(","))
    .pipe(z.array(z.enum(BOARD_TYPES)))
    .optional(),
  updatedAt: z.date().optional(),
});

export type AddBoardMember = z.infer<typeof addBoardMemberSchema>;
export type GetBoard = z.infer<typeof getBoardSchema>;
export type BoardId = z.infer<typeof boardIdSchema>;
export type UpdateBoardMember = z.infer<typeof updateBoardMemberSchema>;
