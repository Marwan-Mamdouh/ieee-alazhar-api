import cors from "cors";
import type { NextFunction, Request, Response } from "express";
import { ForbiddenError } from "../errors/app.error.js";

const allowedOrigins = new Set([
  "https://ieee-website-phi.vercel.app",
  "https://ieee-website-steel.vercel.app",
  "http://localhost:5173",
  // "http://localhost:4173",
]);

const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const sameOrigin = new URL(origin).host === req.get("host");
      if (sameOrigin || allowedOrigins.has(origin)) return cb(null, true);
      return cb(new ForbiddenError("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })(req, res, next);
};

export default corsMiddleware;
