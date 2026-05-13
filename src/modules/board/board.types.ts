import type { BoardDocument } from "./model.js";
import type { ObjectId } from "mongoose";

export const OFFICER_POSITIONS = [
	"chair",
	"treasurer",
	"secretary",
	"vice technical",
	"vice branding",
] as const;
export const TECHNICAL_POSITIONS = ["head", "vice"] as const;

export const BOARD_POSITIONS = [
	...OFFICER_POSITIONS,
	...TECHNICAL_POSITIONS,
] as const;

export const BOARD_TYPES = [
	"officer",
	"technical",
	"branding",
	"operation",
] as const;

export const boardMembersProps =
	"_id name bio memberType boardYear position avatar linkedin_url" as const;

export type BoardPosition = (typeof BOARD_POSITIONS)[number];
export type MemberType = (typeof BOARD_TYPES)[number];
export type OfficerPosition = (typeof OFFICER_POSITIONS)[number];
export type TechnicalPosition = (typeof TECHNICAL_POSITIONS)[number];

export interface BoardMember {
	_id: string | ObjectId;
	name: string;
	bio: string;
	memberType: MemberType;
	boardYear: number;
	position: string;
	image_url: string;
	linkedin_url: string;
}

export const toMemberDTO = (member: BoardDocument | BoardMember) => {
	return {
		id: `${member._id}`,
		name: member.name,
		bio: member.bio,
		memberType: member.memberType,
		boardYear: member.boardYear,
		position: member.position,
		// image_url: member.avatar?.url,
		linkedin_url: member.linkedin_url,
	};
};
