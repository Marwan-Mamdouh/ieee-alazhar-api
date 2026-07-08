// src/middlewares/upload.middleware.ts
import { type Request } from "express";
import multer, { type FileFilterCallback } from "multer";
import { ValidationError } from "../errors/app.error.js";

const ALLOWED_MIME_TYPES = new Set<string>([
	"image/jpg",
	"image/jpeg",
	"image/png",
	"image/webp",
]);

const MAX_SIZE_MB = 10;

const fileFilter = (
	_: Request,
	file: Express.Multer.File,
	cb: FileFilterCallback,
) => {
	if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
		cb(null, true);
	} else {
		cb(new ValidationError(`Unsupported file type: ${file.mimetype}`));
	}
};

const multerUpload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: MAX_SIZE_MB * 1024 * 1024, files: 1 },
	fileFilter,
});

export default multerUpload;
