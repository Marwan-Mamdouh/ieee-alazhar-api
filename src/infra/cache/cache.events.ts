import { EventEmitter } from "node:events";

// Typed events — no magic strings scattered across your codebase
export const CACHE_EVENTS = {
  BOARD_UPDATED: "board:updated",
  BOARD_DELETED: "board:deleted",
  BOARD_AVATAR_UPDATED: "board:avatar:updated",
  BOARD_AVATAR_DELETED: "board:avatar:deleted",
  BOARD_MEMBER_ADDED: "board:member:added",
  SANITY_COMMITTEES_UPDATED: "sanity:committees:updated",
  SANITY_EVENTS_UPDATED: "sanity:events:updated",
  SANITY_HOME_UPDATED: "sanity:home:updated",
} as const;

type CacheEvent = (typeof CACHE_EVENTS)[keyof typeof CACHE_EVENTS];

// Payload shapes per event — this is what prevents silent bugs
interface CacheEventPayloads {
  [CACHE_EVENTS.BOARD_UPDATED]: { boardId: string };
  [CACHE_EVENTS.BOARD_DELETED]: { boardId: string };
  [CACHE_EVENTS.BOARD_AVATAR_UPDATED]: { boardId: string };
  [CACHE_EVENTS.BOARD_AVATAR_DELETED]: { boardId: string };
  [CACHE_EVENTS.BOARD_MEMBER_ADDED]: { boardId: string };
  [CACHE_EVENTS.SANITY_COMMITTEES_UPDATED]: Record<string, never>;
  [CACHE_EVENTS.SANITY_EVENTS_UPDATED]: Record<string, never>;
  [CACHE_EVENTS.SANITY_HOME_UPDATED]: Record<string, never>;
}

class AppEventEmitter extends EventEmitter {
  // Typed emit — TypeScript will enforce payload shape per event
  emitEvent<E extends CacheEvent>(
    event: E,
    payload: CacheEventPayloads[E],
  ): boolean {
    return this.emit(event, payload);
  }

  // Typed listener — no guessing what the payload looks like
  onEvent<E extends CacheEvent>(
    event: E,
    listener: (payload: CacheEventPayloads[E]) => void,
  ): this {
    return this.on(event, listener);
  }
}

// Singleton — one emitter, shared across the whole app
const appEmitter = new AppEventEmitter();

// Critical: unhandled errors on EventEmitter crash Node by default
// This catches listener errors that bubble up as 'error' events
appEmitter.on("error", (err) => {
  console.error("[EventEmitter] Unhandled emitter error:", err);
});

export default appEmitter;
