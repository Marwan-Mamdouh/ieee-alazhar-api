# AGENTS.md

## Commands

| Command             | Use                                    |
| ------------------- | -------------------------------------- |
| `npm run dev`       | Dev server with hot-reload (tsx watch) |
| `npm run build`     | Compile TS to `dist/` via `tsc`        |
| `npm run typecheck` | Type-check only (`tsc --noEmit`)       |
| `npm start`         | Run compiled app from `dist/server.js` |

No lint, test, or formatter scripts exist. The only verification command is `npm run typecheck`.

## Architecture

- **Express 5 + TypeScript 6** ESM app, deployed to Vercel as a serverless function (`vercel.json` routes all paths to `src/server.ts`).
- **Dual data sources**: MongoDB (Mongoose 9) for board members and feedback; Sanity CMS for events, committees, and home page content.
- **Auth**: `better-auth` with MongoDB adapter, admin role plugin, and email OTP. Mounts at `/api/auth/{*any}` _before_ the JSON body parser (auth/webhooks need raw bodies).
- **Caching**: Two layers — HTTP ETag revalidation (`middlewares/http.caching.ts`) and Redis read-through cache (`infra/cache/`). Invalidation uses an in-process typed `EventEmitter` bridge.
- **Rate limiting**: Upstash sliding-window, applied per-route: general (60/min) and upload (10/min).

## Module Convention

Every domain module lives under `src/modules/<name>/` and follows a vertical-slice pattern:

```
<name>.types.ts    — constants + TS interfaces
<name>.schema.ts   — Zod input/output schemas (used for both validation and OpenAPI)
<name>.model.ts    — Mongoose schema (MongoDB modules only)
<name>.dto.ts      — Mongoose doc -> API response transform (MongoDB modules only)
<name>.service.ts  — business logic
<name>.router.ts   — Express Router with middleware chain
<name>.docs.ts     — OpenAPI registry.registerPath() calls
```

Not all files are required — read-only Sanity modules skip model/dto. `mail` and `upload` are service-only (no router).

## Route Middleware Order

The established pattern for route handlers:

```
validate(schema, "query"|"body"|"params")  →  httpCache()  →  rateLimitMiddleware  →  asyncHandler(handler)
```

Protected routes prepend: `isAuthenticated` → `isAdmin` → `upload.single("avatar")` → `verifyImageBytes` → `validate(schema)`.

## Key Gotchas

- **Body parser placement**: `express.json()` is registered _after_ auth and webhooks. Do not move it earlier or auth/webhook handlers will lose access to raw bodies.
- **`validate()` attaches to request**: Successful parses land on `req.validatedBody`, `req.validatedQuery`, or `req.validatedParams`. Use these, not `req.body`/`req.query` directly.
- **Strict TypeScript**: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `verbatimModuleSyntax` are all enabled. Code that compiles loosely elsewhere will fail here.
- **ESM-only**: `"type": "module"` in package.json. All local imports must use `.js` extensions (e.g., `import x from "./foo.js"`).
- **Upload rollback**: If a board member save fails after a Cloudinary upload, the image is deleted. Preserve this pattern when modifying upload flows.
- **CORS origins are hardcoded** in `middlewares/corsMiddleware.ts` — not env-driven.
- **No test suite**: There are no test scripts, test files, or test dependencies. `npm run typecheck` is the only static verification.
- **Vercel deployment**: `bootstrap()` only calls `app.listen()` in non-production. Do not add startup logic that assumes a persistent process in production.

## OpenAPI Docs

Each module's `*.docs.ts` registers paths with the shared `OpenAPIRegistry` singleton (`src/util/registry.ts`). The same Zod schemas used for runtime validation are referenced in OpenAPI specs. To add a new endpoint, register it in the corresponding `*.docs.ts` file.

## Environment

Required env vars (validated in `src/config/env.ts` via Zod): `PORT`, `NODE_ENV`, `DATABASE_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`. A Sanity project ID/dataset is also required (configured in `src/config/sanity.ts`).

## Scripts

- `scripts/seed.admin.ts` — one-shot admin user creation. Run with `npx tsx scripts/seed.admin.ts`.
