import { Document, model, Schema } from "mongoose";
import {
  BOARD_POSITIONS,
  BOARD_TYPES,
  ALLOWED_POSITIONS_BY_TYPE,
  ALLOWED_TRACKS_BY_TYPE,
  GENDERS,
  type BoardPosition,
  type MemberType,
  type BoardTrack,
  type Gender,
} from "./board.types.js";

const isValidTrack = (
  memberType: MemberType,
  track: BoardTrack | undefined,
): boolean => {
  if (memberType === "officer") return !track;
  const allowed = ALLOWED_TRACKS_BY_TYPE[memberType];
  return !!track && !!allowed && (allowed as readonly string[]).includes(track);
};

const isValidPosition = (
  memberType: MemberType,
  position: BoardPosition,
): boolean =>
  (ALLOWED_POSITIONS_BY_TYPE[memberType] as readonly string[]).includes(
    position,
  );

export interface BoardDocument extends Document {
  name: string;
  gender?: Gender;
  email: string;
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
    gender: { type: String, enum: GENDERS, required: false },
    email: { type: String, required: false },
    bio: { type: String, required: false },
    avatar: {
      url: { type: String, required: false },
      public_id: { type: String, required: false },
    },
    linkedin_url: { type: String, required: false },
    position: {
      type: String,
      enum: BOARD_POSITIONS,
      required: true,
      validate: {
        validator: function (this: any, position: BoardPosition) {
          return isValidPosition(this.memberType as MemberType, position);
        },
        message: (props: any) =>
          `${props.value} is not a valid position for this member type!`,
      },
    },
    memberType: { type: String, enum: BOARD_TYPES, required: true },
    track: {
      type: String,
      required: function (this: BoardDocument) {
        return this.memberType !== "officer";
      },
      validate: {
        validator: function (
          this: BoardDocument,
          track: BoardTrack | undefined,
        ) {
          return isValidTrack(this.memberType, track);
        },
        message: (props: any) =>
          `${props.value} is not a valid track for the selected member type!`,
      },
    },
    boardYear: { type: Number, required: true },
  },
  { timestamps: true },
);

// Index for the memberType query (since you'll be filtering by multiple types)
boardSchema.index({ boardYear: -1, memberType: 1, track: 1, position: 1 });

// For committee members: email + track + year must be unique
boardSchema.index(
  { email: 1, track: 1, boardYear: 1 },
  {
    unique: true,
    name: "unique_member_track_year",
    partialFilterExpression: { track: { $exists: true } },
  },
);

// For officers: email + position + year must be unique
// (an officer can't hold the same position twice in the same year)
boardSchema.index(
  { email: 1, position: 1, boardYear: 1 },
  {
    unique: true,
    name: "unique_officer_position_year",
    partialFilterExpression: { memberType: "officer" },
  },
);

// Enforce exactly one 'head' per track per year.
// All other positions ('vice', 'member') are ignored by this index.
boardSchema.index(
  { boardYear: 1, track: 1 },
  {
    unique: true,
    name: "unique_head_per_track_year",
    partialFilterExpression: {
      position: "head", // Replace "head" with your exact string from COMMITTEE_POSITIONS
      track: { $exists: true },
    },
  },
);

const Board = model<BoardDocument>("members", boardSchema);

export default Board;
