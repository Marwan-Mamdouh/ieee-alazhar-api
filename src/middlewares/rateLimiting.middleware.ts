import type { Request, Response, NextFunction } from "express";
import uploadLimiter from "../infra/ratelimit.js";
import { TooManyRequestsError } from "../errors/app.error.js";

export const rateLimitMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	// Use userId if authenticated, fall back to IP
	const identifier = req.user?.id || req.ip;

	const { success, remaining, limit, reset } = await uploadLimiter.limit(
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
