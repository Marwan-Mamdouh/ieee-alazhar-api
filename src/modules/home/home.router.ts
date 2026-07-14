import { Router, type Request, type Response } from "express";

import asyncHandler from "../../util/async.handler.js";
import { getCachedData, CACHE_KEYS, TTL } from "../../infra/cache/cache.js";
import homeService from "./home.service.js";
import { httpCache } from "../../middlewares/http.caching.js";

const router = Router();

router.get(
  "/",
  httpCache({ strategy: "public" }),
  asyncHandler(async (_: Request, res: Response) => {
    const result = await getCachedData(
      CACHE_KEYS.homeData(),
      () => homeService.getHomeData(),
      TTL.HOME_DATA,
    );

    return res.json({ data: result });
  }),
);

export default router;
