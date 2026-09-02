# AGENTS.md

## Commands

| Command             | Use                                    |
| ------------------- | -------------------------------------- |
| `npm run dev`       | Dev server with hot-reload (tsx watch) |
| `npm run build`     | Compile TS to `dist/` via `tsc`        |
| `npm run typecheck` | Type-check only (`tsc --noEmit`)       |
| `npm start`         | Run compiled app from `dist/server.js` |

No lint, test, or formatter scripts exist. `npm run typecheck` is the only local verification. CI (`.github/workflows/ci.yml`) runs `npm audit --audit-level=high`, `npm ci`, and `npm run typecheck` on push/PR to `master`. CD (`.github/workflows/cd.yml`) deploys to Vercel on push to `master` (uses `vercel build --prod` + `vercel deploy --prebuilt --prod`). CI uses Node 24.x.

## Architecture

- **Express 5 + TypeScript 6** ESM app, deployed to Vercel as a serverless function (`vercel.json` routes all paths to `src/server.ts`).
- **Dual data sources**: MongoDB (Mongoose 9) for board members, feedback, and the dynamic forms module (forms + submissions); Sanity CMS for events, committees, and home page content. Forms optionally link to a Sanity event via `sanityEventId`.
- **Auth**: `better-auth` with MongoDB adapter, `admin()` plugin, and email OTP sign-in (password signup disabled via `emailAndPassword.disableSignUp`). Mounts at `/api/auth/{*any}` _before_ the JSON body parser (auth/webhooks need raw bodies). `baseUrl`/`trustedOrigins` come from `FRONTEND_URL`.
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

Forms specifics: the system `_email` field is injected at creation (order 0, immutable); submissions are validated against a runtime Zod schema compiled from the form's fields (`buildFormZodSchema`); structural field changes are blocked once a form has submissions.

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
- **Error classes are the single error source**: throw `AppError` subclasses (`NotFoundError`, `ConflictError`, `ForbiddenError`, `ValidationError`, `GoneError` 410, `UnprocessableEntityError` 422, `TooManyRequestsError`) from services. `normalizeError()` passes `AppError` through unchanged; attaching `statusCode` to a plain `Error` is silently ignored and becomes a 500.
- **Mongoose subdocument edits**: mutations to an array of subdocuments (e.g. `form.fields`) need `form.markModified("fields")` before `save()` or Mongoose won't persist them.
- **Upload rollback**: If a board member save fails after a Cloudinary upload, the image is deleted. Preserve this pattern when modifying upload flows.
- **CORS**: the cross-origin allowlist is hardcoded in `middlewares/corsMiddleware.ts` (not env-driven). Same-origin requests are also allowed (host comparison) so the Scalar docs UI on the API's own host works.
- **No test suite**: There are no test scripts, test files, or test dependencies. `npm run typecheck` is the only static verification.
- **Vercel deployment**: `bootstrap()` only calls `app.listen()` in non-production. Do not add startup logic that assumes a persistent process in production.

## OpenAPI Docs

Each module's `*.docs.ts` registers paths with the shared `OpenAPIRegistry` singleton (`src/util/registry.ts`). The same Zod schemas used for runtime validation are referenced in OpenAPI specs. To add a new endpoint, register it in the corresponding `*.docs.ts` file.

The Scalar UI is served at `/api/docs` with a route-scoped helmet CSP override (global helmet stays strict). `src/docs/openapi.ts` sets `servers` to `/` so Scalar's try-it hits the API's own origin.

## Environment

Validated in `src/config/env.ts` via Zod (`config()` loads `.env`). Required: `MONGO_URI`, `FRONTEND_URL`, `BETTER_AUTH_SECRET` (≥32 chars), `BETTER_AUTH_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_WEBHOOK_SECRET`. Optional: `PORT` (default 3000), `NODE_ENV`, `MONGO_DB_NAME`, `MAIL_USER`, `MAIL_APP_PASSWORD`, `SANITY_USE_CDN`.

## Scripts

- `scripts/seed.admin.ts` — one-shot admin user creation. Run with `npx tsx scripts/seed.admin.ts`.
