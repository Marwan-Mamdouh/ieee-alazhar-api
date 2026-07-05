import { sanityClient } from "../../config/sanity.js";
import { NotFoundError } from "../../errors/app.error.js";
import type { SanityEvent, SanityEventSummary } from "./events.types.js";

const eventsService = {
	getEvents: async (): Promise<SanityEventSummary[]> => {
		return sanityClient.fetch(`
      *[_type == "event"] | order(startDate desc) {
        _id, title, slug,
        startDate, endDate, location, subtitle,
        registrationLink, coverImage { asset -> { url } }
      }`);
	},

	getEventById: async (id: string): Promise<SanityEvent> => {
		const event: SanityEvent | null = await sanityClient.fetch(
			`*[_type == "event" && _id == $id][0] {
        _id, title, slug,
        speakers[] { name, title, photo { asset -> { url } } },
        memories[] { photo { asset -> { url } } },
        startDate, endDate, location, subtitle,
        registrationLink, coverImage { asset -> { url } }
      }`,
			{ id },
		);

		if (!event) throw new NotFoundError("Event not found");
		return event;
	},
};

export default eventsService;
