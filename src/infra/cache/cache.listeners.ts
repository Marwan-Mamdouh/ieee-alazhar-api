import appEmitter, { CACHE_EVENTS } from "./cache.events.js";
import { invalidateByPattern, CACHE_KEYS } from "./cache.js";

/**
 * Registers all cache invalidation listeners.
 * Call this ONCE at app startup (in your main index.ts / app.ts).
 *
 * This is the ONLY place that knows about both events and cache.
 * The board module knows nothing about cache.
 * The cache module knows nothing about events.
 * This file is the bridge — and it owns that responsibility explicitly.
 */
export const registerCacheListeners = (): void => {
  // Board updated or deleted → invalidate that board's cache
  // AND invalidate the list cache (list may show stale member counts, names, etc.)
  appEmitter.onEvent(CACHE_EVENTS.BOARD_UPDATED, async ({ boardId }) => {
    await invalidateByPattern(CACHE_KEYS.boardPattern(boardId));
    await invalidateByPattern(CACHE_KEYS.boardListPattern());
  });

  appEmitter.onEvent(CACHE_EVENTS.BOARD_DELETED, async ({ boardId }) => {
    await invalidateByPattern(CACHE_KEYS.boardPattern(boardId));
    await invalidateByPattern(CACHE_KEYS.boardListPattern());
  });

  // Avatar changes only affect the board itself, not the list
  appEmitter.onEvent(CACHE_EVENTS.BOARD_AVATAR_UPDATED, async ({ boardId }) => {
    await invalidateByPattern(CACHE_KEYS.boardPattern(boardId));
  });

  appEmitter.onEvent(CACHE_EVENTS.BOARD_AVATAR_DELETED, async ({ boardId }) => {
    await invalidateByPattern(CACHE_KEYS.boardPattern(boardId));
  });

  // Adding a member changes the list (member count, membership data)
  appEmitter.onEvent(CACHE_EVENTS.BOARD_MEMBER_ADDED, async ({ boardId }) => {
    await invalidateByPattern(CACHE_KEYS.boardPattern(boardId));
    await invalidateByPattern(CACHE_KEYS.boardListPattern());
  });

  appEmitter.onEvent(CACHE_EVENTS.SANITY_COMMITTEES_UPDATED, async () => {
    await invalidateByPattern(CACHE_KEYS.committeesPattern());
  });

  appEmitter.onEvent(CACHE_EVENTS.SANITY_EVENTS_UPDATED, async () => {
    await invalidateByPattern(CACHE_KEYS.eventsPattern());
  });

  appEmitter.onEvent(CACHE_EVENTS.SANITY_HOME_UPDATED, async () => {
    await invalidateByPattern(CACHE_KEYS.homePattern());
  });

  // Any form mutation changes the public form definition the frontend renders
  // (title, fields, status, time window, capacity) → invalidate that slug's cache.
  appEmitter.onEvent(CACHE_EVENTS.FORM_UPDATED, async ({ slug }) => {
    await invalidateByPattern(CACHE_KEYS.formPattern(slug));
  });

  appEmitter.onEvent(CACHE_EVENTS.FORM_DELETED, async ({ slug }) => {
    await invalidateByPattern(CACHE_KEYS.formPattern(slug));
  });

  console.log("[Cache] Listeners registered");
};
