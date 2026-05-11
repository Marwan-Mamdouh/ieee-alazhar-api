# Upload Module ☁️

A specialized service module for handling file uploads to **Cloudinary**.

## 🛠 Features

- **Buffer Upload:** Accepts file buffers from `multer`, allowing for memory-efficient uploads without temporary local files.
- **Folder Management:** Automatically organizes uploads into specific Cloudinary folders (e.g., `board/avatars`).
- **Cleanup Logic:** Provides a robust `deleteImage` method to ensure no orphaned files remain in the cloud after database records are deleted.

## ⚙️ Service Methods

### `uploadImage(buffer, folder, options)`

- **Purpose:** Streams a file buffer to Cloudinary.
- **Returns:** `Promise<UploadApiResponse>` containing the secure URL and public ID.

### `deleteImage(publicId)`

- **Purpose:** Deletes an image from Cloudinary using its unique public ID.
- **Graceful Handling:** Does not throw if the image is already deleted ("not found").

## 🔌 Integration

This module is primarily used by the **Board Module** to handle member profile pictures.
