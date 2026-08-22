import { Router, type Response } from "express";

import asyncHandler from "../../../util/async.handler.js";
import { validate } from "../../../middlewares/validate.js";
import { generalRateLimitMiddleware } from "../../../middlewares/rateLimiting.middleware.js";
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

export default router;
