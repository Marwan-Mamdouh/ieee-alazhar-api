import type { UploadApiResponse } from "cloudinary";
import cloudinary from "../../config/cloudinary.js";
import { AppError } from "../../errors/app.error.js";

const UploadService = {
  async uploadImage(
    buffer: Buffer,
    folder: string,
    options?: { transformation?: object },
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, ...options?.transformation },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!);
        },
      );
      stream.end(buffer);
    });
  },

  async deleteImage(publicId: string): Promise<void> {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result !== "ok" && result.result !== "not found") {
      throw new AppError(`Failed to delete image: ${publicId}`);
    }
  },
};

export default UploadService;
