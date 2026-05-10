import { Router, type Response, type Request } from "express";
import { validate } from "../../middlewares/validate.js";
import {
  addBoardMemberSchema,
  boardIdSchema,
  getBoardSchema,
  type AddBoardMember,
  type GetBoard,
  type BoardId,
} from "./board.schema.js";
import type { TypedRequest } from "../../types/TypedRequest.js";
import asyncHandler from "../../util/async.handler.js";
import boardService from "./board.service.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import upload from "../../middlewares/upload.js";

const router = Router();
router.get(
  "/",
  validate(getBoardSchema, "query"),
  asyncHandler(async (req: TypedRequest<GetBoard>, res: Response) => {
    const result = await boardService.getBoard(
      req.validatedData?.memberType ?? [],
      req.validatedData?.boardYear ?? 2026,
    );
    return res.json({ data: result });
  }),
);

router.post(
  "/",
  isAuthenticated,
  validate(addBoardMemberSchema),
  asyncHandler(async (req: TypedRequest<AddBoardMember>, res: Response) => {
    const result = await boardService.addMember(req.validatedData!);
    return res.status(201).json({ data: result });
  }),
);

router.get(
  "/:boardId",
  validate(boardIdSchema, "params"),
  asyncHandler(async (req: TypedRequest<BoardId>, res: Response) => {
    const result = await boardService.getBoardById(req.validatedData!.boardId);
    return res.json({ data: result });
  }),
);

router.patch(
  "/:boardId",
  validate(boardIdSchema, "params"),
  asyncHandler(async (req: TypedRequest<BoardId>, res: Response) => {
    const result = await boardService.updateBoard(
      req.validatedData!.boardId,
      req.body,
    );
    return res.json({ data: result });
  }),
);

router.delete(
  "/:boardId",
  validate(boardIdSchema, "params"),
  asyncHandler(async (req: TypedRequest<BoardId>, res: Response) => {
    const boardId = req.validatedData!.boardId;
    const result = await boardService.deleteBoard(boardId);
    return res.status(204).json({ data: result });
  }),
);

router.patch(
  "/:boardId/avatar",
  upload.single("avatar"),
  validate(boardIdSchema, "params"),
  asyncHandler(async (req: TypedRequest<BoardId>, res: Response) => {
    const savedAvatar = await boardService.updateBoardAvatar(
      req.validatedData!.boardId,
      req.file!,
    );
    return res.json({ data: savedAvatar });
  }),
);

router.delete(
  "/:boardId/avatar",
  validate(boardIdSchema, "params"),
  asyncHandler(async (req: TypedRequest<BoardId>, res: Response) => {
    const boardId = req.validatedData!.boardId;
    const result = await boardService.deleteBoardAvatar(boardId);
    return res.status(204).json({ data: result });
  }),
);

export default router;
