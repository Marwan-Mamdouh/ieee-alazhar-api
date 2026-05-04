export const BOARD_POSITIONS = [
  "treasurer",
  "secretary",
  "head",
  "vice",
] as const;
export const MEMBER_TYPES = [
  "officer",
  "technical",
  "branding",
  "operation",
  "chair",
] as const;

export type BoardPosition = (typeof BOARD_POSITIONS)[number];
export type MemberType = (typeof MEMBER_TYPES)[number];
