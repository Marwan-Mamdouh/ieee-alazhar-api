import { Document, model, Schema } from "mongoose";
import {
  BOARD_POSITIONS,
  BOARD_TYPES,
  OFFICERPOSITIONS,
  TECHNICALPOSITIONS,
  type BoardPosition,
  type MemberType,
  type OfficerPosition,
  type TechnicalPosition,
} from "./board.types.js";

export interface BoardDocument extends Document {
  name: string;
  bio: string;
  avatar?: { url: string; public_id: string };
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
        validator: function (
          this: any,
          position: OfficerPosition | TechnicalPosition,
        ) {
          // 'this' refers to the document being saved
          if (this.memberType === "officer") {
            return (OFFICERPOSITIONS as ReadonlyArray<string>).includes(
              position,
            );
          } else {
            return (TECHNICALPOSITIONS as ReadonlyArray<string>).includes(
              position,
            );
          }
        },
        message: (props: any) =>
          `${props.value} is not a valid position for this member type!`,
      },
    },
    memberType: { type: String, enum: BOARD_TYPES, required: true },
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
boardSchema.index({ boardYear: -1, memberType: 1 });

const Board = model<BoardDocument>("members", boardSchema);

export default Board;
