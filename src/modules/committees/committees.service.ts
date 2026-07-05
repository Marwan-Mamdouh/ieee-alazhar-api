import { sanityClient } from "../../config/sanity.js";
import type { Committee, GroupedCommittees } from "./committees.types.js";

const committeesService = {
	getCommittees: async (): Promise<GroupedCommittees> => {
		const query = `*[_type == "committee"] {
      _id, name, type, description, logo { asset -> { url } }
    }`;

		const result: Committee[] = await sanityClient.fetch(query);

		return result.reduce((acc, committee) => {
			(acc[committee.type] ??= []).push(committee);
			return acc;
		}, {} as GroupedCommittees);
	},
};

export default committeesService;
