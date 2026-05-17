import { Ratelimit } from "@upstash/ratelimit";
import redis from "../config/redis.js";
// Create a new ratelimiter, that allows 10 requests per 10 seconds
const ratelimit = new Ratelimit({
	redis,
	limiter: Ratelimit.slidingWindow(10, "60 s"),
	analytics: true,
	prefix: "@upstash/ratelimit",
});

export default ratelimit;
