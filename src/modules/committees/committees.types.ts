import type { SanityImage } from "../../types/SanitySharedTypes.js";
import type { MemberType } from "../board/board.types.js";
import type { TechnicalTrackGroup } from "../../types/shared.types.js";

export type CommitteeMemberType = Exclude<MemberType, "officer">;

export interface Committee {
  _id: string;
  name: string;
  type: string;
  description: string;
  logo: SanityImage;
}

export type TechnicalGroupedCommittees = Record<
  TechnicalTrackGroup,
  Committee[]
>;

export type GroupedCommittees = {
  technical: TechnicalGroupedCommittees;
  branding: Committee[];
  operation: Committee[];
};
