interface CommitteeImage {
	asset: { url: string };
}

export interface Committee {
	_id: string;
	name: string;
	type: string;
	description: string;
	logo: CommitteeImage;
}

// What the endpoint returns — committees grouped by their `type` field
export type GroupedCommittees = Record<string, Committee[]>;
