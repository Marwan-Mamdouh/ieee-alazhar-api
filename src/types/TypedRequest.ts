import { type Request } from "express";

export interface TypedRequest<
	TBody = unknown,
	TParams = unknown,
	TQuery = unknown,
> extends Request {
	validatedBody?: TBody;
	validatedParams?: TParams;
	validatedQuery?: TQuery;
}
