import { Router, type Request, type Response } from "express";
import { Types } from "mongoose";

import asyncHandler from "../../../util/async.handler.js";
import { isAuthenticated } from "../../../middlewares/isAuthenticated.js";
import { isAdmin } from "../../../middlewares/isAdmin.js";
import { validate } from "../../../middlewares/validate.js";
import { httpCache } from "../../../middlewares/http.caching.js";
import { generalRateLimitMiddleware } from "../../../middlewares/rateLimiting.middleware.js";
import { getCachedData, CACHE_KEYS, TTL } from "../../../infra/cache/cache.js";
import appEmitter, { CACHE_EVENTS } from "../../../infra/cache/cache.events.js";
import type { TypedRequest } from "../../../types/TypedRequest.js";
import { FormService } from "./form.service.js";
import { toPublicFormDTO, toAdminFormDTO } from "./form.dto.js";
import {
  createFormSchema,
  updateFormMetaSchema,
  addFieldSchema,
  updateFieldSchema,
  transitionStatusSchema,
  slugParamsSchema,
  fieldKeyParamsSchema,
  reorderFieldsSchema,
  type CreateFormInput,
  type UpdateFormMetaInput,
  type AddFieldInput,
  type UpdateFieldInput,
  type TransitionStatusInput,
  type ReorderFieldsInput,
  type SlugParams,
  type FieldKeyParams,
} from "./form.schema.js";

const router = Router();

// POST /api/v1/forms — create a form (metadata only; service injects _email)
router.post(
  "/",
  isAuthenticated,
  isAdmin,
  validate(createFormSchema, "body"),
  generalRateLimitMiddleware,
  asyncHandler(async (req: TypedRequest<CreateFormInput>, res: Response) => {
    const createdBy = new Types.ObjectId(req.user!.id);
    const form = await FormService.create(req.validatedBody!, createdBy);
    res.status(201).json({ data: toAdminFormDTO(form) });
  }),
);

// GET /api/v1/forms — admin list of all forms, newest first
router.get(
  "/",
  isAuthenticated,
  isAdmin,
  httpCache({ strategy: "no-store" }),
  generalRateLimitMiddleware,
  asyncHandler(async (_req: Request, res: Response) => {
    const forms = await FormService.list();
    res.json({ data: forms.map(toAdminFormDTO) });
  }),
);

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

// PATCH /api/v1/forms/:slug — update form metadata
router.patch(
  "/:slug",
  isAuthenticated,
  isAdmin,
  validate(slugParamsSchema, "params"),
  validate(updateFormMetaSchema, "body"),
  generalRateLimitMiddleware,
  asyncHandler(
    async (
      req: TypedRequest<UpdateFormMetaInput, SlugParams>,
      res: Response,
    ) => {
      const { slug } = req.validatedParams!;
      const form = await FormService.updateMeta(slug, req.validatedBody!);
      appEmitter.emitEvent(CACHE_EVENTS.FORM_UPDATED, { slug });
      res.json({ data: toAdminFormDTO(form) });
    },
  ),
);

// DELETE /api/v1/forms/:slug — delete a form (blocked once it has submissions)
router.delete(
  "/:slug",
  isAuthenticated,
  isAdmin,
  validate(slugParamsSchema, "params"),
  generalRateLimitMiddleware,
  asyncHandler(
    async (req: TypedRequest<unknown, SlugParams>, res: Response) => {
      const { slug } = req.validatedParams!;
      await FormService.remove(slug);
      appEmitter.emitEvent(CACHE_EVENTS.FORM_DELETED, { slug });
      res.sendStatus(204);
    },
  ),
);

// PATCH /api/v1/forms/:slug/status — state machine transition
router.patch(
  "/:slug/status",
  isAuthenticated,
  isAdmin,
  validate(slugParamsSchema, "params"),
  validate(transitionStatusSchema, "body"),
  generalRateLimitMiddleware,
  asyncHandler(
    async (
      req: TypedRequest<TransitionStatusInput, SlugParams>,
      res: Response,
    ) => {
      const { slug } = req.validatedParams!;
      const form = await FormService.transitionStatus(
        slug,
        req.validatedBody!.status,
      );
      appEmitter.emitEvent(CACHE_EVENTS.FORM_UPDATED, { slug });
      res.json({ data: toAdminFormDTO(form) });
    },
  ),
);

// POST /api/v1/forms/:slug/fields — add a field
router.post(
  "/:slug/fields",
  isAuthenticated,
  isAdmin,
  validate(slugParamsSchema, "params"),
  validate(addFieldSchema, "body"),
  generalRateLimitMiddleware,
  asyncHandler(
    async (req: TypedRequest<AddFieldInput, SlugParams>, res: Response) => {
      const { slug } = req.validatedParams!;
      const form = await FormService.addField(slug, req.validatedBody!);
      appEmitter.emitEvent(CACHE_EVENTS.FORM_UPDATED, { slug });
      res.status(201).json({ data: toAdminFormDTO(form) });
    },
  ),
);

// PATCH /api/v1/forms/:slug/fields/:fieldKey — update display props only
router.patch(
  "/:slug/fields/:fieldKey",
  isAuthenticated,
  isAdmin,
  validate(fieldKeyParamsSchema, "params"),
  validate(updateFieldSchema, "body"),
  generalRateLimitMiddleware,
  asyncHandler(
    async (
      req: TypedRequest<UpdateFieldInput, FieldKeyParams>,
      res: Response,
    ) => {
      const { slug, fieldKey } = req.validatedParams!;
      const result = await FormService.updateField(
        slug,
        fieldKey,
        req.validatedBody!,
      );
      appEmitter.emitEvent(CACHE_EVENTS.FORM_UPDATED, { slug });
      res.json({
        data: toAdminFormDTO(result.form),
        warnings: result.warnings,
      });
    },
  ),
);

// DELETE /api/v1/forms/:slug/fields/:fieldKey — remove a field
router.delete(
  "/:slug/fields/:fieldKey",
  isAuthenticated,
  isAdmin,
  validate(fieldKeyParamsSchema, "params"),
  generalRateLimitMiddleware,
  asyncHandler(
    async (req: TypedRequest<unknown, FieldKeyParams>, res: Response) => {
      const { slug, fieldKey } = req.validatedParams!;
      const form = await FormService.removeField(slug, fieldKey);
      appEmitter.emitEvent(CACHE_EVENTS.FORM_UPDATED, { slug });
      res.json({ data: toAdminFormDTO(form) });
    },
  ),
);

// POST /api/v1/forms/:slug/fields/reorder — reorder all fields
router.post(
  "/:slug/fields/reorder",
  isAuthenticated,
  isAdmin,
  validate(slugParamsSchema, "params"),
  validate(reorderFieldsSchema, "body"),
  generalRateLimitMiddleware,
  asyncHandler(
    async (
      req: TypedRequest<ReorderFieldsInput, SlugParams>,
      res: Response,
    ) => {
      const { slug } = req.validatedParams!;
      const form = await FormService.reorderFields(
        slug,
        req.validatedBody!.orderedKeys,
      );
      appEmitter.emitEvent(CACHE_EVENTS.FORM_UPDATED, { slug });
      res.json({ data: toAdminFormDTO(form) });
    },
  ),
);

export default router;
