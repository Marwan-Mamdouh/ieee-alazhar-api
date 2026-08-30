import type { BoardMember } from "./board.types.js";
import type { BoardDocument } from "./board.model.js";

export const toMemberDTO = (member: BoardDocument | BoardMember) => {
	return {
		id: `${member._id}`,
		name: member.name,
		bio: member.bio,
		email: member.email,
		gender: member.gender,
		memberType: member.memberType,
		boardYear: member.boardYear,
		position: member.position,
		track: member.track,
    image_url: member.avatar?.url,
		image_public_id: member.avatar?.public_id,
		linkedin_url: member.linkedin_url,
	};
};
