import { z } from "zod";
import {
  BOARD_POSITIONS,
  BOARD_TYPES,
  OFFICERPOSITIONS,
  TECHNICALPOSITIONS,
} from "./board.types.js";

const boardMemberSchema = z.discriminatedUnion("memberType", [
  // Branch 1: If memberType is "officer"
  z.object({
    memberType: z.literal("officer"),
    position: z.enum(OFFICERPOSITIONS),
  }),
  // Branch 2: If memberType is anything else
  z.object({
    memberType: z.enum(["technical", "branding", "operation"]),
    position: z.enum(TECHNICALPOSITIONS),
  }),
]);

export const addBoardMemberSchema = z
  .object({
    name: z.string(),
    bio: z.string().optional(),
    image_url: z.string().optional(),
    linkedin_url: z.string().optional(),
    boardYear: z
      .string()
      .optional()
      .transform(Number)
      .pipe(z.number().int().min(2017, "page must be >= 2017"))
      .default(new Date().getFullYear()),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
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

export type AddBoardMember = z.infer<typeof addBoardMemberSchema>;
export type GetBoard = z.infer<typeof getBoardSchema>;
