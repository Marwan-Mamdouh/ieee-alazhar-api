import redis from "../../config/redis.js"; // your existing redis client
import type { GetBoard } from "../../modules/board/board.schema.js";

// ─── Key Factory ────────────────────────────────────────────────────────────
// Central place for all cache key shapes.
// If you ever rename a key pattern, you change it here — nowhere else.

export const CACHE_KEYS = {
	boardList: (params: GetBoard) => {
		const {
			yearFrom,
			yearTo,
			position = "all",
			memberType = "all",
			track = "all",
		} = params;
		return `boards:list:${yearFrom}-${yearTo}:pos=${position}:type=${memberType}:track=${track}`;
	},

	// GET /boards/:boardId
	boardById: (boardId: string) => `boards:id:${boardId}`,

	// Wildcard pattern for invalidating ALL caches related to a board
	boardPattern: (boardId: string) => `boards:*${boardId}*`,

	// Wildcard for the entire boards list cache (e.g. when a member is added)
  boardListPattern: () => `boards:list:*`,

  // boardYears
  boardYears: () => `boards:years:*`,

  // GET /committees
  committeesList: () => `committees:list`,

  // GET /events
  eventsList: () => `events:list`,

  // GET /events/:id
  eventById: (id: string) => `events:id:${id}`,

  // GET /home
  homeData: () => `home:data`,
} as const;

const cacheKeyPrefix = "cache:";

// ─── TTL Constants ───────────────────────────────────────────────────────────
export const TTL = {
	BOARDS_LIST: 60 * 60 * 12, // 12 hours — filtered lists change more often
	BOARD_BY_ID: 60 * 60 * 24, // 1 day — single board, more stable
	BOARD_YEARS: 60 * 60 * 24, // 1 day — stable, changes infrequently
	// Sanity read-only proxies — no invalidation, short TTL by design
	COMMITTEES_LIST: 5 * 60,   // 5 minutes
	EVENTS_LIST: 5 * 60,        // 5 minutes
	EVENT_BY_ID: 10 * 60,       // 10 minutes — detail pages are more stable
	HOME_DATA: 60 * 60,         // 1 hour — homepage images change infrequently
} as const;

// ─── Core Cache Helpers ──────────────────────────────────────────────────────

export const getCachedData = async <T>(
	cacheKey: string,
	fetchFn: () => Promise<T>,
	ttl: number,
): Promise<T> => {
	// Step 1: Try cache
	try {
		const cached = await redis.get<T>(cacheKey);
		if (cached !== null) {
			console.log(`[Cache] HIT → ${cacheKey}`);
			return cached;
		}
	} catch (err) {
		// Redis is down or unreachable — degrade gracefully, do NOT crash
		console.error(`[Cache] Read error for "${cacheKey}":`, err);
	}

	// Step 2: Cache miss — fetch from source
	console.log(`[Cache] MISS → ${cacheKey}`);
	const data = await fetchFn();

	// Step 3: Write to cache — failure here is non-fatal
	try {
		await redis.setex(cacheKey, ttl, data);
		console.log(`[Cache] Stored "${cacheKey}" for ${ttl}s`);
	} catch (err) {
		console.error(`[Cache] Write error for "${cacheKey}":`, err);
	}

	return data;
};

export const invalidateByPattern = async (pattern: string): Promise<void> => {
	try {
		const keys = await redis.keys(pattern);
		if (keys.length === 0) return;

		await redis.del(...keys);
		console.log(
			`[Cache] Invalidated ${keys.length} key(s) matching "${pattern}"`,
		);
	} catch (err) {
		// Log but never throw — a failed invalidation should not roll back a write
		console.error(`[Cache] Invalidation error for pattern "${pattern}":`, err);
	}
};
