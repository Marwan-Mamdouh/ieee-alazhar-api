import { Router, type Request, type Response } from "express";

import asyncHandler from "../../util/async.handler.js";
import { validate } from "../../middlewares/validate.js";
import { getCachedData, CACHE_KEYS, TTL } from "../../infra/cache/cache.js";
import { eventIdSchema, type EventId } from "./events.schema.js";
import type { TypedRequest } from "../../types/TypedRequest.js";
import eventsService from "./events.service.js";
import { httpCache } from "../../middlewares/http.caching.js";

const router = Router();

router.get(
  "/",
  httpCache({ strategy: "public" }),
  asyncHandler(async (_: Request, res: Response) => {
    const result = await getCachedData(
      CACHE_KEYS.eventsList(),
      () => eventsService.getEvents(),
      TTL.EVENTS_LIST,
    );

    return res.json({ data: result });
  }),
);

router.get(
  "/:id",
  validate(eventIdSchema, "params"),
  httpCache({ strategy: "public" }),
  asyncHandler(async (req: TypedRequest<unknown, EventId>, res: Response) => {
    const { id } = req.validatedParams!;

    const result = await getCachedData(
      CACHE_KEYS.eventById(id),
      () => eventsService.getEventById(id),
      TTL.EVENT_BY_ID,
    );

    return res.json({ data: result });
  }),
);

export default router;
