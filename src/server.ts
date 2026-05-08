import dotenv from "dotenv";
import compression from "compression";
import express, { json, type Response } from "express";
import helmet from "helmet";
import dbConnection from "./config/db.js";
import boardRouter from "./modules/board/board.router.js";
import corsMiddleware from "./middlewares/corsMiddleware.js";
import logger from "./middlewares/logger.js";
import { errorHandler } from "./middlewares/error.js";

dotenv.config();
dbConnection();
const app = express();

app.use(logger);
app.use(compression());
app.use(helmet());
app.use(json({ type: "application/json" }));
app.use(corsMiddleware);

app.use("/api/board", boardRouter);

app.get("/", (_, res: Response) => {
  res.json({ status: "ok", message: "API is running ✅" });
});
app.use((_, res: Response) => {
  res.status(404).json({ message: "Endpoint not found." });
});

app.use(errorHandler);

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT ?? 8080;
  app.listen(+PORT, () => console.log(`✅ Server running on port ${PORT}`));
}

export default app;
