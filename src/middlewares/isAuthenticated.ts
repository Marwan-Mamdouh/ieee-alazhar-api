import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import auth from "../util/auth.js";

export const isAuthenticated = async (
	req: Request,
	_: Response,
	next: NextFunction,
) => {
	const session = await auth.api.getSession({
		headers: fromNodeHeaders(req.headers),
	});

	if (!session) return next(new Error("Unauthorized"));

	req.user = session?.user;
	next();
};
