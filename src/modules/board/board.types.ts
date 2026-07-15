import type { ObjectId } from "mongoose";

export const GENDERS = ["male", "female"] as const;

export const OFFICER_POSITIONS = [
  "chair",
  "vice technical",
  "vice branding",
  "secretary",
  "treasurer",
] as const;
export const COMMITTEE_POSITIONS = ["head", "vice"] as const;

export const BOARD_POSITIONS = [
  ...OFFICER_POSITIONS,
  ...COMMITTEE_POSITIONS,
] as const;

export const BOARD_TYPES = [
  "officer",
  "technical",
  "branding",
  "operation",
] as const;

export const TECHNICAL_TRACKS = [
  "advanced programming",
  "ai",
  "back end",
  "c language",
  "cloud & devops",
  "cyber security",
  "data science",
  "embedded systems",
  "front end",
  "flutter",
  "java",
  "network",
  "power distribution",
  "problem solving",
  "python",
  "robotics",
  "scientific research",
  "software testing",
  "ui/ux",
] as const;

export const BRANDING_TRACKS = [
  "graphic design",
  "video editing",
  "social media marketing",
  "photography",
] as const;

export const OPERATION_TRACKS = [
  "pr&fr",
  "logistic",
  "hr",
  "operation management",
] as const;

export const ALL_TRACKS = [
  ...TECHNICAL_TRACKS,
  ...BRANDING_TRACKS,
  ...OPERATION_TRACKS,
] as const;

export const ALLOWED_POSITIONS_BY_TYPE: Record<
  MemberType,
  readonly BoardPosition[]
> = {
  officer: OFFICER_POSITIONS,
  technical: COMMITTEE_POSITIONS,
  branding: COMMITTEE_POSITIONS,
  operation: COMMITTEE_POSITIONS,
};

export const ALLOWED_TRACKS_BY_TYPE: Partial<
  Record<MemberType, readonly BoardTrack[]>
> = {
  technical: TECHNICAL_TRACKS,
  branding: BRANDING_TRACKS,
  operation: OPERATION_TRACKS,
};

export const TECHNICAL_TRACK_GROUPS = {
  "cs-fundamentals": [
    "c language",
    "python",
    "java",
    "problem solving",
    "advanced programming",
  ],
  "software-development": ["front end", "back end", "ui/ux", "flutter"],
  "systems-and-data": [
    "ai",
    "data science",
    "cloud & devops",
    "software testing",
    "cyber security",
    "network",
  ],
  engineering: [
    "embedded systems",
    "robotics",
    "power distribution",
    "scientific research",
  ],
} as const;

export type TechnicalTrackGroup = keyof typeof TECHNICAL_TRACK_GROUPS;

type _AllGroupedTracks =
  (typeof TECHNICAL_TRACK_GROUPS)[TechnicalTrackGroup][number];

type _AssertAllTracksGrouped =
  Exclude<(typeof TECHNICAL_TRACKS)[number], _AllGroupedTracks> extends never
    ? true
    : never;

// Compile error if any technical track is missing from TECHNICAL_TRACK_GROUPS
const _exhaustiveTrackCheck: _AssertAllTracksGrouped = true;

export const boardMembersProps =
  "_id name email bio gender memberType boardYear position track avatar linkedin_url" as const;

export type Gender = (typeof GENDERS)[number];
export type BoardPosition = (typeof BOARD_POSITIONS)[number];
export type MemberType = (typeof BOARD_TYPES)[number];
export type OfficerPosition = (typeof OFFICER_POSITIONS)[number];

export type BoardTrack = (typeof ALL_TRACKS)[number];

export interface BoardMember {
  _id: string | ObjectId;
  bio: string;
  name: string;
  email: string;
  gender: Gender;
  boardYear: number;
  track?: BoardTrack;
  linkedin_url: string;
  memberType: MemberType;
  position: BoardPosition;
  avatar?: { url: string; public_id: string };
}
