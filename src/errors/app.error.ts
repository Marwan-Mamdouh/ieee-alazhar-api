// src/errors/AppError.ts

export class AppError extends Error {
	public readonly statusCode: number;
	public readonly isOperational: boolean; // operational = expected, programmer = bug

	constructor(message: string, statusCode: number = 500, isOperational = true) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = isOperational;
		Object.setPrototypeOf(this, new.target.prototype); // fixes instanceof checks
		Error.captureStackTrace(this); // cleaner stack traces in Node
	}
}

// Specific subtypes
export class ValidationError extends AppError {
	constructor(message: string) {
		super(message, 400);
	}
}

export class UnauthorizedError extends AppError {
	constructor(message = "Unauthorized") {
		super(message, 401);
	}
}

export class ForbiddenError extends AppError {
	constructor(message = "Forbidden") {
		super(message, 403);
	}
}

export class NotFoundError extends AppError {
	constructor(resource = "Resource") {
		super(`${resource} not found`, 404);
	}
}

export class ConflictError extends AppError {
	constructor(message: string) {
		super(message, 409);
	}
}

export class GoneError extends AppError {
	constructor(message: string) {
		super(message, 410);
	}
}

export class UnprocessableEntityError extends AppError {
	constructor(message: string) {
		super(message, 422);
	}
}

export class TooManyRequestsError extends AppError {
	constructor(message = "Too many requests") {
		super(message, 429);
	}
}
