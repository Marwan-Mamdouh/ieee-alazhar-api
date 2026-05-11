export const OFFICERPOSITIONS = [
  "chair",
  "treasurer",
  "secretary",
  "vice",
] as const;
export const TECHNICALPOSITIONS = ["head", "vice"] as const;

export const BOARD_POSITIONS = [...new Set([...OFFICERPOSITIONS, ...TECHNICALPOSITIONS])] as const;

export const BOARD_TYPES = [
  "officer",
  "technical",
  "branding",
  "operation",
] as const;

export type BoardPosition = (typeof BOARD_POSITIONS)[number];
export type MemberType = (typeof BOARD_TYPES)[number];
export type OfficerPosition = (typeof OFFICERPOSITIONS)[number];
export type TechnicalPosition = (typeof TECHNICALPOSITIONS)[number];

