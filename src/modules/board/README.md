# Board Module 📋

The Board module handles the management of IEEE Al-Azhar Student Branch board members. It provides a robust set of features for listing, creating, updating, and deleting members, including their profile images (avatars).

## 🏛 Architecture Overview

- **`board.router.ts`**: Defines the RESTful API surface and applies validation/auth middlewares.
- **`board.service.ts`**: Encapsulates all business logic, MongoDB queries, and coordination with the `UploadModule`.
- **`board.schema.ts`**: Strictly enforces data integrity using **Zod**. It includes complex validation like `discriminatedUnion` to ensure the `position` matches the `memberType`.
- **`model.ts`**: Mongoose model representing the `Board` collection.
- **`board.types.ts`**: Centralized enums and types for positions and board categories.

---

## 🚦 API Endpoints

All routes are prefixed with `/api/v1/board`.

### 1. List Board Members

`GET /`
Retrieves a list of board members based on the provided filters.

- **Query Parameters:**
  - `memberType` (Required): Comma-separated list (e.g., `officer,technical`).
  - `boardYear` (Optional): Integer (e.g., `2025`). Defaults to the current year.
  - `position` (Optional): Comma-separated list of roles (e.g., `chair,head`).
- **Logic:** Returns members sorted by their type and creation ID.

### 2. Add New Member

`POST /`
Creates a new board member record.

- **Authentication:** Required (Admin only).
- **Body (JSON):**
  ```json
  {
  	"name": "John Doe",
  	"memberType": "officer",
  	"position": "chair",
  	"bio": "Optional bio",
  	"linkedin_url": "https://linkedin.com/in/johndoe",
  	"boardYear": 2026
  }
  ```
- **Validation:** If `memberType` is `officer`, the `position` must be one of: `chair`, `treasurer`, `secretary`, `vice`. For other types, it must be `head` or `vice`.

### 3. Get Member Details

`GET /:boardId`

- **Params:** `boardId` (MongoDB ObjectId).
- **Response:** Detailed member object including their DTO-mapped fields.

### 4. Update Member Info

`PATCH /:boardId`
Updates the text-based fields of a member.

- **Authentication:** Required.
- **Body:** Partial `AddBoardMember` fields.

### 5. Delete Member

`DELETE /:boardId`
Removes the member from the database.

- **Side Effect:** Automatically calls `UploadService.deleteImage` to remove the member's avatar from Cloudinary if it exists.

### 6. Upload/Update Avatar

`PATCH /:boardId/avatar`
Uploads a profile picture for the member.

- **Form-Data:** `avatar` (File).
- **Logic:**
  1. If an old avatar exists, it is deleted from Cloudinary.
  2. The new image is uploaded to the `board/avatars` folder.
  3. The database record is updated with the new `url` and `public_id`.
  4. Includes automatic cleanup: if the database save fails after upload, the newly uploaded image is deleted to prevent orphaned files.

### 7. Remove Avatar

`DELETE /:boardId/avatar`
Removes only the profile picture while keeping the member record.

---

## 🛠 Business Logic & Security

### 🛡 Validation Logic

The `board.schema.ts` uses a `discriminatedUnion`. This ensures that you cannot accidentally assign a "Technical Head" position to someone marked as an "Officer". This type-safety extends from the HTTP request all the way to the TypeScript service layer.

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
