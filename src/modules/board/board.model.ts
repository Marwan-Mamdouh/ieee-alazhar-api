import { Document, model, Schema } from "mongoose";
import {
	BOARD_POSITIONS,
	BOARD_TYPES,
	OFFICER_POSITIONS,
	COMMITTEE_POSITIONS,
	TECHNICAL_TRACKS,
	BRANDING_TRACKS,
	OPERATION_TRACKS,
	type BoardPosition,
	type MemberType,
	type BoardTrack,
} from "./board.types.js";

// immutable validation strategy map
const TRACK_VALIDATORS: Record<
	MemberType,
	(track: BoardTrack | undefined) => boolean
> = {
	officer: (track) => !track, // Officers must not have a track
	technical: (track) =>
		!!track && (TECHNICAL_TRACKS as ReadonlyArray<string>).includes(track),
	branding: (track) =>
		!!track && (BRANDING_TRACKS as ReadonlyArray<string>).includes(track),
	operation: (track) =>
		!!track && (OPERATION_TRACKS as ReadonlyArray<string>).includes(track),
};

// You can do the exact same thing for positions to clean up that field too
const POSITION_VALIDATORS: Record<
	MemberType,
	(position: BoardPosition) => boolean
> = {
	officer: (pos) => (OFFICER_POSITIONS as ReadonlyArray<string>).includes(pos),
	technical: (pos) =>
		(COMMITTEE_POSITIONS as ReadonlyArray<string>).includes(pos),
	branding: (pos) =>
		(COMMITTEE_POSITIONS as ReadonlyArray<string>).includes(pos),
	operation: (pos) =>
		(COMMITTEE_POSITIONS as ReadonlyArray<string>).includes(pos),
};

export interface BoardDocument extends Document {
	name: string;
	bio: string;
	avatar?: { url: string; public_id: string };
	linkedin_url: string;
	position: BoardPosition;
	memberType: MemberType;
	track?: BoardTrack;
	boardYear: number;
	createdAt: Date;
	updatedAt: Date;
}

const boardSchema = new Schema<BoardDocument>(
	{
		name: { type: String, required: true },
		bio: { type: String, required: false },
		avatar: {
			url: { type: String, required: false, default: "" },
			public_id: { type: String, required: false, default: "" },
		},
		linkedin_url: { type: String, required: false },
		position: {
			type: String,
			enum: BOARD_POSITIONS,
			required: true,
			validate: {
				// Zero if statements: Uses the position strategy map
				validator: function (this: any, position: BoardPosition) {
					return (
						POSITION_VALIDATORS[this.memberType as MemberType]?.(position) ??
						false
					);
				},
				message: (props: any) =>
					`${props.value} is not a valid position for this member type!`,
			},
		},
		memberType: { type: String, enum: BOARD_TYPES, required: true },
		track: {
			type: String,
			required: function (this: any) {
				return this.memberType !== "officer";
			},
			validate: {
				// Zero if statements: Uses the track strategy map
				validator: function (this: any, track: BoardTrack | undefined) {
					return (
						TRACK_VALIDATORS[this.memberType as MemberType]?.(track) ?? false
					);
				},
				message: (props: any) =>
					`${props.value} is not a valid track for the selected member type!`,
			},
		},
		boardYear: { type: Number, required: true },
	},
	{ timestamps: true },
);

// id, name, position, image_url AS image, bio, linkedin_url AS linkedin, board_type, year
// - member_type	- Enum [officer -  technical - branding - operation]
// - position	- Enum for member type officer [treasurer - secretary - vice]
// - position	- Enum for any other member type [head - vice]
//
// Index for the memberType query (since you'll be filtering by multiple types)
boardSchema.index({ boardYear: -1, memberType: 1, track: 1 });

const Board = model<BoardDocument>("members", boardSchema);

export default Board;
