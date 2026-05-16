import type { BoardMember } from "./board.types.js";
import type { BoardDocument } from "./model.js";

export const toMemberDTO = (member: BoardDocument | BoardMember) => {
	return {
		id: `${member._id}`,
		name: member.name,
		bio: member.bio,
		memberType: member.memberType,
		boardYear: member.boardYear,
		position: member.position,
		track: member.track,
		// image_url: member.avatar?.url,
		linkedin_url: member.linkedin_url,
	};
};
