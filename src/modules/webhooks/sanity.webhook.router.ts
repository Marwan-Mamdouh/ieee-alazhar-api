import express, { type Request, type Response, Router, raw } from "express";
import { isValidSignature, SIGNATURE_HEADER_NAME } from "@sanity/webhook";
import appEmitter, { CACHE_EVENTS } from "../../infra/cache/cache.events.js";
import env from "../../config/env.js";

const router = Router();

type SanityPayload = {
  _type: string;
  _id: string;
};

router.post(
  "/",
  raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    // Step 1 — signature header must be present
    const signature = req.headers[SIGNATURE_HEADER_NAME] as string | undefined;
    if (!signature) {
      return res.status(401).json({ message: "Missing webhook signature" });
    }

    // Step 2 — verify HMAC against raw body
    // req.body is a Buffer here because express.raw() is applied above
    const rawBody = req.body.toString();
    const isValid = await isValidSignature(
      rawBody,
      signature,
      env.SANITY_WEBHOOK_SECRET,
    );

    if (!isValid) {
      return res.status(401).json({ message: "Invalid webhook signature" });
    }

    // Step 3 — parse and fan out
    const payload = JSON.parse(rawBody) as SanityPayload;

    switch (payload._type) {
      case "committee":
        appEmitter.emitEvent(CACHE_EVENTS.SANITY_COMMITTEES_UPDATED, {});
        break;
      case "event":
        appEmitter.emitEvent(CACHE_EVENTS.SANITY_EVENTS_UPDATED, {});
        break;
      case "homePage":
        appEmitter.emitEvent(CACHE_EVENTS.SANITY_HOME_UPDATED, {});
        break;
      default:
        // Unknown Sanity document type — acknowledge cleanly, do nothing
        // This prevents Sanity from retrying on unknown types
        break;
    }

    // Always 200 — Sanity retries on anything else
    return res.status(200).json({ message: "ok" });
  },
);

export default router;
