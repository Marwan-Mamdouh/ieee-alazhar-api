import { Router, type Response } from "express";

import { validate } from "../../middlewares/validate.js";
import {
	addBoardMemberSchema,
	boardIdSchema,
	getBoardSchema,
	updateBoardMemberSchema,
	type AddBoardMember,
	type GetBoard,
	type BoardId,
} from "./board.schema.js";
import type { TypedRequest } from "../../types/TypedRequest.js";
import asyncHandler from "../../util/async.handler.js";
import boardService from "./board.service.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import upload from "../../middlewares/upload.js";
import { httpCache } from "../../middlewares/http.caching.js";
import { CACHE_KEYS, TTL, getCachedData } from "../../infra/cache.js";
import appEmitter, { CACHE_EVENTS } from "../../infra/cache.events.js";
import { rateLimitMiddleware } from "../../middlewares/rateLimiting.middleware.js";

const router = Router();
router.get(
	"/",
	validate(getBoardSchema, "query"),
	httpCache({ strategy: "public", maxAge: 60 * 60 * 60 * 24 }), // 1 day
	asyncHandler(async (req: TypedRequest<GetBoard>, res: Response) => {
		const cacheKey = CACHE_KEYS.boardList(req.validatedData!);

		const result = await getCachedData(
			cacheKey,
			() => boardService.getBoard(req.validatedData!),
			TTL.BOARDS_LIST,
		);

		return res.json({ data: result });
	}),
);

router.get(
	"/:boardId",
	httpCache({ strategy: "public", maxAge: 60 * 60 * 60 * 24 }), // 1 day
	validate(boardIdSchema, "params"),
	asyncHandler(async (req: TypedRequest<BoardId>, res: Response) => {
		const { boardId } = req.validatedData!;
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
	rateLimitMiddleware,
	validate(addBoardMemberSchema),
	asyncHandler(async (req: TypedRequest<AddBoardMember>, res: Response) => {
		const result = await boardService.addMember(req.validatedData!);

		appEmitter.emitEvent(CACHE_EVENTS.BOARD_MEMBER_ADDED, {
			boardId: result.id, // adjust to match your actual return shape
		});

		return res.status(201).json({ data: result });
	}),
);

router.patch(
	"/:boardId",
	isAuthenticated,
	validate(boardIdSchema, "params"),
	asyncHandler(async (req: TypedRequest<BoardId>, res: Response) => {
		const result = await boardService.updateBoard(
			req.validatedData!.boardId,
			updateBoardMemberSchema.parse(req.body),
		);
		appEmitter.emitEvent(CACHE_EVENTS.BOARD_UPDATED, {
			boardId: req.validatedData!.boardId,
		});
		return res.json({ data: result });
	}),
);

router.delete(
	"/:boardId",
	isAuthenticated,
	validate(boardIdSchema, "params"),
	asyncHandler(async (req: TypedRequest<BoardId>, res: Response) => {
		const { boardId } = req.validatedData!;
		const result = await boardService.deleteBoard(boardId);
		appEmitter.emitEvent(CACHE_EVENTS.BOARD_DELETED, { boardId });
		return res.status(204).json({ data: result });
	}),
);

router.patch(
	"/:boardId/avatar",
	rateLimitMiddleware,
	isAuthenticated,
	upload.single("avatar"),
	validate(boardIdSchema, "params"),
	asyncHandler(async (req: TypedRequest<BoardId>, res: Response) => {
		const { boardId } = req.validatedData!;
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
	validate(boardIdSchema, "params"),
	asyncHandler(async (req: TypedRequest<BoardId>, res: Response) => {
		const { boardId } = req.validatedData!;
		const result = await boardService.deleteBoardAvatar(boardId);
		appEmitter.emitEvent(CACHE_EVENTS.BOARD_AVATAR_DELETED, { boardId });
		return res.status(204).json({ data: result });
	}),
);

export default router;
