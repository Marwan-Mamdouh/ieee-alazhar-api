interface SanityImage {
	asset: { url: string };
}

interface Speaker {
	name: string;
	title: string;
	photo?: SanityImage;
}

/**
 * Shape returned by GET /events (list query).
 * Intentionally omits `speakers` and `memories` — those are only
 * fetched in the detail query to keep the list payload small.
 */
export interface SanityEventSummary {
	_id: string;
	title: string;
	slug: { current: string };
	startDate: string;
	endDate: string;
	location?: string;
	subtitle?: string;
	registrationLink?: string;
	coverImage?: SanityImage;
}

/**
 * Shape returned by GET /events/:id (detail query).
 * Extends SanityEventSummary with the heavy fields that are
 * only fetched when viewing a single event.
 */
export interface SanityEvent extends SanityEventSummary {
	speakers?: Speaker[];
	memories?: Array<{ photo: SanityImage }>;
}
