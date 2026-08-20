// src/docs/openapi.ts
import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";

import { registry } from "../util/registry.js";
import "../modules/board/board.docs.js";
import "../modules/feedback/feedback.docs.js";
import "../modules/committees/committees.docs.js";
import "../modules/events/events.docs.js";
import "../modules/home/home.docs.js";
import "../modules/forms/form/form.docs.js";
import "../modules/forms/submission/submission.docs.js";
import auth from "../util/auth.js";

export const generateOpenAPIDocument = async () => {
	const generator = new OpenApiGeneratorV3(registry.definitions);

	const mySpec = generator.generateDocument({
		openapi: "3.0.0",
		info: { title: "IEEE Board API", version: "1.0.0" },
		servers: [{ url: "/api" }],
	});

	const authSpec = await auth.api.generateOpenAPISchema();

	// Merge paths and components manually
	return {
		...mySpec,
		paths: {
			...mySpec.paths,
			// prefix every auth path with /api/auth
			...Object.fromEntries(
				Object.entries(authSpec.paths ?? {}).map(([path, val]) => [
					`/api/auth${path}`,
					// Add "Auth" tag to every HTTP method on every path
					Object.fromEntries(
						Object.entries(val as object).map(([method, operation]) => [
							method,
							{ ...(operation as object), tags: ["Auth"] },
						]),
					),
				]),
			),
		},
		components: {
			schemas: {
				...mySpec.components?.schemas,
				...authSpec.components?.schemas,
			},
		},
	};
};
