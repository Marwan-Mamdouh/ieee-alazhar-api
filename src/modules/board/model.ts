import mongoose, { Document, model, Schema } from "mongoose";
import {
  BOARD_POSITIONS,
  MEMBER_TYPES,
  type BoardPosition,
  type MemberType,
} from "./board.types.js";

export interface BoardDocument extends Document {
  name: string;
  bio: string;
  image_url: string;
  linkedin_url: string;
  position: BoardPosition;
  memberType: MemberType;
  boardYear: number;
  createdAt: Date;
  updatedAt: Date;
}

const boardSchema = new Schema<BoardDocument>(
  {
    name: { type: String, required: true },
    bio: { type: String, required: true },
    image_url: { type: String, required: false },
    linkedin_url: { type: String, required: false },
    position: { type: String, enum: BOARD_POSITIONS, required: true },
    memberType: { type: String, enum: MEMBER_TYPES, required: true },
    boardYear: { type: Number, required: true },
  },
  { timestamps: true },
);

// id, name, position, image_url AS image, bio, linkedin_url AS linkedin, board_type, year
// - position	- Enum [treasurer - secretary - head - vice]
// - member_type	- Enum [officer -  technical - branding - operation - chair]
//
// Index for the memberType query (since you'll be filtering by multiple types)
boardSchema.index({ boardYear: -1, memberType: 1 });

const Board = model<BoardDocument>("members", boardSchema);

export default Board;
