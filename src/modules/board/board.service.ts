import type { MemberType } from "./board.types.js";
import Board from "./model.js";
import type { AddBoardMember } from "./board.schema.js";

const boardService = {
  getBoard: async (positions: MemberType[], year: number) => {
    const members = await Board.find({
      boardYear: year,
      memberType: { $in: positions }, // <--- This matches any value in the array
    })
      .sort({ memberType: 1, _id: 1 })
      .lean()
      .exec();
    return members.map(memberDTO);
  },

  addMember: async (member: AddBoardMember) => {
    const newMember = await new Board(member).save();
    return memberDTO(newMember);
  },
};

const memberDTO = (member: AddBoardMember) => {
  return {
    name: member.name,
    bio: member.bio,
    memberType: member.memberType,
    boardYear: member.boardYear,
    position: member.position,
    image_url: member.image_url,
    linkedin_url: member.linkedin_url,
  };
};

export default boardService;
