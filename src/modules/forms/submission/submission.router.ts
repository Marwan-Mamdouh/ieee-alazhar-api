import { Router, type Response } from "express";

import asyncHandler from "../../../util/async.handler.js";
import { isAuthenticated } from "../../../middlewares/isAuthenticated.js";
import { isAdmin } from "../../../middlewares/isAdmin.js";
import { validate } from "../../../middlewares/validate.js";
import { httpCache } from "../../../middlewares/http.caching.js";
import { generalRateLimitMiddleware } from "../../../middlewares/rateLimiting.middleware.js";
import {
  paginationSchema,
  type PaginationParams,
} from "../../../util/zod.config.js";
import type { TypedRequest } from "../../../types/TypedRequest.js";
import {
  SubmissionService,
  type SubmitFormInput,
} from "./submission.service.js";
import { slugParamsSchema, type SlugParams } from "../form/form.schema.js";

const router = Router();

// POST /api/v1/forms/:slug/submissions — public submit.
// No validate() on the body: the payload shape is dynamic and derived from the
// form's fields at runtime (buildFormZodSchema). ZodError surfaces as a 400.
router.post(
  "/:slug/submissions",
  validate(slugParamsSchema, "params"),
  generalRateLimitMiddleware,
  asyncHandler(
    async (req: TypedRequest<SubmitFormInput, SlugParams>, res: Response) => {
      const { slug } = req.validatedParams!;
      const submission = await SubmissionService.submit(slug, {
        data: req.body,
      });
      res.status(201).json({ data: submission });
    },
  ),
);

// GET /api/v1/forms/:slug/submissions — admin paginated list, newest first
router.get(
  "/:slug/submissions",
  isAuthenticated,
  isAdmin,
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

// GET /api/v1/forms/:slug/submissions/export — admin full export for CSV/table
router.get(
  "/:slug/submissions/export",
  isAuthenticated,
  isAdmin,
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
