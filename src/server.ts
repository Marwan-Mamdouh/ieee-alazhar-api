import helmet from "helmet";
import compression from "compression";
import express, { json, type Response, static as serveStatic } from "express";
import { toNodeHandler } from "better-auth/node";
import { apiReference } from "@scalar/express-api-reference";

import env from "./config/env.js";
import connectDb from "./config/db.js";
import boardRouter from "./modules/board/board.router.js";
import feedbackRouter from "./modules/feedback/feedback.router.js";
import committeesRouter from "./modules/committees/committees.route.js";
import eventsRouter from "./modules/events/events.route.js";
import corsMiddleware from "./middlewares/corsMiddleware.js";
import logger from "./middlewares/logger.js";
import auth from "./util/auth.js";
import { generateOpenAPIDocument } from "./docs/openapi.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { registerCacheListeners } from "./infra/cache/cache.listeners.js";

const app = express();

await connectDb();

app.use(logger);
// Generate once at startup and cache it — don't regenerate on every request
const openApiDoc = await generateOpenAPIDocument();

// Serve the raw JSON spec (Scalar needs a URL to fetch from)
app.get("/openapi.json", (_, res) => {
	res.json(openApiDoc);
});

if (env.NODE_ENV !== "production") {
	app.use(serveStatic('public'))
}

// Serve the Scalar UI
app.use(
	"/api/docs",
	apiReference({
    // content: openApiDoc,
    url: '/openapi.json',
    favicon: '/favicon.ico',
    cdn: 'https://cdn.jsdelivr.net/npm/@scalar/api-reference',
		// theme: 'purple', // optional: 'alternate' | 'default' | 'moon' | 'purple' | 'solarized'
	}),
);

app.use(helmet());
app.use(compression());
app.use(corsMiddleware);

app.all("/api/auth/{*any}", toNodeHandler(auth));
app.use(json({ type: "application/json" }));

registerCacheListeners();

app.get("/", (_, res: Response) => res.redirect("/api/docs"));

app.use("/api/v1/board", boardRouter);
app.use("/api/v1/feedback", feedbackRouter);
app.use("/api/v1/committees", committeesRouter);
app.use("/api/v1/events", eventsRouter);

app.use((_, res: Response) => {
	res.status(404).json({ message: "Endpoint not found." });
});

app.use(errorHandler);

const bootstrap = async () => {
	if (env.NODE_ENV !== "production") {
		const PORT = env.PORT ?? 8080;
    app.listen(+PORT, () => console.log(`✅ Server running on port ${PORT}`));
	}
};

bootstrap();

export default app;
