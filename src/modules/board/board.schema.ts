import { positive, z } from "zod";
import { BOARD_POSITIONS, MEMBER_TYPES } from "./board.types.js";

export const addBoardMemberSchema = z.object({
  name: z.string(),
  bio: z.string(),
  image_url: z.string().optional(),
  linkedin_url: z.string().optional(),
  position: z
    .string()
    .transform((val) => val.trim().toLowerCase())
    .pipe(z.enum(BOARD_POSITIONS)),
  memberType: z.enum(MEMBER_TYPES),
  boardYear: z
    .string()
    .optional()
    .default("1")
    .transform(Number)
    .pipe(z.number().int().min(1, "page must be >= 1")),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

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
    .pipe(z.array(z.enum(MEMBER_TYPES))),
});

export type AddBoardMember = z.infer<typeof addBoardMemberSchema>;
export type GetBoard = z.infer<typeof getBoardSchema>;
