# IEEE Al-Azhar Board API 🚀

A robust, type-safe REST API built with **TypeScript**, **Express**, and **MongoDB** for managing the IEEE Al-Azhar Student Branch board members.

---

## 🛠 Tech Stack

- **Runtime:** [Node.js](https://nodejs.org/) (v20+)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (v6.0)
- **Framework:** [Express.js](https://expressjs.com/) (v5.1)
- **Database:** [MongoDB](https://www.mongodb.com/) (via Mongoose)
- **Authentication:** [Better-Auth](https://better-auth.com/)
- **Validation:** [Zod](https://zod.dev/)
- **File Storage:** [Cloudinary](https://cloudinary.com/)
- **Deployment:** [Vercel](https://vercel.com/)

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js:** v20 or higher.
- **PNPM/NPM:** `npm` is used by default.
- **MongoDB:** A running instance (local or Atlas).
- **Cloudinary Account:** For image uploads.

### 2. Installation

```bash
git clone https://github.com/your-repo/ieee-board-api.git
cd ieee-board-api
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory and fill in the required variables:

```env
# Server
PORT=8080
NODE_ENV=development

# Database
DATABASE_URL=mongodb://localhost:27017/ieee-board

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

# Authentication (Better-Auth)
BETTER_AUTH_SECRET=your_secret
BETTER_AUTH_URL=http://localhost:8080
```

### 4. Running the Project

| Command              | Description                                              |
| :------------------- | :------------------------------------------------------- |
| `npm run dev`        | Starts the development server with hot-reload (tsx).     |
| `npm run build`      | Compiles TypeScript to JavaScript in the `dist/` folder. |
| `npm start`          | Runs the compiled application from `dist/`.              |
| `npm run vercel:dev` | Runs the Vercel local environment.                       |

---

## 🏗 Project Architecture

The project follows a **modular architecture**, ensuring high maintainability and scalability.

```text
src/
├── config/             # Configuration files (DB, Cloudinary, Env validation)
├── errors/             # Custom error classes & normalization
├── middlewares/        # Express middlewares (Auth, Logger, Validation)
├── modules/            # Domain-driven modules
│   ├── board/          # Board members management
│   └── upload/         # Image upload service
├── types/              # Global TypeScript types
└── util/               # Shared utility functions (Async handlers, Auth helpers)
```

---

## 📡 API Endpoints (v1)

### 👥 Board Members

- `GET /api/v1/board` - List members (filterable by `memberType` and `boardYear`).
- `GET /api/v1/board/:id` - Get a specific member.
- `POST /api/v1/board` - Add a new member (🔒 Auth required).
- `PATCH /api/v1/board/:id` - Update member info.
- `DELETE /api/v1/board/:id` - Remove a member.
- `PATCH /api/v1/board/:id/avatar` - Upload/Update avatar image.

---

## 🛡 Security & Best Practices

- **Strict Typing:** Powered by TypeScript 6.0 for maximum compile-time safety.
- **Input Validation:** Every request is validated against Zod schemas before reaching the service layer.
- **Secure Headers:** Implementation of `helmet` and `cors` for web security.
- **Error Handling:** Centralized error management with specialized classes for `NotFound`, `Validation`, etc.
