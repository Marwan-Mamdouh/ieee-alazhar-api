import type { Request, Response, NextFunction } from "express";
import { normalizeError } from "../errors/normalizeError.js";
import env from "../config/env.js";

const isDev = env.NODE_ENV === "development";

export function errorHandler(
  err: Error,
  _: Request,
  res: Response,
  __: NextFunction,
): void {
  const appError = normalizeError(err);

  // Log non-operational errors loudly — these are bugs
  if (!appError.isOperational) {
    console.error("[UNHANDLED ERROR]", appError);
    // should be sent to: send to Sentry, Datadog, whatever in production
  }

  res.status(appError.statusCode).json({
    success: false,
    message: appError.message,
    ...(isDev && { stack: appError.stack }), // only expose stack in dev
  });
}
