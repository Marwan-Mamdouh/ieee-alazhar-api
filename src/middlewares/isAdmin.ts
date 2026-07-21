import type { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../errors/app.error.js";

export const isAdmin = (req: Request, _: Response, next: NextFunction) => {
  if (req.user?.role !== "admin") {
    return next(new ForbiddenError("Admin access required"));
  }
  next();
};
