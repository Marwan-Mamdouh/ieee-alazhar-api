import { Router, type Response, type Request } from "express";

import { validate } from "../../middlewares/validate.js";
import {
  addBoardMemberSchema,
  boardIdSchema,
  getBoardSchema,
  updateBoardMemberSchema,
  type AddBoardMember,
  type GetBoard,
  type BoardId,
  type UpdateBoardMember,
} from "./board.schema.js";
import type { TypedRequest } from "../../types/TypedRequest.js";
import asyncHandler from "../../util/async.handler.js";
import boardService from "./board.service.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import { isAdmin } from "../../middlewares/isAdmin.js";
import upload from "../../middlewares/upload.js";
import { httpCache } from "../../middlewares/http.caching.js";
import { CACHE_KEYS, TTL, getCachedData } from "../../infra/cache/cache.js";
import appEmitter, { CACHE_EVENTS } from "../../infra/cache/cache.events.js";
import { rateLimitMiddleware } from "../../middlewares/rateLimiting.middleware.js";
import {
  BOARD_TYPES,
  GENDERS,
  ALLOWED_POSITIONS_BY_TYPE,
  ALLOWED_TRACKS_BY_TYPE,
} from "./board.types.js";
import { TECHNICAL_TRACK_GROUPS } from "../../types/shared.types.js";

const router = Router();
router.get(
  "/",
  validate(getBoardSchema, "query"),
  httpCache({ strategy: "public" }),
  asyncHandler(
    async (req: TypedRequest<unknown, unknown, GetBoard>, res: Response) => {
      const cacheKey = CACHE_KEYS.boardList(req.validatedQuery!);

      const result = await getCachedData(
        cacheKey,
        () => boardService.getBoard(req.validatedQuery!),
        TTL.BOARDS_LIST,
      );

      return res.json({ data: result });
    },
  ),
);

router.get(
  "/years",
  httpCache({ strategy: "public" }),
  asyncHandler(async (_: Request, res: Response) => {
    const cacheKey = CACHE_KEYS.boardYears();

    const result = await getCachedData(
      cacheKey,
      () => boardService.getBoardYears(),
      TTL.BOARD_YEARS,
    );

    return res.json({ data: { years: result } });
  }),
);

router.get(
  "/meta",
  httpCache({ strategy: "public" }), // , maxAge: 60 * 60 * 24 * 30  30 days
  (_, res) => {
    res.json({
      data: {
        memberTypes: BOARD_TYPES,
        genders: GENDERS,
        allowedPositionsByType: ALLOWED_POSITIONS_BY_TYPE,
        allowedTracksByType: ALLOWED_TRACKS_BY_TYPE,
        technicalTrackGroups: TECHNICAL_TRACK_GROUPS,
      },
    });
  },
);

router.get(
  "/:boardId",
  httpCache({ strategy: "public" }),
  validate(boardIdSchema, "params"),
  asyncHandler(async (req: TypedRequest<unknown, BoardId>, res: Response) => {
    const { boardId } = req.validatedParams!;
    const cacheKey = CACHE_KEYS.boardById(boardId);

    const result = await getCachedData(
      cacheKey,
      () => boardService.getBoardById(boardId),
      TTL.BOARD_BY_ID,
    );
    return res.json({ data: result });
  }),
);

router.post(
  "/",
  isAuthenticated,
  isAdmin,
  rateLimitMiddleware,
  upload.single("avatar"),
  validate(addBoardMemberSchema),
  asyncHandler(async (req: TypedRequest<AddBoardMember>, res: Response) => {
    const result = await boardService.addMember(req.validatedBody!, req.file);

    appEmitter.emitEvent(CACHE_EVENTS.BOARD_MEMBER_ADDED, {
      boardId: result.id, // adjust to match your actual return shape
    });

    return res.status(201).json({ data: result });
  }),
);

router.patch(
  "/:boardId",
  isAuthenticated,
  isAdmin,
  upload.single("avatar"),
  validate(boardIdSchema, "params"),
  validate(updateBoardMemberSchema, "body"),
  asyncHandler(
    async (req: TypedRequest<UpdateBoardMember, BoardId>, res: Response) => {
      const { boardId } = req.validatedParams!;
      const result = await boardService.updateBoard(
        boardId,
        req.validatedBody!,
        req.file,
      );
      appEmitter.emitEvent(CACHE_EVENTS.BOARD_UPDATED, { boardId });
      return res.json({ data: result });
    },
  ),
);

router.delete(
  "/:boardId",
  isAuthenticated,
  isAdmin,
  validate(boardIdSchema, "params"),
  asyncHandler(async (req: TypedRequest<unknown, BoardId>, res: Response) => {
    const { boardId } = req.validatedParams!;
    await boardService.deleteBoard(boardId);
    appEmitter.emitEvent(CACHE_EVENTS.BOARD_DELETED, { boardId });
    return res.sendStatus(204);
  }),
);

router.patch(
  "/:boardId/avatar",
  rateLimitMiddleware,
  isAuthenticated,
  isAdmin,
  upload.single("avatar"),
  validate(boardIdSchema, "params"),
  asyncHandler(async (req: TypedRequest<unknown, BoardId>, res: Response) => {
    const { boardId } = req.validatedParams!;
    const savedAvatar = await boardService.updateBoardAvatar(
      boardId,
      req.file!,
    );
    appEmitter.emitEvent(CACHE_EVENTS.BOARD_AVATAR_UPDATED, { boardId });
    return res.json({ data: savedAvatar });
  }),
);

router.delete(
  "/:boardId/avatar",
  isAuthenticated,
  isAdmin,
  validate(boardIdSchema, "params"),
  asyncHandler(async (req: TypedRequest<unknown, BoardId>, res: Response) => {
    const { boardId } = req.validatedParams!;
    await boardService.deleteBoardAvatar(boardId);
    appEmitter.emitEvent(CACHE_EVENTS.BOARD_AVATAR_DELETED, { boardId });
    return res.sendStatus(204);
  }),
);

export default router;
