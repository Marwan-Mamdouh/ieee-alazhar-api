import dotenv from "dotenv";
import compression from "compression";
import express, { json, type Response } from "express";
import helmet from "helmet";
import { toNodeHandler } from "better-auth/node";

import connectDb from "./config/db.js";
import boardRouter from "./modules/board/board.router.js";
import corsMiddleware from "./middlewares/corsMiddleware.js";
import logger from "./middlewares/logger.js";
import { errorHandler } from "./middlewares/error.js";
import getAuth from "./util/auth.js";

dotenv.config();
const app = express();

const { mongoClient } = await connectDb();
const auth = getAuth(mongoClient);

app.use(logger);
app.all("/api/auth/{*any}", toNodeHandler(auth));
app.use(compression());
app.use(helmet());
app.use(json({ type: "application/json" }));
app.use(corsMiddleware);
app.use(express.json());

app.use("/api/board", boardRouter);

app.get("/", (_, res: Response) => {
	res.json({ status: "ok", message: "API is running ✅" });
});
app.use((_, res: Response) => {
	res.status(404).json({ message: "Endpoint not found." });
});

app.use(errorHandler);

const bootstrap = async () => {
	if (process.env.NODE_ENV !== "production") {
		const PORT = process.env.PORT ?? 8080;
		app.listen(+PORT, () => console.log(`✅ Server running on port ${PORT}`));
	}
};

bootstrap();

export default app;
