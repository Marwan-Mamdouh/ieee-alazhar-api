import { Ratelimit } from "@upstash/ratelimit";
import redis from "../config/redis.js";

export const generalLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "60 s"), // 60 req/min
  prefix: "@upstash/ratelimit:general",
});

// src/infra/ratelimit.ts — your existing one, rename for clarity
export const uploadLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"), // 10 req/min
  prefix: "@upstash/ratelimit:upload",
});
