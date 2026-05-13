import helmet from "helmet";
import compression from "compression";
import express, { json, type Response } from "express";
import { toNodeHandler } from "better-auth/node";
import { apiReference } from "@scalar/express-api-reference";

import env from "./config/env.js";
import connectDb from "./config/db.js";
import boardRouter from "./modules/board/board.router.js";
import corsMiddleware from "./middlewares/corsMiddleware.js";
import logger from "./middlewares/logger.js";
import getAuth from "./util/auth.js";
import { generateOpenAPIDocument } from "./docs/openapi.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

const { mongoClient } = await connectDb();
const auth = getAuth(mongoClient);

app.use(logger);
// Generate once at startup and cache it — don't regenerate on every request
const openApiDoc = await generateOpenAPIDocument();

// Serve the raw JSON spec (Scalar needs a URL to fetch from)
app.get("/openapi.json", (_, res) => {
	res.json(openApiDoc);
});

// Serve the Scalar UI
app.use(
	"/api/docs",
	apiReference({
		content: openApiDoc,
		// theme: 'purple', // optional: 'alternate' | 'default' | 'moon' | 'purple' | 'solarized'
	}),
);

app.use(helmet());
app.use(compression());
app.use(corsMiddleware);

app.all(
	"/api/auth/{*any}",
	(_, __, next) => {
		console.log("Auth endpoint called");
		next();
	},
	toNodeHandler(auth),
);
app.use(json({ type: "application/json" }));

app.use("/api/v1/board", boardRouter);

app.get("/", (_, res: Response) => {
	res.json({ status: "ok", message: "API is running ✅" });
});
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
