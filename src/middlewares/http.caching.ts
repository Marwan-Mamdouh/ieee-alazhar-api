import type { Request, Response, NextFunction } from "express";
import generateETag from "../util/e.tag.js";

type CacheStrategy = "no-store" | "private" | "public";

interface CacheOptions {
  strategy: CacheStrategy;
}

/**
 * Patches res.json() to:
 * 1. Set the correct Cache-Control header based on the strategy
 * 2. Generate and attach an ETag
 * 3. Respond with 304 if the client already has a fresh copy
 */
export const httpCache = (options: CacheOptions) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const originalJson = res.json.bind(res);

    res.json = (data: unknown) => {
      // --- 1. Set Cache-Control ---
      switch (options.strategy) {
        case "no-store":
          // Sensitive data. Don't cache anywhere, ever.
          res.setHeader("Cache-Control", "no-store");
          return originalJson(data);

        case "private":
          // User-specific data. Only the browser can cache it, not a CDN.
          // max-age=0 + must-revalidate = "store it, but always check with me first"
          res.setHeader("Cache-Control", `private, no-cache`);
          break;

        case "public":
          // Public data. CDNs and browsers can cache it.
          res.setHeader("Cache-Control", `public no-cache`);
          break;
      }

      // --- 2. Generate ETag from the response data ---
      const etag = generateETag(data);
      res.setHeader("ETag", etag);

      // --- 3. Compare with the client's ETag (if they sent one) ---
      const clientETag = req.headers["if-none-match"];
      // console.log(clientETag, etag, "testing");

      if (clientETag && clientETag === etag) {
        // Client already has the exact same data. No need to send the body.
        res.status(304).end();
        return res; // satisfy TS — res.json must return Response
      }

      // Data changed (or first request). Send the full response.
      return originalJson(data);
    };

    next();
  };
};
