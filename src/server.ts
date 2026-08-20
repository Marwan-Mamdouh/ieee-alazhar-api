import helmet from "helmet";
import compression from "compression";
import express, { json, type Response } from "express";
import { toNodeHandler } from "better-auth/node";
import { apiReference } from "@scalar/express-api-reference";

import env from "./config/env.js";
import connectDb from "./config/db.js";
import boardRouter from "./modules/board/board.router.js";
import feedbackRouter from "./modules/feedback/feedback.router.js";
import committeesRouter from "./modules/committees/committees.router.js";
import eventsRouter from "./modules/events/events.route.js";
import homeRouter from "./modules/home/home.router.js";
import formRouter from "./modules/forms/form/form.router.js";
import submissionRouter from "./modules/forms/submission/submission.router.js";
import corsMiddleware from "./middlewares/corsMiddleware.js";
import logger from "./middlewares/logger.js";
import auth from "./util/auth.js";
import { generateOpenAPIDocument } from "./docs/openapi.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { registerCacheListeners } from "./infra/cache/cache.listeners.js";
import sanityWebhookRouter from "./modules/webhooks/sanity.webhook.router.js";

process.on("uncaughtException", (err: Error) => {
  console.error(
    JSON.stringify({
      event: "process.uncaughtException",
      message: err.message,
      stack: err.stack,
    }),
  );
  process.exit(1);
});

process.on("unhandledRejection", (reason: unknown) => {
  console.error(
    JSON.stringify({
      event: "process.unhandledRejection",
      reason: `${reason}`,
    }),
  );
  process.exit(1);
});

const app = express();

await connectDb();

app.use(helmet());
app.use(corsMiddleware);
app.use(logger);
app.use(compression());
// Generate once at startup and cache it — don't regenerate on every request
const openApiDoc = await generateOpenAPIDocument();

// Serve the raw JSON spec (Scalar needs a URL to fetch from)
app.get("/openapi.json", (_, res) => res.json(openApiDoc));

// Serve the Scalar UI
app.use("/api/docs", apiReference({ content: openApiDoc }));

app.all("/api/auth/{*any}", toNodeHandler(auth));
app.use("/api/v1/webhooks/sanity", sanityWebhookRouter);

app.use(json({ type: "application/json" }));

registerCacheListeners();

app.get("/", (_, res: Response) => res.redirect("/api/docs"));

app.use("/api/v1/board", boardRouter);
app.use("/api/v1/feedback", feedbackRouter);
app.use("/api/v1/committees", committeesRouter);
app.use("/api/v1/events", eventsRouter);
app.use("/api/v1/home", homeRouter);
app.use("/api/v1/forms", formRouter);
app.use("/api/v1/forms", submissionRouter);

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
