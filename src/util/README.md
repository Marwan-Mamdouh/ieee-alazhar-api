# Utilities 🛠️

The `util` directory contains pure functions, shared helpers, and configurations that are used across the entire application.

## 🧰 Key Utilities

### `async.handler.ts`

A higher-order function that wraps Express route handlers to automatically catch and forward errors to the centralized error middleware.

### `e.tag.ts`

Generates a weak ETag (sha1 fingerprint) from any serializable data. This is used by the `httpCache` middleware to support conditional requests and save bandwidth.

### `registry.ts`

Exports the `OpenAPIRegistry` instance from `@asteasolutions/zod-to-openapi`. This is where all module-level documentation (schemas and paths) is registered to build the final OpenAPI document.

### `auth.ts`

Contains the configuration and initialization logic for the authentication system (`Better-Auth`).

### `zod.config.ts`

Global configuration for Zod schemas and custom validation logic.
