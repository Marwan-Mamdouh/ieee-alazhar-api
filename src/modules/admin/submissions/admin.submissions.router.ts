import { Router, type Response } from "express";

import asyncHandler from "../../../util/async.handler.js";
import { validate } from "../../../middlewares/validate.js";
import { httpCache } from "../../../middlewares/http.caching.js";
import { generalRateLimitMiddleware } from "../../../middlewares/rateLimiting.middleware.js";
import {
  paginationSchema,
  type PaginationParams,
} from "../../../util/zod.config.js";
import type { TypedRequest } from "../../../types/TypedRequest.js";
import { SubmissionService } from "../../forms/submission/submission.service.js";
import {
  slugParamsSchema,
  type SlugParams,
} from "../../forms/form/form.schema.js";

const router = Router();

// GET /api/v1/admin/forms/:slug/submissions — paginated list, newest first
router.get(
  "/:slug/submissions",
  validate(slugParamsSchema, "params"),
  validate(paginationSchema, "query"),
  httpCache({ strategy: "no-store" }),
  generalRateLimitMiddleware,
  asyncHandler(
    async (
      req: TypedRequest<unknown, SlugParams, PaginationParams>,
      res: Response,
    ) => {
      const { slug } = req.validatedParams!;
      const { page, limit } = req.validatedQuery!;
      const result = await SubmissionService.getSubmissionsByForm(
        slug,
        page,
        limit,
      );
      res.json(result);
    },
  ),
);

// GET /api/v1/admin/forms/:slug/submissions/export — full export for CSV/table
router.get(
  "/:slug/submissions/export",
  validate(slugParamsSchema, "params"),
  httpCache({ strategy: "no-store" }),
  generalRateLimitMiddleware,
  asyncHandler(
    async (req: TypedRequest<unknown, SlugParams>, res: Response) => {
      const { slug } = req.validatedParams!;
      const result = await SubmissionService.exportSubmissions(slug);
      res.json(result);
    },
  ),
);

export default router;
