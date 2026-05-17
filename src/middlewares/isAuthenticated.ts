import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";

import auth from "../util/auth.js";
import { UnauthorizedError } from "../errors/app.error.js";

export const isAuthenticated = async (
	req: Request,
	_: Response,
	next: NextFunction,
) => {
	const session = await auth.api.getSession({
		headers: fromNodeHeaders(req.headers),
	});

	if (!session)
		return next(new UnauthorizedError("invalid or expired session"));

	req.user = session?.user;
	next();
};
