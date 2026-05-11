// src/errors/normalizeError.ts
import { ZodError } from "zod";
import { MongoServerError } from "mongodb";
import { Error as MongooseError } from "mongoose";

import { AppError, ValidationError, ConflictError } from "./app.error.js";

export function normalizeError(err: unknown): AppError {
  // Already your own — pass through
  if (err instanceof AppError) {
    return err;
  }

  // Zod validation failure
  if (err instanceof ZodError) {
    const message = err.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    return new ValidationError(message);
  }

  // Mongoose validation error (model-level .validate())
  if (err instanceof MongooseError.ValidationError) {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    return new ValidationError(message);
  }

  // Mongoose cast error — e.g. invalid ObjectId
  if (err instanceof MongooseError.CastError) {
    return new ValidationError(`Invalid value for field: ${err.path}`);
  }

  // MongoDB duplicate key (unique constraint)
  if (err instanceof MongoServerError && err.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0] ?? "field";
    return new ConflictError(`${field} already exists`);
  }

  // Native JS errors (TypeError, ReferenceError, etc.) — these are bugs
  if (err instanceof Error) {
    return new AppError(err.message, 500, false); // isOperational: false = bug
  }

  // Truly unknown — string thrown, object thrown, whatever
  return new AppError("An unexpected error occurred", 500, false);
}
