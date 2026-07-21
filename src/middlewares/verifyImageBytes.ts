import { fileTypeFromBuffer } from "file-type";
import type { Request, Response, NextFunction } from "express";
import { ValidationError } from "../errors/app.error.js";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const verifyImageBytes = async (
  req: Request,
  _: Response,
  next: NextFunction,
) => {
  if (!req.file) return next(); // no file = nothing to check, route handles the absence

  const detected = await fileTypeFromBuffer(req.file.buffer);

  if (!detected || !ALLOWED_TYPES.has(detected.mime)) {
    return next(
      new ValidationError(
        `Invalid file. Only JPEG, PNG, and WebP are allowed.`,
      ),
    );
  }

  next();
};
