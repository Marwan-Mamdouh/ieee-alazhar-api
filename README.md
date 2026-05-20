# IEEE Al-Azhar Board API 🚀

## Built to serve the IEEE Al-Azhar student branch website. Used in production by the branch to manage and display board member data. that is already done

in the future we will save feedback for the branch and make a news paper features

A robust, type-safe REST API built with **TypeScript**, **Express**, and **MongoDB** for managing the IEEE Al-Azhar Student Branch board members.

---

## 🛠 Tech Stack

- **Runtime:** [Node.js](https://nodejs.org/) (v20+)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (v6.0)
- **Framework:** [Express.js](https://expressjs.com/) (v5.2)
- **Database:** [MongoDB](https://www.mongodb.com/) (via Mongoose 9.0)
- **Caching & Rate Limiting:** [Upstash Redis](https://upstash.com/)
- **Authentication:** [Better-Auth](https://better-auth.com/)
- **Validation:** [Zod](https://zod.dev/)
- **File Storage:** [Cloudinary](https://cloudinary.com/)
- **Email Service:** [Nodemailer](https://nodemailer.com/)
- **API Reference:** [Scalar](https://scalar.com/)
- **Deployment:** [Vercel](https://vercel.com/)

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js:** v20 or higher.
- **PNPM/NPM:** `npm` is used by default.
- **MongoDB:** A running instance (local or Atlas).
- **Upstash Redis:** Account for caching and rate limiting.
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

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=your_url
UPSTASH_REDIS_REST_TOKEN=your_token

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

# Authentication (Better-Auth)
BETTER_AUTH_SECRET=your_secret
BETTER_AUTH_URL=http://localhost:8080

# Mailer
MAIL_HOST=your_host
MAIL_PORT=your_port
MAIL_USER=your_user
MAIL_PASS=your_pass
```

### 4. Running the Project

| Command             | Description                                              |
| :------------------ | :------------------------------------------------------- |
| `npm run dev`       | Starts the development server with hot-reload (tsx).     |
| `npm run build`     | Compiles TypeScript to JavaScript in the `dist/` folder. |
| `npm run typecheck` | Runs the TypeScript compiler in no-emit mode.            |
| `npm start`         | Runs the compiled application from `dist/`.              |

---

## 🏗 Project Architecture

The project follows a **modular architecture**, ensuring high maintainability and scalability.

```text
src/
├── config/             # Configuration files (DB, Cloudinary, Env, Mailer)
├── docs/               # OpenAPI/Scalar documentation definitions
├── errors/             # Custom error classes & normalization
├── infra/              # Infrastructure (Redis Cache, Rate Limiting)
├── middlewares/        # Express middlewares (Auth, Logger, Caching, Validation)
├── modules/            # Domain-driven modules
│   ├── board/          # Board members management
│   ├── mail/           # Email service (OTP, notifications)
│   └── upload/         # Image upload service
├── types/              # Global TypeScript types
└── util/               # Shared utility functions (Async handlers, ETag, Registry)
```

---

## ✨ Key Features

- **⚡ Performance:** Redis-backed read-through caching for API responses and HTTP ETag revalidation.
- **🛡 Security:** Sliding-window rate limiting (via Upstash), secure headers (Helmet), and strict Zod validation.
- **📧 Communication:** Integrated email service for OTP-based authentication and notifications.
- **📖 Documentation:** Automatically generated OpenAPI 3.0 specs served via interactive Scalar reference.
- **🏗 Robustness:** Centralized event-driven cache invalidation and comprehensive error normalization.

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
