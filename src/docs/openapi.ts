// src/docs/openapi.ts
import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registry } from "../util/registry.js";

// Import each docs file — the side effects (registerPath calls) run on import
import "../modules/board/board.docs.js";

export function generateOpenAPIDocument() {
	const generator = new OpenApiGeneratorV3(registry.definitions);

	return generator.generateDocument({
		openapi: "3.0.0",
		info: { title: "IEEE Board API", version: "1.0.0" },
		servers: [{ url: "/api" }],
	});
}
