import type { NextFunction, Response } from "express";
import type { z } from "zod";

import type { TypedRequest } from "../types/TypedRequest.js";

export const validate =
  <T>(schema: z.ZodType<T>, key: "body" | "query" | "params" = "body") =>
  (req: TypedRequest<T>, _: Response, next: NextFunction) => {
    let result = schema.safeParse(req[key]);

    if (!result.success) return next(result.error);

    req.validatedData = result.data;
    next();
  };
