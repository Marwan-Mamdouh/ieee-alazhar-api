# Board Module 📋

The Board module handles the management of IEEE Al-Azhar Student Branch board members. It provides a robust set of features for listing, creating, updating, and deleting members, including their profile images (avatars).

## 🏛 Architecture Overview

- **`board.router.ts`**: Defines the RESTful API surface. It uses `httpCache` for performance, `rateLimitMiddleware` for protection, and `validate` for type-safety.
- **`board.service.ts`**: Encapsulates all business logic and MongoDB queries.
- **`board.schema.ts`**: Strictly enforces data integrity using **Zod**. Includes support for `memberType`, `position`, and `track` validation.
- **`model.ts`**: Mongoose model representing the `Board` collection.
- **`board.types.ts`**: Centralized enums and types for positions, tracks, and board categories.

---

## 🚦 API Endpoints

All routes are prefixed with `/api/v1/board`.

### 1. List Board Members

`GET /`
Retrieves a list of board members based on the provided filters.

- **Caching:** 1-day public cache with ETag revalidation.
- **Query Parameters:**
  - `memberType` (Optional): Comma-separated list (e.g., `officer,technical`).
  - `boardYear` (Optional): Integer (e.g., `2025`).
  - `position` (Optional): Comma-separated list of roles (e.g., `chair,head`).
  - `track` (Optional): Comma-separated list of tracks (e.g., `web,mobile`).
- **Logic:** Returns members sorted by their type and creation ID.

### 2. Add New Member

`POST /`
Creates a new board member record.

- **Authentication:** Required.
- **Rate Limiting:** Applied to prevent abuse.
- **Cache Invalidation:** Automatically invalidates all board list caches.
- **Body (JSON):**
  ```json
  {
  	"name": "John Doe",
  	"memberType": "officer",
  	"position": "chair",
  	"track": "none",
  	"bio": "Optional bio",
  	"linkedin_url": "https://linkedin.com/in/johndoe",
  	"boardYear": 2026
  }
  ```

### 3. Get Member Details

`GET /:boardId`

- **Caching:** 1-day public cache.
- **Params:** `boardId` (MongoDB ObjectId).

### 4. Update Member Info

`PATCH /:boardId`
Updates the text-based fields of a member.

- **Authentication:** Required.
- **Cache Invalidation:** Invalidates both the specific member cache and the list caches.

### 5. Delete Member

`DELETE /:boardId`

- **Cache Invalidation:** Full cleanup of related caches.
- **Side Effect:** Automatically removes the avatar from Cloudinary.

### 6. Upload/Update Avatar

`PATCH /:boardId/avatar`

- **Rate Limiting:** Strict limits applied to file uploads.
- **Form-Data:** `avatar` (File).
- **Logic:** Handles old avatar deletion, new upload, and database update with atomic-like cleanup on failure.

---

## ⚡ Performance & Caching

The module uses a multi-layer caching strategy:

1.  **L1 (HTTP Cache):** The `httpCache` middleware sets `Cache-Control` headers and generates `ETags`. If the data hasn't changed, the server responds with `304 Not Modified`, saving bandwidth.
2.  **L2 (Redis Cache):** The service layer uses `getCachedData` to store the results of expensive MongoDB queries in Upstash Redis.
3.  **Event-Driven Invalidation:** When a member is added, updated, or deleted, the `appEmitter` triggers events (e.g., `BOARD_UPDATED`). Listeners then clear the relevant Redis keys to ensure data consistency.

### 🔄 Data Transfer Object (DTO)

The API never returns the raw Mongoose document. The `toMemberDTO` function in the service layer:

1. Converts `_id` to a string `id`.
2. Flattens the avatar object.
3. Removes internal Mongoose version keys (`__v`).
4. Ensures consistent property naming for the frontend.

### 🔗 Cloudinary Integration

The module is tightly integrated with the `UploadModule`. It manages the `public_id` of images, which is essential for performing deletions and updates in the cloud storage without leaving "garbage" files behind.

### ⏳ Error Handling

Uses custom error classes:

- `NotFoundError`: Thrown when a `boardId` does not match any record.
- `AppError`: Thrown during failed uploads or database save conflicts.
- `ZodError`: Automatically handled by the `validate` middleware for bad requests.
