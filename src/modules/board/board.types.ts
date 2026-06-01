import type { ObjectId } from "mongoose";

export const OFFICER_POSITIONS = [
	"chair",
	"treasurer",
	"secretary",
	"vice technical",
	"vice branding",
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
	"c",
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
	"ui/ux",
] as const;

export const BRANDING_TRACKS = [
	"graphic design",
	"video editing",
	"social media marketing",
	"photography",
] as const;

export const OPERATION_TRACKS = ["pr", "logistic", "hr"] as const;

export const ALL_TRACKS = [
	...TECHNICAL_TRACKS,
	...BRANDING_TRACKS,
	...OPERATION_TRACKS,
] as const;

export const boardMembersProps =
	"_id name bio memberType boardYear position track avatar linkedin_url" as const;

export type BoardPosition = (typeof BOARD_POSITIONS)[number];
export type MemberType = (typeof BOARD_TYPES)[number];
export type OfficerPosition = (typeof OFFICER_POSITIONS)[number];
export type CommitteePosition = (typeof COMMITTEE_POSITIONS)[number];

export type TechnicalTrack = (typeof TECHNICAL_TRACKS)[number];
export type BrandingTrack = (typeof BRANDING_TRACKS)[number];
export type OperationTrack = (typeof OPERATION_TRACKS)[number];
export type BoardTrack = (typeof ALL_TRACKS)[number];

export interface BoardMember {
	_id: string | ObjectId;
	name: string;
	bio: string;
	memberType: MemberType;
	boardYear: number;
	position: BoardPosition;
	track?: BoardTrack;
	avatar: { url: string; public_id: string };
	linkedin_url: string;
}
