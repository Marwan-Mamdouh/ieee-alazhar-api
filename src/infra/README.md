# Infrastructure Layer 🏗️

The `infra` directory contains the foundational services that power the API's performance, security, and event-driven features.

## ⚡ Caching Strategy (Redis)

The API uses **Upstash Redis** for low-latency data caching.

### Key Components:

- **`cache.ts`**: Contains the core logic for:
  - `getCachedData`: A read-through cache helper that fetches from source on miss and stores the result.
  - `CACHE_KEYS`: A central factory for all Redis key patterns (e.g., `boards:list:*`).
  - `TTL`: Standardized time-to-live constants for different data types.
- **`cache.events.ts` & `cache.listeners.ts`**: An event-driven system using `EventEmitter`. When data changes in a module (e.g., a board member is added), an event is emitted, and the corresponding listener invalidates the stale Redis keys.

### Resilience:

The caching layer is designed with **graceful degradation**. If Redis is unreachable, the API will log the error and fall back to direct database queries without crashing.

## 🛡️ Rate Limiting

The API implements a **sliding window rate limiter** via `@upstash/ratelimit`.

### Implementation:

- **Scope:** Applied selectively to sensitive routes (e.g., uploads, auth-related actions).
- **Identifier:** Uses `userId` for authenticated requests and `IP address` as a fallback.
- **Headers:** Automatically attaches rate limit metadata (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`) to responses.

## 🔗 Middlewares

Infrastructure features are often exposed via middlewares:

- `httpCache`: Manages `Cache-Control` and `ETag` generation.
- `rateLimitMiddleware`: Connects the Upstash ratelimiter to Express routes.
