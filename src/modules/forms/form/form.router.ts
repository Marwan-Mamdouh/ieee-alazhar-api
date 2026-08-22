import { Router, type Response } from "express";

import asyncHandler from "../../../util/async.handler.js";
import { validate } from "../../../middlewares/validate.js";
import { httpCache } from "../../../middlewares/http.caching.js";
import { generalRateLimitMiddleware } from "../../../middlewares/rateLimiting.middleware.js";
import { getCachedData, CACHE_KEYS, TTL } from "../../../infra/cache/cache.js";
import type { TypedRequest } from "../../../types/TypedRequest.js";
import { FormService } from "./form.service.js";
import { toPublicFormDTO } from "./form.dto.js";
import { slugParamsSchema, type SlugParams } from "./form.schema.js";

const router = Router();

// GET /api/v1/forms/:slug — public form definition (read-through cached)
router.get(
  "/:slug",
  validate(slugParamsSchema, "params"),
  httpCache({ strategy: "public" }),
  generalRateLimitMiddleware,
  asyncHandler(
    async (req: TypedRequest<unknown, SlugParams>, res: Response) => {
      const { slug } = req.validatedParams!;
      const form = await getCachedData(
        CACHE_KEYS.formBySlug(slug),
        () => FormService.getBySlug(slug),
        TTL.FORM_BY_SLUG,
      );
      res.json({ data: toPublicFormDTO(form) });
    },
  ),
);

export default router;
