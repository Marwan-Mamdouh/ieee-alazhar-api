import type { Request, Response, NextFunction } from "express";
import { uploadLimiter, generalLimiter } from "../infra/ratelimit.js";
import { TooManyRequestsError } from "../errors/app.error.js";
import type { Ratelimit } from "@upstash/ratelimit";

const createRateLimitMiddleware = (limiter: Ratelimit) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.user?.id || req.ip;

    const { success, remaining, limit, reset } = await limiter.limit(
      identifier!,
    );

    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", new Date(reset).toISOString());

    if (!success) {
      return next(
        new TooManyRequestsError("Too many requests. Please try again later."),
      );
    }

    next();
  };
};

export const uploadRateLimitMiddleware =
  createRateLimitMiddleware(uploadLimiter);
export const generalRateLimitMiddleware =
  createRateLimitMiddleware(generalLimiter);
