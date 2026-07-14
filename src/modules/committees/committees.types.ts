import type { SanityImage } from '../../types/SanitySharedTypes.js';

export interface Committee {
	_id: string;
	name: string;
	type: string;
	description: string;
	logo: SanityImage;
}

// What the endpoint returns — committees grouped by their `type` field
export type GroupedCommittees = Record<string, Committee[]>;
